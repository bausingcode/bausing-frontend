import DOMPurify from "isomorphic-dompurify";

const SANITIZE = {
  USE_PROFILES: { html: true } as const,
  ADD_TAGS: ["img", "h1", "h2", "h3", "h4", "h5", "h6"],
  ADD_ATTR: ["target", "rel", "class", "style", "src", "alt", "width", "height"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
  FORBID_ATTR: [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onmouseenter",
    "onfocus",
    "onanimationstart",
  ],
};

/**
 * Contenido HTML del blog: permite formato enriquecido (Quill) sin ejecutar JS embebido.
 */
export function sanitizeBlogHtml(dirty: string | undefined | null): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, SANITIZE);
}
