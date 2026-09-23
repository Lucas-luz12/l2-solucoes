import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shopId: string; file: string }> },
) {
  const { shopId, file } = await params;
  if (!/^[a-zA-Z0-9_-]+$/.test(shopId) || !/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(file)) {
    return new Response("Imagem não encontrada.", { status: 404 });
  }
  const root = path.resolve(process.cwd(), "data", "acougue-media");
  const target = path.resolve(root, shopId, file);
  if (!target.startsWith(root + path.sep)) {
    return new Response("Imagem não encontrada.", { status: 404 });
  }
  try {
    const bytes = await readFile(target);
    const ext = file.slice(file.lastIndexOf(".") + 1);
    return new Response(bytes, {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Imagem não encontrada.", { status: 404 });
  }
}
