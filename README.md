# Calculator App

A full-stack calculator: a Go REST API backend that performs the arithmetic,
and a React + TypeScript frontend that provides the UI and calls that API
for every calculation.

- **Backend:** Go, standard library only (`net/http`, `encoding/json`) — no
  external dependencies.
- **Frontend:** React 19 + TypeScript, built with Vite, styled with plain CSS.
- **Operations:** add, subtract, multiply, divide, exponentiation (`x^y`),
  square root, percentage.

---

## Project structure

```
calculator-app/
├── backend/               Go REST API
│   ├── calculator/        Pure arithmetic logic (unit tested, 100% coverage)
│   ├── handlers.go        HTTP handlers (request validation, JSON responses)
│   ├── main.go            Server entrypoint, routing, CORS
│   ├── *_test.go          Unit + HTTP-level tests
│   └── Dockerfile
├── frontend/               React + TypeScript SPA
│   ├── src/
│   │   ├── api/            Typed API client
│   │   ├── hooks/          useCalculator — the calculator's state machine
│   │   ├── components/     Calculator, Display, CalcButton, History
│   │   └── utils/          Number formatting helpers
│   ├── nginx.conf          Used only in the Docker/production build
│   └── Dockerfile
├── docker-compose.yml      Runs both services together
└── PROMPTS.md              AI prompts used while building this
```

---

## Setup & running locally (without Docker)

### Prerequisites
- Go 1.22+
- Node.js 18+ and npm

### 1. Run the backend

```bash
cd backend
go run .
# -> calculator-backend listening on :8080
```

The port can be overridden with the `PORT` environment variable.

### 2. Run the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
# -> Local: http://localhost:5173
```

During development, Vite proxies any request to `/api/*` through to
`http://localhost:8080` (see `vite.config.ts`), so the frontend can call
relative URLs without CORS issues. The backend also sends permissive CORS
headers itself as a fallback for other setups.

Open **http://localhost:5173** in your browser.

---

## Running with Docker

```bash
docker compose up --build
```

- Frontend (served by nginx): **http://localhost:3000**
- Backend API directly: **http://localhost:8080**

In the Docker setup, nginx serves the built frontend and proxies `/api/*`
requests to the backend container over the internal Docker network
(`nginx.conf`), so no CORS configuration is needed in production either.

> Note: These Dockerfiles follow standard multi-stage build patterns
> (Go binary in an Alpine runtime image; a Vite build served by nginx) but
> were not build-tested in the environment this project was written in,
> since it has no Docker daemon or Docker Hub access. Please flag it if
> anything doesn't build cleanly on your machine.

---

## Running the tests

### Backend

```bash
cd backend
go test ./... -v -cover
```

Current coverage: **100%** on the core `calculator` package, **~73% overall**
(the remaining uncovered lines are `main()`'s server bootstrap and the CORS
wrapper, which aren't meaningfully unit-testable).

A pre-generated HTML report is committed at
[`backend/coverage.html`](./backend/coverage.html). To regenerate it:
```bash
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### Frontend

```bash
cd frontend
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

26 tests across four suites: the calculator's core logic (`useCalculator`
hook), the API client, a number-formatting utility, and an end-to-end
integration test of the `Calculator` component using Testing Library.

A pre-generated HTML report is committed at
[`frontend/coverage/index.html`](./frontend/coverage/index.html).

See [`COVERAGE.md`](./COVERAGE.md) for a full summary of both reports.

---

## API reference

### `POST /api/calculate`

**Request body:**

```json
{ "operation": "add", "a": 2, "b": 3 }
```

| Field       | Type   | Required | Notes                                              |
|-------------|--------|----------|-----------------------------------------------------|
| `operation` | string | yes      | One of the operations below                         |
| `a`         | number | yes      | First operand                                        |
| `b`         | number | depends  | Required for all operations except `sqrt`           |

**Operations:**

| `operation` | Meaning                          | Formula          |
|-------------|-----------------------------------|------------------|
| `add`       | Addition                          | `a + b`          |
| `subtract`  | Subtraction                       | `a - b`          |
| `multiply`  | Multiplication                    | `a * b`          |
| `divide`    | Division                          | `a / b`          |
| `power`     | Exponentiation                    | `a ^ b`          |
| `sqrt`      | Square root (unary — `b` ignored) | `√a`             |
| `percent`   | "a is what percent of b"          | `(a / b) * 100`  |

**Success response — `200 OK`:**
```json
{ "result": 5, "operation": "add" }
```

**Error response — `400 Bad Request`:**
```json
{ "error": "division by zero is not allowed" }
```

An unrecognized `operation` value returns `422 Unprocessable Entity`.

**Example calls:**

```bash
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"power","a":2,"b":10}'
# {"result":1024,"operation":"power"}

curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"divide","a":5,"b":0}'
# {"error":"division by zero is not allowed"}   (400)

curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"sqrt","a":81}'
# {"result":9,"operation":"sqrt"}
```

### `GET /api/health`

Returns `{"status":"ok"}` — used for readiness checks and to let the
frontend confirm the backend is reachable.

---

## Design decisions & assumptions

**Backend uses only the Go standard library.** No router library (chi,
gin, gorilla/mux) or third-party test helpers. `net/http`'s `ServeMux` is
enough for two routes, and avoiding dependencies keeps the module trivial
to build anywhere with no `go.sum`/proxy access required — a deliberate
trade-off for a project this size, though a real production API with more
endpoints would likely benefit from a router with param/path matching.

**Calculator logic is a separate package (`calculator/`) from the HTTP
layer.** `Calculate(op, a, b)` has no knowledge of HTTP, JSON, or status
codes — it just returns a `(float64, error)`. This is what makes 100% unit
test coverage straightforward on the logic that actually matters, and keeps
`handlers.go` a thin translation layer (parse JSON → call `Calculate` → map
the error to a status code).

**`percent` is defined as `(a / b) * 100`** — "a is what percent of b" —
rather than the "divide displayed value by 100" behavior some physical
calculators use for their `%` key. This was chosen because it's a genuine
binary operation (needs two operands, has one unambiguous mathematical
meaning), which fits the same request/response shape as the other
operations and is easy to validate and test. The frontend's `%` button
follows this same two-operand flow (enter `a`, press `%`, enter `b`, press
`=`).

**`sqrt` is the one unary operation.** The frontend's `√` button applies
immediately to whatever is on screen rather than waiting for a second
operand and an `=` press — this matches how most physical/software
calculators handle unary functions, and avoids sending a meaningless `b`
value.

**Validation happens in both layers, for different reasons.** The backend
is the source of truth (rejects missing fields, unknown operations,
division by zero, negative square roots, non-finite results from overflow)
because it can't trust any client. The frontend does light, UX-oriented
validation (e.g. preventing a second decimal point) purely to avoid
sending obviously-malformed input, and always surfaces the backend's error
message rather than duplicating that logic client-side — so there's a
single source of truth for what's a valid calculation.

**The frontend keeps a "running value" state machine**, like a physical
calculator: typing digits builds a number, pressing an operator commits
the current number as the first operand and waits for the next one, and
operators can be chained (e.g. `2 + 3 × 4` resolves `2 + 3` as soon as `×`
is pressed, then continues) without requiring `=` after every step. This
was chosen over a "build a full expression string and parse it" approach
because it mirrors familiar calculator UX and keeps the state small and
easy to reason about/test (see `useCalculator.ts`).

**The calculator's state machine is a plain hook (`useCalculator`),
decoupled from any markup.** This let it be unit tested directly with
`renderHook`, independent of button clicks or DOM structure, while the
`Calculator` component itself gets a separate, smaller set of integration
tests that click through the actual UI.

**Visual design** leans into the calculator being a physical object rather
than a generic form: a dark device "chassis," an LCD-green display panel
with a monospace typeface for digits, and tactile-feeling keys (amber for
operators, teal for equals) rather than a flat, undifferentiated button
grid.

**Assumptions made:**
- No persistence is required — calculation history lives only in frontend
  memory for the current session (capped at the last 8 entries) and resets
  on page reload.
- No authentication/authorization was in scope.
- CORS is left permissive (`Access-Control-Allow-Origin: *`) since this is
  a case study with no real user data; a production deployment
  would lock this down to a known frontend origin.

---

## AI tooling disclosure

This project was built with the help of Claude (Anthropic). See
[`PROMPTS.md`](./PROMPTS.md) for the prompts used.
