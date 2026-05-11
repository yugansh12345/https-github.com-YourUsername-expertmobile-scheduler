"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface Props {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

export default function SignaturePad({ onSave, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    lastPos.current = getPos(e, canvas);
  }, [disabled]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!drawing || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      setHasStrokes(true);
    }
    lastPos.current = pos;
  }, [drawing, disabled]);

  const endDraw = useCallback(() => {
    setDrawing(false);
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", endDraw);
    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", endDraw);
      canvas.removeEventListener("mouseleave", endDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", endDraw);
    };
  }, [startDraw, draw, endDraw]);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    onSave(canvas.toDataURL("image/png"));
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="w-full border-2 border-dashed border-[var(--color-border)] rounded-lg bg-white touch-none"
        style={{ cursor: disabled ? "not-allowed" : "crosshair" }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={disabled || !hasStrokes}
          className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] disabled:opacity-40 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          disabled={disabled || !hasStrokes}
          className="px-3 py-1.5 text-sm rounded-md bg-[var(--color-primary)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}
