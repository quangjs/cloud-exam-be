package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Attempt to load .env file if it exists (useful for local run outside docker)
	_ = godotenv.Load("../.env")

	// Connect to Database
	ConnectDB()
	defer CloseDB()

	// Initialize Gin router
	r := gin.Default()

	// Define routes
	r.GET("/users", GetUsers)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting Go API on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
