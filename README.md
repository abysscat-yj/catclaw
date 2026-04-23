# CatClaw - 小虾猫 - 你的专属 Mac 桌面 AI Agent 龙虾

> 基于 [OpenClaw](https://github.com/anthropics/claude-code) 核心设计思路的**轻量化桌面通用 Agent**，以 TypeScript 实现了 Agent Loop、Tool Pipeline、多模型接入、自定义 Skill、定时任务、思考过程可视化与 Buddy 伙伴系统等核心能力。

CatClaw 是一个基于 Electron 的 macOS 桌面 AI 助手，支持多 LLM 服务商接入，具备终端命令执行、文件系统操作、屏幕截图等系统级工具能力，并提供自定义 Skill 编排、定时任务调度和趣味宠物收集养成功能。

<img width="2182" height="1478" alt="image" src="https://github.com/user-attachments/assets/510b3003-7219-4963-bb67-4851ab672288" />


## 与 OpenClaw 的关系

CatClaw 参考了 OpenClaw（Claude Code）的核心架构设计，在保留关键设计理念的同时大幅简化实现，适合学习 Agent 架构和二次开发。

| 对比维度 | OpenClaw | CatClaw |
|---------|----------|---------|
| **定位** | 生产级 CLI Agent | 桌面端轻量 Agent |
| **运行环境** | 终端 CLI | macOS Electron 桌面应用 |
| **Agent Loop** | 完整的多轮对话 + 权限控制 + 上下文管理 | 简化版循环（最多 30 轮工具调用） |
| **工具系统** | 丰富的内置工具 + 权限沙箱 | 3 个核心工具 + 7 个预置 Skill + 自定义 Prompt Skill |
| **模型支持** | Anthropic 为主 | 多服务商（Anthropic / OpenAI / DeepSeek / 自定义） |
| **Skill 扩展** | 文件系统 Skill 定义 | SQLite 存储 + Prompt 模板 + URL 导入 + 热更新 |
| **定时任务** | Session 内 Cron | 独立 Scheduler + SQLite 持久化 |
| **思考过程** | 终端内联展示 | GUI 可折叠卡片（ThinkingStep） |
| **宠物系统** | CLI Buddy（ASCII art） | 桌面端 Buddy（动画 + 个性 + 互动） |
| **UI** | 终端 TUI | React + Tailwind 精致图形界面 |

**保留的核心设计**：Agent Loop 多轮工具调用模式、Tool 接口抽象（definition + execute）、流式输出 + 工具调用事件分离、内容分组（ThinkingStep vs 最终回复）、Buddy 伙伴系统（18 物种 + 稀有度 + ASCII art）。

**简化的部分**：去掉了权限系统、上下文压缩、多文件编辑 diff、git 集成、MCP 协议等复杂模块，聚焦于「LLM + 工具调用 + 桌面交互」的最小闭环。

## 核心特性

- **品牌化首页** — CatClaw 专属 SVG 猫爪 Logo + 渐变标语 + 建议卡片快捷入口
- **多模型支持** — 内置 Anthropic、OpenAI、DeepSeek 接入，支持添加任意 OpenAI 兼容 API
- **系统级工具调用** — Agent 可执行终端命令（`exec`）、读写文件（`filesystem`）、截取屏幕（`screenshot`）
- **7 个预置 Skill** — 前端设计、办公四件套（docx/pdf/pptx/xlsx）、Skill 创建器、联网搜索，开箱即用
- **URL 导入 Skill** — 粘贴任意 URL（GitHub / ClaHub 等），Agent 自动抓取解析并安装为 Skill
- **自定义 Skill** — 通过 Prompt 模板创建可复用技能，支持参数化和子任务执行，热更新生效
- **定时任务** — Cron 表达式驱动的定时任务调度，自动创建对话并执行
- **思考过程可视化** — 完整展示 Agent 的中间推理步骤和工具调用过程，支持折叠/展开
- **Buddy 宠物伙伴** — 18 种物种、5 级稀有度、闪光变体、ASCII art 动画、个性系统、互动语音
- **对话持久化** — SQLite 存储对话历史，API Key 通过系统 Keychain 加密保存
- **流式输出** — 实时流式展示 Agent 回复，支持 Markdown 渲染

## 技术架构

```
┌──────────────────────────────────────────────────────┐
│                   Renderer (React)                   │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ │
│  │ ChatView │ │ Skills   │ │Schedule │ │  Pets   │ │
│  │ Messages │ │ Panel    │ │ Panel   │ │  Buddy  │ │
│  │ Thinking │ │ URL导入  │ │  Cron   │ │  Gacha  │ │
│  └──────────┘ └──────────┘ └─────────┘ └─────────┘ │
│    Zustand Store (conversation/settings/pet-store)   │
├──────────── IPC Bridge (contextBridge) ──────────────┤
│                   Main Process                       │
│  ┌───────────────────────────────────────────────┐   │
│  │ AgentLoop                                     │   │
│  │  ├─ LLMClient (Anthropic / OpenAI)            │   │
│  │  ├─ ToolRegistry → ToolExecutor               │   │
│  │  │    ├─ exec (shell)                         │   │
│  │  │    ├─ filesystem (read/write/list)         │   │
│  │  │    ├─ screenshot (screencapture)           │   │
│  │  │    └─ custom skills (prompt template)      │   │
│  │  └─ runSubTask (子任务执行 / URL Skill 导入)  │   │
│  ├─ Scheduler (cron 调度)                         │   │
│  ├─ CustomSkillStore (SQLite + 预置 Skill 种子)   │   │
│  ├─ PetStore (Buddy 系统 + 抽卡经济)             │   │
│  └─ ConversationStore (SQLite + WAL)              │   │
└──────────────────────────────────────────────────────┘
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

### 目录结构

```
src/
├── main/                        # Electron 主进程
│   ├── index.ts                 # 入口，创建窗口
│   ├── ipc-handlers.ts          # IPC 处理器注册中心
│   ├── scheduler.ts             # 定时任务调度器
│   ├── custom-skill-store.ts    # 自定义 Skill SQLite 存储
│   ├── default-skills.ts        # 7 个预置 Skill 定义
│   ├── pet-store.ts             # Buddy 宠物系统 (18 物种/抽卡/经济)
│   ├── agent/
│   │   ├── agent-loop.ts        # Agent 核心循环
│   │   ├── agent-types.ts       # Tool/ToolResult 接口定义
│   │   ├── llm-client.ts        # LLM 客户端抽象接口
│   │   ├── anthropic-client.ts  # Anthropic SDK 实现
│   │   ├── openai-compat-client.ts # OpenAI 兼容 SSE 实现
│   │   ├── conversation-store.ts   # SQLite 对话/消息持久化
│   │   ├── system-prompt.ts     # 系统提示词构建
│   │   ├── tool-registry.ts     # 工具注册表
│   │   └── tool-executor.ts     # 工具执行器
│   └── tools/
│       ├── exec-tool.ts         # 终端命令执行
│       ├── filesystem-tool.ts   # 文件系统操作
│       ├── screenshot-tool.ts   # macOS 屏幕截图
│       └── custom-skill-tool.ts # Prompt 模板 Skill 工厂
├── preload/
│   └── index.ts                 # contextBridge API 暴露
├── renderer/                    # React 前端
│   ├── App.tsx                  # 根组件 (侧边栏 + Buddy 展示 + 多视图)
│   ├── components/
│   │   ├── Chat/                # 对话界面
│   │   │   ├── ChatView.tsx     # 对话视图 (自动建会话)
│   │   │   ├── MessageList.tsx  # 消息列表 + 首页 + 流式渲染
│   │   │   ├── MessageBubble.tsx    # 消息气泡 + 内容分组
│   │   │   ├── ThinkingStep.tsx     # 可折叠思考步骤
│   │   │   ├── ToolCallCard.tsx     # 工具调用卡片
│   │   │   └── InputBar.tsx         # 输入栏 (渐变发送按钮)
│   │   ├── Pets/                # 宠物伙伴系统
│   │   │   ├── PetsPanel.tsx    # 收藏集 + 稀有度统计
│   │   │   ├── PetCard.tsx      # Buddy 卡片 (ASCII art + 改名)
│   │   │   ├── GachaModal.tsx   # 抽卡弹窗 (翻转动画)
│   │   │   └── BuddyDisplay.tsx # 侧边栏 Buddy 展示 (动画+互动)
│   │   ├── Skills/
│   │   │   └── SkillsPanel.tsx  # Skill 管理 + URL 导入
│   │   ├── Schedules/
│   │   │   └── SchedulesPanel.tsx
│   │   ├── Settings/
│   │   │   └── SettingsPanel.tsx
│   │   └── common/
│   │       └── CatClawLogo.tsx  # SVG 猫爪 Logo
│   ├── data/
│   │   └── buddy-data.ts       # 物种/帽子/稀有度/个性数据
│   ├── stores/                  # Zustand 状态管理
│   │   ├── conversation-store.ts
│   │   ├── settings-store.ts
│   │   └── pet-store.ts        # Buddy 收藏状态
│   └── hooks/
│       └── useAgent.ts          # Agent 通信 Hook
└── shared/                      # 主进程/渲染进程共享
    ├── ipc-channels.ts          # IPC 通道常量
    ├── message-types.ts         # 消息类型定义
    └── settings-types.ts        # 设置/Provider 类型
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

点击设置 → 添加自定义服务商，可接入任何 OpenAI 兼容 API（百度千帆、阿里通义、Ollama 本地模型等）。

### 预置 Skill

开箱即用的 7 个专业 Skill，首次启动自动注入：

| Skill | 触发场景 |
|-------|----------|
| `frontend_design` | 构建网页组件、落地页、React UI |
| `create_docx` | 创建/编辑 Word 文档 |
| `handle_pdf` | 读取、创建、合并、拆分 PDF |
| `create_pptx` | 创建/编辑 PowerPoint 演示文稿 |
| `handle_xlsx` | 创建/编辑 Excel 表格、数据分析 |
| `skill_creator` | 设计和测试新的 Skill 模板 |
| `web_search` | 联网搜索、抓取网页内容 |

### URL 导入 Skill

支持从任意 URL 一键导入 Skill：

1. 打开侧边栏「Skills」面板
2. 点击「Import URL」
3. 粘贴 GitHub 仓库、ClaHub 页面或任意文档 URL
4. Agent 自动抓取、分析、提取 Skill 定义
5. 预填充创建表单，确认后即可使用

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

### Buddy 宠物伙伴系统

参考 Claude Code 的 Virtual Buddy 系统，为桌面端定制的宠物收集养成功能：

**收集机制**
- 18 种 ASCII art 物种（猫、鸭、龙、幽灵、机器人、水豚等）
- 5 级稀有度：Common (60%) → Uncommon (25%) → Rare (10%) → Epic (4%) → Legendary (1%)
- 1% 闪光（Shiny）变体概率
- 6 种眼型变体 + 8 种帽子装饰
- 5 维属性系统：Debugging / Patience / Chaos / Wisdom / Snark

**经济系统**
- 每次对话完成奖励 3 爪爪币
- 首次启动赠送 30 爪爪币（可抽 3 次）
- 每次抽卡消耗 10 爪爪币

**互动功能**
- 侧边栏展示当前激活的 Buddy（ASCII art 动画）
- 多种动画状态：闲置、睡觉 (zzZ)、思考 (...)、兴奋 (!!)
- 点击 Buddy 触发弹跳动画 + 互动语音（"Boop!", "Hey!"）
- 基于最高属性的个性标签（"Chaos Gremlin", "Zen Master" 等）
- 个性化语音气泡（高混乱值 Buddy 会说 "YOLO deploy!"）
- 双击名字可自定义重命名

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
