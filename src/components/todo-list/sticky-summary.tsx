"use client";

import { CheckCheck } from "lucide-react";

interface TodoStickySummaryProps {
  total: number;
  done: number;
  onClearCompleted: () => void;
}

/**
 * Pinned bottom progress + clear-completed pills for the todo list.
 *
 * Always-visible footer following the Things / Todoist / Apple
 * Reminders pattern: how many tasks remain on the left, one-tap
 * "Clear completed" on the right. Both stay reachable while
 * scrolling a long list, no scroll-back-to-top trip required.
 *
 * Each pill is its own top-level `position: fixed` element. This
 * sibling layout is a deliberate choice for this specific footer
 * design; preserve it when refactoring this component.
 *
 * Hides when the list is empty (the empty-state card already owns
 * the viewport). The "Clear completed" pill hides while nothing is
 * done so the footer reads as a pure summary in that case.
 */
export function TodoStickySummary({
  total,
  done,
  onClearCompleted,
}: TodoStickySummaryProps) {
  if (total === 0) return null;
  const remaining = total - done;
  return (
    <>
      <div
        data-testid="todo-sticky-progress"
        className="fixed bottom-3 left-4 z-30 rounded-full border border-slate-950/8 bg-white px-3.5 py-1.5 text-[13px] leading-tight shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
      >
        {remaining === 0 ? (
          <span className="font-semibold text-slate-950/70">
            All {total} done — nice work
          </span>
        ) : (
          <>
            <span className="font-semibold text-slate-950/80">{remaining}</span>
            <span className="text-slate-950/45"> remaining</span>
            <span className="mx-1.5 text-slate-950/25">·</span>
            <span className="text-slate-950/50">
              {done} of {total} done
            </span>
          </>
        )}
      </div>
      {done > 0 && (
        <button
          data-testid="todo-sticky-clear"
          type="button"
          onClick={onClearCompleted}
          className="fixed right-4 bottom-3 z-30 flex h-8 items-center gap-1.5 rounded-full border border-slate-950/8 bg-white px-3.5 text-[12px] font-semibold text-slate-950/60 shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-colors hover:text-[#EE5C2A]"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Clear completed
        </button>
      )}
    </>
  );
}
