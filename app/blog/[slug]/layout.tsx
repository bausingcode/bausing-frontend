import type { Metadata } from "next";
import { fetchBlogPostBySlug } from "@/lib/api";
import {
  absoluteUrl,
  getSiteUrl,
  stripHtml,
  titleWithBrand,
} from "@/lib/seo/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug).catch(() => null);
  if (!post) {
    return {
      title: "Artículo",
      robots: { index: false, follow: true },
    };
  }

  const description =
    post.meta_description ||
    stripHtml(post.excerpt || post.content?.slice(0, 400), 160) ||
    post.title;

  const image =
    post.cover_image_url ||
    [...(post.images ?? [])].sort((a, b) => a.position - b.position)[0]
      ?.image_url;

  const url = `${getSiteUrl()}/blog/${post.slug}`;

  return {
    title: post.meta_title ? { absolute: post.meta_title } : post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.meta_title || titleWithBrand(post.title),
      description,
      url,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      images: image ? [{ url: absoluteUrl(image) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta_title || titleWithBrand(post.title),
      description,
      images: image ? [absoluteUrl(image)] : undefined,
    },
  };
}

export default function BlogArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
