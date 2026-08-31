// Package calculator implements the core arithmetic operations used by the
// calculator API. Keeping this logic separate from the HTTP layer makes it
// trivial to unit test in isolation and keeps handlers.go thin.
package calculator

import (
	"errors"
	"math"
)

// Sentinel errors returned by the calculator functions. The HTTP layer maps
// these to appropriate status codes / messages, so the two layers stay
// decoupled from each other's concerns.
var (
	ErrDivideByZero     = errors.New("division by zero is not allowed")
	ErrNegativeSqrt     = errors.New("cannot take the square root of a negative number")
	ErrInvalidResult    = errors.New("operation produced an invalid or non-finite result")
	ErrUnknownOperation = errors.New("unknown operation")
)

// Operation identifies which arithmetic operation to perform.
type Operation string

const (
	Add      Operation = "add"
	Subtract Operation = "subtract"
	Multiply Operation = "multiply"
	Divide   Operation = "divide"
	Power    Operation = "power"
	Sqrt     Operation = "sqrt"
	Percent  Operation = "percent"
)

// Add returns a + b.
func AddOp(a, b float64) (float64, error) {
	return checkFinite(a + b)
}

// Subtract returns a - b.
func SubtractOp(a, b float64) (float64, error) {
	return checkFinite(a - b)
}

// Multiply returns a * b.
func MultiplyOp(a, b float64) (float64, error) {
	return checkFinite(a * b)
}

// Divide returns a / b. Returns ErrDivideByZero when b is 0.
func DivideOp(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivideByZero
	}
	return checkFinite(a / b)
}

// PowerOp returns a raised to the power of b (exponentiation).
func PowerOp(a, b float64) (float64, error) {
	return checkFinite(math.Pow(a, b))
}

// SqrtOp returns the square root of a. b is ignored but kept so all
// operations share a uniform (a, b) signature, simplifying dispatch.
// Returns ErrNegativeSqrt when a is negative.
func SqrtOp(a, _ float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSqrt
	}
	return checkFinite(math.Sqrt(a))
}

// PercentOp returns a as a percentage of b, i.e. (a / b) * 100.
// This mirrors common calculator UX: "a percent b" -> what percent is a of b.
// Returns ErrDivideByZero when b is 0.
func PercentOp(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivideByZero
	}
	return checkFinite((a / b) * 100)
}

// Calculate dispatches to the correct operation implementation based on op.
func Calculate(op Operation, a, b float64) (float64, error) {
	switch op {
	case Add:
		return AddOp(a, b)
	case Subtract:
		return SubtractOp(a, b)
	case Multiply:
		return MultiplyOp(a, b)
	case Divide:
		return DivideOp(a, b)
	case Power:
		return PowerOp(a, b)
	case Sqrt:
		return SqrtOp(a, b)
	case Percent:
		return PercentOp(a, b)
	default:
		return 0, ErrUnknownOperation
	}
}

// checkFinite guards against NaN/Inf results (e.g. from extreme exponents)
// so the API never returns a JSON value that can't round-trip cleanly.
func checkFinite(result float64) (float64, error) {
	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrInvalidResult
	}
	return result, nil
}
