import { type NextRequest, NextResponse } from "next/server";
import { notifications, EazoNotificationPublishError } from "@eazo/sdk/server";

/**
 * GET /api/notifications/cron/daily-digest
 *
 * Scheduled by `vercel.json#crons`. Demonstrates the time-driven
 * publish path: a fresh serverless invocation fires once per day, posts
 * a generic reminder to every subscriber of this app, and exits — no
 * long-running backend required.
 *
 * Auth: Vercel Cron attaches `Authorization: Bearer ${CRON_SECRET}`
 * automatically (https://vercel.com/docs/cron-jobs/manage-cron-jobs).
 * We compare against the env var; mismatched / missing → 401, so the
 * route is a no-op for ad-hoc HTTP callers and only fires on schedule.
 *
 * v1's publish endpoint always broadcasts to `audience: "subscribers"`
 * with one shared title/body, so this route doesn't personalise. When
 * per-user content lands in v2, swap to N publish calls (or pass a
 * recipient list once the platform supports it).
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const appId = process.env.NEXT_PUBLIC_EAZO_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_EAZO_APP_ID is not configured" },
      { status: 500 },
    );
  }

  try {
    const result = await notifications.publish({
      appId,
      title: "Daily reminder",
      body: "Don't forget to review your tasks today.",
      data: { source: "cron-daily-digest" },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EazoNotificationPublishError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.code >= 400 && err.code < 600 ? err.code : 500 },
      );
    }
    console.error("[notifications/cron] unexpected error", err);
    return NextResponse.json({ error: "publish failed" }, { status: 500 });
  }
}
