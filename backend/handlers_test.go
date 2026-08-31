package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func doCalculateRequest(t *testing.T, body map[string]interface{}) (*httptest.ResponseRecorder, calcResponse, errorResponse) {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("failed to marshal request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/api/calculate", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	calculateHandler(rec, req)

	var okResp calcResponse
	var errResp errorResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &okResp)
	_ = json.Unmarshal(rec.Body.Bytes(), &errResp)
	return rec, okResp, errResp
}

func TestCalculateHandler_Success(t *testing.T) {
	cases := []struct {
		name string
		body map[string]interface{}
		want float64
	}{
		{"addition", map[string]interface{}{"operation": "add", "a": 2, "b": 3}, 5},
		{"subtraction", map[string]interface{}{"operation": "subtract", "a": 10, "b": 4}, 6},
		{"multiplication", map[string]interface{}{"operation": "multiply", "a": 6, "b": 7}, 42},
		{"division", map[string]interface{}{"operation": "divide", "a": 20, "b": 4}, 5},
		{"power", map[string]interface{}{"operation": "power", "a": 2, "b": 5}, 32},
		{"sqrt", map[string]interface{}{"operation": "sqrt", "a": 25}, 5},
		{"percent", map[string]interface{}{"operation": "percent", "a": 50, "b": 200}, 25},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec, ok, _ := doCalculateRequest(t, c.body)
			if rec.Code != http.StatusOK {
				t.Fatalf("expected status 200, got %d (body: %s)", rec.Code, rec.Body.String())
			}
			if ok.Result != c.want {
				t.Errorf("expected result %v, got %v", c.want, ok.Result)
			}
		})
	}
}

func TestCalculateHandler_DivisionByZero(t *testing.T) {
	rec, _, errResp := doCalculateRequest(t, map[string]interface{}{
		"operation": "divide", "a": 10, "b": 0,
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rec.Code)
	}
	if errResp.Error == "" {
		t.Error("expected a non-empty error message for division by zero")
	}
}

func TestCalculateHandler_NegativeSqrt(t *testing.T) {
	rec, _, errResp := doCalculateRequest(t, map[string]interface{}{
		"operation": "sqrt", "a": -16,
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rec.Code)
	}
	if errResp.Error == "" {
		t.Error("expected a non-empty error message for negative sqrt")
	}
}

func TestCalculateHandler_MissingOperation(t *testing.T) {
	rec, _, _ := doCalculateRequest(t, map[string]interface{}{
		"a": 1, "b": 2,
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for missing operation, got %d", rec.Code)
	}
}

func TestCalculateHandler_MissingOperand(t *testing.T) {
	rec, _, _ := doCalculateRequest(t, map[string]interface{}{
		"operation": "add", "a": 1,
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for missing 'b', got %d", rec.Code)
	}
}

func TestCalculateHandler_UnknownOperation(t *testing.T) {
	rec, _, _ := doCalculateRequest(t, map[string]interface{}{
		"operation": "modulus", "a": 1, "b": 2,
	})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected status 422 for unknown operation, got %d", rec.Code)
	}
}

func TestCalculateHandler_InvalidJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/calculate", bytes.NewReader([]byte("{not valid json")))
	rec := httptest.NewRecorder()
	calculateHandler(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for invalid JSON, got %d", rec.Code)
	}
}

func TestCalculateHandler_WrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/calculate", nil)
	rec := httptest.NewRecorder()
	calculateHandler(rec, req)
	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status 405, got %d", rec.Code)
	}
}

func TestHealthHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	healthHandler(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}
}
