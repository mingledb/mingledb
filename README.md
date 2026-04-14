<div align="center">
  <h1>MingleDB</h1>
</div>

<p align="center">
  <img src="https://img.shields.io/github/stars/mingledb/mingledb.svg" alt="Stars Badge"/>
  <img src="https://img.shields.io/github/forks/mingledb/mingledb.svg" alt="Forks Badge"/>
  <img src="https://img.shields.io/github/issues/mingledb/mingledb.svg" alt="Issues Badge"/>
  <img src="https://img.shields.io/github/license/mingledb/mingledb.svg" alt="License Badge"/>
</p>

# MingleDB

Lightweight file-based NoSQL database for Node.js with schema validation, query operators, basic auth, and single-file `.mgdb` persistence.

## Overview

MingleDB is designed for embedded/local-first use cases where you want a small database without running an external service.

## Installation

```bash
npm install mingledb
```

## Features

- User authentication (register, login, logout, session checks)
- Schema rules (`required`, `type`, `unique`)
- Query operators (`$gt`, `$gte`, `$lt`, `$lte`, `$eq`, `$ne`, `$in`, `$nin`, `$regex`)
- Single `.mgdb` database file for all collections
- Works in CommonJS, ESM, and TypeScript

## Usage

### ESM (JavaScript `import`)

```js
import MingleDB from "mingledb";

const db = new MingleDB("./data/app.mgdb");
db.insertOne("users", { name: "Wayne" });
console.log(db.findAll("users"));
```

### CommonJS (`require`)

```js
const MingleDB = require("mingledb");

const db = new MingleDB("./data/app.mgdb");
db.insertOne("users", { name: "CommonJS User" });
console.log(db.findOne("users", { name: "CommonJS User" }));
```

### TypeScript

```ts
import MingleDB from "mingledb";

const db = new MingleDB("./data/app.mgdb");
db.insertOne("users", { id: 1, name: "TypeScript User" });
const user = db.findOne("users", { id: { $eq: 1 } });
console.log(user?.name);
```

## Configuration

```js
const db = new MingleDB("./data"); // resolves to ./data/database.mgdb
// const db = new MingleDB("./data/app.mgdb"); // explicit DB file
```

## Testing

```bash
npm test
```

## Community Standards

- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Code of conduct: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- License: [`LICENSE`](./LICENSE)
- Funding: [`FUNDING.yml`](./FUNDING.yml)
- Bug reports and feature requests: [Issue templates](./.github/ISSUE_TEMPLATE/)
- Pull requests: [PR template](./.github/pull_request_template.md)

## License

MIT © 2025 Mark Wayne Menorca
