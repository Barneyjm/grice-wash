"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { getAudit, getTemplate, updateAudit } from "@/lib/store";
import type { Audit, AuditTemplate, AuditResponseItem } from "@/lib/types";

export default function AuditExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [template, setTemplate] = useState<AuditTemplate | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<Record<string, AuditResponseItem>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoItemId, setActivePhotoItemId] = useState<string | null>(null);

  useEffect(() => {
    const a = getAudit(id);
    if (!a) return;
    setAudit(a);

    const t = getTemplate(a.templateId);
    if (!t) return;
    setTemplate(t);

    // Restore existing responses
    const existing: Record<string, AuditResponseItem> = {};
    a.responses.forEach((r) => {
      existing[r.templateItemId] = r;
    });
    setResponses(existing);
  }, [id]);

  if (!audit || !template) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading audit...</p>
      </div>
    );
  }

  if (audit.status === "completed") {
    router.push(`/audits/${audit.id}`);
    return null;
  }

  const section = template.sections[currentSection];
  const totalSections = template.sections.length;

  function updateResponse(itemId: string, value: string | boolean | number, notes?: string) {
    setResponses((prev) => ({
      ...prev,
      [itemId]: {
        templateItemId: itemId,
        value,
        photoUrl: prev[itemId]?.photoUrl,
        notes: notes ?? prev[itemId]?.notes,
      },
    }));
  }

  function handlePhoto(itemId: string) {
    setActivePhotoItemId(itemId);
    fileInputRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activePhotoItemId) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotos((prev) => ({ ...prev, [activePhotoItemId!]: dataUrl }));
      setResponses((prev) => ({
        ...prev,
        [activePhotoItemId!]: {
          templateItemId: activePhotoItemId!,
          value: true,
          photoUrl: dataUrl,
          notes: prev[activePhotoItemId!]?.notes,
        },
      }));
      setActivePhotoItemId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function saveProgress() {
    const responseArray = Object.values(responses);
    const photoArray = Object.values(photos);
    updateAudit(audit!.id, {
      responses: responseArray,
      photos: photoArray,
    });
  }

  function handleNext() {
    saveProgress();
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  }

  function handlePrev() {
    saveProgress();
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  }

  function handleComplete() {
    saveProgress();

    const allResponses = Object.values(responses);
    const passFailItems = template!.sections
      .flatMap((s) => s.items)
      .filter((item) => item.type === "pass_fail");
    const passedItems = passFailItems.filter(
      (item) => responses[item.id]?.value === true
    ).length;
    const score =
      passFailItems.length > 0
        ? Math.round((passedItems / passFailItems.length) * 100)
        : 100;

    updateAudit(audit!.id, {
      responses: allResponses,
      photos: Object.values(photos),
      status: "completed",
      score,
      passedItems,
      completedAt: new Date().toISOString(),
    });

    router.push(`/audits/${audit!.id}`);
  }

  const sectionProgress = section.items.filter(
    (item) => responses[item.id] !== undefined
  ).length;

  return (
    <div className="pb-24 lg:pb-8">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">{audit.templateName}</h2>
          <span className="text-sm text-gray-500">
            {currentSection + 1} / {totalSections}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{
              width: `${((currentSection + 1) / totalSections) * 100}%`,
            }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {audit.locationName}
        </p>
      </div>

      {/* Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">
          {section.title}
        </h3>
        <p className="text-sm text-gray-500">
          {sectionProgress} of {section.items.length} items completed
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelected}
      />

      {/* Items */}
      <div className="space-y-4">
        {section.items.map((item) => {
          const response = responses[item.id];
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.required && (
                  <span className="text-xs text-red-500 font-medium">
                    Required
                  </span>
                )}
              </div>

              {item.type === "pass_fail" && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => updateResponse(item.id, true)}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition ${
                      response?.value === true
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-green-50"
                    }`}
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => updateResponse(item.id, false)}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition ${
                      response?.value === false
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-red-50"
                    }`}
                  >
                    Fail
                  </button>
                </div>
              )}

              {item.type === "rating" && (
                <div className="flex gap-2 mt-3">
                  {(item.options ?? ["1", "2", "3", "4", "5"]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateResponse(item.id, Number(opt))}
                      className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition ${
                        response?.value === Number(opt)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-blue-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {item.type === "checkbox" && (
                <label className="flex items-center gap-3 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={response?.value === true}
                    onChange={(e) => updateResponse(item.id, e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Confirmed</span>
                </label>
              )}

              {item.type === "text" && (
                <textarea
                  value={(response?.value as string) ?? ""}
                  onChange={(e) => updateResponse(item.id, e.target.value)}
                  placeholder="Enter notes..."
                  className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              )}

              {item.type === "photo" && (
                <div className="mt-3">
                  {photos[item.id] ? (
                    <div className="relative">
                      <img
                        src={photos[item.id]}
                        alt="Captured"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handlePhoto(item.id)}
                        className="absolute bottom-2 right-2 bg-white/90 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium"
                      >
                        Retake
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePhoto(item.id)}
                      className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition flex flex-col items-center gap-2"
                    >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">Take Photo</span>
                    </button>
                  )}
                </div>
              )}

              {/* Notes for pass/fail items */}
              {item.type === "pass_fail" && response?.value === false && (
                <textarea
                  value={response?.notes ?? ""}
                  onChange={(e) =>
                    updateResponse(item.id, false, e.target.value)
                  }
                  placeholder="Add notes about the failure..."
                  className="w-full mt-3 px-3 py-2 border border-red-200 rounded-lg text-sm text-gray-900 bg-red-50 focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  rows={2}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 p-4 z-20">
        <div className="max-w-6xl flex gap-3">
          {currentSection > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Previous
            </button>
          )}
          {currentSection < totalSections - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Next Section
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
            >
              Complete Audit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
