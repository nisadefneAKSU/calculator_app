package calculator

import (
	"errors"
	"math"
	"testing"
)

func almostEqual(a, b float64) bool {
	return math.Abs(a-b) < 1e-9
}

func TestAddOp(t *testing.T) {
	cases := []struct{ a, b, want float64 }{
		{2, 3, 5},
		{-2, 3, 1},
		{0, 0, 0},
		{2.5, 2.5, 5},
	}
	for _, c := range cases {
		got, err := AddOp(c.a, c.b)
		if err != nil {
			t.Fatalf("AddOp(%v, %v) unexpected error: %v", c.a, c.b, err)
		}
		if !almostEqual(got, c.want) {
			t.Errorf("AddOp(%v, %v) = %v, want %v", c.a, c.b, got, c.want)
		}
	}
}

func TestSubtractOp(t *testing.T) {
	got, err := SubtractOp(10, 4)
	if err != nil || !almostEqual(got, 6) {
		t.Errorf("SubtractOp(10, 4) = %v, %v; want 6, nil", got, err)
	}
}

func TestMultiplyOp(t *testing.T) {
	got, err := MultiplyOp(6, 7)
	if err != nil || !almostEqual(got, 42) {
		t.Errorf("MultiplyOp(6, 7) = %v, %v; want 42, nil", got, err)
	}
}

func TestDivideOp(t *testing.T) {
	t.Run("normal division", func(t *testing.T) {
		got, err := DivideOp(10, 4)
		if err != nil || !almostEqual(got, 2.5) {
			t.Errorf("DivideOp(10, 4) = %v, %v; want 2.5, nil", got, err)
		}
	})
	t.Run("division by zero", func(t *testing.T) {
		_, err := DivideOp(10, 0)
		if !errors.Is(err, ErrDivideByZero) {
			t.Errorf("DivideOp(10, 0) error = %v, want ErrDivideByZero", err)
		}
	})
}

func TestPowerOp(t *testing.T) {
	cases := []struct{ base, exp, want float64 }{
		{2, 10, 1024},
		{5, 0, 1},
		{2, -1, 0.5},
	}
	for _, c := range cases {
		got, err := PowerOp(c.base, c.exp)
		if err != nil {
			t.Fatalf("PowerOp(%v, %v) unexpected error: %v", c.base, c.exp, err)
		}
		if !almostEqual(got, c.want) {
			t.Errorf("PowerOp(%v, %v) = %v, want %v", c.base, c.exp, got, c.want)
		}
	}
}

func TestSqrtOp(t *testing.T) {
	t.Run("perfect square", func(t *testing.T) {
		got, err := SqrtOp(16, 0)
		if err != nil || !almostEqual(got, 4) {
			t.Errorf("SqrtOp(16) = %v, %v; want 4, nil", got, err)
		}
	})
	t.Run("negative input", func(t *testing.T) {
		_, err := SqrtOp(-9, 0)
		if !errors.Is(err, ErrNegativeSqrt) {
			t.Errorf("SqrtOp(-9) error = %v, want ErrNegativeSqrt", err)
		}
	})
	t.Run("zero", func(t *testing.T) {
		got, err := SqrtOp(0, 0)
		if err != nil || !almostEqual(got, 0) {
			t.Errorf("SqrtOp(0) = %v, %v; want 0, nil", got, err)
		}
	})
}

func TestPercentOp(t *testing.T) {
	t.Run("normal percent", func(t *testing.T) {
		got, err := PercentOp(25, 200) // 25 is what % of 200 -> 12.5
		if err != nil || !almostEqual(got, 12.5) {
			t.Errorf("PercentOp(25, 200) = %v, %v; want 12.5, nil", got, err)
		}
	})
	t.Run("division by zero base", func(t *testing.T) {
		_, err := PercentOp(10, 0)
		if !errors.Is(err, ErrDivideByZero) {
			t.Errorf("PercentOp(10, 0) error = %v, want ErrDivideByZero", err)
		}
	})
}

func TestCalculateDispatch(t *testing.T) {
	cases := []struct {
		op   Operation
		a, b float64
		want float64
	}{
		{Add, 1, 2, 3},
		{Subtract, 5, 2, 3},
		{Multiply, 3, 4, 12},
		{Divide, 10, 2, 5},
		{Power, 2, 3, 8},
		{Sqrt, 9, 0, 3},
		{Percent, 50, 100, 50},
	}
	for _, c := range cases {
		got, err := Calculate(c.op, c.a, c.b)
		if err != nil {
			t.Fatalf("Calculate(%v, %v, %v) unexpected error: %v", c.op, c.a, c.b, err)
		}
		if !almostEqual(got, c.want) {
			t.Errorf("Calculate(%v, %v, %v) = %v, want %v", c.op, c.a, c.b, got, c.want)
		}
	}
}

func TestCalculateUnknownOperation(t *testing.T) {
	_, err := Calculate("modulus", 1, 2)
	if !errors.Is(err, ErrUnknownOperation) {
		t.Errorf("Calculate with unknown op error = %v, want ErrUnknownOperation", err)
	}
}

func TestInvalidResultOverflow(t *testing.T) {
	// A huge exponent should overflow to +Inf, which we treat as invalid.
	_, err := PowerOp(10, 1000)
	if !errors.Is(err, ErrInvalidResult) {
		t.Errorf("PowerOp(10, 1000) error = %v, want ErrInvalidResult", err)
	}
}
