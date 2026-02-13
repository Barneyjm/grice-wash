"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getAudit, getTemplate } from "@/lib/store";
import type { Audit, AuditTemplate } from "@/lib/types";
import { format } from "date-fns";

export default function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [template, setTemplate] = useState<AuditTemplate | null>(null);

  useEffect(() => {
    const a = getAudit(id);
    if (!a) return;
    setAudit(a);
    const t = getTemplate(a.templateId);
    setTemplate(t);
  }, [id]);

  if (!audit) {
    return <p className="text-gray-500 p-8">Loading...</p>;
  }

  const responseMap = new Map(
    audit.responses.map((r) => [r.templateItemId, r])
  );

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/audits"
          className="text-sm text-blue-600 hover:underline mb-2 inline-block"
        >
          &larr; Back to History
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {audit.templateName}
            </h2>
            <p className="text-gray-500 mt-1">
              {audit.locationName} &middot; {audit.auditorName}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Started{" "}
              {format(new Date(audit.startedAt), "MMM d, yyyy h:mm a")}
              {audit.completedAt &&
                ` — Completed ${format(
                  new Date(audit.completedAt),
                  "MMM d, yyyy h:mm a"
                )}`}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${
                audit.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {audit.status === "completed" ? "Completed" : "In Progress"}
            </span>
            {audit.score != null && (
              <p
                className={`text-3xl font-bold mt-2 ${
                  audit.score >= 80
                    ? "text-green-600"
                    : audit.score >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {audit.score}%
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Score summary */}
      {audit.status === "completed" && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {audit.totalItems}
            </p>
            <p className="text-xs text-blue-600">Total Items</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">
              {audit.passedItems}
            </p>
            <p className="text-xs text-green-600">Passed</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-700">
              {audit.totalItems - audit.passedItems}
            </p>
            <p className="text-xs text-red-600">Failed</p>
          </div>
        </div>
      )}

      {/* Responses by section */}
      {template?.sections.map((section) => (
        <div
          key={section.id}
          className="bg-white rounded-xl border border-gray-200 p-4 mb-4"
        >
          <h3 className="font-semibold text-gray-900 mb-3">{section.title}</h3>
          <div className="space-y-3">
            {section.items.map((item) => {
              const response = responseMap.get(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{item.label}</p>
                    {response?.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {response.notes}
                      </p>
                    )}
                    {response?.photoUrl && (
                      <img
                        src={response.photoUrl}
                        alt={item.label}
                        className="mt-2 w-full max-w-xs h-32 object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="ml-3">
                    {!response ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : item.type === "pass_fail" ? (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          response.value === true
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {response.value === true ? "Pass" : "Fail"}
                      </span>
                    ) : item.type === "rating" ? (
                      <span className="text-sm font-medium text-blue-700">
                        {String(response.value)}/5
                      </span>
                    ) : item.type === "checkbox" ? (
                      <span
                        className={`text-xs font-medium ${
                          response.value ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {response.value ? "Yes" : "No"}
                      </span>
                    ) : item.type === "photo" ? (
                      <span className="text-xs text-green-600">Captured</span>
                    ) : (
                      <span className="text-xs text-gray-500 max-w-[120px] truncate block">
                        {String(response.value)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Photos gallery */}
      {audit.photos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Photos</h3>
          <div className="grid grid-cols-2 gap-2">
            {audit.photos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt={`Audit photo ${i + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Resume if in progress */}
      {audit.status === "in_progress" && (
        <Link
          href={`/audit/${audit.id}`}
          className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-center"
        >
          Resume Audit
        </Link>
      )}
    </div>
  );
}
