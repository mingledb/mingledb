// mingleDB.js - Lightweight File-Based NoSQL Engine with Compression, Schema, Query, and Basic Authentication Support

const fs = require("fs");
const path = require("path");
const BSON = require("bson");
const zlib = require("zlib");
const crypto = require("crypto");

const HEADER = Buffer.from("MINGLEDBv1");
const MINGLEDB_EXTENSIONS = ".mgdb";
const DEFAULT_DB_FILE = "database.mgdb";

class MingleDB {
  constructor(dbDir = ".mgdb") {
    this.dbPath = this._resolveDbPath(dbDir);
    this.schemas = {};
    this.authenticatedUsers = new Set();
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
  }
  /**
   * Completely wipe database contents and reset schemas/auth state.
   * Useful for unit testing or a full reset.
   */
  reset() {
    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
    }
    this.schemas = {};
    this.authenticatedUsers.clear();
  }

  defineSchema(collection, schemaDefinition) {
    this.schemas[collection] = schemaDefinition;
  }

  registerUser(username, password) {
    this._ensureDatabaseFile();
    const users = this.findAll("_auth");
    const exists = users.find((u) => u.username === username);
    if (exists) throw new Error("Username already exists.");

    const hashed = this._hashPassword(password);
    this.insertOne("_auth", { username, password: hashed });
  }

  login(username, password) {
    const user = this.findOne("_auth", { username });
    if (!user || user.password !== this._hashPassword(password)) {
      throw new Error("Authentication failed.");
    }
    this.authenticatedUsers.add(username);
    return true;
  }

  isAuthenticated(username) {
    return this.authenticatedUsers.has(username);
  }

  logout(username) {
    this.authenticatedUsers.delete(username);
  }

  _hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  _resolveDbPath(dbPath) {
    const raw = String(dbPath || "").trim();
    if (!raw) return DEFAULT_DB_FILE;
    if (raw.toLowerCase().endsWith(MINGLEDB_EXTENSIONS)) return raw;
    return path.join(raw, DEFAULT_DB_FILE);
  }

  _ensureDatabaseFile() {
    if (!fs.existsSync(this.dbPath)) {
      const meta = Buffer.from(
        JSON.stringify({ scope: "database", format: "single-file-v2" }),
      );
      const metaLen = Buffer.alloc(4);
      metaLen.writeUInt32LE(meta.length);
      fs.writeFileSync(this.dbPath, Buffer.concat([HEADER, metaLen, meta]));
    }
  }

  _validateSchema(collection, doc) {
    const schema = this.schemas[collection];
    if (!schema) return;

    for (const key in schema) {
      const rule = schema[key];
      const value = doc[key];

      if (rule.required && (value === undefined || value === null)) {
        throw new Error(`Validation error: Field "${key}" is required.`);
      }

      if (value !== undefined && typeof value !== rule.type) {
        throw new Error(
          `Validation error: Field "${key}" must be of type ${rule.type}.`,
        );
      }

      if (rule.unique && value !== undefined) {
        const all = this.findAll(collection);
        const duplicate = all.find((d) => d[key] === value);
        if (duplicate) {
          throw new Error(
            `Validation error: Duplicate value for unique field "${key}".`,
          );
        }
      }
    }
  }

  insertOne(collection, doc) {
    this._ensureDatabaseFile();
    this._validateSchema(collection, doc);

    const bson = BSON.serialize({ collection, doc });
    const compressed = zlib.deflateSync(bson);
    const length = Buffer.alloc(4);
    length.writeUInt32LE(compressed.length);
    fs.appendFileSync(this.dbPath, Buffer.concat([length, compressed]));
  }

  _readAllRecords() {
    if (!fs.existsSync(this.dbPath)) return [];
    const buffer = fs.readFileSync(this.dbPath);
    if (buffer.length < HEADER.length + 4) return [];
    if (!buffer.slice(0, HEADER.length).equals(HEADER)) {
      throw new Error("Invalid mingleDB file header.");
    }

    let offset = HEADER.length;
    const metaLen = buffer.readUInt32LE(offset);
    offset += 4;
    const meta = JSON.parse(
      buffer.slice(offset, offset + metaLen).toString("utf8") || "{}",
    );
    const legacyCollection =
      typeof meta.collection === "string" ? meta.collection : "";
    offset += metaLen;

    const records = [];
    while (offset < buffer.length) {
      if (offset + 4 > buffer.length) break;
      const len = buffer.readUInt32LE(offset);
      offset += 4;
      if (offset + len > buffer.length) break;
      const compressedBuf = buffer.slice(offset, offset + len);
      offset += len;
      const bson = zlib.inflateSync(compressedBuf);
      const decoded = BSON.deserialize(bson);
      if (
        decoded &&
        typeof decoded.collection === "string" &&
        typeof decoded.doc === "object" &&
        decoded.doc !== null
      ) {
        records.push({ collection: decoded.collection, doc: decoded.doc });
      } else if (legacyCollection) {
        records.push({ collection: legacyCollection, doc: decoded });
      }
    }
    return records;
  }

  _writeAllRecords(records) {
    const meta = Buffer.from(
      JSON.stringify({ scope: "database", format: "single-file-v2" }),
    );
    const metaLen = Buffer.alloc(4);
    metaLen.writeUInt32LE(meta.length);

    const docBuffers = records.map((record) => {
      const bson = BSON.serialize(record);
      const compressed = zlib.deflateSync(bson);
      const len = Buffer.alloc(4);
      len.writeUInt32LE(compressed.length);
      return Buffer.concat([len, compressed]);
    });

    fs.writeFileSync(
      this.dbPath,
      Buffer.concat([HEADER, metaLen, meta, ...docBuffers]),
    );
  }

  findAll(collection) {
    return this._readAllRecords()
      .filter((record) => record.collection === collection)
      .map((record) => record.doc);
  }

  find(collection, filter = {}) {
    const docs = this.findAll(collection);
    return docs.filter((doc) => this._matchQuery(doc, filter));
  }

  findOne(collection, filter = {}) {
    return this.find(collection, filter)[0] || null;
  }

  deleteOne(collection, query) {
    const all = this.findAll(collection);
    const newDocs = [];
    let deleted = false;

    for (const doc of all) {
      if (!deleted && this._matchQuery(doc, query)) {
        deleted = true;
        continue;
      }
      newDocs.push(doc);
    }

    this._rewriteCollection(collection, newDocs);
    return deleted;
  }

  updateOne(collection, query, update) {
    const all = this.findAll(collection);
    let updated = false;
    const updatedDocs = all.map((doc) => {
      if (!updated && this._matchQuery(doc, query)) {
        updated = true;
        return { ...doc, ...update };
      }
      return doc;
    });

    this._rewriteCollection(collection, updatedDocs);
    return updated;
  }

  _rewriteCollection(collection, docs) {
    const current = this._readAllRecords().filter(
      (record) => record.collection !== collection,
    );
    const next = docs.map((doc) => ({ collection, doc }));
    this._writeAllRecords([...current, ...next]);
  }

  _matchQuery(doc, query) {
    return Object.entries(query).every(([key, value]) => {
      const docVal = doc[key];
      if (value instanceof RegExp) {
        return typeof docVal === "string" && value.test(docVal);
      }
      if (typeof value === "object" && value !== null) {
        if ("$gt" in value && !(docVal > value.$gt)) return false;
        if ("$gte" in value && !(docVal >= value.$gte)) return false;
        if ("$lt" in value && !(docVal < value.$lt)) return false;
        if ("$lte" in value && !(docVal <= value.$lte)) return false;
        if ("$eq" in value && !(docVal === value.$eq)) return false;
        if ("$ne" in value && !(docVal !== value.$ne)) return false;
        if ("$in" in value && !value.$in.includes(docVal)) return false;
        if ("$nin" in value && value.$nin.includes(docVal)) return false;
        if ("$regex" in value) {
          const pattern =
            typeof value.$regex === "string"
              ? value.$regex
              : String(value.$regex);
          const flags =
            typeof value.$options === "string" && value.$options.includes("i")
              ? "i"
              : "";
          try {
            const re = new RegExp(pattern, flags);
            return typeof docVal === "string" && re.test(docVal);
          } catch {
            return false;
          }
        }
        return true;
      }
      return docVal === value;
    });
  }
}

module.exports = MingleDB;
