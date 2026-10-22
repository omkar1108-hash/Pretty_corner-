"use client";

/** Small  −  3  +  quantity control. */
export default function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-lg font-bold leading-none text-rose transition hover:bg-blush disabled:opacity-30 disabled:hover:bg-white";
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" className={btn} aria-label="−" disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} aria-label="+" disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
