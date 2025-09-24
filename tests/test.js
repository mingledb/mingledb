const path = require("path");
const fs = require("fs");
const MingleDB = require("../index");

describe("MingleDB end-to-end flow", () => {
  let db;
  let tmp;

  beforeEach(() => {
    // create a unique tmp directory for every test
    tmp = path.join(__dirname, "tmp", `db-${Date.now()}-${Math.random()}`);
    fs.mkdirSync(tmp, { recursive: true });
    db = new MingleDB(tmp);
  });

  // ✅ remove tmp directory after every test
  afterEach(() => {
    if (fs.existsSync(tmp)) {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // 🧹 Remove the parent tmp directory too
  afterAll(() => {
    const rootTmp = path.join(__dirname, "tmp");
    if (fs.existsSync(rootTmp)) {
      fs.rmSync(rootTmp, { recursive: true, force: true });
    }
  });
  // 🔐 AUTHENTICATION
  test("register, login, and logout user", () => {
    db.registerUser("admin", "secure123");
    db.login("admin", "secure123");
    expect(db.isAuthenticated("admin")).toBe(true);

    db.logout("admin");
    expect(db.isAuthenticated("admin")).toBe(false);
  });

  // 📌 Schema definition
  test("define schema and insert documents", () => {
    db.defineSchema("users", {
      name: { type: "string", required: true },
      email: { type: "string", required: true, unique: true },
      age: { type: "number" },
    });

    db.insertOne("users", { name: "Cloud", email: "cloud@seed.com", age: 25 });
    db.insertOne("users", {
      name: "Alice",
      email: "alice@example.com",
      age: 30,
    });
    db.insertOne("users", { name: "Bob", email: "bob@example.com", age: 17 });

    const all = db.findAll("users");
    expect(all).toHaveLength(3);
  });

  // 📥 uniqueness & validation
  test("reject duplicate email or missing required field", () => {
    db.defineSchema("users", {
      name: { type: "string", required: true },
      email: { type: "string", required: true, unique: true },
    });

    db.insertOne("users", { name: "A", email: "a@a.com" });
    expect(() =>
      db.insertOne("users", { name: "B", email: "a@a.com" }),
    ).toThrow(/unique/i);

    expect(() => db.insertOne("users", { email: "missingname@x.com" })).toThrow(
      /required/i,
    );
  });

  // 📤 read operations
  test("findAll, findOne, regex, range, and $in queries", () => {
    db.defineSchema("users", {
      name: { type: "string", required: true },
      email: { type: "string", required: true, unique: true },
      age: { type: "number" },
    });

    db.insertOne("users", { name: "Cloud", email: "cloud@seed.com", age: 25 });
    db.insertOne("users", {
      name: "Alice",
      email: "alice@example.com",
      age: 30,
    });
    db.insertOne("users", { name: "Bob", email: "bob@example.com", age: 17 });

    expect(db.findAll("users")).toHaveLength(3);

    const alice = db.findOne("users", { email: "alice@example.com" });
    expect(alice.name).toBe("Alice");

    const regexMatch = db.find("users", { name: /clo/i });
    expect(regexMatch[0].name).toBe("Cloud");

    const ageRange = db.find("users", { age: { $gte: 18, $lt: 60 } });
    expect(ageRange.map((u) => u.name)).toEqual(
      expect.arrayContaining(["Cloud", "Alice"]),
    );

    const emailIn = db.find("users", {
      email: { $in: ["cloud@seed.com", "a@b.com"] },
    });
    expect(emailIn).toHaveLength(1);
    expect(emailIn[0].email).toBe("cloud@seed.com");
  });

  // 📥 update
  test("updateOne modifies matching record", () => {
    db.defineSchema("users", {
      name: { type: "string", required: true },
      email: { type: "string", required: true, unique: true },
      age: { type: "number" },
    });

    db.insertOne("users", {
      name: "Alice",
      email: "alice@example.com",
      age: 30,
    });
    const updated = db.updateOne("users", { name: "Alice" }, { age: 31 });
    expect(updated).toBe(true);

    const check = db.findOne("users", { name: "Alice" });
    expect(check.age).toBe(31);
  });

  // 🗑️ delete
  test("deleteOne removes a document", () => {
    db.defineSchema("users", {
      name: { type: "string", required: true },
      email: { type: "string", required: true, unique: true },
    });

    db.insertOne("users", { name: "Alice", email: "alice@example.com" });
    const deleted = db.deleteOne("users", { email: "alice@example.com" });
    expect(deleted).toBe(true);

    expect(db.findAll("users")).toHaveLength(0);
  });
});
