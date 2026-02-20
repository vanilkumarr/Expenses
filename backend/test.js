// test.js — simple API tests (no extra libraries needed)
const http = require("http");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
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

async function runTests() {
  console.log("\n🧪 Running Paisa Tracker API Tests\n");

  // Start server
  const app = require("./server.js");
  await new Promise((r) => setTimeout(r, 500)); // wait for server to start

  try {
    // Test 1: Health check
    console.log("Test 1: Health Check");
    const health = await request("GET", "/health");
    assert(health.status === 200, "Health endpoint returns 200");
    assert(health.body.status === "ok", "Health status is ok");

    // Test 2: Get all expenses
    console.log("\nTest 2: Get All Expenses");
    const all = await request("GET", "/api/expenses");
    assert(all.status === 200, "GET /api/expenses returns 200");
    assert(all.body.success === true, "Response has success: true");
    assert(Array.isArray(all.body.data), "Response data is an array");
    assert(all.body.data.length > 0, "Returns seeded expenses");

    // Test 3: Filter by month
    console.log("\nTest 3: Filter by Month");
    const jan = await request("GET", "/api/expenses?month=January");
    assert(jan.status === 200, "Filter by January returns 200");
    assert(jan.body.data.every((e) => e.month === "January"), "All results are January");

    // Test 4: Get summary
    console.log("\nTest 4: Summary Endpoint");
    const summary = await request("GET", "/api/expenses/summary");
    assert(summary.status === 200, "GET /api/expenses/summary returns 200");
    assert(summary.body.data.byMonth.length > 0, "Has monthly breakdown");
    assert(summary.body.data.byCategory.length > 0, "Has category breakdown");
    assert(summary.body.data.overall.total > 0, "Has overall total");

    // Test 5: Add new expense
    console.log("\nTest 5: Add New Expense");
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

    const newId = newExp.body.data.id;

    // Test 6: Validation — missing fields
    console.log("\nTest 6: Validation");
    const invalid = await request("POST", "/api/expenses", { description: "Missing amount" });
    assert(invalid.status === 400, "Missing fields returns 400");

    // Test 7: Delete expense
    console.log("\nTest 7: Delete Expense");
    const del = await request("DELETE", `/api/expenses/${newId}`);
    assert(del.status === 200, "DELETE returns 200");
    assert(del.body.success === true, "Delete success is true");

    // Test 8: Delete non-existent
    const delMissing = await request("DELETE", "/api/expenses/99999");
    assert(delMissing.status === 404, "Delete non-existent returns 404");

  } catch (err) {
    console.error("Test error:", err.message);
    failed++;
  }

  console.log(`\n─────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("❌ Tests failed");
    process.exit(1);
  } else {
    console.log("✅ All tests passed");
    process.exit(0);
  }
}

runTests();
