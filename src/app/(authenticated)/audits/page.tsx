"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAuditSummaries } from "@/lib/store";
import type { AuditSummary } from "@/lib/types";
import { format } from "date-fns";

export default function AuditsPage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "in_progress">(
    "all"
  );

  useEffect(() => {
    if (!user) return;
    setAudits(getAuditSummaries(user.organizationId));
  }, [user]);

  const filtered = audits.filter(
    (a) => filter === "all" || a.status === filter
  );

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit History</h2>
          <p className="text-gray-500 mt-1">{audits.length} total audits</p>
        </div>
        <Link
          href="/audit/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          + New Audit
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "completed", "in_progress"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all"
              ? "All"
              : f === "completed"
              ? "Completed"
              : "In Progress"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No audits found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((audit) => (
            <Link
              key={audit.id}
              href={`/audits/${audit.id}`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {audit.templateName}
                </p>
                <p className="text-sm text-gray-500">
                  {audit.locationName} &middot; {audit.auditorName}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(audit.startedAt), "MMM d, yyyy h:mm a")}
                  {audit.completedAt &&
                    ` — Completed ${format(
                      new Date(audit.completedAt),
                      "h:mm a"
                    )}`}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                    audit.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {audit.status === "completed" ? "Completed" : "In Progress"}
                </span>
                {audit.score != null && (
                  <p
                    className={`text-lg font-bold mt-1 ${
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
