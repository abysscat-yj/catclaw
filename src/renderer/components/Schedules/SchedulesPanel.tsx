// SchedulesPanel - manage scheduled/cron tasks

import React, { useCallback, useEffect, useState } from "react";

export default function SchedulesPanel() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    const list = await window.catclaw.listSchedules();
    setTasks(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      await window.catclaw.deleteSchedule(id);
      refresh();
    },
    [refresh]
  );

  const handleToggle = useCallback(
    async (id: string, enabled: boolean) => {
      await window.catclaw.updateSchedule(id, { enabled });
      refresh();
    },
    [refresh]
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scheduled Tasks</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {showCreate ? "Cancel" : "+ New Task"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {showCreate && (
          <CreateTaskForm
            onCreated={() => {
              setShowCreate(false);
              refresh();
            }}
          />
        )}

        {tasks.length === 0 && !showCreate ? (
          <div className="text-center text-gray-400 py-12">
            <div className="text-3xl mb-3">{"\u23F0"}</div>
            <p className="text-sm">No scheduled tasks</p>
            <p className="text-xs mt-1">
              Create a task to run automatically on a schedule
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdated={refresh}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --- Task Card ---

function TaskCard({
  task,
  onToggle,
  onDelete,
  onUpdated,
}: {
  task: ScheduledTask;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{"\uD83D\uDCCB"}</span>
            <span className="font-semibold text-sm">{task.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(task.id, !task.enabled)}
              className={`text-xs px-2 py-0.5 rounded-full ${
                task.enabled
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500"
              }`}
            >
              {task.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
          Cron: {task.cron}
        </div>

        <p className="mt-1.5 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {task.prompt}
        </p>

        {task.lastRunAt && (
          <div className="mt-1.5 text-xs text-gray-400">
            Last run: {new Date(task.lastRunAt).toLocaleString()}
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
            onClick={() => onDelete(task.id)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <EditTaskForm
          task={task}
          onSaved={() => {
            setEditing(false);
            onUpdated();
          }}
        />
      )}
    </div>
  );
}

// --- Create Form ---

const CRON_PRESETS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day 9am", value: "0 9 * * *" },
  { label: "Every day 6pm", value: "0 18 * * *" },
  { label: "Weekdays 9am", value: "0 9 * * 1-5" },
  { label: "Every Sunday", value: "0 10 * * 0" },
];

function CreateTaskForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cron, setCron] = useState("0 9 * * *");
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim() || !prompt.trim() || !cron.trim()) return;
    setSaving(true);
    await window.catclaw.createSchedule({
      name: name.trim(),
      prompt: prompt.trim(),
      cron: cron.trim(),
    });
    setSaving(false);
    onCreated();
  }, [name, prompt, cron, onCreated]);

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
        New Scheduled Task
      </h3>

      <div>
        <label className="block text-xs font-medium mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Daily code review"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="What should the agent do?"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Cron Schedule
        </label>
        <div className="flex gap-2 mb-1.5 flex-wrap">
          {CRON_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setCron(p.value)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                cron === p.value
                  ? "border-blue-500 bg-blue-100 dark:bg-blue-900/40 text-blue-600"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          placeholder="M H D Mon DOW"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm font-mono"
        />
        <p className="text-[10px] text-gray-400 mt-0.5">
          Format: minute hour day-of-month month day-of-week
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !prompt.trim() || saving}
          className="rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {saving ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}

// --- Edit Form ---

function EditTaskForm({
  task,
  onSaved,
}: {
  task: ScheduledTask;
  onSaved: () => void;
}) {
  const [name, setName] = useState(task.name);
  const [prompt, setPrompt] = useState(task.prompt);
  const [cron, setCron] = useState(task.cron);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await window.catclaw.updateSchedule(task.id, {
      name: name.trim(),
      prompt: prompt.trim(),
      cron: cron.trim(),
    });
    setSaving(false);
    onSaved();
  }, [task.id, name, prompt, cron, onSaved]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3 bg-gray-50 dark:bg-gray-800/50">
      <div>
        <label className="block text-xs font-medium mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm resize-y"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Cron</label>
        <input
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm font-mono"
        />
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
