export interface EmailConfig {
  emailUser: string | null;
  emailHost: string | null;
  emailPort: number | null;
  replyToEmail: string | null;
  emailSubdomain: string | null;
  emailEnabled: boolean;
  companyName: string;
}

export interface UpdateEmailConfigInput {
  replyToEmail: string;
  emailSubdomain: string;
  emailEnabled: boolean;
}

export interface SendTestEmailInput {
  toEmail: string;
}

export interface TestEmailResponse {
  from: string;
  replyTo: string;
  messageId: string;
}

export interface EmailTemplate {
  id: number;
  templateName: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendCustomEmailInput {
  toEmail: string;
  subject: string;
  htmlContent: string;
}

export interface EmailLog {
  id: number;
  companyId: number;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  status: 'sent' | 'failed';
  messageId: string | null;
  errorMessage: string | null;
  created_at: string;
}

export interface EmailLogsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EmailLogsResponse {
  success: boolean;
  data: EmailLog[];
  pagination: EmailLogsPagination;
}