# --- Build stage ---
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/calculator-backend .

# --- Runtime stage ---
FROM alpine:3.20
RUN adduser -D -H -u 10001 appuser
COPY --from=build /out/calculator-backend /usr/local/bin/calculator-backend
USER appuser
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/calculator-backend"]
