# --- build stage
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/rapp .

# --- runtime stage
FROM alpine:3.20
RUN adduser -D app
USER app
COPY --from=build /out/rapp /rapp
EXPOSE 8080
ENTRYPOINT ["/rapp"]
