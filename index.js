// mingleDB.js - Lightweight File-Based NoSQL Engine with Compression, Schema, Query, and Basic Authentication Support

const fs = require("fs");
const path = require("path");
const BSON = require("bson");
const zlib = require("zlib");
const crypto = require("crypto");

const HEADER = Buffer.from("MINGLEDBv1");
const MINGLEDB_EXTENSIONS = ".mgdb";

class MingleDB {
  constructor(dbDir = "./mydb") {
    this.dbDir = dbDir;
    this.schemas = {};
    this.authenticatedUsers = new Set();
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  }
  /**
   * 🧹 Completely wipe all collections and reset schemas/auth state.
   * Useful for unit testing or a full reset.
   */
  reset() {
    if (fs.existsSync(this.dbDir)) {
      // remove all .mingleDB files
      for (const file of fs.readdirSync(this.dbDir)) {
        if (file.endsWith(MINGLEDB_EXTENSIONS)) {
          fs.unlinkSync(path.join(this.dbDir, file));
        }
      }
    }
    this.schemas = {};
    this.authenticatedUsers.clear();
  }

  defineSchema(collection, schemaDefinition) {
    this.schemas[collection] = schemaDefinition;
  }

  registerUser(username, password) {
    this._initCollectionFile("_auth");
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

  _getFilePath(collection) {
    return path.join(this.dbDir, `${collection}${MINGLEDB_EXTENSIONS}`);
  }

  _initCollectionFile(collection) {
    const filePath = this._getFilePath(collection);
    if (!fs.existsSync(filePath)) {
      const meta = Buffer.from(JSON.stringify({ collection }));
      const metaLen = Buffer.alloc(4);
      metaLen.writeUInt32LE(meta.length);
      fs.writeFileSync(filePath, Buffer.concat([HEADER, metaLen, meta]));
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
    this._initCollectionFile(collection);
    this._validateSchema(collection, doc);
    const filePath = this._getFilePath(collection);

    const bson = BSON.serialize(doc);
    const compressed = zlib.deflateSync(bson);
    const length = Buffer.alloc(4);
    length.writeUInt32LE(compressed.length);

    fs.appendFileSync(filePath, Buffer.concat([length, compressed]));
  }

  findAll(collection) {
    const filePath = this._getFilePath(collection);
    if (!fs.existsSync(filePath)) return [];

    const buffer = fs.readFileSync(filePath);
    const docs = [];

    let offset = HEADER.length;
    const metaLen = buffer.readUInt32LE(offset);
    offset += 4 + metaLen;

    while (offset < buffer.length) {
      const len = buffer.readUInt32LE(offset);
      offset += 4;
      const compressedBuf = buffer.slice(offset, offset + len);
      offset += len;
      const bson = zlib.inflateSync(compressedBuf);
      docs.push(BSON.deserialize(bson));
    }

    return docs;
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
    const filePath = this._getFilePath(collection);
    const meta = Buffer.from(JSON.stringify({ collection }));
    const metaLen = Buffer.alloc(4);
    metaLen.writeUInt32LE(meta.length);

    const docBuffers = docs.map((doc) => {
      const bson = BSON.serialize(doc);
      const compressed = zlib.deflateSync(bson);
      const len = Buffer.alloc(4);
      len.writeUInt32LE(compressed.length);
      return Buffer.concat([len, compressed]);
    });

    fs.writeFileSync(
      filePath,
      Buffer.concat([HEADER, metaLen, meta, ...docBuffers]),
    );
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
        return true;
      }
      return docVal === value;
    });
  }
}

module.exports = MingleDB;
