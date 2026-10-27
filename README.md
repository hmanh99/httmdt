# STRIDE — Editorial Luxury Footwear Platform

STRIDE is a production-ready, full-stack e-commerce platform engineered specifically for high-end sneaker and luxury footwear retail. Built with Python 3.12 FastAPI, SQLAlchemy 2.0 (async), PostgreSQL/SQLite, and React 18 + TypeScript + Vite, it couples an editorial storefront with an administrative console.

---

## Key Highlights & Architectural Guarantees

1. **Transactional Inventory Concurrency Control**:
   - Checkout uses **pessimistic row-level locking** (`SELECT ... FOR UPDATE` via SQLAlchemy async `with_for_update()`).
   - Sizing variants cannot be oversold, even under high-concurrency race condition bursts (verified by automated tests returning HTTP `409 Conflict`).
   - Order cancellation automatically restores stock quantity atomically.

2. **Full-Featured Admin Management Console (`/admin`)**:
   - **Real-Time Analytics Dashboard**: Real-time KPI cards for gross revenue, order volume, pending fulfillments, low-stock alerts, and recent orders.
   - **Footwear Archive (Product CRUD)**: Ant Design expandable table detailing shoe models, parent metadata, and child variant sub-tables (SKU, size, color hex, price override, quantity). Includes modal for adding/editing models and uploading photographs.
   - **Fulfillment & Order Pipeline**: Filter by workflow status (`pending` → `paid` → `processing` → `shipped` → `delivered` / `cancelled`) with dispatch tracking and internal admin notes.
   - **Review Moderation**: Approve or reject client impressions and remove spam submissions.
   - **Discount Coupons**: Create, manage, and delete percentage or fixed discount coupon codes with minimum order thresholds.

3. **Editorial Storefront Experience**:
   - Curated landing page with editorial hero, featured drop spotlight, curated brand stories, and client trust guarantees.
   - Interactive footwear catalog with instant multi-faceted filtering (brand, category, size, color, gender, and price range slider).
   - Dynamic product detail page with high-resolution image gallery, live variant selection, real-time stock feedback, and client reviews with verified buyer badges.
   - Slide-out Cart Drawer with Zustand persistence and local coupon calculation.
   - 3-step checkout wizard with shipping address book, automated discount validation, and Cash on Delivery / Stripe simulation.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2, PostgreSQL / SQLite (`aiosqlite`), native bcrypt, Pytest, HTTPX |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Ant Design v5 (`@ant-design/cssinjs`), TanStack Query, Zustand, Axios, Lucide Icons |
| **Infra & DevOps** | Docker, Docker Compose (`api`, `db`, `web`), Makefile, Environment variable configs |

---

## Project Structure

```
├── backend/
│   ├── alembic/                # Async database migrations
│   │   └── versions/           # Migration revisions
│   ├── app/
│   │   ├── api/v1/endpoints/   # Auth, users, catalog, cart, orders, reviews, admin
│   │   ├── core/               # App config, database session factory, security
│   │   ├── models/             # 16 normalized SQLAlchemy models
│   │   ├── repositories/       # Repositories for catalog, orders, users, reviews
│   │   ├── schemas/            # Pydantic v2 schemas for all payloads
│   │   ├── services/           # Order transactional checkout service, catalog service
│   │   ├── main.py             # FastAPI entrypoint with CORS and static media mount
│   │   └── seed.py             # Database seeder (30 shoes, 6 brands, 5 categories, 3 coupons)
│   ├── tests/                  # Pytest async test suite (19 tests)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API clients with auto-refresh interceptors
│   │   ├── components/         # Layout, product, cart, filter components
│   │   ├── pages/              # Storefront, checkout, customer account, admin console
│   │   ├── store/              # Zustand auth and cart stores
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   ├── routes/             # AppRoutes with storefront and admin guards
│   │   └── main.tsx            # Ant Design ConfigProvider & StyleProvider root
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml          # Containerized deployment (db, api, web)
├── Makefile                    # One-command developer automation
├── .env.example                # Example environment variables
└── README.md
```

---

## Quickstart & Local Setup

### 1. Prerequisites
- Python 3.12+ (or `uv` package manager)
- Node.js 18+ & npm
- PostgreSQL (or use built-in SQLite fallback for instant zero-dependency local testing)

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed catalog (30 shoes, brands, categories, coupons, and superuser)
python -m app.seed

# Run dev server
uvicorn app.main:app --reload --port 8000
```

Backend Swagger documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Storefront will be running at: `http://localhost:5173`

---

## Default Credentials & Seed Data

### Administrator Console Account
- **URL**: `http://localhost:5173/admin` (or click "Admin Dashboard" in user menu)
- **Email**: `admin@stride.com`
- **Password**: `Admin@123456`

### Promotional Coupon Codes
- `WELCOME10`: 10% discount on orders over $50.00
- `STRIDE20`: 20% discount on orders over $150.00
- `FREESHIP`: $15.00 discount on orders over $100.00

---

## Running with Docker Compose

To start the complete multi-container production stack (PostgreSQL, FastAPI API, and Vite Web):

```bash
# Copy environment variables
cp .env.example .env

# Build and start all services
docker compose up --build
```

- Web Storefront: `http://localhost:3000`
- API Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

---

## Automated Pytest Suite

The backend includes a comprehensive async test suite covering authentication, duplicate detection, address CRUD, catalog search/facets, cart operations, coupon validation, transactional overselling concurrency protection, order cancellation stock restoration, and review moderation:

```bash
# From workspace root
& "backend\.venv\Scripts\python.exe" -m pytest backend/tests -v
```

**Results**: `19 passed in 10.54s`

---

## API Summary

- `POST /api/v1/auth/register` — Customer registration
- `POST /api/v1/auth/login` — JWT login returning access + refresh tokens
- `POST /api/v1/auth/refresh` — Issue new access token using refresh token
- `GET /api/v1/auth/me` / `PUT /api/v1/auth/me` — Current user profile management
- `GET /api/v1/users/addresses` — Customer address book CRUD
- `GET /api/v1/products` — Catalog search with faceted filtering (brands, categories, size, color, price)
- `GET /api/v1/products/{slug}` — Product detail with variants and primary images
- `GET /api/v1/products/facets` — Dynamic aggregations of all available filter options
- `POST /api/v1/products/{id}/reviews` — Submit review (auto-validates verified purchase)
- `GET /api/v1/products/{id}/reviews` — Public approved reviews
- `GET /api/v1/cart` & `POST /api/v1/cart/items` — Persistent cart management
- `POST /api/v1/orders` — Atomic checkout with `SELECT ... FOR UPDATE` row locking
- `POST /api/v1/orders/coupons/validate` — Coupon validation against subtotal
- `GET /api/v1/orders` & `GET /api/v1/orders/{order_number}` — Customer order history and tracking
- `GET /api/v1/admin/stats` — Admin dashboard KPIs and recent orders
- `GET /api/v1/admin/orders` — Admin order management
- `PUT /api/v1/orders/{id}/status` — Admin order status update
- `GET /api/v1/admin/reviews` & `PUT /api/v1/admin/reviews/{id}/status` — Review moderation
- `GET /api/v1/admin/coupons` & `POST /api/v1/admin/coupons` — Promotional discount coupons
- `POST /api/v1/admin/upload` — Media upload endpoint
