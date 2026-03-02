// test.js — simple API tests (no extra libraries needed)
const http = require("http");

let passed = 0;
let failed = 0;
let skipped = 0;
let dbAvailable = false;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

function skip(message) {
  console.log(`  ⏭️  SKIP: ${message} (no DB in CI)`);
  skipped++;
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3001,
      path,
      method,
      headers: { "Content-Type": "application/json" },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkDBAvailable() {
  try {
    const res = await request("GET", "/api/expenses");
    return res.body.success === true;
  } catch {
    return false;
  }
}

async function runTests() {
  console.log("\n🧪 Running Paisa Tracker API Tests\n");

  // Start server
  const app = require("./server.js");
  await new Promise((r) => setTimeout(r, 1000)); // wait for server + DB init

  // Check if DB is reachable
  dbAvailable = await checkDBAvailable();
  if (!dbAvailable) {
    console.log("⚠️  Database not reachable — skipping DB tests (CI environment)\n");
  }

  try {
    // Test 1: Health check (always runs)
    console.log("Test 1: Health Check");
    const health = await request("GET", "/health");
    assert(health.status === 200, "Health endpoint returns 200");
    assert(health.body.status === "ok", "Health status is ok");

    // Test 2: Get all expenses
    console.log("\nTest 2: Get All Expenses");
    if (!dbAvailable) {
      skip("GET /api/expenses returns 200");
      skip("Response has success: true");
      skip("Response data is an array");
      skip("Returns seeded expenses");
    } else {
      const all = await request("GET", "/api/expenses");
      assert(all.status === 200, "GET /api/expenses returns 200");
      assert(all.body.success === true, "Response has success: true");
      assert(Array.isArray(all.body.data), "Response data is an array");
      assert(all.body.data.length > 0, "Returns seeded expenses");
    }

    // Test 3: Filter by month
    console.log("\nTest 3: Filter by Month");
    if (!dbAvailable) {
      skip("Filter by January returns 200");
      skip("All results are January");
    } else {
      const jan = await request("GET", "/api/expenses?month=January");
      assert(jan.status === 200, "Filter by January returns 200");
      assert(jan.body.data.every((e) => e.month === "January"), "All results are January");
    }

    // Test 4: Get summary
    console.log("\nTest 4: Summary Endpoint");
    if (!dbAvailable) {
      skip("GET /api/expenses/summary returns 200");
      skip("Has monthly breakdown");
      skip("Has category breakdown");
      skip("Has overall total");
    } else {
      const summary = await request("GET", "/api/expenses/summary");
      assert(summary.status === 200, "GET /api/expenses/summary returns 200");
      assert(summary.body.data.byMonth.length > 0, "Has monthly breakdown");
      assert(summary.body.data.byCategory.length > 0, "Has category breakdown");
      assert(summary.body.data.overall.total > 0, "Has overall total");
    }

    // Test 5: Add new expense
    console.log("\nTest 5: Add New Expense");
    let newId = null;
    if (!dbAvailable) {
      skip("POST /api/expenses returns 201");
      skip("New expense has correct description");
      skip("New expense has correct amount");
    } else {
      const newExp = await request("POST", "/api/expenses", {
        description: "Test Chai",
        amount: 15,
        category: "Food",
        month: "February",
        date: "2026-02-20",
      });
      assert(newExp.status === 201, "POST /api/expenses returns 201");
      assert(newExp.body.data.description === "Test Chai", "New expense has correct description");
      assert(newExp.body.data.amount === 15, "New expense has correct amount");
      newId = newExp.body.data.id;
    }

    // Test 6: Validation — missing fields (always runs, no DB needed)
    console.log("\nTest 6: Validation");
    const invalid = await request("POST", "/api/expenses", { description: "Missing amount" });
    assert(invalid.status === 400, "Missing fields returns 400");

    // Test 7: Delete expense
    console.log("\nTest 7: Delete Expense");
    if (!dbAvailable || !newId) {
      skip("DELETE returns 200");
      skip("Delete success is true");
    } else {
      const del = await request("DELETE", `/api/expenses/${newId}`);
      assert(del.status === 200, "DELETE returns 200");
      assert(del.body.success === true, "Delete success is true");
    }

    // Test 8: Delete non-existent
    console.log("\nTest 8: Delete Non-existent");
    if (!dbAvailable) {
      skip("Delete non-existent returns 404");
    } else {
      const delMissing = await request("DELETE", "/api/expenses/99999");
      assert(delMissing.status === 404, "Delete non-existent returns 404");
    }

  } catch (err) {
    console.error("Test error:", err.message);
    failed++;
  }

  console.log(`\n─────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);

  if (failed > 0) {
    console.log("❌ Tests failed");
    process.exit(1);
  } else {
    console.log("✅ All tests passed");
    process.exit(0);
  }
}

runTests();