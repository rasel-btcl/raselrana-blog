/** Result of the last form action (`readNotice()` in src/lib/admin-action.js). */
export default function Notice({ notice }) {
  if (!notice) return null;
  const isError = notice.kind === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? "border-[var(--danger)] text-[var(--danger)]"
          : "border-[var(--signal)] text-[var(--ink)]"
      }`}
    >
      {notice.text}
    </p>
  );
}
