// src/App/AutomatedTasks/index.tsx
import React, { useMemo, useState } from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
} from "flowbite-react";
import { HiExclamationCircle } from "react-icons/hi";
import { TbTimeline } from "react-icons/tb";
import AppDataTable from "../../components/ui/AppDataTable";
import { useAutomatedTasks } from "../../hooks/AutomatedTasks/useAutomatedTasks";
import {
  AutomatedTask,
  AutomatedTaskHistoryEntry,
} from "../../types/automatedTask";
import AutomatedTaskInlineEditForm from "../../components/automatedTasks/AutomatedTaskInlineEditForm";
import { useDraggableModal } from "../../hooks/useDraggableModal";

/* ================================================================== */
/* Types                                                              */
/* ================================================================== */

type ConfirmMode = "run" | "enable" | "disable";

interface TaskConfirmModalProps {
  mode: ConfirmMode | null;
  task: AutomatedTask | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

interface TaskHistoryModalProps {
  open: boolean;
  task: AutomatedTask | null;
  onClose: () => void;
  getHistory: (id: number) => Promise<AutomatedTaskHistoryEntry[]>;
}

/* ================================================================== */
/* Main Page                                                          */
/* ================================================================== */

const AutomatedTasksPage: React.FC = () => {
  const {
    tasks,
    loading,
    enableTask,
    disableTask,
    runTaskNow,
    updateSchedule,
    getHistory,
  } = useAutomatedTasks();

  const [confirmMode, setConfirmMode] = useState<ConfirmMode | null>(null);
  const [confirmTask, setConfirmTask] = useState<AutomatedTask | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTask, setHistoryTask] = useState<AutomatedTask | null>(null);

  const columns = useMemo(
    () => [
      {
        name: "Name",
        selector: (row: AutomatedTask) => row.name,
        sortable: true,
        cell: (row: AutomatedTask) => (
          <div className="mt-3 px-1 text-sm text-gray-900">{row.name}</div>
        ),
      },
      {
        name: "Scheduled For",
        selector: (row: AutomatedTask) => row.run_at,
        sortable: true,
        width: "15%",
        cell: (row: AutomatedTask) => (
          <div className="mt-3 px-1 text-sm text-gray-900">
            {row.run_at || "—"}
          </div>
        ),
      },
      {
        name: "Last Executed On",
        selector: (row: AutomatedTask) => row.last_executed_at ?? "",
        sortable: true,
        width: "20%",
        cell: (row: AutomatedTask) => (
          <div className="mt-3 px-1 text-sm text-gray-900">
            {row.last_executed_at
              ? new Date(row.last_executed_at).toLocaleString()
              : ""}
          </div>
        ),
      },
      {
        name: "Will Execute Again On",
        selector: (row: AutomatedTask) => row.next_run_at ?? "",
        sortable: true,
        width: "20%",
        cell: (row: AutomatedTask) => (
          <div className="mt-3 px-1 text-sm text-gray-900">
            {row.next_run_at ? new Date(row.next_run_at).toLocaleString() : ""}
          </div>
        ),
      },
      {
        name: "Status",
        selector: (row: AutomatedTask) => row.status,
        sortable: true,
        width: "12%",
        cell: (row: AutomatedTask) => (
          <div className="mt-3 px-1 text-sm font-semibold">
            {row.status === "enabled" ? (
              <span className="text-green-600">Enabled</span>
            ) : (
              <span className="text-red-600">Disabled</span>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const handleHistoryClick = (task: AutomatedTask) => {
    setHistoryTask(task);
    setHistoryOpen(true);
  };

  const handleRunNow = (task: AutomatedTask) => {
    setConfirmTask(task);
    setConfirmMode("run");
  };

  const handleToggleStatus = (task: AutomatedTask) => {
    setConfirmTask(task);
    setConfirmMode(task.status === "enabled" ? "disable" : "enable");
  };

  const renderEditForm = (
    task: AutomatedTask,
    rowOnSave: (updated: AutomatedTask) => void,
    rowOnCancel: () => void,
  ) => (
    <AutomatedTaskInlineEditForm
      task={task}
      onSave={async (data: Partial<AutomatedTask>) => {
        const nextRunAt = (data.run_at ?? task.run_at ?? "").trim();
        const updated = await updateSchedule(task.id, nextRunAt);
        rowOnSave(updated);
      }}
      onCancel={rowOnCancel}
      onViewHistory={() => handleHistoryClick(task)}
      onRunNow={() => handleRunNow(task)}
      onToggleStatus={() => handleToggleStatus(task)}
    />
  );

  if (loading) {
    return (
      <div className="px-5 pb-10">
        <div className="mb-4 h-9 w-56 animate-pulse rounded bg-gray-200" />
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="h-10 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-gray-50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-5 sm:px-5">
      {/* Header (match spacing/behavior of Sales Tax & Tags) */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-[230px] flex-shrink-0 items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-700">
            <TbTimeline className="h-6 w-6 text-white"/>
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Automated Tasks ({tasks.length})
            </span>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <AppDataTable
        data={tasks}
        columns={columns}
        searchPlaceholder="Search by name…"
        searchKeys={["name"]}
        filterOptions={[{ value: "all", label: "All" }]}
        filterKey="__dummy"
        defaultFilter="all"
        sortOptions={[
          {
            value: "name_asc",
            label: "Name A–Z",
            sortFn: (a: AutomatedTask, b: AutomatedTask) =>
              a.name.localeCompare(b.name),
          },
        ]}
        defaultSort="name_asc"
        paginationOptions={[10, 20, 50]}
        defaultPerPage={20}
        enableInlineEdit={true}
        renderEditForm={renderEditForm}
        showEditButton={true}
        mobileCard={{
          titleField: "name",
          titleRender: (task: AutomatedTask) => task.name,
          statusField: undefined,
          enableEdit: true,
          fields: [
            {
              key: "run_at",
              label: "Scheduled For",
            },
            {
              key: "status",
              label: "Status",
              render: (status: AutomatedTask["status"]) =>
                status === "enabled" ? (
                  <span className="text-green-600">Enabled</span>
                ) : (
                  <span className="text-red-600">Disabled</span>
                ),
            },
          ],
          actions: [
            {
              label: "Edit",
              color: "gray",
              triggerInlineEdit: true,
              onClick: () => {},
            },
          ],
        }}
      />

      {/* Confirm Run / Enable / Disable */}
      <TaskConfirmModal
        mode={confirmMode}
        task={confirmTask}
        onClose={() => {
          setConfirmMode(null);
          setConfirmTask(null);
        }}
        onConfirm={async () => {
          if (!confirmMode || !confirmTask) return;
          if (confirmMode === "run") {
            await runTaskNow(confirmTask.id);
          } else if (confirmMode === "enable") {
            await enableTask(confirmTask.id);
          } else if (confirmMode === "disable") {
            await disableTask(confirmTask.id);
          }
          setConfirmMode(null);
          setConfirmTask(null);
        }}
      />

      {/* History modal */}
      <TaskHistoryModal
        open={historyOpen}
        task={historyTask}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryTask(null);
        }}
        getHistory={getHistory}
      />
    </div>
  );
};

/* ================================================================== */
/* Confirm modal                                                      */
/* ================================================================== */

const TaskConfirmModal: React.FC<TaskConfirmModalProps> = ({
  mode,
  task,
  onClose,
  onConfirm,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mode || !task) return null;

  const titles: Record<ConfirmMode, string> = {
    run: "Run Scheduled Task",
    enable: "Enable Scheduled Task",
    disable: "Disable Scheduled Task",
  };

  const verbs: Record<ConfirmMode, string> = {
    run: "Run",
    enable: "Enable",
    disable: "Disable",
  };

  const body =
    mode === "run"
      ? `Are you sure you want to execute '${task.name}' Task?`
      : mode === "enable"
        ? `Are you sure you want to enable '${task.name}' Task?`
        : `Are you sure you want to disable '${task.name}' Task?`;

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={!!mode} onClose={onClose} size="md">
      <ModalHeader className="border-t border-gray-200">
        {titles[mode]}
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-700">{body}</p>
        {error && (
          <Alert color="failure" icon={HiExclamationCircle} className="mt-3">
            <span className="text-xs sm:text-sm">{error}</span>
          </Alert>
        )}
      </ModalBody>
      <ModalFooter className="justify-end">
        <Button color="light" onClick={onClose} className="cursor-pointer">
          Cancel
        </Button>
        <Button
          color="gray"
          onClick={handleConfirm}
          className="cursor-pointer"
          disabled={saving}
        >
          {saving ? `${verbs[mode]}ing...` : verbs[mode]}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

/* ================================================================== */
/* History modal (Changes report)                                     */
/* ================================================================== */

const TaskHistoryModal: React.FC<TaskHistoryModalProps> = ({
  open,
  task,
  onClose,
  getHistory,
}) => {
  useDraggableModal(open);
  const [entries, setEntries] = useState<AutomatedTaskHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!open || !task) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const list = await getHistory(task.id);
        if (!cancelled) setEntries(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [open, task, getHistory]);

  if (!open || !task) return null;

  const fmtWhen = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  return (
    <Modal show={open} onClose={onClose} size="2xl">
      <ModalHeader
        className={[
          "border-t border-gray-200",
          "modal-drag-handle flex items-center justify-between",
          "cursor-grab select-none active:cursor-grabbing",
          "[&>button]:inline-flex [&>button]:h-8 [&>button]:w-8",
          "[&>button]:items-center [&>button]:justify-center",
          "[&>button]:cursor-pointer",
          "[&>button]:rounded-md [&>button]:text-gray-500",
          "[&>button:hover]:bg-gray-100 [&>button:hover]:text-gray-700",
          "[&>button:focus]:outline-none",
        ].join(" ")}
      >
        Changes report
      </ModalHeader>

      <ModalBody>
        <div className="max-h-[60vh] overflow-auto">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 align-top">Who</th>
                  <th className="px-3 py-2 align-top">What</th>
                  <th className="px-3 py-2 align-top">When</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      Loading history...
                    </td>
                  </tr>
                )}

                {!loading &&
                  entries.map((entry, idx) => {
                    const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";
                    return (
                      <tr
                        key={entry.id}
                        className={`${rowBg} border-b border-gray-200 align-top last:border-b-0`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {entry.user_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-pre-line text-gray-800">
                          {entry.action}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {fmtWhen(entry.created_at)}
                          <div className="mt-1 text-xs text-gray-400">
                            IP: {entry.ip_address ?? "—"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && entries.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No changes yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="space-y-2 px-2 md:hidden">
            {loading && (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-500">
                Loading history...
              </div>
            )}

            {!loading && entries.length === 0 && (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-500">
                No changes yet.
              </div>
            )}

            {!loading &&
              entries.map((entry, idx) => (
                <div key={entry.id} className="overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    <div className="grid grid-cols-[80px_minmax(0,1fr)] bg-gray-50 px-3 py-2 text-sm">
                      <div className="font-semibold text-gray-600">Who</div>
                      <div className="text-gray-900">
                        {entry.user_name || "—"}
                      </div>
                    </div>
                    <div className="grid grid-cols-[80px_minmax(0,1fr)] bg-white px-3 py-3 text-sm">
                      <div className="pt-[2px] font-semibold text-gray-600">
                        What
                      </div>
                      <div className="whitespace-pre-line text-gray-800">
                        {entry.action}
                      </div>
                    </div>
                    <div className="grid grid-cols-[80px_minmax(0,1fr)] bg-gray-50 px-3 py-3 text-sm">
                      <div className="pt-[2px] font-semibold text-gray-600">
                        When
                      </div>
                      <div className="text-gray-800">
                        {fmtWhen(entry.created_at)}
                        <div className="mt-1 text-xs text-gray-400">
                          IP: {entry.ip_address ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  {idx !== entries.length - 1 && (
                    <div className="h-[1px] bg-gray-200" />
                  )}
                </div>
              ))}
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="justify-end">
        <Button color="light" onClick={onClose} className="cursor-pointer">
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

/* ================================================================== */
/* Export                                                             */
/* ================================================================== */

export default AutomatedTasksPage;
