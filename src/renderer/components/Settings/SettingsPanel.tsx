// SettingsPanel - settings modal with multi-provider support

import React, { useCallback, useState } from "react";
import { useSettings } from "../../hooks/useSettings";

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    activeProviderId,
    providers,
    model,
    maxTokens,
    customSystemPrompt,
    activeProvider,
    updateSettings,
  } = useSettings();

  const [showAddProvider, setShowAddProvider] = useState(false);

  const handleProviderChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateSettings({ activeProviderId: e.target.value });
    },
    [updateSettings]
  );

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateSettings({ model: e.target.value });
    },
    [updateSettings]
  );

  const handleMaxTokensChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val > 0) {
        updateSettings({ maxTokens: val });
      }
    },
    [updateSettings]
  );

  const handleSystemPromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateSettings({ customSystemPrompt: e.target.value });
    },
    [updateSettings]
  );

  const handleRemoveProvider = useCallback(
    (providerId: string) => {
      updateSettings({ removeProvider: providerId });
    },
    [updateSettings]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Provider selector */}
          <div>
            <label className="block text-sm font-medium mb-1">服务商</label>
            <div className="flex gap-2">
              <select
                value={activeProviderId}
                onChange={handleProviderChange}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.hasApiKey ? "" : " (未配置)"}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddProvider(!showAddProvider)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 text-sm transition-colors"
              >
                {showAddProvider ? "取消" : "+ 自定义"}
              </button>
            </div>
          </div>

          {/* Add custom provider form */}
          {showAddProvider && (
            <AddProviderForm
              onAdd={() => setShowAddProvider(false)}
              updateSettings={updateSettings}
            />
          )}

          {/* Active provider API key */}
          {activeProvider && (
            <ProviderKeyForm
              provider={activeProvider}
              updateSettings={updateSettings}
            />
          )}

          {/* Non-builtin provider: edit fields + delete */}
          {activeProvider && !activeProvider.builtin && (
            <EditProviderForm
              key={activeProvider.id}
              provider={activeProvider}
              updateSettings={updateSettings}
              onRemove={() => handleRemoveProvider(activeProvider.id)}
            />
          )}

          {/* Model selector */}
          {activeProvider && (
            <div>
              <label className="block text-sm font-medium mb-1">模型</label>
              <select
                value={model}
                onChange={handleModelChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {activeProvider.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium mb-1">
              最大 Tokens
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={handleMaxTokensChange}
              min={256}
              max={200000}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Custom System Prompt */}
          <div>
            <label className="block text-sm font-medium mb-1">
              自定义系统提示词（可选）
            </label>
            <textarea
              value={customSystemPrompt}
              onChange={handleSystemPromptChange}
              rows={4}
              placeholder="为 AI 添加额外指令..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 text-sm font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function ProviderKeyForm({
  provider,
  updateSettings,
}: {
  provider: { id: string; name: string; apiKey: string; hasApiKey: boolean };
  updateSettings: (u: Record<string, unknown>) => Promise<void>;
}) {
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    await updateSettings({
      providerApiKey: { providerId: provider.id, apiKey: newKey.trim() },
    });
    setNewKey("");
    setSaving(false);
  }, [newKey, updateSettings, provider.id]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {provider.name} API 密钥
      </label>
      {provider.hasApiKey && (
        <p className="text-xs text-green-600 dark:text-green-400 mb-2">
          已配置密钥: {provider.apiKey}
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="password"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={
            provider.hasApiKey
              ? "输入新密钥以替换"
              : "输入 API 密钥..."
          }
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={!newKey.trim() || saving}
          className="rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          {saving ? "..." : "保存"}
        </button>
      </div>
    </div>
  );
}

function EditProviderForm({
  provider,
  updateSettings,
  onRemove,
}: {
  provider: ProviderInfo;
  updateSettings: (u: Record<string, unknown>) => Promise<void>;
  onRemove: () => void;
}) {
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl);
  const [models, setModels] = useState(provider.models.join(", "));
  const [headers, setHeaders] = useState(
    provider.customHeaders
      ? Object.entries(provider.customHeaders)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseUrl(e.target.value);
    setDirty(true);
  };
  const handleModelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModels(e.target.value);
    setDirty(true);
  };
  const handleHeadersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHeaders(e.target.value);
    setDirty(true);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    const modelList = models
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    let customHeaders: Record<string, string> | undefined;
    if (headers.trim()) {
      customHeaders = {};
      for (const line of headers.split("\n")) {
        const idx = line.indexOf(":");
        if (idx > 0) {
          customHeaders[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      }
    }

    await updateSettings({
      addProvider: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        baseUrl: baseUrl.trim().replace(/\/+$/, ""),
        models: modelList.length > 0 ? modelList : ["default"],
        defaultModel: modelList[0] || "default",
        customHeaders,
        builtin: false,
      },
    });

    setSaving(false);
    setDirty(false);
  }, [baseUrl, models, headers, provider, updateSettings]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-4 space-y-3">
      <h3 className="text-sm font-semibold">服务商设置</h3>

      <div>
        <label className="block text-xs font-medium mb-1">接口地址</label>
        <input
          value={baseUrl}
          onChange={handleBaseUrlChange}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          模型（逗号分隔）
        </label>
        <input
          value={models}
          onChange={handleModelsChange}
          placeholder="例如 glm-5, ernie-4.0"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          自定义请求头（每行一个: Key: Value）
        </label>
        <textarea
          value={headers}
          onChange={handleHeadersChange}
          rows={2}
          placeholder={"Appid: your-app-id\nX-Custom: value"}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm resize-y"
        />
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onRemove}
          className="text-xs text-red-500 hover:text-red-700"
        >
          删除服务商
        </button>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {saving ? "保存中..." : "保存修改"}
          </button>
        )}
      </div>
    </div>
  );
}

function AddProviderForm({
  onAdd,
  updateSettings,
}: {
  onAdd: () => void;
  updateSettings: (u: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"openai-compatible" | "anthropic">(
    "openai-compatible"
  );
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState("");
  const [headers, setHeaders] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!name.trim() || !baseUrl.trim()) return;
    setSaving(true);

    const modelList = models
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    let customHeaders: Record<string, string> | undefined;
    if (headers.trim()) {
      customHeaders = {};
      for (const line of headers.split("\n")) {
        const idx = line.indexOf(":");
        if (idx > 0) {
          customHeaders[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      }
    }

    const id = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    await updateSettings({
      addProvider: {
        id,
        name: name.trim(),
        type,
        baseUrl: baseUrl.trim().replace(/\/+$/, ""),
        apiKey: apiKey.trim(),
        models: modelList.length > 0 ? modelList : ["default"],
        defaultModel: modelList[0] || "default",
        customHeaders,
        builtin: false,
      },
    });

    setSaving(false);
    onAdd();
  }, [name, type, baseUrl, apiKey, models, headers, updateSettings, onAdd]);

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
        添加自定义服务商
      </h3>

      <div>
        <label className="block text-xs font-medium mb-1">名称</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如 百度千帆"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">类型</label>
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as "openai-compatible" | "anthropic")
          }
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        >
          <option value="openai-compatible">OpenAI 兼容</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">接口地址</label>
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="例如 http://qianfan.baidubce.com/v2"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">API 密钥</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Bearer Token 或 API 密钥"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          模型（逗号分隔）
        </label>
        <input
          value={models}
          onChange={(e) => setModels(e.target.value)}
          placeholder="例如 glm-5, ernie-4.0"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          自定义请求头（可选，每行一个: Key: Value）
        </label>
        <textarea
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          rows={2}
          placeholder={"Appid: your-app-id\nX-Custom: value"}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm resize-y"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onAdd}
          className="rounded px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          取消
        </button>
        <button
          onClick={handleAdd}
          disabled={!name.trim() || !baseUrl.trim() || saving}
          className="rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {saving ? "添加中..." : "添加服务商"}
        </button>
      </div>
    </div>
  );
}
