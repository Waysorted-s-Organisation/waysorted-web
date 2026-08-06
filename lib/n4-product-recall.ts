import dbConnect from "@/lib/db";
import {
  buildProductInactiveEvent,
  emitNotificationEvent,
} from "@/lib/notifications";
import Session from "@/models/session";
import User from "@/models/user";
import { getN4ScanWindow } from "@/lib/n4-scan-window";

type LatestActivity = {
  _id: unknown;
  lastActivityAt: Date;
  lastActivityType: "login" | "credited_tool";
  lastActivitySource: string;
  toolCode?: string | null;
  featureCode?: string | null;
};

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export async function produceN4InactivityEvents(now = new Date()) {
  if (process.env.NOTIFICATION_N4_PRODUCER_ENABLED?.trim() !== "true") {
    return { enabled: false, candidates: 0, emitted: 0, failed: 0 };
  }

  const startedAtRaw = process.env.NOTIFICATION_N4_PRODUCER_STARTED_AT?.trim();
  const producerStartedAt = startedAtRaw ? new Date(startedAtRaw) : null;
  if (!producerStartedAt || Number.isNaN(producerStartedAt.getTime())) {
    throw new Error(
      "NOTIFICATION_N4_PRODUCER_STARTED_AT must be a valid timestamp to prevent historical backfill.",
    );
  }

  const inactivityDays = positiveInteger(
    process.env.NOTIFICATION_N4_INACTIVITY_DAYS,
    7,
  );
  const lookbackHours = positiveInteger(
    process.env.NOTIFICATION_N4_SCAN_LOOKBACK_HOURS,
    50,
  );
  const limit = Math.min(
    positiveInteger(process.env.NOTIFICATION_N4_SCAN_LIMIT, 100),
    500,
  );
  const { cutoff, lowerBound } = getN4ScanWindow({
    now,
    producerStartedAt,
    inactivityDays,
    lookbackHours,
  });

  await dbConnect();
  const activities = await Session.aggregate<LatestActivity>([
    {
      $match: {
        completed: true,
        user: { $ne: null },
      },
    },
    {
      $project: {
        user: 1,
        activityAt: { $ifNull: ["$completedAt", "$createdAt"] },
        activityType: { $literal: "login" },
        activitySource: { $ifNull: ["$source", "web"] },
        toolCode: { $literal: null },
        featureCode: { $literal: null },
      },
    },
    {
      $unionWith: {
        coll: "usagereservations",
        pipeline: [
          { $match: { status: "committed", user: { $ne: null } } },
          {
            $project: {
              user: 1,
              activityAt: { $ifNull: ["$committedAt", "$updatedAt"] },
              activityType: { $literal: "credited_tool" },
              activitySource: { $literal: "billing_usage" },
              toolCode: 1,
              featureCode: 1,
            },
          },
        ],
      },
    },
    { $match: { activityAt: { $ne: null } } },
    { $sort: { activityAt: -1 } },
    {
      $group: {
        _id: "$user",
        lastActivityAt: { $first: "$activityAt" },
        lastActivityType: { $first: "$activityType" },
        lastActivitySource: { $first: "$activitySource" },
        toolCode: { $first: "$toolCode" },
        featureCode: { $first: "$featureCode" },
      },
    },
    {
      $match: {
        lastActivityAt: { $gt: lowerBound, $lte: cutoff },
      },
    },
    { $sort: { lastActivityAt: 1 } },
    { $limit: limit },
  ]);

  const users = await User.find({
    _id: { $in: activities.map((item) => item._id) },
  }).select({ email: 1, name: 1 }).lean();
  const usersById = new Map(
    users.map((user) => [String(user._id), user]),
  );

  let emitted = 0;
  let failed = 0;
  for (const activity of activities) {
    const user = usersById.get(String(activity._id));
    if (!user?.email) {
      failed += 1;
      continue;
    }
    const result = await emitNotificationEvent(buildProductInactiveEvent({
      userId: String(activity._id),
      email: user.email,
      name: user.name || null,
      lastActivityAt: new Date(activity.lastActivityAt),
      lastActivityType: activity.lastActivityType,
      lastActivitySource: activity.lastActivitySource,
      toolCode: activity.toolCode || null,
      featureCode: activity.featureCode || null,
      inactivityDays,
      detectedAt: now,
    }));
    if (result.sent) emitted += 1;
    else failed += 1;
  }

  return {
    enabled: true,
    candidates: activities.length,
    emitted,
    failed,
    inactivityDays,
    coverage: "successful_logins_and_credited_tools",
    cutoff: cutoff.toISOString(),
    lowerBound: lowerBound.toISOString(),
  };
}
