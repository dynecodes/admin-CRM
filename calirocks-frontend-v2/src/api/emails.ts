import { privateService } from "./api";
import type { EmailConfig, UpdateEmailConfigInput, SendTestEmailInput, TestEmailResponse, SendCustomEmailInput } from "../types/emails";

export const emailsApi = {
  // Get email configuration
  getConfig: async (): Promise<{ success: boolean; data: EmailConfig }> => {
    const response = await privateService.get("/emails/config");
    return response.data;
  },

  // Update email configuration
  updateConfig: async (data: UpdateEmailConfigInput): Promise<{ success: boolean; message: string }> => {
    const response = await privateService.put("/emails/config", data);
    return response.data;
  },

  // Send test email
  sendTest: async (data: SendTestEmailInput): Promise<{ success: boolean; message: string; data: TestEmailResponse }> => {
    const response = await privateService.post("/emails/test", data);
    return response.data;
  },

  getTemplates: async () => {
    const response = await privateService.get("/emails/templates");
    return response.data;
  },

  createTemplate: async (data: { templateName: string; subject: string; htmlContent: string }) => {
    const response = await privateService.post("/emails/templates", data);
    return response.data;
  },

  updateTemplate: async (id: number, data: { templateName: string; subject: string; htmlContent: string }) => {
    const response = await privateService.put(`/emails/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: number) => {
    const response = await privateService.delete(`/emails/templates/${id}`);
    return response.data;
  },

  sendCustomEmail: async (data: SendCustomEmailInput) => {
    const response = await privateService.post("/emails/send-custom", data);
    return response.data;
  },

  // Email Logs
  getEmailLogs: async (params: { page?: number; limit?: number; sort?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await privateService.get(`/emails/logs?${queryParams.toString()}`);
    return response.data;
  },

  getEmailLog: async (id: number) => {
    const response = await privateService.get(`/emails/logs/${id}`);
    return response.data;
  },
};