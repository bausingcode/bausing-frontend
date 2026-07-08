"use client";

import dynamic from "next/dynamic";

const ReviewsSectionInner = dynamic(() => import("@/components/ReviewsSection"), {
  loading: () => <div className="py-16 bg-[#FAFAFA]" />,
  ssr: false,
});

export default function ReviewsSectionLazy({ reviewCount }: { reviewCount?: number }) {
  return <ReviewsSectionInner reviewCount={reviewCount} />;
}
