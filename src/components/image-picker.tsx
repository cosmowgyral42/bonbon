"use client";

/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import { ImagePlus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/ui";
import { imageSrc } from "@/lib/client";
import type { PostImage } from "@/lib/types";

const MAX = 9; // LinkedIn allows up to 9 images in a post

export function ImagePicker({
  images,
  onChange,
  disabled,
}: {
  images: PostImage[];
  onChange: (images: PostImage[]) => void;
  disabled?: boolean;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [over, setOver] = useState(false);

  async function add(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, MAX - images.length);
    if (!list.length) return;
    setUploading(list.length);
    const added: PostImage[] = [];
    for (const f of list) {
      const form = new FormData();
      form.append("file", f);
      try {
        const res = await fetch("/api/media", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        added.push(json as PostImage);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed", "error");
      }
      setUploading((n) => n - 1);
    }
    if (added.length) onChange([...images, ...added]);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) add(e.dataTransfer.files);
      }}
      className={clsx(
        "rounded-2xl border-2 border-dashed p-3 transition-colors duration-300",
        over ? "border-blush-400 bg-blush-50" : "border-blush-100 bg-white",
      )}
    >
      <div className="flex flex-wrap gap-3">
        <AnimatePresence initial={false}>
          {images.map((img) => (
            <motion.div
              key={img.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative size-24 overflow-hidden rounded-xl border border-blush-100 bg-blush-50 shadow-sm"
            >
              <img src={imageSrc(img)} alt="" className="size-full object-cover" />
              {img.url && (
                <span className="absolute bottom-1 left-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-mint-deep">
                  public
                </span>
              )}
              {!disabled && (
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => onChange(images.filter((x) => x.id !== img.id))}
                  className="absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-white/95 text-berry opacity-0 shadow transition-all group-hover:opacity-100 hover:bg-blush-500 hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`u${i}`} className="flex size-24 items-center justify-center rounded-xl bg-blush-50 text-blush-500">
            <Spinner />
          </div>
        ))}

        {!disabled && images.length + uploading < MAX && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className={clsx(
              "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-blush-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blush-50",
              images.length ? "size-24 border border-blush-100" : "h-24 flex-1 px-4",
            )}
          >
            <ImagePlus className="size-5" />
            <span className="text-xs font-semibold">{images.length ? "Add" : "Add an image"}</span>
            {!images.length && <span className="text-[11px] text-berry-faint">or drop it here · PNG, JPG, GIF, WebP</span>}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
