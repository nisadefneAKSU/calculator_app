// Command calculator-backend runs the REST API server for the calculator
// application. It exposes a single POST endpoint for performing arithmetic
// operations plus a health check endpoint.
package main

import (
	"log"
	"net/http"
	"os"
)

// withCORS wraps a handler to allow the React frontend (running on a
// different origin during local development) to call the API.
// For a take-home / demo project this is intentionally permissive (*);
// in production it should be locked down to the known frontend origin(s).
func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/calculate", withCORS(calculateHandler))
	mux.HandleFunc("/api/health", withCORS(healthHandler))

	addr := ":" + port
	log.Printf("calculator-backend listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
