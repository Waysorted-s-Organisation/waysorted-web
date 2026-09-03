/**
 * Loads the local environment before anything that reads it.
 *
 * Import this FIRST, above any import that touches `process.env`:
 *
 *     import "./load-env";
 *     import dbConnect from "../lib/db";
 *
 * ES module imports are evaluated in source order and before any statement in
 * the file body, so calling dotenv in the body is too late - `lib/db.ts` throws
 * "MONGODB_URI not set" while it is still being imported. That is why every
 * script here needed the connection string passed by hand.
 *
 * `.env.local` is read first and wins, matching Next's own precedence, because
 * that is where the real connection string lives.
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();
