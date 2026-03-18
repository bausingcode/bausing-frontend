/** URL de Supabase hero bucket apuntando a un video */
export function isHeroVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const path = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v)$/.test(path);
}
