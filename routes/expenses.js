const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── Validation helper ───────────────────────────────────────────────────────
const VALID_CATEGORIES = ['food','transport','shopping','health','entertainment','other'];

function validateExpense({ amount, description, category, expense_date }) {
  if (!amount || isNaN(amount) || Number(amount) <= 0)
    return 'amount must be a positive number';
  if (!description || description.trim().length === 0)
    return 'description is required';
  if (category && !VALID_CATEGORIES.includes(category))
    return `category must be one of: ${VALID_CATEGORIES.join(', ')}`;
  if (!expense_date || isNaN(Date.parse(expense_date)))
    return 'expense_date must be a valid date (YYYY-MM-DD)';
  return null;
}

// ── GET /api/expenses ───────────────────────────────────────────────────────
// Query params: year, month, category, page, limit
router.get('/', async (req, res, next) => {
  try {
    const {
      year     = new Date().getFullYear(),
      month    = new Date().getMonth() + 1,
      category,
      page     = 1,
      limit    = 50
    } = req.query;

    const offset = (Math.max(1, page) - 1) * Math.min(100, limit);

    let where = 'WHERE YEAR(expense_date) = ? AND MONTH(expense_date) = ?';
    const params = [year, month];

    if (category && VALID_CATEGORIES.includes(category)) {
      where += ' AND category = ?';
      params.push(category);
    }

    const [rows] = await db.query(
      `SELECT * FROM expenses ${where}
       ORDER BY expense_date DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM expenses ${where}`,
      params
    );

    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// ── GET /api/expenses/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await db.query(
      'SELECT * FROM expenses WHERE id = ?', [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Expense not found' });
    res.json(row);
  } catch (err) { next(err); }
});

// ── POST /api/expenses ──────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { amount, description, category = 'other', expense_date } = req.body;
    const err = validateExpense({ amount, description, category, expense_date });
    if (err) return res.status(400).json({ error: err });

    const [result] = await db.query(
      'INSERT INTO expenses (amount, description, category, expense_date) VALUES (?, ?, ?, ?)',
      [Number(amount), description.trim(), category, expense_date]
    );

    const [[created]] = await db.query(
      'SELECT * FROM expenses WHERE id = ?', [result.insertId]
    );
    res.status(201).json(created);
  } catch (err) { next(err); }
});

// ── PUT /api/expenses/:id ───────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { amount, description, category, expense_date } = req.body;
    const err = validateExpense({ amount, description, category, expense_date });
    if (err) return res.status(400).json({ error: err });

    const [result] = await db.query(
      `UPDATE expenses
       SET amount = ?, description = ?, category = ?, expense_date = ?
       WHERE id = ?`,
      [Number(amount), description.trim(), category, expense_date, req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Expense not found' });

    const [[updated]] = await db.query(
      'SELECT * FROM expenses WHERE id = ?', [req.params.id]
    );
    res.json(updated);
  } catch (err) { next(err); }
});

// ── DELETE /api/expenses/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM expenses WHERE id = ?', [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted', id: Number(req.params.id) });
  } catch (err) { next(err); }
});

module.exports = router;
