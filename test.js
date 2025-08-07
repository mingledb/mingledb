const MingleDB = require("./index");
const db = new MingleDB();

// 🔐 AUTHENTICATION

try {
  // Register new user
  db.registerUser("admin", "secure123");

  // Login as user
  db.login("admin", "secure123");

  // Confirm login
  if (db.isAuthenticated("admin")) {
    console.log("🔐 Authenticated as admin");
  } else {
    console.log("❌ Authentication failed");
  }
} catch (err) {
  console.error("Auth error:", err.message);
}

// 📌 1. Define schema for validation and uniqueness
db.defineSchema("users", {
  name: {type: "string", required: true},
  email: {type: "string", required: true, unique: true},
  age: {type: "number"},
});

// 📥 2. Insert documents
try {
  db.insertOne("users", {
    name: "Cloud",
    email: "cloud@seed.com",
    age: 25,
  });

  db.insertOne("users", {
    name: "Alice",
    email: "alice@example.com",
    age: 30,
  });

  db.insertOne("users", {
    name: "Bob",
    email: "bob@example.com",
    age: 17,
  });
} catch (err) {
  console.error("Insert error:", err.message);
}

// 📤 3. Read operations
const allUsers = db.findAll("users"); // Get all
const findOne = db.findOne("users", {email: "alice@example.com"}); // Exact match
const partialSearch = db.find("users", {name: /clo/i}); // Regex
const ageRange = db.find("users", {age: {$gte: 18, $lt: 60}}); // Range
const emailList = db.find("users", {
  email: {$in: ["cloud@seed.com", "a@b.com"]},
});

// 📥 4. Update operation
const updated = db.updateOne("users", {name: "Alice"}, {age: 31});

// 🗑️ 5. Delete operation
const deleted = db.deleteOne("users", {email: "alice@example.com"});

// ✅ 6. Print results
console.log("🔎 All Users:", allUsers);
console.log("🔍 Find One (Alice):", findOne);
console.log("🔎 Regex Search (name:/clo/i):", partialSearch);
console.log("🔎 Age Range (18–60):", ageRange);
console.log("🔎 Email in list:", emailList);
console.log("📝 Updated Alice’s Age?", updated);
console.log("🗑️ Deleted Alice?", deleted);

// 🔐 Logout
db.logout("admin");
console.log("🚪 Logged out admin:", !db.isAuthenticated("admin"));
