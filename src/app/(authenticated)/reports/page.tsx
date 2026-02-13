"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAudits, getTemplates } from "@/lib/store";
import type { Audit, AuditTemplate } from "@/lib/types";
import { format, subDays, isAfter } from "date-fns";

export default function ReportsPage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [range, setRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    if (!user) return;
    setAudits(getAudits(user.organizationId));
    setTemplates(getTemplates(user.organizationId));
  }, [user]);

  const cutoff = subDays(new Date(), range);
  const filtered = audits.filter((a) => isAfter(new Date(a.startedAt), cutoff));
  const completed = filtered.filter((a) => a.status === "completed");
  const inProgress = filtered.filter((a) => a.status === "in_progress");

  const avgScore =
    completed.length > 0
      ? Math.round(
          completed
            .filter((a) => a.score != null)
            .reduce((sum, a) => sum + (a.score ?? 0), 0) /
            Math.max(
              completed.filter((a) => a.score != null).length,
              1
            )
        )
      : 0;

  const completionRate =
    filtered.length > 0
      ? Math.round((completed.length / filtered.length) * 100)
      : 0;

  // Per-template breakdown
  const templateStats = templates.map((t) => {
    const tAudits = completed.filter((a) => a.templateId === t.id);
    const tAvgScore =
      tAudits.length > 0
        ? Math.round(
            tAudits.reduce((sum, a) => sum + (a.score ?? 0), 0) / tAudits.length
          )
        : 0;
    return {
      name: t.name,
      count: tAudits.length,
      avgScore: tAvgScore,
    };
  });

  // Per-auditor breakdown
  const auditorMap = new Map<string, { name: string; count: number; totalScore: number }>();
  completed.forEach((a) => {
    const existing = auditorMap.get(a.auditorId);
    if (existing) {
      existing.count++;
      existing.totalScore += a.score ?? 0;
    } else {
      auditorMap.set(a.auditorId, {
        name: a.auditorName,
        count: 1,
        totalScore: a.score ?? 0,
      });
    }
  });
  const auditorStats = Array.from(auditorMap.values())
    .map((a) => ({
      name: a.name,
      count: a.count,
      avgScore: Math.round(a.totalScore / a.count),
    }))
    .sort((a, b) => b.count - a.count);

  // Score distribution
  const scoreRanges = [
    { label: "90-100%", min: 90, max: 100, color: "bg-green-500" },
    { label: "70-89%", min: 70, max: 89, color: "bg-yellow-500" },
    { label: "50-69%", min: 50, max: 69, color: "bg-orange-500" },
    { label: "0-49%", min: 0, max: 49, color: "bg-red-500" },
  ];

  const distribution = scoreRanges.map((r) => ({
    ...r,
    count: completed.filter(
      (a) => (a.score ?? 0) >= r.min && (a.score ?? 0) <= r.max
    ).length,
  }));

  const maxDistCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-500 mt-1">
            Performance overview for the last {range} days
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                range === r
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total Audits</p>
          <p className="text-2xl font-bold text-blue-700">{filtered.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-700">
            {completed.length}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-sm text-purple-600 font-medium">Avg Score</p>
          <p className="text-2xl font-bold text-purple-700">{avgScore}%</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-4">
          <p className="text-sm text-cyan-600 font-medium">Completion Rate</p>
          <p className="text-2xl font-bold text-cyan-700">{completionRate}%</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            Score Distribution
          </h3>
          {completed.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No completed audits in this period
            </p>
          ) : (
            <div className="space-y-3">
              {distribution.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-16">{d.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${d.color} rounded-full transition-all flex items-center justify-end pr-2`}
                      style={{
                        width: `${Math.max((d.count / maxDistCount) * 100, d.count > 0 ? 15 : 0)}%`,
                      }}
                    >
                      {d.count > 0 && (
                        <span className="text-xs text-white font-medium">
                          {d.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Template */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">By Template</h3>
          {templateStats.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No templates
            </p>
          ) : (
            <div className="space-y-3">
              {templateStats.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.count} audit{t.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      t.avgScore >= 80
                        ? "text-green-600"
                        : t.avgScore >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {t.count > 0 ? `${t.avgScore}%` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Auditor */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">
            Auditor Performance
          </h3>
          {auditorStats.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No auditor data
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-2 font-medium text-gray-600">Auditor</th>
                    <th className="pb-2 font-medium text-gray-600 text-center">
                      Audits
                    </th>
                    <th className="pb-2 font-medium text-gray-600 text-right">
                      Avg Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditorStats.map((a) => (
                    <tr key={a.name} className="border-b border-gray-50">
                      <td className="py-3 text-gray-900">{a.name}</td>
                      <td className="py-3 text-center text-gray-600">
                        {a.count}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-bold ${
                            a.avgScore >= 80
                              ? "text-green-600"
                              : a.avgScore >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {a.avgScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
