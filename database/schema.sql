-- Run this file once to set up your database
-- mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS expense_tracker
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE expense_tracker;

-- ─────────────────────────────────────────
-- Expenses table
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  amount      DECIMAL(10, 2)  NOT NULL,
  description VARCHAR(255)    NOT NULL,
  category    ENUM(
    'food', 'transport', 'shopping',
    'health', 'entertainment', 'other'
  ) NOT NULL DEFAULT 'other',
  expense_date DATE            NOT NULL,
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_expense_date (expense_date),
  INDEX idx_category     (category)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────
-- Monthly budgets table
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  year        SMALLINT UNSIGNED NOT NULL,
  month       TINYINT UNSIGNED  NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount      DECIMAL(10, 2)    NOT NULL,
  created_at  TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_year_month (year, month)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────
-- Seed: default budget for current month
-- ─────────────────────────────────────────
INSERT IGNORE INTO budgets (year, month, amount)
VALUES (YEAR(CURDATE()), MONTH(CURDATE()), 30000.00);
