# 💸 Expense Tracker — Backend API

Node.js + Express + MySQL REST API for the daily expense tracker app.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Set up the database
```bash
npm run db:setup
# OR manually: mysql -u root -p < database/schema.sql
```

### 4. Start the server
```bash
npm run dev     # development (auto-reload)
npm start       # production
```

---

## 📡 API Endpoints

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses |
| GET | `/api/expenses/:id` | Get single expense |
| POST | `/api/expenses` | Add expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

**GET /api/expenses** — Query params:
- `year` (default: current year)
- `month` (default: current month)
- `category` — filter by category
- `page` / `limit` — pagination

**POST /api/expenses** — Body:
```json
{
  "amount": 150.00,
  "description": "Lunch at MK",
  "category": "food",
  "expense_date": "2026-04-30"
}
```

Categories: `food` | `transport` | `shopping` | `health` | `entertainment` | `other`

---

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Get budget for month |
| PUT | `/api/budgets` | Set budget for month |

**GET /api/budgets** — Query params: `year`, `month`

**PUT /api/budgets** — Body:
```json
{ "year": 2026, "month": 4, "amount": 30000 }
```

---

### Summary (Monzo-style)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/summary` | Full monthly summary |
| GET | `/api/summary/months` | All months with data |

**GET /api/summary** — Query params: `year`, `month`

Response includes:
- `total_spent`, `budget_amount`, `remaining`
- `daily_average`, `avg_per_transaction`
- `transaction_count`, `top_spending_day`
- `categories[]` — breakdown with percentages
- `daily[]` — per-day totals for charts

---

### Health Check
```
GET /api/health
```

---

## 📁 Project Structure

```
expense-tracker-backend/
├── server.js           # Entry point
├── config/
│   └── db.js           # MySQL connection pool
├── routes/
│   ├── expenses.js     # CRUD for expenses
│   ├── budgets.js      # Monthly budgets
│   └── summary.js      # Analytics & summary
├── database/
│   └── schema.sql      # DB setup script
├── .env.example
└── package.json
```
