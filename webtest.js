const Fastify = require("fastify");
const MingleDB = require("./index"); // Your custom DB class

const fastify = Fastify({logger: true});
const db = new MingleDB();

// 🔐 Auth schema (used internally)
db.defineSchema("_auth", {
  username: {type: "string", required: true, unique: true},
  password: {type: "string", required: true},
});

// 📌 Define "users" collection schema
db.defineSchema("users", {
  name: {type: "string", required: true},
  email: {type: "string", required: true, unique: true},
  age: {type: "number"},
});

// 🔐 Register
fastify.post("/register", async (req, reply) => {
  const {username, password} = req.body;
  try {
    db.registerUser(username, password);
    reply.send({success: true, message: "User registered."});
  } catch (err) {
    reply.status(400).send({error: err.message});
  }
});

// 🔐 Login
fastify.post("/login", async (req, reply) => {
  const {username, password} = req.body;
  try {
    db.login(username, password);
    reply.send({success: true, message: "Login successful."});
  } catch (err) {
    reply.status(401).send({error: err.message});
  }
});

// 📥 Create user (must be authenticated)
fastify.post("/users", async (req, reply) => {
  const {username, user} = req.body;
  if (!db.isAuthenticated(username)) {
    return reply.status(403).send({error: "Not authenticated"});
  }

  try {
    db.insertOne("users", user);
    reply.send({success: true, message: "User created."});
  } catch (err) {
    reply.status(400).send({error: err.message});
  }
});

// 📤 Get all users
fastify.get("/users", async (req, reply) => {
  const list = db.findAll("users");
  reply.send(list);
});

// 🔎 Search users
fastify.post("/users/search", async (req, reply) => {
  const {query} = req.body;
  const results = db.find("users", query);
  reply.send(results);
});

// 📝 Update one
fastify.put("/users", async (req, reply) => {
  const {filter, update} = req.body;
  const result = db.updateOne("users", filter, update);
  reply.send({updated: result});
});

// 🗑️ Delete one
fastify.delete("/users", async (req, reply) => {
  const {filter} = req.body;
  const result = db.deleteOne("users", filter);
  reply.send({deleted: result});
});

// 🚀 Start server
fastify.listen({port: 3000}, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
