import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readSession } from "@/lib/acougue/auth";
import { getShop, StoreError } from "@/lib/acougue/store";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2_500_000;

const TYPES: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sniff(bytes: Uint8Array, ext: "jpg" | "png" | "webp") {
  if (ext === "jpg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (ext === "png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (bytes.length < 12) return false;
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  return riff === "RIFF" && webp === "WEBP";
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(`midia:${clientIp(request)}`, 20, 10 * 60 * 1000)) return tooManyRequests();
    const session = await readSession();
    if (!session) return Response.json({ error: "Entre na conta do açougue." }, { status: 401 });
    await getShop(session.shopId);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Escolha uma imagem." }, { status: 400 });
    }
    const ext = TYPES[file.type];
    if (!ext) {
      return Response.json({ error: "Use uma foto JPG, PNG ou WebP." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return Response.json({ error: "A imagem precisa ter até 2,5 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!sniff(bytes, ext)) {
      return Response.json({ error: "O arquivo não é uma imagem válida." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(session.shopId)) {
      throw new StoreError("Loja inválida.", 400);
    }
    const filename = `${randomUUID()}.${ext}`;
    const directory = path.join(process.cwd(), "data", "acougue-media", session.shopId);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), bytes);
    return Response.json({ url: `/api/acougue/midia/${session.shopId}/${filename}` });
  } catch (error) {
    if (error instanceof StoreError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "Não foi possível enviar a imagem." }, { status: 500 });
  }
}
