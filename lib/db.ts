import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI not set");
}

declare global {
  var _mongooseConn: { conn: Mongoose | null; promise: Promise<Mongoose> | null } | undefined;
}

const globalCache = global._mongooseConn || { conn: null, promise: null };
global._mongooseConn = globalCache;

export async function dbConnect(): Promise<Mongoose> {
  if (globalCache.conn) return globalCache.conn;

  if (!globalCache.promise) {
    globalCache.promise = mongoose
      .connect(MONGODB_URI as string, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    globalCache.conn = await globalCache.promise;
  } catch (e) {
    globalCache.promise = null;
    throw e;
  }
  return globalCache.conn;
}

export default dbConnect;