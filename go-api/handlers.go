package main

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetUsers(c *gin.Context) {
	if dbPool == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not established"})
		return
	}

	rows, err := dbPool.Query(context.Background(), "SELECT id, username, email FROM up_users")
	if err != nil {
		log.Printf("Query error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Username, &user.Email)
		if err != nil {
			log.Printf("Row scan error: %v", err)
			continue
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Rows iteration error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading users"})
		return
	}

	c.JSON(http.StatusOK, users)
}
