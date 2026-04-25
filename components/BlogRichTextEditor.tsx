"use client";

import dynamic from "next/dynamic";

const BlogRichTextInner = dynamic(() => import("./BlogRichTextInner"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[320px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
  ),
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  postId: string | null;
  onImageUploadError: (message: string) => void;
  onNeedPostId?: () => void;
  placeholder?: string;
};

export default function BlogRichTextEditor(props: Props) {
  return <BlogRichTextInner {...props} />;
}
