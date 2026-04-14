import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MingleDB from "../../index.mjs";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mingledb-esm-"));

try {
  const db = new MingleDB(path.join(tempRoot, "db.mgdb"));
  db.insertOne("users", { id: 1, name: "ESM" });
  const doc = db.findOne("users", { id: 1 });
  assert.equal(doc?.name, "ESM");
  console.log("ESM interop OK");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
