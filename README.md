<div align="center">
  <h1> MingleDB </h1>
</div>

<p align="center">
  <img src="https://img.shields.io/github/stars/marcuwynu23/mingledb.svg" alt="Stars Badge"/>
  <img src="https://img.shields.io/github/forks/marcuwynu23/mingledb.svg" alt="Forks Badge"/>
  <img src="https://img.shields.io/github/issues/marcuwynu23/mingledb.svg" alt="Issues Badge"/>
  <img src="https://img.shields.io/github/license/marcuwynu23/mingledb.svg" alt="License Badge"/>
</p>

**MingleDB** is a lightweight, file-based NoSQL database built on top of the [BSON](https://bsonspec.org/) serialization format with support for:

- 🔐 Basic authentication
- ✅ Schema validation
- 🔎 Query filters (including regex, range, `$in`, etc.)
- 📦 BSON + Zlib compression
- 💾 Flat file-based persistence

Designed for fast prototyping, embedded use, CLI apps, or offline-first environments.

---

## 📦 Installation

```bash
npm install mingledb
```

---

## 🚀 Features

| Feature                         | Description                                                          |
| ------------------------------- | -------------------------------------------------------------------- |
| 🔐 **User Authentication**      | Register, login, logout, and session tracking using SHA256 hashing   |
| 🧾 **Schema Definition**        | Define required fields, types, and unique constraints per collection |
| 🧠 **Smart Querying**           | Supports advanced query filters like `$gt`, `$in`, `$regex`, etc.    |
| 💨 **Compression**              | Uses zlib + BSON to store entries compactly                          |
| 📁 **Flatfile Storage**         | Saves data in `.mingleDB` files with a binary header and metadata    |
| 🔄 **Update/Delete Operations** | Simple CRUD support with updateOne and deleteOne                     |
| 📃 **Minimal Dependencies**     | Zero external DB needed, runs anywhere Node.js runs                  |

---

## 🧪 Example Usage

```js
import MingleDB from "mingledb"; // For ES Modules
// const MingleDB = require("mingledb"); // For CommonJS

const db = new MingleDB(); // Optional: pass custom directory path

// 🔐 1. Register & Login
db.registerUser("admin", "secure123");
db.login("admin", "secure123");

// ✅ 2. Define schema
db.defineSchema("users", {
  name: { type: "string", required: true },
  email: { type: "string", required: true, unique: true },
  age: { type: "number" },
});

// 📥 3. Insert documents
db.insertOne("users", {
  name: "Wayne",
  email: "wayne@mingle.com",
  age: 25,
});

// 🔎 4. Read operations
console.log(db.findAll("users")); // All documents
console.log(db.findOne("users", { email: "wayne@mingle.com" })); // Exact match
console.log(db.find("users", { age: { $gte: 18, $lt: 30 } })); // Range filter

// 📝 5. Update a document
db.updateOne("users", { name: "Wayne" }, { age: 26 });

// 🗑️ 6. Delete a document
db.deleteOne("users", { email: "wayne@mingle.com" });

// 🚪 7. Logout
db.logout("admin");
```

---

## 🧠 Query Operators Supported

| Operator                     | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| `$gt`, `$gte`, `$lt`, `$lte` | Greater/Less Than (or Equal)                                            |
| `$eq`, `$ne`                 | Equals / Not Equals                                                     |
| `$in`, `$nin`                | Matches any in list / not in list                                       |
| `$regex`                     | Regular Expression matching (case-insensitive supported via `$options`) |

---

## 🔐 Authentication API

```ts
registerUser(username: string, password: string): void
login(username: string, password: string): boolean
isAuthenticated(username: string): boolean
logout(username: string): void
```

---

## 📂 Schema Example

```js
db.defineSchema("posts", {
  title: { type: "string", required: true },
  slug: { type: "string", unique: true },
  views: { type: "number" },
});
```

> `required` will throw error if missing  
> `unique` will scan the whole collection to ensure no duplicates

---

## 💡 Use Cases

- Embedded/local-first database
- Desktop apps (Electron)
- CLI tools or utilities
- Offline PWA storage simulation
- Rapid prototyping with schema validation
- Lightweight admin panel backend

---

## 🔧 Configuration

```js
const db = new MingleDB("./data"); // Change default directory
```

Each collection will be stored as a `.mingleDB` binary file with compressed records.

---

## 📁 File Format

Each collection file contains:

1. Header (`MINGLEDBv1`)
2. JSON metadata (collection name, version)
3. Repeated entries of:
   - 4-byte length
   - zlib-compressed BSON document

---

## ✅ Roadmap (Future Ideas)

- [ ] Auto-indexing for faster unique validation
- [ ] Nested field queries
- [ ] Export/import data as JSON
- [ ] File-level locking for concurrent writes
- [ ] Optional encryption
- [ ] WebSocket sync module

---

## 👨‍💻 Development

```bash
npm install
npm run test
```

---

## 📜 License

MIT © 2025 Mark Wayne Menorca

---

## 💬 Feedback

Feel free to open issues or submit pull requests to suggest improvements or report bugs!
