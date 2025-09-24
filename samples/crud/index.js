// server.js
const Fastify = require("fastify");
const MingleDB = require("../../index");

const fastify = Fastify({ logger: true });
const db = new MingleDB("./data"); // store DB files in ./data folder

// 🔐 Internal auth schema
db.defineSchema("_auth", {
  username: { type: "string", required: true, unique: true },
  password: { type: "string", required: true },
});

// 📌 Users collection schema
db.defineSchema("users", {
  name: { type: "string", required: true },
  email: { type: "string", required: true, unique: true },
  age: { type: "number" },
});

// 🔐 Register
fastify.post("/register", async (req, reply) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return reply.status(400).send({ error: "Username and password required" });
  }
  try {
    db.registerUser(username, password);
    return { success: true, message: "User registered." };
  } catch (err) {
    return reply.status(400).send({ error: err.message });
  }
});

// 🔐 Login
fastify.post("/login", async (req, reply) => {
  const { username, password } = req.body || {};
  try {
    db.login(username, password);
    return { success: true, message: "Login successful." };
  } catch (err) {
    return reply.status(401).send({ error: err.message });
  }
});

// 📥 Create user (must be authenticated)
fastify.post("/users", async (req, reply) => {
  const { username, user } = req.body || {};
  if (!db.isAuthenticated(username)) {
    return reply.status(403).send({ error: "Not authenticated" });
  }
  try {
    db.insertOne("users", user);
    return { success: true, message: "User created." };
  } catch (err) {
    return reply.status(400).send({ error: err.message });
  }
});

// 📤 Get all users
fastify.get("/users", async () => {
  return db.findAll("users");
});

// 🔎 Search users
fastify.post("/users/search", async (req) => {
  const { query } = req.body || {};
  return db.find("users", query || {});
});

// 📝 Update one
fastify.put("/users", async (req) => {
  const { filter, update } = req.body || {};
  const result = db.updateOne("users", filter || {}, update || {});
  return { updated: result };
});

// 🗑️ Delete one
fastify.delete("/users", async (req) => {
  const { filter } = req.body || {};
  const result = db.deleteOne("users", filter || {});
  return { deleted: result };
});

// 🚀 Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    fastify.log.info("Server running at http://0.0.0.0:3000/");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
