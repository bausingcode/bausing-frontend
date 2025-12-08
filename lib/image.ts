// utils/image.ts
type CompressOptions = {
  maxSide?: number;   // default 2048
  quality?: number;   // default 0.86
};

const ALLOWED_UPLOAD = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function guessMimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "";
}

export function isAllowed(file: File): boolean {
  const mt = (file.type || "").toLowerCase() || guessMimeFromName(file.name);
  return ALLOWED_UPLOAD.has(mt);
}

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  try {
    // @ts-ignore
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fallback a <img> si falla
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas no disponible");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return await createImageBitmap(blob);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }
}

async function drawToWebpBlob(
  bmp: ImageBitmap,
  opts: Required<CompressOptions>
): Promise<Blob> {
  const { maxSide, quality } = opts;
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));

  // @ts-ignore
  if (typeof OffscreenCanvas !== "undefined") {
    // @ts-ignore
    const off = new OffscreenCanvas(w, h);
    const ctx = off.getContext("2d") as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.drawImage(bmp, 0, 0, w, h);
    // @ts-ignore
    return await off.convertToBlob({ type: "image/webp", quality });
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(bmp, 0, 0, w, h);

  return await new Promise((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error("toBlob falló"))), "image/webp", quality)
  );
}

/** Solo normaliza mime para casos simples, no convierte HEIC */
async function ensureDecodable(file: File): Promise<File> {
  const mt0 = (file.type || "").toLowerCase() || guessMimeFromName(file.name);
  const mt = mt0 === "image/jpg" ? "image/jpeg" : mt0;
  return mt && mt !== mt0 ? new File([file], file.name, { type: mt }) : file;
}

/**
 * Comprime a WebP cuando el navegador puede decodificar,
 * si es HEIC o HEIF, ignora la compresión y devuelve el archivo original.
 */
export async function compressToWebp(
  input: File,
  options: CompressOptions = {}
): Promise<File> {
  const opts: Required<CompressOptions> = {
    maxSide: options.maxSide ?? 2048,
    quality: options.quality ?? 0.86,
  };
  if (!isAllowed(input)) {
    throw new Error("Tipo de archivo no permitido");
  }

  const mt = (input.type || "").toLowerCase() || guessMimeFromName(input.name);
  if (mt === "image/heic" || mt === "image/heif") {
    // Ignoramos por completo cualquier conversión que requiera WASM,
    // devolvemos el archivo tal cual para subirlo directo al storage.
    return input;
  }

  // Para el resto, normalizamos mime y comprimimos
  const decodable = await ensureDecodable(input);
  const bmp = await fileToBitmap(decodable);
  try {
    const blob = await drawToWebpBlob(bmp, opts);
    // @ts-ignore
    if (bmp.close) bmp.close();
    return new File(
      [blob],
      decodable.name.replace(/\.\w+$/, ".webp"),
      { type: "image/webp" }
    );
  } catch (e) {
    // @ts-ignore
    if (bmp.close) bmp.close();
    throw e;
  }
}

/**
 * Comprime varios archivos. HEIC y HEIF se devuelven sin cambios.
 * Los demás se comprimen en paralelo moderado.
 */
export async function compressManySmart(
  files: File[],
  options: CompressOptions = {}
): Promise<File[]> {
  const heicOrHeif = (f: File) => {
    const t = (f.type || "").toLowerCase() || guessMimeFromName(f.name);
    return t === "image/heic" || t === "image/heif";
  };

  const heic = files.filter(heicOrHeif);
  const other = files.filter(f => !heicOrHeif(f));

  const out: File[] = [];

  // HEIC y HEIF, bypass total
  for (const f of heic) {
    out.push(f);
  }

  // Los demás, compresión en paralelo moderado
  const pool = 2;
  const queue = [...other];
  const workers: Promise<void>[] = [];
  async function worker() {
    while (queue.length) {
      const f = queue.shift()!;
      out.push(await compressToWebp(f, options));
    }
  }
  const n = Math.min(pool, queue.length);
  for (let i = 0; i < n; i++) workers.push(worker());
  await Promise.all(workers);

  return out;
}

/** Utilidad, te dice qué va a pasar con el archivo */
export function getCompressionPlan(file: File): "bypass" | "compress" {
  const t = (file.type || "").toLowerCase() || guessMimeFromName(file.name);
  return t === "image/heic" || t === "image/heif" ? "bypass" : "compress";
}

