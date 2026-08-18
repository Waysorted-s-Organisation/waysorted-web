import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import { opaqueSecretMatches } from "@/lib/auth-session";
import { OPTIONS, withCors } from "@/lib/cors";

export { OPTIONS };

type PollBody = {
  sessionId?: string;
  pollSecret?: string;
};

function pollResponse(request: NextRequest, body: unknown, status = 200) {
  return withCors(request, NextResponse.json(body, { status }));
}

export async function GET(request: NextRequest) {
  return pollResponse(
    request,
    { error: "Use POST with the polling credentials returned by /api/auth/start." },
    405,
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as PollBody;
    const pollId = body.sessionId?.trim();
    const pollSecret = body.pollSecret?.trim();

    if (!pollId || !pollSecret) {
      return pollResponse(request, { error: "Missing polling credentials." }, 400);
    }

    await dbConnect();
    const now = new Date();
    const session = await Session.findOne({
      pollId,
      pollExpiresAt: { $gt: now },
      pollConsumedAt: { $exists: false },
    }).lean();

    if (
      !session?.pollSecretHash ||
      !opaqueSecretMatches(pollSecret, session.pollSecretHash)
    ) {
      return pollResponse(request, { error: "Invalid or expired polling credentials." }, 401);
    }

    if (!session.completed) {
      return pollResponse(request, { pending: true });
    }

    if (!session.user || !session.accessToken) {
      return pollResponse(request, { error: "Authentication did not complete correctly." }, 401);
    }

    if (!session.accessTokenExpiresAt || session.accessTokenExpiresAt <= Date.now()) {
      return pollResponse(
        request,
        { error: "Authentication token expired. Please sign in again.", requiresReauth: true },
        401,
      );
    }

    const consumed = await Session.findOneAndUpdate(
      {
        _id: session._id,
        pollId,
        pollConsumedAt: { $exists: false },
        pollExpiresAt: { $gt: now },
      },
      {
        $set: { pollConsumedAt: now },
        $unset: { pollSecretHash: 1 },
      },
      { new: true },
    ).lean();

    if (!consumed) {
      return pollResponse(request, { error: "Polling credentials were already consumed." }, 409);
    }

    return pollResponse(request, { accessToken: session.accessToken });
  } catch (error) {
    console.error("Error in /api/auth/poll:", error);
    return pollResponse(request, { error: "Unable to check authentication status." }, 500);
  }
}
