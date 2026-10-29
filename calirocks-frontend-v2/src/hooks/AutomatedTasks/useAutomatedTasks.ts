import { useCallback, useEffect, useState } from "react";
import {
  AutomatedTask,
  AutomatedTaskHistoryEntry,
  AutomatedTaskStatus,
} from "../../types/automatedTask";
import {
  mockAutomatedTasks,
  mockAutomatedTaskHistory,
} from "../../utils/mockAutomatedTasksData";

const TASKS_KEY = "automatedTasks_tasks";
const HISTORY_PREFIX = "automatedTasks_history_";
const hasWindow = typeof window !== "undefined";

function readFromStorage<T>(key: string, fallback: T): T {
  if (!hasWindow) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeToStorage(key: string, value: unknown) {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function loadTasksFromStorage(): AutomatedTask[] {
  const stored = readFromStorage<AutomatedTask[]>(
    TASKS_KEY,
    mockAutomatedTasks,
  );
  return stored && stored.length ? stored : mockAutomatedTasks;
}

function saveTasksToStorage(tasks: AutomatedTask[]) {
  writeToStorage(TASKS_KEY, tasks);
}

function historyKey(id: number) {
  return `${HISTORY_PREFIX}${id}`;
}

function loadHistoryFromStorage(id: number): AutomatedTaskHistoryEntry[] {
  const stored = readFromStorage<AutomatedTaskHistoryEntry[]>(
    historyKey(id),
    mockAutomatedTaskHistory,
  );
  return stored || [];
}

function saveHistoryToStorage(
  id: number,
  entries: AutomatedTaskHistoryEntry[],
) {
  writeToStorage(historyKey(id), entries);
}

export const useAutomatedTasks = () => {
  const [tasks, setTasks] = useState<AutomatedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyCache, setHistoryCache] = useState<
    Record<number, AutomatedTaskHistoryEntry[]>
  >({});

  useEffect(() => {
    setLoading(true);
    try {
      setTasks(loadTasksFromStorage());
    } finally {
      setLoading(false);
    }
  }, []);

  const pushHistory = useCallback((taskId: number, action: string) => {
    setHistoryCache((prev) => {
      const existing =
        prev[taskId] !== undefined
          ? prev[taskId]
          : loadHistoryFromStorage(taskId);

      const nextEntry: AutomatedTaskHistoryEntry = {
        id: existing.length ? existing[existing.length - 1].id + 1 : 1,
        task_id: taskId,
        user_name: "System",
        action,
        created_at: new Date().toISOString(),
        ip_address: "local",
      };

      const next = [...existing, nextEntry];
      saveHistoryToStorage(taskId, next);

      return {
        ...prev,
        [taskId]: next,
      };
    });
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(loadTasksFromStorage());
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(
    async (id: number, patch: Partial<AutomatedTask>) => {
      const base = tasks.length ? tasks : loadTasksFromStorage();
      let updated: AutomatedTask | null = null;

      const nextList = base.map((t) => {
        if (t.id !== id) return t;
        const next: AutomatedTask = { ...t, ...patch };
        updated = next;
        return next;
      });

      if (!updated) {
        throw new Error("Task not found");
      }

      setTasks(nextList);
      saveTasksToStorage(nextList);
      return updated;
    },
    [tasks],
  );

  const setStatus = useCallback(
    async (id: number, status: AutomatedTaskStatus) => {
      const updated = await updateTask(id, { status });
      pushHistory(id, status === "enabled" ? "Enabled task" : "Disabled task");
      return updated;
    },
    [updateTask, pushHistory],
  );

  const enableTask = useCallback(
    async (id: number) => setStatus(id, "enabled"),
    [setStatus],
  );

  const disableTask = useCallback(
    async (id: number) => setStatus(id, "disabled"),
    [setStatus],
  );

  const runTaskNow = useCallback(
    async (id: number) => {
      const nowIso = new Date().toISOString();
      const updated = await updateTask(id, {
        last_executed_at: nowIso,
      });
      pushHistory(id, "Executed task manually");
      return updated;
    },
    [updateTask, pushHistory],
  );

  const updateSchedule = useCallback(
    async (id: number, run_at: string) => {
      const updated = await updateTask(id, { run_at });
      pushHistory(id, `Updated schedule to run at ${run_at}`);
      return updated;
    },
    [updateTask, pushHistory],
  );

  const getHistory = useCallback(
    async (id: number): Promise<AutomatedTaskHistoryEntry[]> => {
      if (historyCache[id]) return historyCache[id];
      const entries = loadHistoryFromStorage(id);
      setHistoryCache((prev) => ({ ...prev, [id]: entries }));
      return entries;
    },
    [historyCache],
  );

  return {
    tasks,
    loading,
    fetchTasks,
    enableTask,
    disableTask,
    runTaskNow,
    updateSchedule,
    getHistory,
  };
};
