import { Suspense } from "react";
import { StudioNav } from "@/components/studio-nav";

export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  return (
    <div className="bg-candy relative flex min-h-screen">
      {/* floating candy blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-8rem] right-[-6rem] size-[26rem] animate-float-slow rounded-full bg-blush-200/40 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[20%] size-[30rem] animate-float rounded-full bg-lilac/70 blur-3xl" />
      </div>
      <StudioNav />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-28 md:px-10 lg:pt-12 lg:pb-16">
        {/* Studio pages read the clock and local data, so they render per visit */}
        <Suspense
          fallback={
            <div className="flex h-[60vh] items-center justify-center">
              <span className="animate-float text-5xl">🍬</span>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
