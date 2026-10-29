// src/components/customers/CustomerSuggestPanel.tsx
export default function CustomerSuggestPanel({
  matches,
  onPick,
  onClose,
}: {
  matches: Array<{
    id: number | string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }>;
  onPick: (c: any) => void;
  onClose: () => void;
}) {
  if (!matches.length) return null;

  return (
    <div
      className="
        absolute inset-x-0 top-full mt-1
        z-30
        rounded-xl border border-gray-200 bg-gray-50 shadow-lg
      "
      role="listbox"
      onMouseDown={(e) => e.preventDefault()} // keep input focus while clicking
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="text-xs font-medium text-gray-600">
          Select existing person
        </span>
        <span className="text-[11px] text-gray-400">
          {matches.length} found
        </span>
      </div>

      {/* List */}
      <ul className="max-h-64 space-y-2 overflow-y-auto px-2 py-2">
        {matches.map((c) => {
          const initials = (
            (c.firstName?.[0] || "") + (c.lastName?.[0] || "")
          ).toUpperCase();

          return (
            <li
              key={c.id}
              role="option"
              tabIndex={0}
              className="
                cursor-pointer rounded-lg bg-white p-3
                shadow-sm ring-1 ring-gray-200
                hover:bg-gray-50 focus:bg-gray-50
              "
              onClick={() => {
                onPick(c);
                onClose();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(c);
                  onClose();
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 text-xs font-semibold text-white">
                  {initials || "?"}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {c.firstName} {c.lastName}
                  </div>
                  <div className="truncate text-xs text-gray-600">
                    {c.email || "—"}
                  </div>
                  {c.phone && (
                    <div className="truncate text-xs text-gray-500">
                      {c.phone}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}