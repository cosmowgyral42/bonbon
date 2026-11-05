"use client";

import { motion } from "motion/react";
import { useState } from "react";

const BITS = ["💖", "✨", "🍬", "🎀", "💗", "🌸", "⭐"];

export function Confetti({ count = 26 }: { count?: number }) {
  // Random burst computed once per mount.
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 120 + Math.random() * 160;
      return {
        emoji: BITS[i % BITS.length],
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 40,
        rotate: Math.random() * 360 - 180,
        delay: Math.random() * 0.15,
        size: 14 + Math.random() * 14,
      };
    }),
  );

  return (
    <div aria-hidden className="pointer-events-none absolute top-24 left-1/2">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ fontSize: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 80], opacity: [1, 1, 0], scale: 1, rotate: p.rotate }}
          transition={{ duration: 1.6, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}
