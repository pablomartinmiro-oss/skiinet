import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const STATIC_PATHS = [
  { path: "", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/experiencias", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/hotel", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/spa", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/restaurante", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/packs", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/bono", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/presupuesto", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/terminos", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/politica-privacidad", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" as const },
];

const STATIONS = [
  "Baqueira Beret",
  "Sierra Nevada",
  "Formigal",
  "Alto Campoo",
  "Candanchú",
  "Astún",
  "La Pinilla",
];

const BASE_URL =
  process.env.AUTH_URL ?? "https://crm-dash-prod.up.railway.app";

export default async function sitemap({
  params,
}: {
  params: { slug: string };
}): Promise<MetadataRoute.Sitemap> {
  const { slug } = params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, updatedAt: true },
  });

  if (!tenant) return [];

  const lastModified = tenant.updatedAt;
  const root = `${BASE_URL}/s/${slug}`;

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${root}${p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // Destination pages
  const destinationEntries: MetadataRoute.Sitemap = STATIONS.map((station) => ({
    url: `${root}/destinos/${encodeURIComponent(station)}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Public, active products
  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { slug: true, updatedAt: true },
  });
  const productEntries: MetadataRoute.Sitemap = products
    .filter((p): p is { slug: string; updatedAt: Date } => !!p.slug)
    .map((p) => ({
      url: `${root}/experiencias/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticEntries, ...destinationEntries, ...productEntries];
}
