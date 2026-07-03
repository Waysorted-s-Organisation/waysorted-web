import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getCurrentUser } from "@/lib/user";
import {
  areAllNewsletterPreferencesUnsubscribed,
  DEFAULT_NEWSLETTER_PREFERENCES,
  NEWSLETTER_PREFERENCE_CATEGORIES,
  normalizeNewsletterPreferences,
} from "@/lib/newsletterPreferences";
import {
  buildNotificationPreferencesUpdatedEvent,
  emitNotificationEvent,
} from "@/lib/notifications";
import Subscriber from "@/models/subscriber";

type SubscriberPreferenceShape = {
  preferences?: Record<string, unknown>;
  status?: string;
};

function responseForPreferences(source: SubscriberPreferenceShape | null) {
  const storedPreferences = normalizeNewsletterPreferences(source?.preferences);
  const preferences =
    source?.status === "unsubscribed"
      ? normalizeNewsletterPreferences(
          Object.fromEntries(
            NEWSLETTER_PREFERENCE_CATEGORIES.map((category) => [
              category.key,
              "unsubscribed",
            ])
          )
        )
      : storedPreferences;

  return {
    categories: NEWSLETTER_PREFERENCE_CATEGORIES,
    preferences,
    status: areAllNewsletterPreferencesUnsubscribed(preferences)
      ? "unsubscribed"
      : "active",
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const subscriber = await Subscriber.findOne({
      email: user.email.toLowerCase(),
    }).lean<SubscriberPreferenceShape | null>();

    return NextResponse.json({
      success: true,
      ...responseForPreferences(subscriber),
    });
  } catch (error) {
    console.error("GET /api/newsletter/preferences error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const requestedPreferences =
      body?.unsubscribeAll === true
        ? Object.fromEntries(
            NEWSLETTER_PREFERENCE_CATEGORIES.map((category) => [
              category.key,
              "unsubscribed",
            ])
          )
        : body?.preferences;

    const preferences = normalizeNewsletterPreferences(
      requestedPreferences,
      DEFAULT_NEWSLETTER_PREFERENCES
    );
    const unsubscribedAll =
      areAllNewsletterPreferencesUnsubscribed(preferences);
    const now = new Date();
    const email = user.email.toLowerCase();

    await dbConnect();
    await Subscriber.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          name: user.name || undefined,
          preferences,
          status: unsubscribedAll ? "unsubscribed" : "active",
          source: "settings",
          updated_at: now,
          unsubscribed_at: unsubscribedAll ? now : null,
          ...(unsubscribedAll ? {} : { resubscribed_at: now }),
        },
        $setOnInsert: {
          subscribed_at: now,
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    await emitNotificationEvent(
      buildNotificationPreferencesUpdatedEvent({
        userId: user.id,
        email,
        name: user.name,
        preferences,
        unsubscribedAll,
      })
    );

    return NextResponse.json({
      success: true,
      categories: NEWSLETTER_PREFERENCE_CATEGORIES,
      preferences,
      status: unsubscribedAll ? "unsubscribed" : "active",
      message: unsubscribedAll
        ? "Newsletter emails unsubscribed"
        : "Notification preferences updated",
    });
  } catch (error) {
    console.error("PUT /api/newsletter/preferences error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
