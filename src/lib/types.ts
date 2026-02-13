export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "auditor";
  organizationId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface TemplateItem {
  id: string;
  label: string;
  type: "pass_fail" | "rating" | "photo" | "text" | "checkbox";
  required: boolean;
  description?: string;
  options?: string[]; // for rating labels etc
}

export interface TemplateSection {
  id: string;
  title: string;
  items: TemplateItem[];
}

export interface AuditTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AuditResponseItem {
  templateItemId: string;
  value: string | boolean | number;
  photoUrl?: string;
  notes?: string;
}

export interface Audit {
  id: string;
  templateId: string;
  templateName: string;
  organizationId: string;
  locationName: string;
  auditorId: string;
  auditorName: string;
  status: "in_progress" | "completed";
  responses: AuditResponseItem[];
  score?: number;
  totalItems: number;
  passedItems: number;
  photos: string[];
  startedAt: string;
  completedAt?: string;
  notes?: string;
}

export type AuditSummary = Pick<
  Audit,
  | "id"
  | "templateName"
  | "locationName"
  | "auditorName"
  | "status"
  | "score"
  | "startedAt"
  | "completedAt"
>;
