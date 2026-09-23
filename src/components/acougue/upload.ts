export async function uploadShopImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/acougue/midia", { method: "POST", body: form });
  const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !body.url) {
    throw new Error(body.error || "Não foi possível enviar a imagem.");
  }
  return body.url;
}
