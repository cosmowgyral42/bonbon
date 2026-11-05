"use client";

import { Globe2, MessageCircle, Repeat2, Send, ThumbsUp } from "lucide-react";
import { useState } from "react";

// Approximates how the post shows in the LinkedIn feed, including the "…see more" fold.
const FOLD = 210;

export function LinkedInPreview({
  text,
  name,
  headline,
  compact,
  images = [],
}: {
  text: string;
  name?: string;
  headline?: string;
  compact?: boolean;
  images?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const needsFold = text.length > FOLD;
  const shown = expanded || !needsFold ? text : text.slice(0, FOLD).replace(/\s+\S*$/, "");
  const initials = (name || "You")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="@container overflow-hidden rounded-2xl border border-[#e8e3e6] bg-white text-[14px] text-[#1d1d1d] shadow-sm">
      <div className="flex items-start gap-3 p-4 pb-2">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blush-200 to-blush-400 text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-semibold">{name || "You"}</p>
          <p className="truncate text-xs text-[#666]">{headline || "Your headline"}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#666]">
            now · <Globe2 className="size-3" />
          </p>
        </div>
      </div>
      <div className={`px-4 pb-3 leading-[1.45] whitespace-pre-wrap ${compact ? "max-h-64 overflow-y-auto" : ""}`}>
        {shown}
        {needsFold && !expanded && (
          <>
            …{" "}
            {/* span, not button: previews sometimes sit inside clickable cards */}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpanded(true);
                }
              }}
              className="cursor-pointer text-[#666] hover:text-[#0a66c2] hover:underline"
            >
              see more
            </span>
          </>
        )}
      </div>
      {images.length > 0 && <PreviewImages images={images} />}
      <div className="flex justify-around border-t border-[#eee] px-2 py-1 text-xs font-semibold text-[#666]">
        {[
          [ThumbsUp, "Like"],
          [MessageCircle, "Comment"],
          [Repeat2, "Repost"],
          [Send, "Send"],
        ].map(([Icon, label]) => {
          const I = Icon as typeof ThumbsUp;
          return (
            <span key={label as string} className="flex items-center gap-1.5 rounded-md px-2 py-2.5">
              <I className="size-4" /> <span className="hidden @[360px]:inline">{label as string}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// LinkedIn-style layouts: 1 image full width, 2 side by side, 3+ one big + a row.
function PreviewImages({ images }: { images: string[] }) {
  /* eslint-disable @next/next/no-img-element */
  if (images.length === 1) {
    return <img src={images[0]} alt="" className="block max-h-[520px] w-full bg-[#f3f2ef] object-contain" />;
  }
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 bg-white">
        {images.map((src, i) => (
          <img key={i} src={src} alt="" className="aspect-square w-full object-cover" />
        ))}
      </div>
    );
  }
  const rest = images.slice(1, 4);
  return (
    <div className="grid gap-0.5 bg-white">
      <img src={images[0]} alt="" className="aspect-[16/10] w-full object-cover" />
      <div className="grid grid-cols-3 gap-0.5">
        {rest.map((src, i) => (
          <div key={i} className="relative">
            <img src={src} alt="" className="aspect-square w-full object-cover" />
            {i === rest.length - 1 && images.length > 4 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xl font-semibold text-white">
                +{images.length - 4}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  /* eslint-enable @next/next/no-img-element */
}
