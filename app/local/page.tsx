import { getLocalPageImage } from "@/lib/api";
import LocalContent from "./LocalContent";

const DEFAULT_LOCAL_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop";

export default async function LocalPage() {
  const localImageUrl = (await getLocalPageImage().catch(() => null)) || DEFAULT_LOCAL_IMAGE;

  return <LocalContent localImageUrl={localImageUrl} />;
}
