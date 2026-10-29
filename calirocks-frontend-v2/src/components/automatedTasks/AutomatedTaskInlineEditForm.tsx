// src/components/automatedTasks/AutomatedTaskInlineEditForm.tsx
import React from "react";
import { Button, Alert } from "flowbite-react";
import { HiExclamationCircle } from "react-icons/hi";
import type { AutomatedTask } from "../../types/automatedTask";
import TimeDrop from "../ui/TimeDrop";

type Props = {
  task: AutomatedTask;
  onSave: (data: Partial<AutomatedTask>) => Promise<void> | void;
  onCancel: () => void;
  onViewHistory: () => void;
  onRunNow: () => void;
  onToggleStatus: () => void;
};

const readOnlyCls =
  "block w-full rounded-lg border border-gray-200 bg-gray-100 px-3 h-10 sm:h-11 " +
  "text-xs sm:text-sm text-gray-700 cursor-not-allowed";

const AutomatedTaskInlineEditForm: React.FC<Props> = ({
  task,
  onSave,
  onCancel,
  onViewHistory,
  onRunNow,
  onToggleStatus,
}) => {
  const [runAt, setRunAt] = React.useState<string>(task.run_at || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRunAt(task.run_at || "");
    setError(null);
    setIsSaving(false);
  }, [task]);

  const validate = () => {
    if (!runAt.trim()) {
      setError("Run at time is required");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave({ run_at: runAt.trim() });
    } catch (e: any) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Failed to save scheduled task.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const statusText = task.status === "enabled" ? "Enabled" : "Disabled";
  const statusColor =
    task.status === "enabled" ? "text-green-600" : "text-red-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header + actions (mirrors SalesTaxInlineEditForm) */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
            Scheduled Task Details
          </h2>
          <p className="text-xs text-gray-500 sm:text-sm">
            Update the schedule and status for this automated task.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
          <Button
            type="button"
            size="xs"
            color="light"
            onClick={onViewHistory}
            className="cursor-pointer border-gray-200 bg-white"
          >
            View History
          </Button>
          <Button
            type="button"
            size="xs"
            color="light"
            onClick={onRunNow}
            disabled={task.status === "disabled"}
            className="cursor-pointer border-gray-200 bg-white"
          >
            Run Task Now
          </Button>
          <Button          
            type="button"
            size="xs"
            color="light"
            onClick={onToggleStatus}
            className="cursor-pointer border-gray-200 bg-white"
          >
            {task.status === "enabled" ? "Disable Task" : "Enable Task"}
          </Button>
        </div>
      </div>

      {/* Name (read-only) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr] sm:items-center">
        <span className="text-xs font-medium text-gray-700 sm:text-sm">
          Name
        </span>
        <input
          type="text"
          value={task.name}
          readOnly
          className="border border-gray-300 rounded-lg px-3 py-3 text-sm bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none focus:ring-0 focus:border-gray-300"
        />
      </div>

      {/* Run at – full width like Sales Tax inputs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr] sm:items-center">
        <span className="text-xs font-medium text-gray-700 sm:text-sm">
          Run at
        </span>

        <TimeDrop
          id={`run_at_${task.id}`}
          name={`run_at_${task.id}`}
          value={runAt}
          onChange={setRunAt}
          minuteStep={5}
          className="w-full"
          inputClassName="w-full rounded-lg border border-gray-300 bg-white px-3 h-10 sm:h-11 text-xs sm:text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
        />
      </div>

      {/* Status display */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr] sm:items-center">
        <span className="text-xs font-medium text-gray-700 sm:text-sm">
          Status
        </span>
        <div className={`text-xs font-semibold sm:text-sm ${statusColor}`}>
          {statusText}
        </div>
      </div>

      {error && (
        <Alert color="failure" icon={HiExclamationCircle} className="mt-2">
          <span className="text-xs sm:text-sm">{error}</span>
        </Alert>
      )}

      {/* Footer buttons – same pattern as SalesTaxInlineEditForm */}
      <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full cursor-pointer sm:w-24"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          color="gray"
          size="xs"
          disabled={isSaving}
          className="w-full cursor-pointer sm:w-24"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

export default AutomatedTaskInlineEditForm;
