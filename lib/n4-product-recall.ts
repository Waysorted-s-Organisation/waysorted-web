import dbConnect from "@/lib/db";
import type { PipelineStage } from "mongoose";
import {
  buildProductInactiveEvent,
  emitNotificationEvent,
} from "@/lib/notifications";
import Session from "@/models/session";
import User from "@/models/user";
import { getN4ScanWindow } from "@/lib/n4-scan-window";
import { getN4CanarySimulationTime } from "@/lib/n4-canary-test";

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

type ProducerOptions = {
  targetUserId?: unknown;
  producerStartedAtOverride?: Date;
  detectedAt?: Date;
  canarySimulation?: boolean;
};

function activityPipeline(input: {
  targetUserId?: unknown;
  cutoff?: Date;
  lowerBound?: Date;
  limit: number;
}) {
  const userMatch = input.targetUserId
    ? { user: input.targetUserId }
    : { user: { $ne: null } };
  const pipeline = [
    {
      $match: {
        completed: true,
        ...userMatch,
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
          { $match: { status: "committed", ...userMatch } },
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
  ] as PipelineStage[];

  if (input.cutoff && input.lowerBound) {
    pipeline.push({
      $match: {
        lastActivityAt: { $gt: input.lowerBound, $lte: input.cutoff },
      },
    });
  }
  pipeline.push({ $sort: { lastActivityAt: 1 } }, { $limit: input.limit });
  return pipeline;
}

export async function produceN4InactivityEvents(
  now = new Date(),
  options: ProducerOptions = {},
) {
  if (process.env.NOTIFICATION_N4_PRODUCER_ENABLED?.trim() !== "true") {
    return { enabled: false, candidates: 0, emitted: 0, failed: 0 };
  }

  const startedAtRaw = process.env.NOTIFICATION_N4_PRODUCER_STARTED_AT?.trim();
  const producerStartedAt = options.producerStartedAtOverride
    || (startedAtRaw ? new Date(startedAtRaw) : null);
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
  const activities = await Session.aggregate<LatestActivity>(activityPipeline({
    targetUserId: options.targetUserId,
    cutoff,
    lowerBound,
    limit,
  }));

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
    const baseEvent = buildProductInactiveEvent({
      userId: String(activity._id),
      email: user.email,
      name: user.name || null,
      lastActivityAt: new Date(activity.lastActivityAt),
      lastActivityType: activity.lastActivityType,
      lastActivitySource: activity.lastActivitySource,
      toolCode: activity.toolCode || null,
      featureCode: activity.featureCode || null,
      inactivityDays,
      detectedAt: options.detectedAt || now,
    });
    const event = options.canarySimulation
      ? {
          ...baseEvent,
          eventId: `product_inactive_7d_test:${String(activity._id)}:${new Date(activity.lastActivityAt).getTime()}`,
          payload: {
            ...baseEvent.payload,
            canary_simulation: true,
            simulated_evaluation_at: now.toISOString(),
          },
          traits: { canary_simulation: true },
        }
      : baseEvent;
    const result = await emitNotificationEvent(event);
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
    mode: options.canarySimulation ? "canary_simulation" : "scheduled",
  };
}

export class N4CanarySimulationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "N4CanarySimulationError";
  }
}

export async function produceN4CanarySimulation(email: string) {
  const inactivityDays = positiveInteger(
    process.env.NOTIFICATION_N4_INACTIVITY_DAYS,
    7,
  );
  await dbConnect();
  const user = await User.findOne({ email }).select({ email: 1, name: 1 }).lean();
  if (!user) {
    throw new N4CanarySimulationError("Canary user was not found", 404);
  }

  const latest = await Session.aggregate<LatestActivity>(activityPipeline({
    targetUserId: user._id,
    limit: 1,
  }));
  const activity = latest[0];
  if (!activity?.lastActivityAt) {
    throw new N4CanarySimulationError(
      "Canary user has no verified successful activity to simulate",
      409,
    );
  }

  const simulatedNow = getN4CanarySimulationTime(
    new Date(activity.lastActivityAt),
    inactivityDays,
  );
  const result = await produceN4InactivityEvents(simulatedNow, {
    targetUserId: user._id,
    producerStartedAtOverride: new Date(0),
    detectedAt: new Date(),
    canarySimulation: true,
  });
  return {
    ...result,
    targetEmail: email,
    latestActivityAt: new Date(activity.lastActivityAt).toISOString(),
    simulatedEvaluationAt: simulatedNow.toISOString(),
  };
}
