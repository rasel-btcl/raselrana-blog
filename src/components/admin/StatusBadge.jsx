import { chip } from "@/lib/ui";

export const STATUS_LABELS = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const STATUS_STYLES = {
  PUBLISHED: "border-[var(--signal)] text-[var(--signal)]",
  SCHEDULED: "border-[var(--pulse)] text-[var(--pulse)]",
  ARCHIVED: "border-dashed",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`${chip} whitespace-nowrap ${STATUS_STYLES[status] ?? ""}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
