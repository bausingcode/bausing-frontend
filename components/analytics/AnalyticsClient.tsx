"use client";

import { Suspense } from "react";
import MetaPageViewTracker from "./MetaPageViewTracker";

export default function AnalyticsClient() {
  return (
    <Suspense fallback={null}>
      <MetaPageViewTracker />
    </Suspense>
  );
}
