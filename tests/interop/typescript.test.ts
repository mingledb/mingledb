import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MingleDB from "mingledb";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mingledb-ts-"));

try {
  const db = new MingleDB(path.join(tempRoot, "db.mgdb"));
  db.defineSchema("users", {
    id: { type: "number", required: true, unique: true },
    name: { type: "string", required: true },
  });
  db.insertOne("users", { id: 1, name: "TypeScript" });
  const doc = db.findOne("users", { id: { $eq: 1 } });
  assert.equal(doc?.name, "TypeScript");
  console.log("TypeScript interop OK");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
