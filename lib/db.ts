import mongoose, { Mongoose } from "mongoose";

// For feedback and tools, prefer MONGODB_URI_TOOLS (waysorted database)
// Falls back to general MONGODB_URI for other uses
const MONGODB_URI =
  process.env.MONGODB_URI_TOOLS ||
  process.env.NEXT_PUBLIC_MONGODB_URI_TOOLS ||
  process.env.MONGODB_URI ||
  process.env.NEXT_PUBLIC_MONGODB_URI;

declare global {
  var _mongooseConn: { conn: Mongoose | null; promise: Promise<Mongoose> | null } | undefined;
}

const globalCache = globalThis._mongooseConn ?? { conn: null, promise: null };
globalThis._mongooseConn = globalCache;

export async function dbConnect(): Promise<Mongoose> {
  // Only throw error when actually trying to connect, not during build
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI not set");
  }

  if (globalCache.conn) return globalCache.conn;

  globalCache.promise ??= mongoose
    .connect(MONGODB_URI as string, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    })
    .then((m) => m);

  try {
    globalCache.conn = await globalCache.promise;
  } catch (e) {
    globalCache.promise = null;
    throw e;
  }
  return globalCache.conn;
}

export default dbConnect;