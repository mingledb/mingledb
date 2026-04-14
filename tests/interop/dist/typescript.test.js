"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const mingledb_1 = __importDefault(require("mingledb"));
const tempRoot = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), "mingledb-ts-"));
try {
    const db = new mingledb_1.default(node_path_1.default.join(tempRoot, "db.mgdb"));
    db.defineSchema("users", {
        id: { type: "number", required: true, unique: true },
        name: { type: "string", required: true },
    });
    db.insertOne("users", { id: 1, name: "TypeScript" });
    const doc = db.findOne("users", { id: { $eq: 1 } });
    strict_1.default.equal(doc?.name, "TypeScript");
    console.log("TypeScript interop OK");
}
finally {
    node_fs_1.default.rmSync(tempRoot, { recursive: true, force: true });
}
