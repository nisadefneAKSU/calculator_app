package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"calculator-backend/calculator"
)

// calcRequest is the expected JSON body for POST /api/calculate.
// A and B are pointers so we can distinguish "field omitted" (nil) from
// "field explicitly set to 0", which matters for validation error messages.
type calcRequest struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b,omitempty"`
}

// calcResponse is the JSON shape returned on success.
type calcResponse struct {
	Result    float64 `json:"result"`
	Operation string  `json:"operation"`
}

// errorResponse is the JSON shape returned on any failure.
type errorResponse struct {
	Error string `json:"error"`
}

// operationsRequiringB lists operations that need a second operand.
// sqrt only needs "a", so it's intentionally excluded.
var operationsRequiringB = map[calculator.Operation]bool{
	calculator.Add:      true,
	calculator.Subtract: true,
	calculator.Multiply: true,
	calculator.Divide:   true,
	calculator.Power:    true,
	calculator.Percent:  true,
}

// writeJSON writes v as a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("failed to write JSON response: %v", err)
	}
}

// writeError is a small helper to keep error responses consistent.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, errorResponse{Error: message})
}

// calculateHandler handles POST /api/calculate.
// Expected body: {"operation": "add", "a": 1, "b": 2}
func calculateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "only POST is supported on this endpoint")
		return
	}

	var req calcRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body: "+err.Error())
		return
	}

	if req.Operation == "" {
		writeError(w, http.StatusBadRequest, "\"operation\" field is required")
		return
	}

	op := calculator.Operation(req.Operation)

	if req.A == nil {
		writeError(w, http.StatusBadRequest, "\"a\" field is required and must be a number")
		return
	}

	// Only require "b" for operations that actually use it.
	var bVal float64
	if operationsRequiringB[op] {
		if req.B == nil {
			writeError(w, http.StatusBadRequest, "\"b\" field is required for operation \""+req.Operation+"\"")
			return
		}
		bVal = *req.B
	} else if req.B != nil {
		bVal = *req.B
	}

	result, err := calculator.Calculate(op, *req.A, bVal)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, calculator.ErrUnknownOperation) {
			status = http.StatusUnprocessableEntity
		}
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, calcResponse{Result: result, Operation: req.Operation})
}

// healthHandler handles GET /api/health, used for readiness/liveness checks
// and by the frontend to verify the backend is reachable.
func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "only GET is supported on this endpoint")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
