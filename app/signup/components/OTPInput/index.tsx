"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  length?: number;
  value?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
};

export default function OTPInput({
  length = 6,
  value = "",
  onChange,
  onComplete,
}: Props) {
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length }, (_, i) => value[i] || "")
  );
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // If value prop changes from outside, sync internal state
    if (value && value.length <= length) {
      const next = Array.from({ length }, (_, i) => value[i] || "");
      setDigits(next);
    }
  }, [value, length]);

  const code = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    onChange?.(code);
    if (code.length === length && !code.includes("")) {
      onComplete?.(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const focusAt = (idx: number) => {
    refs.current[idx]?.focus();
    refs.current[idx]?.select();
  };

  const handleChange = (idx: number, val: string) => {
    const sanitized = val.replace(/\D/g, ""); // digits only
    if (!sanitized) return;

    setDigits((prev) => {
      const next = [...prev];
      const chars = sanitized.split("");
      let i = idx;
      for (const c of chars) {
        if (i >= length) break;
        next[i] = c;
        i++;
      }
      // Move focus to the first empty or next idx
      const nextIdx = Math.min(i, length - 1);
      setTimeout(() => focusAt(nextIdx), 0);
      return next;
    });
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    if (key === "Backspace") {
      e.preventDefault();
      setDigits((prev) => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = "";
          setTimeout(() => focusAt(idx), 0);
        } else if (idx > 0) {
          next[idx - 1] = "";
          setTimeout(() => focusAt(idx - 1), 0);
        }
        return next;
      });
      return;
    }

    if (key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      focusAt(idx - 1);
      return;
    }

    if (key === "ArrowRight" && idx < length - 1) {
      e.preventDefault();
      focusAt(idx + 1);
      return;
    }
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    setDigits((prev) => {
      const next = [...prev];
      let i = idx;
      for (const ch of text) {
        if (i >= length) break;
        next[i] = ch;
        i++;
      }
      const nextIdx = Math.min(i, length - 1);
      setTimeout(() => focusAt(nextIdx), 0);
      return next;
    });
  };

  return (
    <div className="flex gap-3 w-full justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          className="w-12 h-12 text-center text-lg rounded-lg border border-secondary-db-20 outline-none focus:ring-2 focus:ring-primary-way-100"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}