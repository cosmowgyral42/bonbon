const HOOKS = [
  "I said yes before I felt ready 🌷",
  "Three things my first hackathon taught me",
  "New city, new desk, same messy notebook",
  "I finally finished the course I kept pausing 📚",
  "We shipped it. Here's the ugly first version 🧁",
  "Promotion news, but mostly a thank-you note 💌",
  "What 30 days of learning Figma looked like",
  "Small win, loudly celebrated ✨",
];

const TONES = [
  "warm",
  "witty",
  "honest",
  "curious",
  "storyteller",
  "a little nerdy",
  "soft-spoken",
  "bold",
  "playful",
  "thoughtful",
];

function Row({ items, reverse, pill }: { items: string[]; reverse?: boolean; pill?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div
        className="flex w-max shrink-0 animate-marquee gap-4 pr-4 group-hover:[animation-play-state:paused]"
        style={{ animationDirection: reverse ? "reverse" : "normal", animationDuration: pill ? "55s" : "45s" }}
      >
        {doubled.map((t, i) =>
          pill ? (
            <span
              key={i}
              className="rounded-full border border-blush-200 bg-white/70 px-5 py-2 font-hand text-2xl text-blush-600 transition-all duration-300 hover:-translate-y-1 hover:bg-blush-500 hover:text-white"
            >
              {t}
            </span>
          ) : (
            <span
              key={i}
              className="candy-card cursor-default px-6 py-4 font-display text-lg font-medium whitespace-nowrap text-berry transition-all duration-500 ease-[var(--ease-bounce)] hover:-translate-y-1.5 hover:-rotate-1 hover:border-blush-300 hover:shadow-[var(--shadow-candy-lg)]"
            >
              {t}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <section aria-label="Example post openers" className="relative space-y-4 py-10">
      <Row items={HOOKS} />
      <Row items={TONES} reverse pill />
    </section>
  );
}
