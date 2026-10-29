import React, { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useEmailLogs } from "../../../hooks/Emails/useEmailLogs";
import AppDataTable from "../../../components/ui/AppDataTable";
import { EmailLog } from "../../../types/emails";
import { Badge } from "flowbite-react";
import { HiMail, HiChevronRight } from "react-icons/hi";
import { format } from "date-fns";

const EmailLogs: React.FC = () => {
  const { logs, loading, fetchLogs } = useEmailLogs();
  const pathPrefix = window.location.pathname.split('/')[1];

  useEffect(() => {
    // Fetch all logs at once - AppDataTable handles pagination internally
    fetchLogs({ limit: 1000 });
  }, [fetchLogs]);

  const formatEmailSummary = (log: EmailLog) => {
    const fromDisplay = log.fromName ? `"${log.fromName}" <${log.fromEmail}>` : log.fromEmail;
    const toDisplay = log.toName ? `"${log.toName}" <${log.toEmail}>` : log.toEmail;
    return `From ${fromDisplay} to ${toDisplay} '${log.subject || '(No Subject)'}'`;
  };

  const columns = useMemo(
    () => [
      {
        name: "Date / Time",
        selector: (row: EmailLog) => row.created_at,
        sortable: false,
        width: "20%",
        cell: (row: EmailLog) => (
          <div className="text-sm text-gray-900">
            <div className="font-medium">
              {format(new Date(row.created_at), 'MMM dd, yyyy')}
            </div>
            <div className="text-xs text-gray-500">
              {format(new Date(row.created_at), 'h:mm a')}
            </div>
          </div>
        ),
      },
      {
        name: "Summary",
        selector: (row: EmailLog) => formatEmailSummary(row),
        sortable: false,
        width: "70%",
        cell: (row: EmailLog) => (
          <div className="text-sm text-gray-900">
            <div className="flex items-center gap-2">
              {formatEmailSummary(row)}
              {row.status === 'failed' && (
                <Badge color="failure" size="xs">Failed</Badge>
              )}
            </div>
          </div>
        ),
      },
    ],
    []
  );

  const sortOptions = [
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: EmailLog, b: EmailLog) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
    {
      value: "oldest",
      label: "Oldest",
      sortFn: (a: EmailLog, b: EmailLog) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
  ];

  const renderExpandedRow = (
  log: EmailLog,
) => (
  <div className="space-y-4">
    {/* Row 1: Date & Time, Message ID, Status */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Date & Time</label>
        <div className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900">
          {format(new Date(log.created_at), 'MMMM dd, yyyy h:mm a')}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Message ID</label>
        <div className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 font-mono text-xs text-gray-600 break-all">
          {log.messageId || <span className="text-gray-400 italic">N/A</span>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
        <div className="inline-block">
          <Badge color={log.status === 'sent' ? 'success' : 'failure'} size="sm">
            {log.status === 'sent' ? 'Sent' : 'Failed'}
          </Badge>
        </div>
      </div>
    </div>

    {/* Row 2: From and To */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">From</label>
        <div className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900">
          {log.fromName && <span className="font-medium">{log.fromName}</span>}
          {log.fromName && ' '}
          <span className="text-gray-600">&lt;{log.fromEmail}&gt;</span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">To</label>
        <div className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900">
          {log.toName && <span className="font-medium">{log.toName}</span>}
          {log.toName && ' '}
          <span className="text-gray-600">&lt;{log.toEmail}&gt;</span>
        </div>
      </div>
    </div>

    {/* Row 3: Subject */}
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">Subject</label>
      <div className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900">
        {log.subject || <span className="text-gray-400 italic">(No Subject)</span>}
      </div>
    </div>

    {/* Error (if any) */}
    {log.errorMessage && (
      <div>
        <label className="mb-1 block text-xs font-medium text-red-700">Error</label>
        <div className="block w-full rounded-lg border border-red-300 bg-red-50 px-2.5 py-2 text-xs text-red-700">
          {log.errorMessage}
        </div>
      </div>
    )}

    {/* Email Content */}
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">Email Content</label>
      <div className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs min-h-[4.5rem] max-h-96 overflow-auto">
        <div dangerouslySetInnerHTML={{ __html: log.htmlContent }} />
      </div>
    </div>
  </div>
);

  if (loading) {
    return (
      <div className="px-4 pb-5 sm:px-5 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 h-5 bg-gray-200 rounded w-48"></div>

        {/* Header skeleton */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-50 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-5 sm:px-5">
      {/* Breadcrumb */}
      <nav className="flex items-center text-gray-700 mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to={`/${pathPrefix}/emails`}
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-black sm:text-sm"
            >
              Email Integration
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <HiChevronRight className="w-4 h-4 text-gray-400" />
              <span className="ml-1 text-xs font-medium text-gray-500 sm:text-sm md:ml-2">
                Email Logs
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
            <HiMail className="h-6 w-6 text-white" />
          </div>
          <div className="font-medium">
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Email Logs ({logs.length})
            </span>
            <div className="text-sm text-gray-500">
              View all sent emails
            </div>
          </div>
        </div>
      </div>

      <AppDataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search by email or subject..."
        searchKeys={["toEmail", "fromEmail", "subject", "toName", "fromName"]}
        sortOptions={sortOptions}
        defaultSort="newest"
        paginationOptions={[10, 20, 50, 100]}
        defaultPerPage={20}
        enableInlineEdit={true}
        renderEditForm={renderExpandedRow}
        noDataMessage="No email logs found"
      />
    </div>
  );
};

export default EmailLogs;