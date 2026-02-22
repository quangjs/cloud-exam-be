# Go API for Quick Quiz

This is the Go backend API for the Quick Quiz application, designed to connect to the shared PostgreSQL database managed by Strapi.

## Technologies Used

- **Go**: Primary language.
- **Gin**: High-performance HTTP web framework.
- **pgx**: PostgreSQL driver and toolkit for Go.
- **godotenv**: For loading environment variables from `.env` files.

## Local Development (Without Docker)

If you have Go installed on your local machine and want to run this API outside of Docker, follow these steps.

### 1. Prerequisites

- Ensure the **PostgreSQL database** is running. You can start it using Docker from the root folder:
  ```bash
  cd ..
  docker compose up -d postgres
  ```
- Ensure **Go 1.22+** is installed on your Mac. If not, you can install it via Homebrew:
  ```bash
  brew install go
  ```

### 2. Environment Variables

I've created a `.env` file in the `go-api` folder for you. It contains the local connection details to connect to the database running on `localhost:5432`.

### 3. Run the Application

Navigate to this directory (`go-api`) and run:

```bash
go mod tidy
go run .
```

The server will start on `http://localhost:8080`.

### 4. Test the API

You can test the health and the users endpoint:

- Health Check: `http://localhost:8080/health`
- Users Endpoint: `http://localhost:8080/users`

## Running with Docker

This API is also configured to run as a service in your main `docker-compose.yml` file.

To run everything (Strapi, Postgres, and the Go API) together via Docker from the root directory:

```bash
cd ..
docker compose up -d
```

The Go API will automatically connect to the `postgres` container on the internal Docker network.
