const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Create table + seed if empty
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      month TEXT NOT NULL,
      date TEXT NOT NULL,
      year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Add year column if it doesn't exist (for existing tables)
  await pool.query(`
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS year INTEGER NOT NULL DEFAULT 2026
  `);

  const { rows } = await pool.query("SELECT COUNT(*) as count FROM expenses");
  if (parseInt(rows[0].count) === 0) {
    const seedData = [
      ["Jio", 195, "Bills", "January", "2026-01-05", 2026],
      ["Masala Pesarattu", 30, "Food", "January", "2026-01-08", 2026],
      ["Samosa", 30, "Food", "January", "2026-01-10", 2026],
      ["Jilebi", 50, "Food", "January", "2026-01-12", 2026],
      ["Moondal", 20, "Food", "January", "2026-01-14", 2026],
      ["Panipuri", 20, "Food", "January", "2026-01-16", 2026],
      ["Vada", 30, "Food", "January", "2026-01-18", 2026],
      ["Masala Dosa", 30, "Food", "January", "2026-01-20", 2026],
      ["Samosa", 40, "Food", "January", "2026-01-25", 2026],
      ["Puri", 30, "Food", "January", "2026-01-28", 2026],
      ["Kurkure & Ice Cream", 90, "Snacks", "February", "2026-02-05", 2026],
      ["Samosa & Dil Kusheh", 90, "Food", "February", "2026-02-15", 2026],
    ];

    for (const row of seedData) {
      await pool.query(
        "INSERT INTO expenses (description, amount, category, month, date, year) VALUES ($1, $2, $3, $4, $5, $6)",
        row
      );
    }
    console.log("✅ Database seeded with initial expenses");
  }
};

initDB().catch(console.error);

// ─── ROUTES ───────────────────────────────────────────────

// GET /api/expenses — get all, filter by month and/or year
app.get("/api/expenses", async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = "SELECT * FROM expenses WHERE 1=1";
    const params = [];

    if (month && month !== "All") {
      params.push(month);
      query += ` AND month = $${params.length}`;
    }
    if (year && year !== "All") {
      params.push(parseInt(year));
      query += ` AND year = $${params.length}`;
    }

    query += " ORDER BY date DESC";
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/expenses/summary — totals by month, category, and year
app.get("/api/expenses/summary", async (req, res) => {
  try {
    const { rows: byMonth } = await pool.query(`
      SELECT month, year, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      GROUP BY month, year
      ORDER BY year ASC, date ASC
    `);

    const { rows: byCategory } = await pool.query(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `);

    const { rows: byYear } = await pool.query(`
      SELECT year, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      GROUP BY year
      ORDER BY year ASC
    `);

    const { rows: overall } = await pool.query(`
      SELECT SUM(amount) as total, COUNT(*) as count FROM expenses
    `);

    res.json({ success: true, data: { byMonth, byCategory, byYear, overall: overall[0] } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/expenses — add new expense
app.post("/api/expenses", async (req, res) => {
  try {
    const { description, amount, category, month, date } = req.body;

    if (!description || !amount || !category || !month || !date) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: "Amount must be a positive number" });
    }

    const year = new Date(date).getFullYear();

    const { rows } = await pool.query(
      `INSERT INTO expenses (description, amount, category, month, date, year)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [description, parseFloat(amount), category, month, date, year]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/expenses/:id — delete an expense
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM expenses WHERE id = $1", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Expense not found" });
    }

    await pool.query("DELETE FROM expenses WHERE id = $1", [id]);
    res.json({ success: true, message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Paisa Tracker API running on port ${PORT}`);
});

module.exports = app;
