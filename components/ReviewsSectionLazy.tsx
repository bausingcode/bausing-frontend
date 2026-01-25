"use client";

import dynamic from "next/dynamic";

const ReviewsSection = dynamic(() => import("@/components/ReviewsSection"), {
  loading: () => <div className="py-16 bg-[#FAFAFA]" />,
  ssr: false, // Lazy load en el cliente
});

export default ReviewsSection;
