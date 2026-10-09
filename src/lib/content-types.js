// The one place that maps the ContentType enum (prisma/schema.prisma) to its label
// and address slug. Safe to import from client code.

export const CONTENT_TYPES = [
  { value: "EXPLAINER", label: "Explainer", slug: "explainer" },
  { value: "HOWTO", label: "How-to", slug: "how-to" },
  { value: "TROUBLESHOOTING", label: "Troubleshooting", slug: "troubleshooting" },
  { value: "COMPARISON", label: "Comparison", slug: "comparison" },
];

export const CONTENT_TYPE_VALUES = CONTENT_TYPES.map((type) => type.value);

export const DEFAULT_CONTENT_TYPE = "EXPLAINER";

export function contentTypeByValue(value) {
  return CONTENT_TYPES.find((type) => type.value === value) ?? null;
}

export function contentTypeBySlug(slug) {
  return CONTENT_TYPES.find((type) => type.slug === slug) ?? null;
}
