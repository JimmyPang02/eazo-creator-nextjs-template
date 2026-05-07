import { type NextRequest, NextResponse } from "next/server";
import { notifications, EazoNotificationPublishError } from "@eazo/sdk/server";
import { requireAuth } from "@/lib/auth";
import { getTodos } from "@/lib/db/queries/todos";

/**
 * POST /api/notifications/test
 *
 * Demonstrates the server-side `notifications.publish` API. Requires a
 * signed-in caller (so random crawlers can't drive the platform). Reads
 * the caller's actual todo list to compose a *meaningful* push body —
 * pending count + the oldest pending task title — instead of generic
 * "Hello world" filler. Production apps trigger publishes from real
 * events (webhooks, crons, user actions); this route exists so the
 * pipeline is easy to dogfood end-to-end with realistic content.
 *
 * Caveat: v1 `audience: 'subscribers'` broadcasts to *every* subscriber
 * of this app, not just the caller. The body is "you-shaped" because
 * the only subscriber during dogfooding is usually the caller themselves.
 * When multiple subscribers exist they all receive the same caller-derived
 * text — that's the v1 trade-off until per-recipient publishes ship.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const appId = process.env.NEXT_PUBLIC_EAZO_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_EAZO_APP_ID is not configured" },
      { status: 500 },
    );
  }

  // Compose a body that ties to the caller's real state. Falls back to
  // an encouragement prompt if there are no pending todos.
  const userTodos = await getTodos(auth.user.id);
  const pending = userTodos.filter((t) => !t.completed);
  const completedCount = userTodos.filter((t) => t.completed).length;
  // List is ordered DESC by createdAt; the *oldest* pending sits at the tail.
  const oldestPending = pending[pending.length - 1];
  const callerLabel =
    auth.user.name?.trim() || auth.user.email?.split("@")[0] || "there";

  let title: string;
  let body: string;
  if (pending.length === 0) {
    title = `All caught up, ${callerLabel} 🎉`;
    body =
      completedCount > 0
        ? `${completedCount} task${completedCount === 1 ? "" : "s"} done — add the next thing on your mind.`
        : "No pending tasks yet. Add one to get started.";
  } else if (pending.length === 1 && oldestPending) {
    title = "1 task waiting for you";
    body = `Don't forget: "${truncate(oldestPending.title, 80)}"`;
  } else if (oldestPending) {
    title = `${pending.length} tasks waiting for you`;
    body = `Oldest still open: "${truncate(oldestPending.title, 64)}"`;
  } else {
    // pending.length > 0 but oldestPending undefined — defensive only
    title = `${pending.length} tasks waiting for you`;
    body = "Tap to review your list.";
  }

  try {
    const result = await notifications.publish({
      appId,
      title,
      body,
      data: {
        source: "test-button",
        triggeredByUserId: auth.user.id,
        pendingCount: pending.length,
        completedCount,
        // appId is also surfaced via `targetId` server-side so the mobile
        // tap handler can deep-link without us repeating it here, but we
        // keep it explicit for any non-mobile consumer reading `data`.
        appId,
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EazoNotificationPublishError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.code >= 400 && err.code < 600 ? err.code : 500 },
      );
    }
    console.error("[notifications/test] unexpected error", err);
    return NextResponse.json({ error: "publish failed" }, { status: 500 });
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}
