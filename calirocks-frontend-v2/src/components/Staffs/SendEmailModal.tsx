import * as React from "react";
import { Button, Label } from "flowbite-react";
import { HiX } from "react-icons/hi";
import { Staff } from "../../types/staffs";
import { createPortal } from "react-dom";
import usePrivateService from "../../hooks/Auth/usePrivateService";
import DraggableModalWrapper from "../ui/DraggableModalWrapper";

type Props = {
  staff: Staff;
  isOpen: boolean;
  onClose: () => void;
};

export default function SendEmailModal({ staff, isOpen, onClose }: Props) {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const privateService = usePrivateService();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }

    if (!body.trim()) {
      setError("Message is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await privateService.post("/staff/send-email", {
        staffId: staff.id,
        email: staff.email,
        subject,
        body,
      });

      if (response.data.success) {
        setSuccess(true);
        setSubject("");
        setBody("");
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error sending email:", err);
      setError(err.response?.data?.message || "Failed to send email");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <DraggableModalWrapper isOpen={isOpen} handleSelector=".modal-drag-handle" className="w-[90vw] max-w-md">
        <div className="bg-white rounded-lg shadow-xl relative">
          {/* Header */}
          <div className="modal-drag-handle flex items-center justify-between p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none">
            <h2 className="text-lg font-semibold text-gray-900 pointer-events-none">
              Send Email to {staff.firstName} {staff.lastName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              <HiX className="h-5 w-5 cursor-pointer" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                Email sent successfully!
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              {/* To */}
              <div>
                <Label className="mb-1 block text-sm font-medium">To</Label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600">
                  {staff.email}
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Subject</Label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  disabled={isLoading}
                />
              </div>

              {/* Message Body */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Message</Label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter your message"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
                  disabled={isLoading}
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
            <Button
              color="light"
              onClick={onClose}
              className="cursor-pointer"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={handleSend}
              className="cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Email"
              )}
            </Button>
          </div>
        </div>
      </DraggableModalWrapper>
    </div>,
    document.body
  );
}