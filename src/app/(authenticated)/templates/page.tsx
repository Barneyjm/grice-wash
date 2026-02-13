"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getTemplates, deleteTemplate } from "@/lib/store";
import type { AuditTemplate } from "@/lib/types";
import { format } from "date-fns";

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);

  useEffect(() => {
    if (!user) return;
    setTemplates(getTemplates(user.organizationId));
  }, [user]);

  function handleDelete(id: string) {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Templates</h2>
          <p className="text-gray-500 mt-1">
            Create and manage audit templates
          </p>
        </div>
        <Link
          href="/templates/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          + New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
          </svg>
          <p className="text-gray-500 mb-4">No templates yet</p>
          <Link
            href="/templates/new"
            className="text-blue-600 hover:underline font-medium"
          >
            Create your first template
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{t.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t.sections.length} sections &middot;{" "}
                    {t.sections.reduce((n, s) => n + s.items.length, 0)} items
                    &middot; Updated{" "}
                    {format(new Date(t.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/templates/${t.id}/edit`}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
