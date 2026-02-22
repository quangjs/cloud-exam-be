package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var dbPool *pgxpool.Pool

func ConnectDB() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		host := os.Getenv("DATABASE_HOST")
		user := os.Getenv("DATABASE_USERNAME")
		pass := os.Getenv("DATABASE_PASSWORD")
		dbName := os.Getenv("DATABASE_NAME")
		port := os.Getenv("DATABASE_PORT")
		if port == "" {
			port = "5432"
		}

		dbURL = fmt.Sprintf("postgres://%s:%s@%s:%s/%s", user, pass, host, port, dbName)
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Unable to parse database URL: %v", err)
	}

	config.MaxConns = 10
	config.MaxConnLifetime = 1 * time.Hour

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}

	// Test connection
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("Unable to ping database: %v", err)
	}

	dbPool = pool
	log.Println("Successfully connected to the PostgreSQL database")
}

func CloseDB() {
	if dbPool != nil {
		dbPool.Close()
	}
}
