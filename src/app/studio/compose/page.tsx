import { Suspense } from "react";
import { Composer } from "@/components/compose/composer";

export default function ComposePage() {
  return (
    <Suspense>
      <Composer />
    </Suspense>
  );
}
