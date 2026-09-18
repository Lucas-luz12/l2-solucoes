import type { CatalogApp, Policy } from "./types";

export const APP_CATALOG: CatalogApp[] = [
  {
    id: "telefone",
    name: "Telefone",
    category: "essencial",
    description: "Chamadas de voz",
    href: "tel:",
    essentialHint: true,
  },
  {
    id: "sms",
    name: "Mensagens",
    category: "essencial",
    description: "SMS da operadora",
    href: "sms:",
    essentialHint: true,
  },
  {
    id: "camera",
    name: "Câmera",
    category: "essencial",
    description: "Fotos e evidências de campo",
    href: "camera://",
    essentialHint: true,
  },
  {
    id: "mapas",
    name: "Mapas",
    category: "navegacao",
    description: "Navegação até o ponto de operação",
    href: "https://maps.google.com/",
    essentialHint: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "comunicacao",
    description: "Contato com a central",
    href: "https://wa.me/",
    essentialHint: true,
  },
  {
    id: "email",
    name: "E-mail",
    category: "comunicacao",
    description: "Caixa corporativa",
    href: "mailto:",
  },
  {
    id: "navegador",
    name: "Navegador",
    category: "outros",
    description: "Acesso livre à internet",
    href: "https://www.google.com/",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "midia",
    description: "Rede social — não essencial",
    href: "https://www.instagram.com/",
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "midia",
    description: "Vídeos — não essencial",
    href: "https://www.youtube.com/",
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "midia",
    description: "Vídeos curtos — não essencial",
    href: "https://www.tiktok.com/",
  },
  {
    id: "facebook",
    name: "Facebook",
    category: "midia",
    description: "Rede social — não essencial",
    href: "https://www.facebook.com/",
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "midia",
    description: "Música — não essencial",
    href: "https://open.spotify.com/",
  },
];

export const DEFAULT_POLICIES: Policy[] = [
  {
    id: "politica-operacao",
    name: "Operação de campo",
    description:
      "Somente o essencial: telefone, mensagens, câmera, mapas e WhatsApp da central.",
    allowedAppIds: ["telefone", "sms", "camera", "mapas", "whatsapp"],
    kioskMode: true,
  },
  {
    id: "politica-escritorio",
    name: "Escritório",
    description: "Ferramentas de trabalho, sem redes sociais e mídia.",
    allowedAppIds: ["telefone", "sms", "camera", "mapas", "whatsapp", "email", "navegador"],
    kioskMode: false,
  },
  {
    id: "politica-livre",
    name: "Uso livre",
    description: "Catálogo completo — reserva ou aparelho ainda não em operação.",
    allowedAppIds: APP_CATALOG.map((app) => app.id),
    kioskMode: false,
  },
];

export function appsForPolicy(policy: Policy): CatalogApp[] {
  const allowed = new Set(policy.allowedAppIds);
  return APP_CATALOG.filter((app) => allowed.has(app.id));
}

export function getApp(id: string): CatalogApp | undefined {
  return APP_CATALOG.find((app) => app.id === id);
}
