const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── GET /api/budgets?year=&month= ───────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const year  = req.query.year  || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;

    const [[row]] = await db.query(
      'SELECT * FROM budgets WHERE year = ? AND month = ?', [year, month]
    );

    if (!row) return res.json({ year: Number(year), month: Number(month), amount: 0 });
    res.json(row);
  } catch (err) { next(err); }
});

// ── PUT /api/budgets ─────────────────────────────────────────────────────────
// Upsert: create or update budget for a given year/month
router.put('/', async (req, res, next) => {
  try {
    const { year, month, amount } = req.body;

    if (!year || !month || isNaN(year) || isNaN(month))
      return res.status(400).json({ error: 'year and month are required' });
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return res.status(400).json({ error: 'amount must be a positive number' });
    if (month < 1 || month > 12)
      return res.status(400).json({ error: 'month must be between 1 and 12' });

    await db.query(
      `INSERT INTO budgets (year, month, amount) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [year, month, Number(amount)]
    );

    const [[updated]] = await db.query(
      'SELECT * FROM budgets WHERE year = ? AND month = ?', [year, month]
    );
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
