const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const MingleDB = require("../../index.js");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mingledb-cjs-"));

try {
  const db = new MingleDB(path.join(tempRoot, "db.mgdb"));
  db.insertOne("users", { id: 1, name: "CJS" });
  const doc = db.findOne("users", { id: 1 });
  assert.equal(doc?.name, "CJS");
  console.log("CommonJS interop OK");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
