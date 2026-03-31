# CatClaw - 小虾猫 - 你的专属 Mac 桌面 AI Agent 龙虾

> 基于 [OpenClaw](https://github.com/anthropics/claude-code) 核心设计思路的**轻量化桌面通用 Agent**，以 ~6000 行 TypeScript 代码实现了 Agent Loop、Tool Pipeline、多厂商大模型接入、自定义 Skill、定时任务、思考过程可视化等核心能力。

CatClaw 是一个基于 Electron 的 macOS 桌面 AI 助手，支持多 LLM 服务商接入，具备终端命令执行、文件系统操作、屏幕截图等系统级工具能力，并提供自定义 Skill 编排和定时任务调度功能。

## 与 OpenClaw 的关系

CatClaw 参考了 OpenClaw（Claude Code）的核心架构设计，在保留关键设计理念的同时大幅简化实现，适合学习 Agent 架构和二次开发。

| 对比维度 | OpenClaw | CatClaw |
|---------|----------|---------|
| **定位** | 生产级 CLI Agent | 桌面端轻量 Agent |
| **代码规模** | 数十万行 | **~6000 行** (39 个源文件) |
| **运行环境** | 终端 CLI | macOS Electron 桌面应用 |
| **Agent Loop** | 完整的多轮对话 + 权限控制 + 上下文管理 | 简化版循环（最多 30 轮工具调用） |
| **工具系统** | 丰富的内置工具 + 权限沙箱 | 3 个核心工具 + 自定义 Prompt Skill |
| **模型支持** | Anthropic 为主 | 多服务商（Anthropic / OpenAI / DeepSeek / 自定义） |
| **Skill 扩展** | 文件系统 Skill 定义 | SQLite 存储 + Prompt 模板 + 热更新 |
| **定时任务** | Session 内 Cron | 独立 Scheduler + SQLite 持久化 |
| **思考过程** | 终端内联展示 | GUI 可折叠卡片（ThinkingStep） |
| **UI** | 终端 TUI | React + Tailwind 图形界面 |

**保留的核心设计**：Agent Loop 多轮工具调用模式、Tool 接口抽象（definition + execute）、流式输出 + 工具调用事件分离、内容分组（ThinkingStep vs 最终回复）。

**简化的部分**：去掉了权限系统、上下文压缩、多文件编辑 diff、git 集成、MCP 协议等复杂模块，聚焦于「LLM + 工具调用 + 桌面交互」的最小闭环。

## 核心特性

- **多模型支持** — 内置 Anthropic (Claude Sonnet 4.6)、OpenAI (GPT-5.4)、DeepSeek (V3.2) 接入，支持添加任意 OpenAI 兼容 API
- **系统级工具调用** — Agent 可执行终端命令（`exec`）、读写文件（`filesystem`）、截取屏幕（`screenshot`）
- **自定义 Skill** — 通过 Prompt 模板创建自定义技能，支持参数化和子任务执行，创建后热更新生效
- **定时任务** — Cron 表达式驱动的定时任务调度，自动创建对话并执行
- **思考过程可视化** — 完整展示 Agent 的中间推理步骤和工具调用过程，支持折叠/展开
- **对话持久化** — SQLite 存储对话历史，API Key 通过系统 Keychain 加密保存
- **流式输出** — 实时流式展示 Agent 回复，支持 Markdown 渲染

## 技术架构

```
┌─────────────────────────────────────────────────┐
│                  Renderer (React)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ ChatView │ │ Skills   │ │ SchedulesPanel   │ │
│  │ Messages │ │ Panel    │ │ CRUD + Cron      │ │
│  │ Thinking │ │ CRUD     │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│          Zustand Store (conversation/settings)   │
├──────────── IPC Bridge (contextBridge) ──────────┤
│                  Main Process                    │
│  ┌──────────────────────────────────────────┐   │
│  │ AgentLoop                                │   │
│  │  ├─ LLMClient (Anthropic / OpenAI)       │   │
│  │  ├─ ToolRegistry → ToolExecutor          │   │
│  │  │    ├─ exec (shell)                    │   │
│  │  │    ├─ filesystem (read/write/list)    │   │
│  │  │    ├─ screenshot (screencapture)      │   │
│  │  │    └─ custom skills (prompt template) │   │
│  │  └─ runSubTask (子任务执行)               │   │
│  ├─ Scheduler (cron 调度)                    │   │
│  ├─ CustomSkillStore (SQLite)               │   │
│  └─ ConversationStore (SQLite + WAL)        │   │
└─────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Electron 33 + Electron Forge |
| 前端 | React 18 + TypeScript + Tailwind CSS |
| 构建 | Vite 6 (main/preload/renderer 三入口) |
| 状态 | Zustand |
| 存储 | better-sqlite3 (WAL 模式) |
| LLM | Anthropic SDK + OpenAI 兼容 SSE |
| 渲染 | react-markdown + remark-gfm |

### 代码统计

```
源文件:  39 个 (.ts / .tsx)
代码行:  ~6000 行
主进程:  ~3200 行 (agent loop / tools / scheduler / IPC)
渲染层:  ~2300 行 (React 组件 / stores / hooks)
共享层:  ~500 行 (类型 / IPC 通道 / 消息格式)
```

### 目录结构

```
src/
├── main/                    # Electron 主进程
│   ├── index.ts             # 入口，创建窗口
│   ├── ipc-handlers.ts      # IPC 处理器注册中心
│   ├── scheduler.ts         # 定时任务调度器
│   ├── custom-skill-store.ts # 自定义 Skill SQLite 存储
│   ├── agent/
│   │   ├── agent-loop.ts    # Agent 核心循环 (消息→LLM→工具→循环)
│   │   ├── agent-types.ts   # Tool/ToolResult 接口定义
│   │   ├── llm-client.ts    # LLM 客户端抽象接口
│   │   ├── anthropic-client.ts   # Anthropic SDK 实现
│   │   ├── openai-compat-client.ts # OpenAI 兼容 SSE 实现
│   │   ├── conversation-store.ts  # SQLite 对话/消息持久化
│   │   ├── tool-registry.ts # 工具注册表
│   │   └── tool-executor.ts # 工具执行器 (超时/中断控制)
│   └── tools/
│       ├── exec-tool.ts     # 终端命令执行
│       ├── filesystem-tool.ts # 文件系统操作
│       ├── screenshot-tool.ts # macOS 屏幕截图
│       └── custom-skill-tool.ts # Prompt 模板 Skill 工厂
├── preload/
│   └── index.ts             # contextBridge API 暴露
├── renderer/                # React 前端
│   ├── App.tsx              # 根组件 (侧边栏 + 多视图路由)
│   ├── components/
│   │   ├── Chat/            # 对话界面
│   │   │   ├── ChatView.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx  # 消息气泡 + 内容分组
│   │   │   ├── ThinkingStep.tsx   # 可折叠思考步骤
│   │   │   └── InputBar.tsx
│   │   ├── Skills/
│   │   │   └── SkillsPanel.tsx    # Skill CRUD 管理
│   │   ├── Schedules/
│   │   │   └── SchedulesPanel.tsx # 定时任务 CRUD
│   │   └── Settings/
│   │       └── SettingsPanel.tsx  # 设置面板
│   ├── stores/              # Zustand 状态管理
│   └── hooks/               # 自定义 Hooks
└── shared/                  # 主进程/渲染进程共享
    ├── ipc-channels.ts      # IPC 通道常量
    ├── message-types.ts     # 消息类型定义
    └── settings-types.ts    # 设置/Provider 类型
```

## 快速开始

### 环境要求

- macOS 12+
- Node.js 18+
- npm 9+

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/abysscat-yj/catclaw.git
cd catclaw

# 安装依赖
npm install

# 开发模式启动
npm start
```

首次启动会自动打开设置面板，配置至少一个 LLM 服务商的 API Key 即可开始使用。

### 构建分发包

```bash
# 类型检查
npm run build

# 打包 macOS 应用
npm run package

# 生成 DMG 安装包
npm run make
```

构建产物位于 `out/` 目录。

## 功能说明

### 多模型接入

内置支持三家服务商，无需额外配置即可切换：

| 服务商 | 协议 | 默认模型 |
|--------|------|----------|
| Anthropic | Native SDK | claude-sonnet-4.6 |
| OpenAI | OpenAI API | gpt-5.4 |
| DeepSeek | OpenAI 兼容 | deepseek-v3.2 |

点击设置 → 添加自定义服务商，可接入任何 OpenAI 兼容 API：

- 百度千帆
- 阿里通义
- Ollama 本地模型
- 其他兼容服务

### 自定义 Skill

通过 Prompt 模板创建可复用的技能：

1. 打开侧边栏「Skills」面板
2. 点击「+ New Skill」
3. 定义名称、描述、参数和 Prompt 模板
4. 创建后 Agent 立即可调用（热更新，无需重启）

**示例** — 创建一个代码审查 Skill：

```
名称: code_review
描述: 对指定文件进行代码质量审查
参数: file (string, required) - 文件路径
模板: 请审查 {{file}} 的代码质量，检查安全漏洞、
      性能问题和代码风格，给出改进建议。
```

Agent 调用该 Skill 时，会自动填充参数，启动子对话执行（可调用 exec/filesystem 等工具），返回审查结果。

### 定时任务

创建 Cron 驱动的自动化任务：

1. 打开侧边栏「Scheduled Tasks」
2. 设置名称、Prompt、Cron 表达式
3. 到期时自动创建对话并执行

支持的 Cron 格式：`分 时 日 月 周` (5 字段标准格式)

### 思考过程展示

Agent 回复时，中间步骤以可折叠卡片形式展示：

- 思考文本 + 工具调用 → 折叠为一个「ThinkingStep」
- 点击展开查看完整推理和工具输入/输出
- 最终回复文本不折叠，直接展示

## 数据与安全

- **API Key** — 通过 macOS Keychain (`safeStorage`) 加密存储，渲染进程仅可见掩码值
- **对话数据** — SQLite 数据库存储在 `~/Library/Application Support/CatClaw/catclaw.db`
- **设置文件** — JSON 存储在 `~/Library/Application Support/CatClaw/catclaw-settings.json`（不含明文 Key）
- **进程隔离** — `contextIsolation: true`，渲染进程通过 contextBridge 访问有限 API

## License

MIT
