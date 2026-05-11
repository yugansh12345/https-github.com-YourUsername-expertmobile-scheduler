"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";

interface Props {
  onCapture: (dataUrl: string) => void;
  disabled?: boolean;
}

// Compress image to JPEG at reduced quality/size to keep base64 manageable
function compressImage(file: File | Blob, maxWidth = 1280, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no ctx")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function PhotoCapture({ onCapture, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      onCapture(dataUrl);
    } finally {
      setLoading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      {preview && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="h-32 rounded-md border border-[var(--color-border)] object-cover" />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute -top-2 -right-2 bg-white rounded-full border border-[var(--color-border)] p-0.5 hover:bg-red-50 text-red-500"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {/* Camera capture (mobile) */}
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => cameraRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-[var(--color-primary)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <Camera size={16} />
          {loading ? "Processing…" : "Take Photo"}
        </button>
        {/* File picker */}
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] disabled:opacity-40 transition-colors"
        >
          <Upload size={16} />
          Upload
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
