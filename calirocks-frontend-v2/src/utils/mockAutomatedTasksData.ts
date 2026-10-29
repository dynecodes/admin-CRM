import {
  AutomatedTask,
  AutomatedTaskHistoryEntry,
} from "../types/automatedTask";

export const mockAutomatedTasks: AutomatedTask[] = [
  {
    id: 1,
    name: "Auto Reverse Automaid Pay Authorization",
    run_at: "8:00PM",
    last_executed_at: null,
    next_run_at: null,
    status: "disabled",
  },
  {
    id: 2,
    name: "Charge Cards",
    run_at: "7:00PM",
    last_executed_at: null,
    next_run_at: null,
    status: "disabled",
  },
  {
    id: 3,
    name: "Complete Bookings",
    run_at: "9:30AM",
    last_executed_at: "2025-11-20T09:31:24Z",
    next_run_at: "2025-11-21T09:30:00Z",
    status: "enabled",
  },
  {
    id: 4,
    name: "Put On Hold",
    run_at: "11:50AM",
    last_executed_at: "2025-11-20T11:58:11Z",
    next_run_at: "2025-11-21T11:50:00Z",
    status: "enabled",
  },
  {
    id: 5,
    name: "Send Booking Rating Emails And Text Messages",
    run_at: "10:00AM",
    last_executed_at: "2025-11-20T10:16:43Z",
    next_run_at: "2025-11-21T10:00:00Z",
    status: "enabled",
  },
  {
    id: 6,
    name: "Send Booking Reminder Emails And Text Messages",
    run_at: "10:50AM",
    last_executed_at: "2025-11-20T10:58:49Z",
    next_run_at: "2025-11-21T10:50:00Z",
    status: "enabled",
  },
  {
    id: 7,
    name: "Send Tomorrow's Daily Schedule Email To Teams",
    run_at: "12:50PM",
    last_executed_at: "2025-11-20T12:56:51Z",
    next_run_at: "2025-11-21T12:50:00Z",
    status: "enabled",
  },
  {
    id: 8,
    name: "Send Unassigned Booking Reminder Emails",
    run_at: "3:00PM",
    last_executed_at: "2025-11-20T15:18:10Z",
    next_run_at: "2025-11-21T15:00:00Z",
    status: "enabled",
  },
  {
    id: 9,
    name: "Synchronize With Charge",
    run_at: "4:45PM",
    last_executed_at: "2025-11-20T16:45:22Z",
    next_run_at: "2025-11-21T16:45:00Z",
    status: "enabled",
  },
];

export const mockAutomatedTaskHistory: AutomatedTaskHistoryEntry[] = [];
