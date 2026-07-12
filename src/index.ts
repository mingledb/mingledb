import fs from "fs";
import path from "path";
import BSON from "bson";
import zlib from "zlib";
import crypto from "crypto";

const HEADER = Buffer.from("MINGLEDBv1");
const MINGLEDB_EXTENSIONS = ".mgdb";

interface SchemaRule {
  type?: string;
  required?: boolean;
  unique?: boolean;
}

interface SchemaDefinition {
  [key: string]: SchemaRule;
}

interface QueryOperators {
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $eq?: unknown;
  $ne?: unknown;
  $in?: unknown[];
  $nin?: unknown[];
  $regex?: string | RegExp;
  $options?: string;
}

type QueryValue = unknown | RegExp | QueryOperators;

interface Query {
  [key: string]: QueryValue;
}

interface Document {
  [key: string]: unknown;
}

class MingleDB {
  private dbDir: string;
  private schemas: Record<string, SchemaDefinition>;
  private authenticatedUsers: Set<string>;

  constructor(dbDir = ".mgdb") {
    this.dbDir = dbDir;
    this.schemas = {};
    this.authenticatedUsers = new Set();
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  }

  reset(): void {
    if (fs.existsSync(this.dbDir)) {
      for (const file of fs.readdirSync(this.dbDir)) {
        if (file.endsWith(MINGLEDB_EXTENSIONS)) {
          fs.unlinkSync(path.join(this.dbDir, file));
        }
      }
    }
    this.schemas = {};
    this.authenticatedUsers.clear();
  }

  defineSchema(collection: string, schemaDefinition: SchemaDefinition): void {
    this.schemas[collection] = schemaDefinition;
  }

  registerUser(username: string, password: string): void {
    this._initCollectionFile("_auth");
    const users = this.findAll("_auth");
    const exists = users.find((u) => u.username === username);
    if (exists) throw new Error("Username already exists.");

    const hashed = this._hashPassword(password);
    this.insertOne("_auth", { username, password: hashed });
  }

  login(username: string, password: string): boolean {
    const user = this.findOne("_auth", { username });
    if (!user || user.password !== this._hashPassword(password)) {
      throw new Error("Authentication failed.");
    }
    this.authenticatedUsers.add(username);
    return true;
  }

  isAuthenticated(username: string): boolean {
    return this.authenticatedUsers.has(username);
  }

  logout(username: string): void {
    this.authenticatedUsers.delete(username);
  }

  private _hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  private _getFilePath(collection: string): string {
    return path.join(this.dbDir, `${collection}${MINGLEDB_EXTENSIONS}`);
  }

  private _initCollectionFile(collection: string): void {
    const filePath = this._getFilePath(collection);
    if (!fs.existsSync(filePath)) {
      const meta = Buffer.from(JSON.stringify({ collection }));
      const metaLen = Buffer.alloc(4);
      metaLen.writeUInt32LE(meta.length);
      fs.writeFileSync(filePath, Buffer.concat([HEADER, metaLen, meta]));
    }
  }

  private _validateSchema(collection: string, doc: Document): void {
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

  insertOne(collection: string, doc: Document): void {
    this._initCollectionFile(collection);
    this._validateSchema(collection, doc);
    const filePath = this._getFilePath(collection);

    const bson = BSON.serialize(doc);
    const compressed = zlib.deflateSync(bson);
    const length = Buffer.alloc(4);
    length.writeUInt32LE(compressed.length);

    fs.appendFileSync(filePath, Buffer.concat([length, compressed]));
  }

  findAll(collection: string): Document[] {
    const filePath = this._getFilePath(collection);
    if (!fs.existsSync(filePath)) return [];

    const buffer = fs.readFileSync(filePath);
    const docs: Document[] = [];

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

  find(collection: string, filter: Query = {}): Document[] {
    const docs = this.findAll(collection);
    return docs.filter((doc) => this._matchQuery(doc, filter));
  }

  findOne(collection: string, filter: Query = {}): Document | null {
    return this.find(collection, filter)[0] || null;
  }

  deleteOne(collection: string, query: Query): boolean {
    const all = this.findAll(collection);
    const newDocs: Document[] = [];
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

  updateOne(collection: string, query: Query, update: Document): boolean {
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

  private _rewriteCollection(collection: string, docs: Document[]): void {
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

  private _matchQuery(doc: Document, query: Query): boolean {
    return Object.entries(query).every(([key, value]) => {
      const docVal = doc[key];
      if (value instanceof RegExp) {
        return typeof docVal === "string" && value.test(docVal);
      }
      if (typeof value === "object" && value !== null) {
        const ops = value as QueryOperators;
        if ("$gt" in ops && !(typeof docVal === "number" && typeof ops.$gt === "number" && docVal > ops.$gt)) return false;
        if ("$gte" in ops && !(typeof docVal === "number" && typeof ops.$gte === "number" && docVal >= ops.$gte)) return false;
        if ("$lt" in ops && !(typeof docVal === "number" && typeof ops.$lt === "number" && docVal < ops.$lt)) return false;
        if ("$lte" in ops && !(typeof docVal === "number" && typeof ops.$lte === "number" && docVal <= ops.$lte)) return false;
        if ("$eq" in ops && !(docVal === ops.$eq)) return false;
        if ("$ne" in ops && !(docVal !== ops.$ne)) return false;
        if ("$in" in ops && Array.isArray(ops.$in) && !ops.$in.includes(docVal)) return false;
        if ("$nin" in ops && Array.isArray(ops.$nin) && ops.$nin.includes(docVal)) return false;
        if ("$regex" in ops) {
          const pattern =
            typeof ops.$regex === "string"
              ? ops.$regex
              : String(ops.$regex);
          const flags =
            typeof ops.$options === "string" && ops.$options.includes("i")
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

export default MingleDB;
