"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getTemplate, updateTemplate } from "@/lib/store";
import type { TemplateSection, TemplateItem } from "@/lib/types";
import { v4 as uuid } from "uuid";

function emptyItem(): TemplateItem {
  return { id: uuid(), label: "", type: "pass_fail", required: true };
}

function emptySection(): TemplateSection {
  return { id: uuid(), title: "", items: [emptyItem()] };
}

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = getTemplate(id);
    if (!t) return;
    setName(t.name);
    setDescription(t.description);
    setSections(t.sections);
    setIsActive(t.isActive);
    setLoaded(true);
  }, [id]);

  function updateSection(idx: number, updates: Partial<TemplateSection>) {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...updates } : s))
    );
  }

  function addSection() {
    setSections((prev) => [...prev, emptySection()]);
  }

  function removeSection(idx: number) {
    if (sections.length <= 1) return;
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(sIdx: number, iIdx: number, updates: Partial<TemplateItem>) {
    setSections((prev) =>
      prev.map((s, si) =>
        si === sIdx
          ? {
              ...s,
              items: s.items.map((item, ii) =>
                ii === iIdx ? { ...item, ...updates } : item
              ),
            }
          : s
      )
    );
  }

  function addItem(sIdx: number) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIdx ? { ...s, items: [...s.items, emptyItem()] } : s
      )
    );
  }

  function removeItem(sIdx: number, iIdx: number) {
    setSections((prev) =>
      prev.map((s, si) =>
        si === sIdx
          ? { ...s, items: s.items.filter((_, ii) => ii !== iIdx) }
          : s
      )
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = sections
      .filter((s) => s.title.trim())
      .map((s) => ({
        ...s,
        items: s.items.filter((item) => item.label.trim()),
      }))
      .filter((s) => s.items.length > 0);

    updateTemplate(id, { name, description, sections: cleaned, isActive });
    router.push("/templates");
  }

  if (!loaded) {
    return <p className="text-gray-500 p-8">Loading...</p>;
  }

  return (
    <div className="pb-20 lg:pb-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Template</h2>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600"
            />
            Active (visible to auditors)
          </label>
        </div>

        {sections.map((section, si) => (
          <div
            key={section.id}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(si, { title: e.target.value })}
                placeholder="Section title"
                className="flex-1 text-lg font-semibold border-b border-transparent focus:border-blue-500 pb-1 outline-none text-gray-900"
              />
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(si)}
                  className="ml-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {section.items.map((item, ii) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) =>
                        updateItem(si, ii, { label: e.target.value })
                      }
                      placeholder="Item label"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <div className="flex gap-2">
                      <select
                        value={item.type}
                        onChange={(e) =>
                          updateItem(si, ii, {
                            type: e.target.value as TemplateItem["type"],
                          })
                        }
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900"
                      >
                        <option value="pass_fail">Pass / Fail</option>
                        <option value="rating">Rating (1-5)</option>
                        <option value="photo">Photo</option>
                        <option value="text">Text Note</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) =>
                            updateItem(si, ii, { required: e.target.checked })
                          }
                          className="rounded border-gray-300 text-blue-600"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(si, ii)}
                    className="p-1 text-gray-400 hover:text-red-500 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addItem(si)}
              className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition"
            >
              + Add Item
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addSection}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition font-medium"
        >
          + Add Section
        </button>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
