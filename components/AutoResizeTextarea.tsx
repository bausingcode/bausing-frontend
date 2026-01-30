"use client";

import { useRef, useEffect, useCallback } from "react";

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

export default function AutoResizeTextarea({
  value,
  onChange,
  minRows = 2,
  className = "",
  style,
  ...rest
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 20;
    const minHeight = minRows * lineHeight;
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  }, [minRows]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        resize();
      }}
      onInput={resize}
      className={className}
      style={{ ...style, overflow: "hidden" }}
      rows={minRows}
      {...rest}
    />
  );
}
