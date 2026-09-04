"use client";

import { useState } from "react";

export type CounterProps = {
  /** Starting value. */
  initialCount?: number;
  /** How much each click changes the count by. */
  step?: number;
  /** The count can never go below this. */
  min?: number;
  /** The count can never go above this. */
  max?: number;
  /** Called with the new value after every change. */
  onChange?: (count: number) => void;
};

export function Counter({
  initialCount = 0,
  step = 1,
  min = -Infinity,
  max = Infinity,
  onChange,
}: CounterProps) {
  const [count, setCount] = useState(initialCount);

  function update(next: number) {
    const clamped = Math.min(max, Math.max(min, next));
    setCount(clamped);
    onChange?.(clamped);
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-lg">
        Count: <span data-testid="count">{count}</span>
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => update(count - step)}
          disabled={count - step < min}
          className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
        >
          Decrement
        </button>
        <button
          type="button"
          onClick={() => update(count + step)}
          disabled={count + step > max}
          className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
        >
          Increment
        </button>
        <button
          type="button"
          onClick={() => update(initialCount)}
          className="rounded-full border px-4 py-2 text-sm"
        >
          Reset
        </button>
      </div>

      {count === max && <p role="status">Maximum reached</p>}
    </div>
  );
}
