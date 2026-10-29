export type AutomatedTaskStatus = "enabled" | "disabled";

export interface AutomatedTask {
  id: number;
  name: string;
  /** Human-readable time, e.g. "7:00PM" */
  run_at: string;
  /** ISO datetime or null if never */
  last_executed_at: string | null;
  /** ISO datetime or null if unknown */
  next_run_at: string | null;
  status: AutomatedTaskStatus;
}

export interface AutomatedTaskHistoryEntry {
  id: number;
  task_id: number;
  user_name: string;
  action: string;
  created_at: string; // ISO datetime
  ip_address?: string | null;
}
