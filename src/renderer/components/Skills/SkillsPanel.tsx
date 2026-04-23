// SkillsPanel - manage agent skills (custom prompt-template skills + read-only built-in tools)

import React, { useCallback, useEffect, useState } from "react";

export default function SkillsPanel() {
  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importedData, setImportedData] = useState<CustomSkillData | null>(null);

  const refresh = useCallback(async () => {
    const list = await window.catclaw.listSkills();
    setSkills(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      await window.catclaw.deleteSkill(id);
      refresh();
    },
    [refresh]
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading skills...
      </div>
    );
  }

  const customSkills = skills.filter((s) => !s.builtin);
  const builtinSkills = skills.filter((s) => s.builtin);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Skills</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {customSkills.length} custom, {builtinSkills.length} built-in
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowImport(!showImport); setShowCreate(false); setImportedData(null); }}
            className="rounded-lg border border-blue-300 dark:border-blue-700 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {showImport ? "Cancel" : "Import URL"}
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowImport(false); setImportedData(null); }}
            className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {showCreate ? "Cancel" : "+ New Skill"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {showImport && (
          <ImportUrlForm
            onImported={(data) => {
              setImportedData(data);
              setShowImport(false);
              setShowCreate(true);
            }}
          />
        )}

        {showCreate && (
          <CreateSkillForm
            initialData={importedData}
            onCreated={() => {
              setShowCreate(false);
              setImportedData(null);
              refresh();
            }}
          />
        )}

        {/* Custom Skills */}
        {customSkills.length > 0 && (
          <>
            <SectionLabel label="Custom Skills" />
            {customSkills.map((skill) => (
              <SkillCard
                key={skill.id || skill.name}
                skill={skill}
                onDelete={handleDelete}
                onUpdated={refresh}
              />
            ))}
          </>
        )}

        {customSkills.length === 0 && !showCreate && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-3xl mb-3">{"\uD83D\uDD27"}</div>
            <p className="text-sm">No custom skills yet</p>
            <p className="text-xs mt-1">
              Create a prompt-template skill for the agent to use
            </p>
          </div>
        )}

        {/* Built-in Tools */}
        {builtinSkills.length > 0 && (
          <>
            <SectionLabel label="Built-in Tools" />
            {builtinSkills.map((skill) => (
              <BuiltinSkillCard key={skill.name} skill={skill} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// --- Section Label ---

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 pt-2">
      {label}
    </div>
  );
}

// --- Builtin Skill Card (read-only) ---

function BuiltinSkillCard({ skill }: { skill: SkillDefinition }) {
  const [expanded, setExpanded] = useState(false);
  const schema = skill.inputSchema as {
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  };
  const props = schema.properties || {};
  const required = new Set(schema.required || []);

  const icon =
    skill.name === "exec"
      ? "\uD83D\uDDA5"
      : skill.name === "filesystem"
        ? "\uD83D\uDCC1"
        : skill.name === "screenshot"
          ? "\uD83D\uDCF8"
          : "\uD83D\uDD27";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
      >
        <span className="text-lg mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-sm text-blue-600 dark:text-blue-400">
              {skill.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              Built-in
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {skill.description}
          </div>
        </div>
        <span className="text-gray-400 text-xs mt-1">
          {expanded ? "\u25B2" : "\u25BC"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-500 mt-3 mb-2">
            Parameters
          </div>
          <div className="space-y-1.5">
            {Object.entries(props).map(([name, prop]) => (
              <div key={name} className="flex items-baseline gap-2 text-xs">
                <code className="font-mono text-purple-600 dark:text-purple-400">
                  {name}
                </code>
                {required.has(name) && (
                  <span className="text-red-400 text-[10px]">required</span>
                )}
                {prop.type && (
                  <span className="text-gray-400">{prop.type}</span>
                )}
                {prop.description && (
                  <span className="text-gray-500 dark:text-gray-400 truncate">
                    - {prop.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Custom Skill Card ---

function SkillCard({
  skill,
  onDelete,
  onUpdated,
}: {
  skill: SkillDefinition;
  onDelete: (id: string) => void;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{"\uD83D\uDD27"}</span>
            <span className="font-mono font-semibold text-sm text-blue-600 dark:text-blue-400">
              {skill.name}
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 text-xs"
          >
            {expanded ? "\u25B2" : "\u25BC"}
          </button>
        </div>

        <p className="mt-1.5 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {skill.description}
        </p>

        {skill.parameters && skill.parameters.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {skill.parameters.map((p) => (
              <span
                key={p.name}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono"
              >
                {p.name}
                {p.required ? "*" : ""}
              </span>
            ))}
          </div>
        )}

        {expanded && skill.promptTemplate && (
          <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2">
            <div className="text-[10px] font-semibold text-gray-500 mb-1">
              Prompt Template
            </div>
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {skill.promptTemplate}
            </pre>
          </div>
        )}

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={() => skill.id && onDelete(skill.id)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {editing && skill.id && (
        <EditSkillForm
          skill={skill}
          onSaved={() => {
            setEditing(false);
            onUpdated();
          }}
        />
      )}
    </div>
  );
}

// --- Create Skill Form ---

function CreateSkillForm({ onCreated, initialData }: { onCreated: () => void; initialData?: CustomSkillData | null }) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [parameters, setParameters] = useState<SkillParameter[]>(initialData?.parameters || []);
  const [promptTemplate, setPromptTemplate] = useState(initialData?.promptTemplate || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addParam = () => {
    setParameters([
      ...parameters,
      { name: "", type: "string", description: "", required: true },
    ]);
  };

  const updateParam = (idx: number, updates: Partial<SkillParameter>) => {
    setParameters(parameters.map((p, i) => (i === idx ? { ...p, ...updates } : p)));
  };

  const removeParam = (idx: number) => {
    setParameters(parameters.filter((_, i) => i !== idx));
  };

  const handleCreate = useCallback(async () => {
    if (!name.trim() || !promptTemplate.trim()) return;
    setSaving(true);
    setError("");
    try {
      await window.catclaw.createSkill({
        name: name.trim(),
        description: description.trim(),
        parameters: parameters.filter((p) => p.name.trim()),
        promptTemplate: promptTemplate,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [name, description, parameters, promptTemplate, onCreated]);

  const paramNames = parameters
    .filter((p) => p.name.trim())
    .map((p) => `{{${p.name.trim()}}}`);

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
        New Custom Skill
      </h3>

      {error && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.replace(/\s+/g, "_"))}
          placeholder="e.g. code_review"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm font-mono"
        />
        <p className="text-[10px] text-gray-400 mt-0.5">
          Unique identifier (no spaces, used by agent to call this skill)
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What does this skill do?"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Parameters</label>
        <div className="space-y-2">
          {parameters.map((param, idx) => (
            <ParameterRow
              key={idx}
              param={param}
              onChange={(updates) => updateParam(idx, updates)}
              onRemove={() => removeParam(idx)}
            />
          ))}
        </div>
        <button
          onClick={addParam}
          className="mt-2 text-xs text-blue-500 hover:text-blue-700"
        >
          + Add Parameter
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Prompt Template</label>
        <textarea
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          rows={4}
          placeholder="Enter the prompt template. Use {{paramName}} for parameter placeholders."
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm font-mono resize-y"
        />
        {paramNames.length > 0 && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            Available variables: {paramNames.join(", ")}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !promptTemplate.trim() || saving}
          className="rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {saving ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}

// --- Edit Skill Form ---

function EditSkillForm({
  skill,
  onSaved,
}: {
  skill: SkillDefinition;
  onSaved: () => void;
}) {
  const [name, setName] = useState(skill.name);
  const [description, setDescription] = useState(skill.description);
  const [parameters, setParameters] = useState<SkillParameter[]>(
    skill.parameters || []
  );
  const [promptTemplate, setPromptTemplate] = useState(
    skill.promptTemplate || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addParam = () => {
    setParameters([
      ...parameters,
      { name: "", type: "string", description: "", required: true },
    ]);
  };

  const updateParam = (idx: number, updates: Partial<SkillParameter>) => {
    setParameters(parameters.map((p, i) => (i === idx ? { ...p, ...updates } : p)));
  };

  const removeParam = (idx: number) => {
    setParameters(parameters.filter((_, i) => i !== idx));
  };

  const handleSave = useCallback(async () => {
    if (!skill.id) return;
    setSaving(true);
    setError("");
    try {
      await window.catclaw.updateSkill(skill.id, {
        name: name.trim(),
        description: description.trim(),
        parameters: parameters.filter((p) => p.name.trim()),
        promptTemplate,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [skill.id, name, description, parameters, promptTemplate, onSaved]);

  const paramNames = parameters
    .filter((p) => p.name.trim())
    .map((p) => `{{${p.name.trim()}}}`);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3 bg-gray-50 dark:bg-gray-800/50">
      {error && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.replace(/\s+/g, "_"))}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Parameters</label>
        <div className="space-y-2">
          {parameters.map((param, idx) => (
            <ParameterRow
              key={idx}
              param={param}
              onChange={(updates) => updateParam(idx, updates)}
              onRemove={() => removeParam(idx)}
            />
          ))}
        </div>
        <button
          onClick={addParam}
          className="mt-2 text-xs text-blue-500 hover:text-blue-700"
        >
          + Add Parameter
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Prompt Template</label>
        <textarea
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          rows={4}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm font-mono resize-y"
        />
        {paramNames.length > 0 && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            Available: {paramNames.join(", ")}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// --- Import URL Form ---

function ImportUrlForm({ onImported }: { onImported: (data: CustomSkillData) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await window.catclaw.importSkillFromUrl(url.trim());
      onImported(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [url, onImported]);

  return (
    <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
        Import Skill from URL
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Paste a URL to a skill repository (GitHub, ClaHub, etc.) or documentation page.
        The AI agent will fetch, analyze, and extract the skill definition automatically.
      </p>

      {error && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/user/skill-repo"
          className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleImport()}
          disabled={loading}
        />
        <button
          onClick={handleImport}
          disabled={!url.trim() || loading}
          className="rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-4 py-2 text-sm font-medium transition-colors shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Import"
          )}
        </button>
      </div>

      {loading && (
        <p className="text-xs text-purple-500 dark:text-purple-400 animate-pulse">
          Agent is fetching and analyzing the URL... This may take a moment.
        </p>
      )}
    </div>
  );
}

// --- Parameter Row ---

function ParameterRow({
  param,
  onChange,
  onRemove,
}: {
  param: SkillParameter;
  onChange: (updates: Partial<SkillParameter>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={param.name}
        onChange={(e) => onChange({ name: e.target.value.replace(/\s+/g, "_") })}
        placeholder="name"
        className="w-28 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs font-mono"
      />
      <select
        value={param.type}
        onChange={(e) =>
          onChange({ type: e.target.value as SkillParameter["type"] })
        }
        className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-1 text-xs"
      >
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
      </select>
      <input
        value={param.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="description"
        className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs"
      />
      <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
        <input
          type="checkbox"
          checked={param.required}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="rounded"
        />
        req
      </label>
      <button
        onClick={onRemove}
        className="text-red-400 hover:text-red-600 text-xs shrink-0"
      >
        &times;
      </button>
    </div>
  );
}
