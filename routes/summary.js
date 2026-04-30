const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── GET /api/summary?year=&month= ───────────────────────────────────────────
// Full monthly summary: totals, category breakdown, daily spending
router.get('/', async (req, res, next) => {
  try {
    const year  = Number(req.query.year  || new Date().getFullYear());
    const month = Number(req.query.month || new Date().getMonth() + 1);

    // 1. Total spent this month
    const [[{ total_spent }]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_spent
       FROM expenses
       WHERE YEAR(expense_date) = ? AND MONTH(expense_date) = ?`,
      [year, month]
    );

    // 2. Budget
    const [[budget]] = await db.query(
      'SELECT amount FROM budgets WHERE year = ? AND month = ?', [year, month]
    );
    const budget_amount = budget ? Number(budget.amount) : 0;

    // 3. Category breakdown
    const [categories] = await db.query(
      `SELECT
         category,
         COUNT(*)            AS transaction_count,
         SUM(amount)         AS total,
         AVG(amount)         AS average,
         MIN(amount)         AS min_amount,
         MAX(amount)         AS max_amount
       FROM expenses
       WHERE YEAR(expense_date) = ? AND MONTH(expense_date) = ?
       GROUP BY category
       ORDER BY total DESC`,
      [year, month]
    );

    // 4. Daily spending (for bar chart)
    const [daily] = await db.query(
      `SELECT
         expense_date,
         COUNT(*)    AS transaction_count,
         SUM(amount) AS total
       FROM expenses
       WHERE YEAR(expense_date) = ? AND MONTH(expense_date) = ?
       GROUP BY expense_date
       ORDER BY expense_date ASC`,
      [year, month]
    );

    // 5. Transaction count
    const [[{ transaction_count }]] = await db.query(
      `SELECT COUNT(*) AS transaction_count
       FROM expenses
       WHERE YEAR(expense_date) = ? AND MONTH(expense_date) = ?`,
      [year, month]
    );

    // 6. Top spending day
    const [[topDay]] = await db.query(
      `SELECT expense_date, SUM(amount) AS total
       FROM expenses
       WHERE YEAR(expense_date) = ? AND MONTH(expense_date) = ?
       GROUP BY expense_date
       ORDER BY total DESC
       LIMIT 1`,
      [year, month]
    );

    // 7. Days elapsed this month (for daily average)
    const now        = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    const daysElapsed = isCurrentMonth ? now.getDate() : new Date(year, month, 0).getDate();

    res.json({
      year,
      month,
      total_spent:        Number(total_spent),
      budget_amount,
      remaining:          budget_amount - Number(total_spent),
      transaction_count:  Number(transaction_count),
      daily_average:      daysElapsed > 0 ? Number((total_spent / daysElapsed).toFixed(2)) : 0,
      avg_per_transaction: transaction_count > 0
        ? Number((total_spent / transaction_count).toFixed(2))
        : 0,
      top_spending_day:   topDay || null,
      categories:         categories.map(c => ({
        ...c,
        total:   Number(c.total),
        average: Number(Number(c.average).toFixed(2)),
        percentage: total_spent > 0
          ? Number((c.total / total_spent * 100).toFixed(1))
          : 0
      })),
      daily
    });
  } catch (err) { next(err); }
});

// ── GET /api/summary/months ─────────────────────────────────────────────────
// List all months that have expense data
router.get('/months', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT
         YEAR(expense_date)  AS year,
         MONTH(expense_date) AS month,
         SUM(amount)         AS total_spent,
         COUNT(*)            AS transaction_count
       FROM expenses
       GROUP BY year, month
       ORDER BY year DESC, month DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
