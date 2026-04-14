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

### 1) ESM (JavaScript `import`)

```js
import MingleDB from "mingledb";

const db = new MingleDB("./data/app.mgdb");

db.defineSchema("users", {
  name: { type: "string", required: true },
  email: { type: "string", required: true, unique: true },
  age: { type: "number" },
});

db.insertOne("users", { name: "Wayne", email: "wayne@mingle.com", age: 25 });
console.log(db.findAll("users"));
```

### 2) CommonJS (`require`)

```js
const MingleDB = require("mingledb");

const db = new MingleDB("./data/app.mgdb");
db.insertOne("users", { name: "CommonJS User" });
console.log(db.findOne("users", { name: "CommonJS User" }));
```

### 3) TypeScript

```ts
import MingleDB from "mingledb";

const db = new MingleDB("./data/app.mgdb");

db.defineSchema("users", {
  id: { type: "number", required: true, unique: true },
  name: { type: "string", required: true },
});

db.insertOne("users", { id: 1, name: "TypeScript User" });
const user = db.findOne("users", { id: { $eq: 1 } });
console.log(user?.name);
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

## Community and Project Docs

- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Code of conduct: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- License: [`LICENSE`](./LICENSE)
- Funding: [`FUNDING.yml`](.github/FUNDING.yml)
- Bug reports and feature requests: [Issue templates](./.github/ISSUE_TEMPLATE/)
- Pull requests: [PR template](./.github/pull_request_template.md)

---

## License

MIT © 2025 Mark Wayne Menorca

---

## Feedback

Open issues or pull requests are welcome for improvements or bug reports.
