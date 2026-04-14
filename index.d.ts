export type QueryValue = string | number | boolean | null | RegExp | QueryOperators;

export interface QueryOperators {
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

export type QueryFilter = Record<string, QueryValue>;

export interface SchemaRule {
  type?: "string" | "number";
  required?: boolean;
  unique?: boolean;
}

export type SchemaDefinition = Record<string, SchemaRule>;

export default class MingleDB {
  constructor(dbPath?: string);

  defineSchema(collection: string, schemaDefinition: SchemaDefinition): void;

  registerUser(username: string, password: string): void;
  login(username: string, password: string): boolean;
  isAuthenticated(username: string): boolean;
  logout(username: string): void;

  insertOne(collection: string, doc: Record<string, unknown>): void;
  findAll(collection: string): Record<string, unknown>[];
  find(collection: string, filter?: QueryFilter): Record<string, unknown>[];
  findOne(collection: string, filter?: QueryFilter): Record<string, unknown> | null;
  updateOne(collection: string, query: QueryFilter, update: Record<string, unknown>): boolean;
  deleteOne(collection: string, query: QueryFilter): boolean;

  reset(): void;
}
