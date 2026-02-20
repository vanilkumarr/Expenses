const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new Database(path.join(__dirname, "expenses.db"));

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    month TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Seed initial data if table is empty
const count = db.prepare("SELECT COUNT(*) as count FROM expenses").get();
if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO expenses (description, amount, category, month, date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const seedData = [
    ["Jio", 195, "Bills", "January", "2026-01-05"],
    ["Masala Pesarattu", 30, "Food", "January", "2026-01-08"],
    ["Samosa", 30, "Food", "January", "2026-01-10"],
    ["Jilebi", 50, "Food", "January", "2026-01-12"],
    ["Moondal", 20, "Food", "January", "2026-01-14"],
    ["Panipuri", 20, "Food", "January", "2026-01-16"],
    ["Vada", 30, "Food", "January", "2026-01-18"],
    ["Masala Dosa", 30, "Food", "January", "2026-01-20"],
    ["Samosa", 40, "Food", "January", "2026-01-25"],
    ["Puri", 30, "Food", "January", "2026-01-28"],
    ["Kurkure & Ice Cream", 90, "Snacks", "February", "2026-02-05"],
    ["Samosa & Dil Kusheh", 90, "Food", "February", "2026-02-15"],
  ];

  seedData.forEach((row) => insert.run(...row));
  console.log("✅ Database seeded with initial expenses");
}

// ─── ROUTES ───────────────────────────────────────────────

// GET /api/expenses — get all or filter by month
app.get("/api/expenses", (req, res) => {
  try {
    const { month } = req.query;
    let expenses;
    if (month && month !== "All") {
      expenses = db.prepare("SELECT * FROM expenses WHERE month = ? ORDER BY date DESC").all(month);
    } else {
      expenses = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
    }
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/expenses/summary — totals by month and category
app.get("/api/expenses/summary", (req, res) => {
  try {
    const byMonth = db.prepare(`
      SELECT month, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      GROUP BY month
      ORDER BY date ASC
    `).all();

    const byCategory = db.prepare(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `).all();

    const overall = db.prepare(`
      SELECT SUM(amount) as total, COUNT(*) as count FROM expenses
    `).get();

    res.json({ success: true, data: { byMonth, byCategory, overall } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/expenses — add new expense
app.post("/api/expenses", (req, res) => {
  try {
    const { description, amount, category, month, date } = req.body;

    // Validation
    if (!description || !amount || !category || !month || !date) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: "Amount must be a positive number" });
    }

    const result = db.prepare(`
      INSERT INTO expenses (description, amount, category, month, date)
      VALUES (?, ?, ?, ?, ?)
    `).run(description, parseFloat(amount), category, month, date);

    const newExpense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newExpense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/expenses/:id — delete an expense
app.delete("/api/expenses/:id", (req, res) => {
  try {
    const { id } = req.params;
    const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);

    if (!expense) {
      return res.status(404).json({ success: false, error: "Expense not found" });
    }

    db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
    res.json({ success: true, message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check — GitHub Actions and Render use this
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Paisa Tracker API running on port ${PORT}`);
});

module.exports = app;
