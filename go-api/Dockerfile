FROM golang:1.22-alpine

WORKDIR /app

# Copy go.mod and go.sum (if exists)
COPY go.mod ./
# COPY go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
# We use mod tidy to fetch dependencies defined in go.mod
RUN go mod tidy

# Copy the source from the current directory to the Working Directory inside the container
COPY . .

# Build the Go app
RUN go build -o main .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
