<div align="center">
  <h1>MingleDB</h1>
</div>

<p align="center">
  <img src="https://img.shields.io/github/stars/mingledb/mingledb.svg" alt="Stars Badge"/>
  <img src="https://img.shields.io/github/forks/mingledb/mingledb.svg" alt="Forks Badge"/>
  <img src="https://img.shields.io/github/issues/mingledb/mingledb.svg" alt="Issues Badge"/>
  <img src="https://img.shields.io/github/license/mingledb/mingledb.svg" alt="License Badge"/>
</p>

**MingleDB** is a lightweight, file-based NoSQL database built on the BSON format. It supports basic authentication, schema validation, advanced query filters, and flat-file persistence, making it suitable for rapid prototyping, embedded use, CLI apps, or offline-first environments.

---

## Installation

```bash
npm install mingledb
```

---

## Features

| Feature              | Description                                                          |
| -------------------- | -------------------------------------------------------------------- |
| User Authentication  | Register, login, logout, and session tracking                        |
| Schema Definition    | Define required fields, types, and unique constraints per collection |
| Smart Querying       | Supports filters like `$gt`, `$in`, `$regex`, and ranges             |
| Compression          | Stores entries compactly using BSON and zlib                         |
| Flatfile Storage     | Saves data in a single `.mgdb` database file with binary records     |
| CRUD Operations      | Simple create, read, update, and delete support                      |
| Minimal Dependencies | Runs anywhere Node.js is supported                                   |

---

## Example Usage

```js
import MingleDB from "mingledb";

const db = new MingleDB();

// User authentication
db.registerUser("admin", "secure123");
db.login("admin", "secure123");

// Define schema
db.defineSchema("users", {
  name: { type: "string", required: true },
  email: { type: "string", required: true, unique: true },
  age: { type: "number" },
});

// Insert document
db.insertOne("users", { name: "Wayne", email: "wayne@mingle.com", age: 25 });

// Query
console.log(db.findAll("users"));
console.log(db.findOne("users", { email: "wayne@mingle.com" }));

// Update and delete
db.updateOne("users", { name: "Wayne" }, { age: 26 });
db.deleteOne("users", { email: "wayne@mingle.com" });

// Logout
db.logout("admin");
```

---

## Use Cases

* Embedded or local-first databases
* Desktop applications
* CLI tools or utilities
* Offline-first storage
* Rapid prototyping with schema validation
* Lightweight backend for admin panels

---

## Configuration

```js
const db = new MingleDB("./data"); // directory -> ./data/database.mgdb
// const db = new MingleDB("./data/app.mgdb"); // explicit single-file path
```

All collections are stored inside one `.mgdb` database file.

---

## License

MIT © 2025 Mark Wayne Menorca

---

## Feedback

Open issues or pull requests are welcome for improvements or bug reports.
