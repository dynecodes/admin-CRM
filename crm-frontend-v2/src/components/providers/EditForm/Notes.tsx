import * as React from "react";
import { Button, Textarea, HelperText } from "flowbite-react";
import { HiTrash, HiPencil, HiChevronLeft, HiChevronRight } from "react-icons/hi";

type Note = {
  id: string;
  text: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  author?: string;
};

type FetchResult = { items: Note[]; total: number };

type Props = {
  providerId: number;
  onCreateNote?: (providerId: number, text: string) => Promise<Note> | Note;
  onUpdateNote?: (providerId: number, id: string, text: string) => Promise<Note> | Note;
  onDeleteNote?: (providerId: number, id: string) => Promise<void> | void;
  onFetchNotes?: (providerId: number, page: number, pageSize: number) => Promise<FetchResult> | FetchResult;
  pageSize?: number;
};

export default function ProviderNotes({
  providerId,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onFetchNotes,
  pageSize = 10,
}: Props) {
  const serverMode = typeof onFetchNotes === "function";

  const [allNotes, setAllNotes] = React.useState<Note[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageItems, setPageItems] = React.useState<Note[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // expanded row editor state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  /** ================= Composer autosize ================= */
  const draftRef = React.useRef<HTMLTextAreaElement | null>(null);
  const MIN_PX = 64;    // ~2 rows
  const MAX_PX = 240;   // ~8-10 rows (soft cap)

  const autosizeDraft = React.useCallback(() => {
    const el = draftRef.current;
    if (!el) return;
    el.style.height = "auto"; // allow shrink
      el.style.overflow = "hidden";
    const next = Math.min(MAX_PX, Math.max(MIN_PX, el.scrollHeight));
    el.style.height = `${next}px`;
  }, []);

  React.useEffect(() => {
    autosizeDraft();
  }, [draft, autosizeDraft]);

  const resetDraftSize = () => {
    const el = draftRef.current;
    if (!el) return;
    el.style.height = `${MIN_PX}px`;
  };


  // ---- Edit area autosize (per note) ----
const editRefs = React.useRef<Record<string, HTMLTextAreaElement | null>>({});

const autosizeEdit = React.useCallback((id: string) => {
  const el = editRefs.current[id];
  if (!el) return;
  el.style.height = "auto";        // allow shrink
  el.style.overflow = "hidden";    // hide scrollbar
  el.style.height = `${el.scrollHeight}px`; // exact fit
}, []);

const setEditRef =
  (id: string) =>
  (el: HTMLTextAreaElement | null) => {
    editRefs.current[id] = el;
    if (el) autosizeEdit(id);      // size on mount
  };



  /** ================= Pagination / loading ================= */
  const loadPage = React.useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        if (serverMode && onFetchNotes) {
          const res = await onFetchNotes(providerId, p, pageSize);
          setPageItems(res.items);
          setTotal(res.total);
        } else {
          const sorted = [...allNotes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
          setTotal(sorted.length);
          const start = (p - 1) * pageSize;
          const end = start + pageSize;
          setPageItems(sorted.slice(start, end));
        }
        setPage(p);
      } finally {
        setLoading(false);
      }
    },
    [serverMode, onFetchNotes, providerId, pageSize, allNotes]
  );

  React.useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  React.useEffect(() => {
    if (!serverMode) {
      loadPage(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNotes]);

  /** ================= CRUD ================= */
  const addNote = async () => {
    const text = draft.trim();
    if (!text) {
      setError("Note cannot be empty.");
      return;
    }
    setError(null);

    if (serverMode) {
      await (onCreateNote?.(providerId, text) ??
        Promise.resolve({
          id: crypto.randomUUID(),
          text,
          createdAt: new Date().toISOString(),
          author: "You",
        } as Note));
      setDraft("");
      resetDraftSize();
      await loadPage(1);
    } else {
      const newNote: Note =
        (await onCreateNote?.(providerId, text)) ?? {
          id: crypto.randomUUID(),
          text,
          createdAt: new Date().toISOString(),
          author: "You",
        };
      setDraft("");
      resetDraftSize();
      setAllNotes((prev) => [newNote, ...prev]);
    }
  };

  const cancelDraft = () => {
    setDraft("");
    setError(null);
    resetDraftSize();
  };

  const startEdit = (n: Note) => {
  setEditingId((curr) => (curr === n.id ? null : n.id)); // toggle
  setEditingText(n.text);
  // size after it renders
  requestAnimationFrame(() => autosizeEdit(n.id));
};

  const saveEdit = async () => {
    if (!editingId) return;
    const text = editingText.trim();
    if (!text) {
      setError("Note cannot be empty.");
      return;
    }
    setError(null);

    if (serverMode) {
      await onUpdateNote?.(providerId, editingId, text);
      setEditingId(null);
      setEditingText("");
      await loadPage(page);
    } else {
      setAllNotes((prev) =>
        prev.map((n) => (n.id === editingId ? { ...n, text, updatedAt: new Date().toISOString() } : n))
      );
      setEditingId(null);
      setEditingText("");
    }
  };

  const removeNote = async (id: string) => {
    await onDeleteNote?.(providerId, id);
    if (serverMode) {
      const newTotal = total - 1;
      const lastPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = Math.min(page, lastPage);
      await loadPage(targetPage);
    } else {
      setAllNotes((prev) => prev.filter((n) => n.id !== id));
    }
    if (editingId === id) {
      setEditingId(null);
      setEditingText("");
    }
  };

  /** ================= Key handling ================= */
  const onDraftKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  };
  const onEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
  };

  const canPrev = page > 1 && !loading;
  const canNext = page < totalPages && !loading;

  return (
    <div className="p-4 space-y-4">
      {/* Header with count + pager */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Notes</h3>
        </div>

        <div className="hidden items-center gap-2 sm:flex cursor-pointer">
          <Button color="light" size="xs" disabled={!canPrev} onClick={() => loadPage(page - 1)}>
            <HiChevronLeft className="h-4 w-4" />
          </Button>
          <Button color="light" size="xs" disabled={!canNext} onClick={() => loadPage(page + 1)}>
            <HiChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Composer (auto-expanding, no scrollbar) */}
        <div className="space-y-2">
          <Textarea
            ref={draftRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autosizeDraft(); // dynamically resize
            }}
            onInput={autosizeDraft}
            onKeyDown={onDraftKeyDown}
            placeholder="Type a new note…"
            rows={2}
            className="bg-white text-base resize-none overflow-hidden"
          />
          {error && <HelperText color="failure">{error}</HelperText>}
          <div className="flex items-center justify-end gap-2">
            <Button color="light" size="xs" className="px-4 cursor-pointer" onClick={cancelDraft} disabled={!draft.trim()}>
              Cancel
            </Button>
            <Button color="gray" size="xs" className="px-5 cursor-pointer" onClick={addNote} disabled={!draft.trim()}>
              Add
            </Button>
          </div>
        </div>


      {/* List */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-x-hidden">
        {/* Pager info */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 text-xs text-gray-600">
          <div>
            Showing <span className="font-medium">{total === 0 ? 0 : startIndex}</span>–
            <span className="font-medium">{endIndex}</span> of <span className="font-medium">{total}</span>
          </div>
          <div className="flex items-center gap-2 sm:hidden cursor-pointer">
            <Button color="light" size="xs" disabled={!canPrev} onClick={() => loadPage(page - 1)}>
              <HiChevronLeft className="h-4 w-4" />
            </Button>
            <Button color="light" size="xs" disabled={!canNext} onClick={() => loadPage(page + 1)}>
              <HiChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <ul className="divide-y divide-gray-100">
          {loading && <li className="px-3 py-4 text-sm text-gray-500">Loading…</li>}
          {!loading && pageItems.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-gray-500">No notes yet.</li>
          )}

          {!loading &&
            pageItems.map((n) => {
              const expanded = editingId === n.id;
              const editorId = `note-editor-${n.id}`;
              return (
                <li key={n.id} className="px-3 py-3">
                  {/* Row content */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                     <p className="whitespace-pre-wrap break-words text-base font-medium text-gray-800 pr-16"
                        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                      >
                      {n.text}</p>
                        <p className="mt-1 text-[11px] text-gray-500">
                        {n.author ? `${n.author} • ` : ""}
                        {new Date(n.updatedAt ?? n.createdAt).toLocaleString()}
                        {n.updatedAt ? " (edited)" : ""}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2 cursor-pointer">
                      <Button color="light" size="xs" aria-expanded={expanded} aria-controls={editorId} onClick={() => startEdit(n)}>
                        <HiPencil className="h-4 w-4" />
                      </Button>
                      <Button color="light" size="xs" onClick={() => removeNote(n.id)}>
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded editor below the row */}
                  {expanded && (
                    <div id={editorId} className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <Textarea
                        ref={setEditRef(n.id)}
                        value={editingText}
                        onChange={(e) => {
                          setEditingText(e.target.value);
                          autosizeEdit(n.id);        // resize as you type
                        }}
                        onInput={() => autosizeEdit(n.id)}
                        onKeyDown={onEditKeyDown}
                        rows={2}
                        className="bg-white text-base resize-none overflow-hidden"
                        autoFocus
                      />

                      <div className="mt-2 flex justify-end items-center gap-2">
                        <Button color="light" size="xs" className="px-5 cursor-pointer" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button color="gray" size="xs" className="px-6 cursor-pointer" onClick={saveEdit}>
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
        </ul>

        {/* Bottom pager (desktop) */}
        <div className="hidden items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-xs text-gray-600 sm:flex">
          <div>
            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer">
            <Button color="light" size="xs" disabled={!canPrev} onClick={() => loadPage(page - 1)}>
              <HiChevronLeft className="h-4 w-4" />
            </Button>
            <Button color="light" size="xs" disabled={!canNext} onClick={() => loadPage(page + 1)}>
              <HiChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
