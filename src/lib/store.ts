// In-memory store with localStorage persistence
// Replace with a real database (Supabase, Prisma, etc.) for production

import { v4 as uuid } from "uuid";
import type {
  User,
  Organization,
  AuditTemplate,
  Audit,
  TemplateSection,
  AuditSummary,
} from "./types";

const STORAGE_KEYS = {
  users: "mywash_users",
  orgs: "mywash_orgs",
  templates: "mywash_templates",
  audits: "mywash_audits",
  currentUser: "mywash_current_user",
} as const;

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Users ---

export function getUsers(): User[] {
  return load<User>(STORAGE_KEYS.users);
}

export function createUser(
  email: string,
  name: string,
  role: User["role"],
  organizationId: string
): User {
  const users = getUsers();
  const existing = users.find((u) => u.email === email);
  if (existing) throw new Error("Email already registered");
  const user: User = {
    id: uuid(),
    email,
    name,
    role,
    organizationId,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  save(STORAGE_KEYS.users, users);
  return user;
}

export function loginUser(email: string): User | null {
  const users = getUsers();
  return users.find((u) => u.email === email) ?? null;
}

export function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// --- Organizations ---

export function getOrganizations(): Organization[] {
  return load<Organization>(STORAGE_KEYS.orgs);
}

export function createOrganization(name: string): Organization {
  const orgs = getOrganizations();
  const org: Organization = {
    id: uuid(),
    name,
    createdAt: new Date().toISOString(),
  };
  orgs.push(org);
  save(STORAGE_KEYS.orgs, orgs);
  return org;
}

// --- Templates ---

export function getTemplates(organizationId: string): AuditTemplate[] {
  return load<AuditTemplate>(STORAGE_KEYS.templates).filter(
    (t) => t.organizationId === organizationId
  );
}

export function getTemplate(id: string): AuditTemplate | null {
  return (
    load<AuditTemplate>(STORAGE_KEYS.templates).find((t) => t.id === id) ??
    null
  );
}

export function createTemplate(
  organizationId: string,
  createdBy: string,
  name: string,
  description: string,
  sections: TemplateSection[]
): AuditTemplate {
  const templates = load<AuditTemplate>(STORAGE_KEYS.templates);
  const template: AuditTemplate = {
    id: uuid(),
    organizationId,
    name,
    description,
    sections,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };
  templates.push(template);
  save(STORAGE_KEYS.templates, templates);
  return template;
}

export function updateTemplate(
  id: string,
  updates: Partial<Pick<AuditTemplate, "name" | "description" | "sections" | "isActive">>
): AuditTemplate | null {
  const templates = load<AuditTemplate>(STORAGE_KEYS.templates);
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  templates[idx] = {
    ...templates[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  save(STORAGE_KEYS.templates, templates);
  return templates[idx];
}

export function deleteTemplate(id: string): boolean {
  const templates = load<AuditTemplate>(STORAGE_KEYS.templates);
  const filtered = templates.filter((t) => t.id !== id);
  if (filtered.length === templates.length) return false;
  save(STORAGE_KEYS.templates, filtered);
  return true;
}

// --- Audits ---

export function getAudits(organizationId: string): Audit[] {
  return load<Audit>(STORAGE_KEYS.audits)
    .filter((a) => a.organizationId === organizationId)
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
}

export function getAudit(id: string): Audit | null {
  return load<Audit>(STORAGE_KEYS.audits).find((a) => a.id === id) ?? null;
}

export function getAuditSummaries(organizationId: string): AuditSummary[] {
  return getAudits(organizationId).map((a) => ({
    id: a.id,
    templateName: a.templateName,
    locationName: a.locationName,
    auditorName: a.auditorName,
    status: a.status,
    score: a.score,
    startedAt: a.startedAt,
    completedAt: a.completedAt,
  }));
}

export function createAudit(
  templateId: string,
  templateName: string,
  organizationId: string,
  locationName: string,
  auditorId: string,
  auditorName: string,
  totalItems: number
): Audit {
  const audits = load<Audit>(STORAGE_KEYS.audits);
  const audit: Audit = {
    id: uuid(),
    templateId,
    templateName,
    organizationId,
    locationName,
    auditorId,
    auditorName,
    status: "in_progress",
    responses: [],
    totalItems,
    passedItems: 0,
    photos: [],
    startedAt: new Date().toISOString(),
  };
  audits.push(audit);
  save(STORAGE_KEYS.audits, audits);
  return audit;
}

export function updateAudit(
  id: string,
  updates: Partial<Audit>
): Audit | null {
  const audits = load<Audit>(STORAGE_KEYS.audits);
  const idx = audits.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  audits[idx] = { ...audits[idx], ...updates };
  save(STORAGE_KEYS.audits, audits);
  return audits[idx];
}

// --- Seed data ---

export function seedDemoData() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("mywash_seeded")) return;

  const org = createOrganization("Grice Car Wash Co.");

  createUser("admin@mywash.io", "Admin User", "admin", org.id);
  createUser("manager@mywash.io", "Sarah Manager", "manager", org.id);
  createUser("auditor@mywash.io", "Jake Auditor", "auditor", org.id);

  const sections: TemplateSection[] = [
    {
      id: uuid(),
      title: "Exterior Wash Quality",
      items: [
        {
          id: uuid(),
          label: "Vehicle fully rinsed before wash",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Soap coverage complete and even",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "No water spots after dry",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Tire shine applied correctly",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Exterior photo after wash",
          type: "photo",
          required: true,
          description: "Take a clear photo of the finished exterior",
        },
      ],
    },
    {
      id: uuid(),
      title: "Interior Cleaning",
      items: [
        {
          id: uuid(),
          label: "Dashboard wiped and dust-free",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Floor mats vacuumed",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Windows streak-free",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Overall interior rating",
          type: "rating",
          required: true,
          options: ["1", "2", "3", "4", "5"],
        },
        {
          id: uuid(),
          label: "Interior photo",
          type: "photo",
          required: false,
          description: "Photo of cleaned interior",
        },
      ],
    },
    {
      id: uuid(),
      title: "Equipment & Safety",
      items: [
        {
          id: uuid(),
          label: "All equipment functioning properly",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Chemical levels adequate",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Safety signage visible",
          type: "checkbox",
          required: true,
        },
        {
          id: uuid(),
          label: "Additional notes",
          type: "text",
          required: false,
          description: "Any other observations",
        },
      ],
    },
  ];

  createTemplate(
    org.id,
    "admin",
    "Standard Wash Audit",
    "Complete quality check for standard wash service",
    sections
  );

  createTemplate(org.id, "admin", "Express Wash Audit", "Quick quality check for express wash", [
    {
      id: uuid(),
      title: "Express Wash Checklist",
      items: [
        {
          id: uuid(),
          label: "Exterior rinse complete",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Soap applied evenly",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Dry complete — no spots",
          type: "pass_fail",
          required: true,
        },
        {
          id: uuid(),
          label: "Finished vehicle photo",
          type: "photo",
          required: true,
        },
      ],
    },
  ]);

  localStorage.setItem("mywash_seeded", "1");
}
