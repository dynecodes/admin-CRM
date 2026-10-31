import * as React from "react";
import { Button } from "flowbite-react";
import { HiUpload, HiDownload, HiTrash, HiExternalLink } from "react-icons/hi";

type FileItem = {
  id: string;
  name: string;
  size: number; // bytes
  type?: string;
  uploadedAt: string; // ISO
  url?: string; // preview or download
};

type Props = {
  providerId: number;
  onUploadFiles?: (providerId: number, files: File[]) => Promise<FileItem[]> | FileItem[];
  onDeleteFile?: (providerId: number, id: string) => Promise<void> | void;
  onDownloadFile?: (providerId: number, id: string) => void;
};

const ACCEPTED_MIME = ["application/pdf", "image/png", "image/jpeg"];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export default function ProviderFiles({ providerId, onUploadFiles, onDeleteFile, onDownloadFile }: Props) {
  const [items, setItems] = React.useState<FileItem[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const openPicker = () => inputRef.current?.click();

  const validateFiles = (files: File[]) => {
    for (const f of files) {
      if (!ACCEPTED_MIME.includes(f.type)) {
        return `Only PDF, PNG, and JPG are allowed. "${f.name}" is ${f.type || "an unsupported type"}.`;
      }
      if (f.size > MAX_BYTES) {
        return `Max file size is 10MB. "${f.name}" is ${(f.size / (1024 * 1024)).toFixed(1)}MB.`;
      }
    }
    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);

    const validationMsg = validateFiles(arr);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }
    setError(null);

    const uploaded =
      (await onUploadFiles?.(providerId, arr)) ??
      arr.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(f),
      }));

    setItems((prev) => [...uploaded, ...prev]);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    await handleFiles(e.dataTransfer.files);
  };

  const onDelete = async (id: string) => {
    await onDeleteFile?.(providerId, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const onDownload = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    onDownloadFile?.(providerId, id);
    if (item.url) {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.name;
      a.click();
    }
  };

  const canView = (f: FileItem) =>
    !!f.url && (!!f.type?.includes("pdf") || !!f.type?.startsWith("image/"));

  const onView = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || !item.url) return;
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Files</h3>
      </div>

      {/* Uploader (responsive) */}
      <div
        className={[
          "cursor-pointer rounded-xl border-2 border-dashed transition",
          "px-4 py-3 sm:px-6 sm:py-4",
          dragOver ? "border-gray-500 bg-gray-50" : "border-gray-300 bg-white",
        ].join(" ")}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        aria-label="Upload documents"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={ACCEPTED_MIME.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: icon + text */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <HiUpload className="h-6 w-6 text-gray-500" />
            </div>

            <div className="min-w-0">
              <div className="text-[15px] font-medium text-gray-900">Upload documents</div>
              <div className="text-xs text-gray-600">
                <span className="sm:hidden">Tap to browse • PDF/PNG/JPG • 10MB max</span>
                <span className="hidden sm:inline">Drag &amp; drop or click to browse • PDF, PNG, JPG • Max 10MB</span>
              </div>
            </div>
          </div>

          {/* Right: Browse button */}
          <div className="flex-shrink-0">
            <Button
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
              className="w-full sm:w-auto cursor-pointer"
            >
              Browse
            </Button>
          </div>
        </div>

        {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      </div>

      {/* List (responsive) */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-[640px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 sm:px-4">File</th>
              <th className="hidden px-3 py-2 text-left font-medium text-gray-700 sm:table-cell sm:px-4">
                Size
              </th>
              <th className="hidden px-3 py-2 text-left font-medium text-gray-700 md:table-cell md:px-4">
                Uploaded
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 sm:px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No files yet.
                </td>
              </tr>
            )}
            {items.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="max-w-[280px] px-3 py-2 sm:max-w-none sm:px-4">
                  <div className="truncate font-medium text-gray-900">{f.name}</div>
                  <div className="text-[11px] text-gray-500">{f.type || "—"}</div>
                </td>

                {/* Size: hidden on very small screens */}
                <td className="hidden px-3 py-2 text-gray-700 sm:table-cell sm:px-4">
                  {(f.size / 1024).toFixed(1)} KB
                </td>

                {/* Uploaded: hidden until md */}
                <td className="hidden px-3 py-2 text-gray-700 md:table-cell md:px-4">
                  {new Date(f.uploadedAt).toLocaleString()}
                </td>

                <td className="px-3 py-2 sm:px-4">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {canView(f) && (
                      <Button
                        color="light"
                        size="xs"
                        onClick={() => onView(f.id)}
                        title="View"
                        className="cursor-pointer"
                      >
                        <HiExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      color="light"
                      size="xs"
                      onClick={() => onDownload(f.id)}
                      title="Download"
                      className="cursor-pointer"
                    >
                      <HiDownload className="h-4 w-4" />
                    </Button>
                    <Button
                      color="light"
                      size="xs"
                      onClick={() => onDelete(f.id)}
                      title="Delete"
                      className="cursor-pointer"
                    >
                      <HiTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
