"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getTemplates, getTemplate, createAudit } from "@/lib/store";
import type { AuditTemplate } from "@/lib/types";

export default function NewAuditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("templateId");

  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(preselectedId ?? "");
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    if (!user) return;
    const t = getTemplates(user.organizationId).filter((t) => t.isActive);
    setTemplates(t);
    if (preselectedId) setSelectedTemplateId(preselectedId);
  }, [user, preselectedId]);

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedTemplateId || !locationName.trim()) return;

    const template = getTemplate(selectedTemplateId);
    if (!template) return;

    const totalItems = template.sections.reduce(
      (n, s) => n + s.items.length,
      0
    );

    const audit = createAudit(
      template.id,
      template.name,
      user.organizationId,
      locationName.trim(),
      user.id,
      user.name,
      totalItems
    );

    router.push(`/audit/${audit.id}`);
  }

  return (
    <div className="pb-20 lg:pb-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Start New Audit</h2>

      <form onSubmit={handleStart} className="max-w-lg space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audit Template
          </label>
          <div className="space-y-2">
            {templates.map((t) => (
              <label
                key={t.id}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  selectedTemplateId === t.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={selectedTemplateId === t.id}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedTemplateId === t.id
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedTemplateId === t.id && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t.sections.length} sections &middot;{" "}
                    {t.sections.reduce((n, s) => n + s.items.length, 0)} items
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location Name
          </label>
          <input
            type="text"
            required
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Bay 3, Main St Location"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedTemplateId || !locationName.trim()}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Start Audit
        </button>
      </form>
    </div>
  );
}
