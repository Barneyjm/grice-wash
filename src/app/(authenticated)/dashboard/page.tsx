"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAudits, getTemplates } from "@/lib/store";
import type { Audit, AuditTemplate } from "@/lib/types";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);

  useEffect(() => {
    if (!user) return;
    setAudits(getAudits(user.organizationId));
    setTemplates(getTemplates(user.organizationId));
  }, [user]);

  const completedToday = audits.filter(
    (a) =>
      a.status === "completed" &&
      a.completedAt &&
      new Date(a.completedAt).toDateString() === new Date().toDateString()
  ).length;

  const inProgress = audits.filter((a) => a.status === "in_progress").length;
  const totalCompleted = audits.filter((a) => a.status === "completed").length;
  const avgScore =
    totalCompleted > 0
      ? Math.round(
          audits
            .filter((a) => a.status === "completed" && a.score != null)
            .reduce((sum, a) => sum + (a.score ?? 0), 0) /
            Math.max(
              audits.filter((a) => a.status === "completed" && a.score != null)
                .length,
              1
            )
        )
      : 0;

  const recentAudits = audits.slice(0, 5);

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]}
        </h2>
        <p className="text-gray-500 mt-1">Here&apos;s your audit overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today" value={completedToday} color="blue" />
        <StatCard label="In Progress" value={inProgress} color="yellow" />
        <StatCard label="Completed" value={totalCompleted} color="green" />
        <StatCard label="Avg Score" value={`${avgScore}%`} color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Quick Start
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates
            .filter((t) => t.isActive)
            .map((t) => (
              <Link
                key={t.id}
                href={`/audit/new?templateId=${t.id}`}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition group"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.sections.reduce((n, s) => n + s.items.length, 0)} items
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Recent Audits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Audits
          </h3>
          <Link
            href="/audits"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {recentAudits.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No audits yet. Start your first one above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAudits.map((audit) => (
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
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {audit.score}%
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: "blue" | "yellow" | "green" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    yellow: "bg-yellow-50 text-yellow-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
