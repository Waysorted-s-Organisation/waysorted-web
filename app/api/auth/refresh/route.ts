import { NextRequest } from "next/server";
import { handleRefresh } from "@/lib/auth-refresh";

export { OPTIONS } from "@/lib/cors";

// The handler lives in lib/ so it can be loaded by tests; a Next.js route
// module may export only route handlers.
export async function POST(request: NextRequest) {
  return handleRefresh(request);
}
