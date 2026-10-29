import * as React from "react";
import { createPortal } from "react-dom";

type Recipient = { name?: string; email: string };
type Props = {
  open: boolean;
  teamName?: string;
  defaultRecipients?: Recipient[];
  onClose: () => void;
  onSend: (data: { recipients: Recipient[]; subject: string; message: string }) => void;
};

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SendMessageModal({
  open,
  onClose,
  onSend,
  teamName,
  defaultRecipients = [],
}: Props) {
  const [recipients, setRecipients] = React.useState<Recipient[]>(defaultRecipients);
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [toInput, setToInput] = React.useState("");
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // reset when opened
  React.useEffect(() => {
    if (open) {
      setRecipients(defaultRecipients);
      setSubject("");
      setMessage("");
      setToInput("");
    }
  }, [open, defaultRecipients]);

  // esc + click-outside + scroll lock
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);

    // lock scroll
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  const tryAddRecipient = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const match = v.match(/^(.*)<([^>]+)>$/);
    const email = match ? match[2].trim() : v;
    const name = match ? match[1].trim().replace(/,$/, "") : undefined;
    if (!emailRx.test(email)) return;
    if (!recipients.some(r => r.email.toLowerCase() === email.toLowerCase())) {
      setRecipients(prev => [...prev, { name, email }]);
    }
  };

  const onToKey: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      tryAddRecipient(toInput);
      setToInput("");
    } else if (e.key === "Backspace" && !toInput && recipients.length) {
      setRecipients(prev => prev.slice(0, -1));
    }
  };

  const removeRecipient = (email: string) =>
    setRecipients(prev => prev.filter(r => r.email !== email));

  const canSend = recipients.length > 0 && (subject.trim() || message.trim());

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Send Message"
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Send Message{teamName ? ` • ${teamName}` : ""}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100 text-gray-500 cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <div className="min-h-[42px] w-full rounded-lg border border-gray-300 px-2 py-1.5 flex flex-wrap gap-2 focus-within:ring-1 focus-within:ring-gray-500 focus-within:border-gray-600">
              {recipients.map(r => (
                <span
                  key={r.email}
                  className="inline-flex items-center gap-1 rounded-full bg-yellow-50 text-gray-800 border border-gray-200 px-2 py-1 text-xs"
                >
                  {r.name ? `${r.name}, ` : ""}&lt;{r.email}&gt;
                  <button onClick={() => removeRecipient(r.email)} className="ml-0.5 rounded hover:bg-gray-100 px-1 cursor-pointer" aria-label={`Remove ${r.email}`}>
                    ×
                  </button>
                </span>
              ))}
              <input
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={onToKey}
                placeholder="Add recipient"
                className="flex-1 min-w-[160px] outline-none text-sm py-1 px-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter to add. Supports “Name &lt;email@domain&gt;”.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-600"
              placeholder="Subject"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-600 resize-y"
              placeholder="Write your message..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button onClick={onClose} className="rounded-lg cursor-pointer px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50">
            Cancel
          </button>
          <button
            disabled={!canSend}
            onClick={() => onSend({ recipients, subject: subject.trim(), message: message.trim() })}
            className={`rounded-lg px-4 py-2 cursor-pointer text-sm text-white ${canSend ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-300 cursor-not-allowed"}`}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
