import * as React from "react";
import {
  Modal,
  Button,
  Label,
  Spinner,
} from "flowbite-react";
import { HiPlus, HiTrash, HiX, HiChevronDown, HiCheck } from "react-icons/hi";
import ColorPicker from "../ui/ColorPicker"; // Adjust path as needed
import type { FunnelCfg, FunnelStageCfg } from "../../hooks/Leads/useFunnels";

type Props = {
  open: boolean;
  onClose: () => void | Promise<void>;
  onSave: (
    payload: Omit<FunnelCfg, "id" | "slug" | "createdAt">
  ) => void | Promise<void>;
  initial?: Partial<FunnelCfg>;
};

function rid() {
  return Math.random().toString(36).slice(2, 10);
}
import { TextInput } from "../ui/InputsBundle";
// Modern, vibrant colors
const DEFAULT_STAGES: FunnelStageCfg[] = [
  { id: rid(), name: "New",           color: "#3B82F6" }, // gray
  { id: rid(), name: "Contacted",     color: "#8B5CF6" }, // Purple
  { id: rid(), name: "Qualified",     color: "#10B981" }, // Green
  { id: rid(), name: "Proposal Sent", color: "#F59E0B" }, // Amber
  { id: rid(), name: "Won",           color: "#06B6D4" }, // Cyan
];

const STAGE_LIMIT = 15;

// Hardcoded form source options
const FORM_SOURCES = [
  { value: "lead_form",  label: "Lead Form"  },
  { value: "quote_form", label: "Quote Form" },
  { value: "website",    label: "Website"    },
];

export default function FunnelFormModal({ open, onClose, onSave, initial }: Props) {
  const nameRef = React.useRef<HTMLInputElement | null>(null);

  const [name, setName] = React.useState(initial?.name ?? "");
  const [sourceId, setSourceId] = React.useState<string>(initial?.sourceId ?? "");
  const [stages, setStages] = React.useState<FunnelStageCfg[]>(
    initial?.stages?.length ? initial.stages : DEFAULT_STAGES
  );
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Color picker state
  const [colorPickerStageId, setColorPickerStageId] = React.useState<string | null>(null);
  const activeStage = stages.find((s) => s.id === colorPickerStageId);

  // Custom dropdown (full-width popover under the trigger)
  const [sourcePickerOpen, setSourcePickerOpen] = React.useState(false);
  const sourceFieldWrapRef = React.useRef<HTMLDivElement | null>(null);
  const sourceCardRef = React.useRef<HTMLDivElement | null>(null);
  const sourceBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<number | null>(null);

  // Detect edit vs create
  const isEditing = Boolean(initial?.id || initial?.slug);
  const titleLabel = isEditing ? "Edit Funnel" : "Create New Funnel";
  const submitLabel = isEditing ? "Save Changes" : "Create Funnel";
  const savingLabel = isEditing ? "Saving…" : "Creating…";

  React.useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setSourceId(initial?.sourceId ?? "");
    setStages(initial?.stages?.length ? initial.stages : DEFAULT_STAGES);
    setError(null);
    setSaving(false);
    setColorPickerStageId(null);
    setSourcePickerOpen(false);
    // autofocus
    setTimeout(() => nameRef.current?.focus(), 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close the source picker on outside click
  React.useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!sourcePickerOpen) return;
      const wrap = sourceFieldWrapRef.current;
      const card = sourceCardRef.current;
      const target = e.target as Node;
      if (wrap?.contains(target) || card?.contains(target)) return;
      setSourcePickerOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [sourcePickerOpen]);

  // Keep popover width equal to trigger width
  React.useEffect(() => {
    function measure() {
      const w = sourceBtnRef.current?.offsetWidth ?? null;
      setPopoverWidth(w);
    }
    measure();
    if (!sourcePickerOpen) return;
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [sourcePickerOpen]);

  const canAdd = stages.length < STAGE_LIMIT;
  const canRemove = stages.length > 1;

  const addStage = () => {
    if (!canAdd) return setError(`You can add up to ${STAGE_LIMIT} stages.`);
    setStages((s) => [...s, { id: rid(), name: "", color: "#6B7280" }]);
    setError(null);
  };

  const removeStage = (id: string) =>
    setStages((s) => (canRemove ? s.filter((x) => x.id !== id) : s));

  const validate = () => {
    const trimmed = name.trim();
    if (!trimmed) return "Funnel name is required.";
    const validStages = stages
      .map((s) => ({ ...s, name: s.name.trim() }))
      .filter((s) => s.name.length > 0)
      .slice(0, STAGE_LIMIT);
    if (!validStages.length) return "Please add at least one stage.";
    const dedup = new Set(validStages.map((s) => s.name.toLowerCase()));
    if (dedup.size !== validStages.length) return "Stage names must be unique.";
    return null;
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    const err = validate();
    if (err) return setError(err);

    const payloadStages = stages
      .map((s) => ({ ...s, name: s.name.trim() }))
      .filter((s) => s.name);

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        sourceId: sourceId || null,
        stages: payloadStages.slice(0, STAGE_LIMIT),
      });
      onClose();
    } catch (error) {
      setError("Failed to save funnel. Please try again.");
      setSaving(false);
    }
  };

  const hasError = !!validate();

  // Drag state for stages
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  function reorder(list: FunnelStageCfg[], fromId: string, toId: string) {
    if (fromId === toId) return list;
    const fromIdx = list.findIndex((x) => x.id === fromId);
    const toIdx   = list.findIndex((x) => x.id === toId);
    if (fromIdx < 0 || toIdx < 0) return list;
    const copy = [...list];
    const [row] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, row);
    return copy;
  }

  const selectedSourceLabel =
    FORM_SOURCES.find((o) => o.value === (sourceId || ""))?.label ||
    (sourceId ? sourceId : "");

  return (
    <>
      <style>{`
        .funnel-modal-content {
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }
        .funnel-stages-scroll::-webkit-scrollbar { width: 6px; }
        .funnel-stages-scroll::-webkit-scrollbar-track { background: #f9fafb; border-radius: 3px; }
        .funnel-stages-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        .funnel-stages-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .funnel-stages-scroll { scrollbar-width: thin; scrollbar-color: #d1d5db #f9fafb; }

        /* Source popover card (detached but anchored) */
        .source-popover {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 60;
        }
      `}</style>

      <Modal
        show={open}
        onClose={onClose}
        size="3xl"
        aria-labelledby="funnel-form-title"
      >
        <div className="funnel-modal-content">
          {/* Header - Fixed */}
          <div className="flex items-start justify-between border-b border-gray-200 p-5">
            <div className="flex-1">
              <h2 id="funnel-form-title" className="text-xl font-semibold text-gray-900">
                {titleLabel}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              className="ml-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content - Scrollable */}
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <Label
                    htmlFor="funnel_name"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Funnel Name
                  </Label>
                  <TextInput
                    id="funnel_name"        
                    placeholder="Enter Funnel Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    disabled={saving}
                    required
                  />
                </div>

                {/* Source — custom dropdown (full width like the screenshot) */}
                <div ref={sourceFieldWrapRef} className="relative">
                  <Label
                    htmlFor="funnel_source_button"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Connect to Form Source
                  </Label>

                  {/* Dropdown trigger button (not TextInput) */}
                  <button
                    id="funnel_source_button"
                    ref={sourceBtnRef}
                    type="button"
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={sourcePickerOpen}
                    aria-controls="funnel_source_listbox"
                    onClick={() => !saving && setSourcePickerOpen((v) => !v)}
                    disabled={saving}
                    className="
                      inline-flex w-full items-center justify-between
                      rounded-lg border border-gray-300 bg-white
                      px-3 py-2.5 text-left text-sm text-gray-900
                      focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                      cursor-pointer disabled:opacity-50
                    "
                  >
                    <span className={`${selectedSourceLabel ? "text-gray-900" : "text-gray-400"}`}>
                      {selectedSourceLabel || "Select form source"}
                    </span>
                    <HiChevronDown className="ml-2 h-4 w-4 text-gray-500" aria-hidden="true" />
                  </button>

                  {/* Detached card, directly below field, width matches trigger (full) */}
                  {sourcePickerOpen && (
                    <div
                      ref={sourceCardRef}
                      className="source-popover"
                      style={{ width: popoverWidth ? `${popoverWidth}px` : "100%" }}
                    >
                      <div className="rounded-xl border border-gray-200 bg-white shadow-xl">
                        <ul
                          id="funnel_source_listbox"
                          role="listbox"
                          className="max-h-[50vh] overflow-auto py-1"
                        >
                          {FORM_SOURCES.map((opt) => {
                            const active = opt.value === (sourceId || "");
                            return (
                              <li key={opt.value} role="option" aria-selected={active}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSourceId(opt.value);
                                    setSourcePickerOpen(false);
                                  }}
                                  className={`flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-sm ${
                                    active
                                      ? "bg-gray-50 text-gray-800"
                                      : "text-gray-900 hover:bg-gray-50"
                                  }`}
                                >
                                  <span className="truncate">{opt.label}</span>
                                  {active && <HiCheck className="ml-3 h-4 w-4" />}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stages */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-900 cursor-pointer">
                      Funnel Stages
                    </Label>
                    <Button
                      size="xs"
                      color="light"
                      onClick={addStage}
                      disabled={!canAdd || saving}
                      type="button"
                      className="cursor-pointer"
                    >
                      <HiPlus className="h-4 w-4" />
                      <span className="ml-1.5">Add Stage</span>
                    </Button>
                  </div>

                  {/* Scrollable stages list with fixed height */}
                  <div
                    className="funnel-stages-scroll space-y-2.5 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3"
                    style={{ maxHeight: "320px" }}
                  >
                    {stages.map((s) => {
                      const isDragSource = dragId === s.id;
                      const isOver = overId === s.id && dragId !== s.id;

                      return (
                        <div
                          key={s.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragId && overId !== s.id) setOverId(s.id);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragId) {
                              setStages((prev) => reorder(prev, dragId, s.id));
                            }
                            setDragId(null);
                            setOverId(null);
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverId(null);
                          }}
                          className={`
                            flex items-center gap-2.5 rounded-lg border bg-white p-3 transition-all
                            ${isOver ? "border-gray-400 ring-2 ring-gray-100" : "border-gray-200"}
                            ${isDragSource ? "opacity-50" : ""}
                            ${saving ? "pointer-events-none opacity-50" : ""}
                          `}
                        >
                          {/* Drag Handle */}
                          <button
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              setDragId(s.id);
                              setOverId(s.id);
                            }}
                            onDragEnd={() => {
                              setDragId(null);
                              setOverId(null);
                            }}
                            disabled={saving}
                            title="Drag to reorder"
                            aria-label="Drag to reorder"
                            className="flex h-8 w-6 cursor-grab items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing disabled:cursor-not-allowed"
                          >
                            <span className="text-lg leading-none">⋮⋮</span>
                          </button>

                          {/* Name Input */}
                          <input
                            value={s.name}
                            onChange={(e) => {
                              setStages((list) =>
                                list.map((x) =>
                                  x.id === s.id ? { ...x, name: e.target.value } : x
                                )
                              );
                              setError(null);
                            }}
                            placeholder="Stage name"
                            disabled={saving}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                          />

                          {/* Color Button */}
                          <button
                            type="button"
                            onClick={() => setColorPickerStageId(s.id)}
                            disabled={saving}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-200 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ backgroundColor: s.color }}
                            title="Change color"
                            aria-label="Change stage color"
                          />

                          {/* Delete Button */}
                          <Button
                            color="failure"
                            size="sm"
                            type="button"
                            onClick={() => removeStage(s.id)}
                            disabled={!canRemove || saving}
                            className="cursor-pointer"
                          >
                            <HiTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    {stages.length === 0 && (
                      <div className="rounded-lg bg-white p-8 text-center">
                        <p className="text-sm text-gray-500">
                          No stages added yet. Click "Add Stage" to get started.
                        </p>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mt-2 rounded-lg bg-red-50 p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  color="light"
                  className="w-full cursor-pointer sm:w-auto"
                >
                  Cancel
                </Button>

                <Button
                  color="gray"
                  type="submit"
                  disabled={saving || hasError}
                  className="w-full cursor-pointer sm:w-auto"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      <span>{savingLabel}</span>
                    </span>
                  ) : (
                    submitLabel
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* COLOR PICKER — separate card, unchanged */}
          {colorPickerStageId && activeStage && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto w-[320px] rounded-xl bg-white p-4 shadow-xl">
                <div className="scale-90 origin-top">
                  <ColorPicker
                    mode="inline"
                    value={activeStage.color}
                    onChange={(newColor) => {
                      setStages((list) =>
                        list.map((x) =>
                          x.id === colorPickerStageId ? { ...x, color: newColor } : x
                        )
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
