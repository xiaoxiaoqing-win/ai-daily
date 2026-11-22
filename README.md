# 第二号 · AI Daily

AI 日报 + 有来源的深度调研。前端部署到 **GitHub Pages**，**GitHub Actions** 负责定时采集、调用兼容 OpenAI 的模型并发布静态 JSON；不需要常驻服务器。

## 你能得到什么

- 首页：最新日报、历史日历、调研报告。
- 日报：Follow Builders 一手动态、GitHub Trending、可配置 RSS / Atom；来源筛选、全文搜索、90 期归档。
- 深度调研：公开文章提取、YouTube / B 站公开字幕读取、用户补充原文、可选 Tavily 联网交叉检索、带引用的中文报告。
- Markdown 阅读、复制和导出；每个来源的采集状态及失败提示。
- 未配置模型密钥时，采集仍可运行，明确标记为「原文汇编」。深度调研需要模型密钥。

## 部署到 github.io

1. 创建公开 GitHub 仓库并上传代码，默认分支使用 `main`。若仓库为私有，先确认账号支持私有仓库 Pages。
2. 仓库 **Settings → Pages → Build and deployment → Source → GitHub Actions**。
3. **Settings → Secrets and variables → Actions → New repository secret**，添加下表配置。密钥不能放进源码、Issue、`VITE_*` 或网页表单。
4. **Actions → Deploy Pages → Run workflow**。后续向 `main` 推送代码会自动部署。
5. **Actions → Daily Digest → Run workflow** 生成第一期，之后每天北京时间 **08:17** 自动更新。Actions 调度可能延迟；长期不活跃的公开仓库定时任务可能被 GitHub 停用，需到 Actions 恢复。

预计网址：`https://xiaoxiaoqing-win.github.io/ai-daily/`。构建时从 `github.repository` 自动识别仓库，支持仓库子路径和 `<用户名>.github.io` 根站点，使用 hash 路由避免刷新 404。

| Secret | 必填 | 用途 |
| --- | --- | --- |
| `OPENAI_API_KEY` | AI 功能需要 | 模型服务 API 密钥 |
| `OPENAI_BASE_URL` | 否 | 默认 `https://api.openai.com/v1`；填兼容服务的 API 根地址，代码追加 `/chat/completions` |
| `OPENAI_MODEL` | 否 | 默认 `gpt-4o-mini`；可填服务支持的其他模型 |
| `TAVILY_API_KEY` | 联网研究需要 | 调研表单勾选联网检索后使用 |

如果写回内容时报 403，在 **Settings → Actions → General → Workflow permissions** 检查仓库是否允许工作流写入内容（组织策略也可能限制）。Daily 和 Research 工作流显式调用 Pages 部署，因为 `GITHUB_TOKEN` 生成的提交不会再次触发 push 工作流。

## 配置信息源

编辑 [`config/sources.json`](config/sources.json)：

```json
{
  "timezone": "Asia/Shanghai",
  "lookback_hours": 72,
  "max_items_per_source": 12,
  "sources": [
    {"id":"builders","name":"Follow Builders","kind":"builders","url":"https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json","enabled":true},
    {"id":"github","name":"GitHub Trending","kind":"github","url":"https://github.com/trending?since=daily","enabled":true},
    {"id":"my-feed","name":"我的订阅","kind":"rss","url":"https://example.com/feed.xml","enabled":true}
  ]
}
```

`kind` 支持 `builders`、`github`、`rss`，`id` 应唯一。按 URL 去重；保留来源给出的原始日期，GitHub 趋势使用采集时间。72 小时窗口用于低频订阅，可能在相邻日报中再次出现同一条信息。同一天重跑会更新该期日报。全部来源失败时保留之前的日报，同时记录错误状态。

默认来源还包含 Simon Willison 和 Hugging Face Blog。Follow Builders 是独立上游项目，存在格式变化、断更或条目过期的可能；GitHub Trending 是页面解析，也可能因页面改版失效。界面会如实显示逐源状态。

## 发起深度调研

网页「深度调研 → 发起调研」填写主题、链接和可选原文，点击「准备调研任务」，再到 GitHub 检查并提交 Issue。标题前缀必须是 `[Research]`，正文包含 JSON 任务。

- 自动运行仅接受具有仓库写权限的所有者和协作者。普通访问者的 Issue 不会消耗 API 配额。
- 无需在浏览器输入 GitHub token 或模型密钥。
- 也可在 **Actions → Deep Research → Run workflow** 手动填写主题、每行一个的 URL、原文和联网检索开关。
- 视频依赖 yt-dlp 和可公开读取的字幕，不下载音视频，不做语音转录或画面理解；无字幕、地域限制、登录或反爬可能导致失败。
- 小红书、公众号及其他文章优先提取公开正文；无法读取时，在 notes 中补充有权使用的正文或转录。不会把提取失败的来源作为已读资料。
- 联网研究会对原问题及其评估/局限做两轮检索，再基于证据综合。它是可复现的研究流水线，不提供任意网站登录或无限浏览能力。
- 任务、补充原文、生成报告和引用都会进入公开仓库/站点，请只提交可公开的资料。提交后到 Actions 查看进度；生成失败不会写入虚构报告。同一 Issue 重跑会更新原报告。

报告由 AI 生成，重要结论需核验引用原文。资料文字被当作数据而非指令，外链读取限制为公开 http/https；页面使用安全 Markdown 渲染，不执行来源 HTML。

## 本地开发

要求 Node.js **22.12+**、Python **3.11+**。

```sh
npm ci
npm run dev
```

首次未采集时自动展示明确标注的示例内容；首页不是后台运行状态监控，真实状态来自最后一次发布的数据。

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pipeline collect --no-ai
python -m unittest discover -s tests -v
npm run build
npx playwright install chromium
npm run test:e2e
```

本地运行 AI 功能，先在 shell 中导出环境变量；`.env.example` 仅作模板，Python 不会自动读取 `.env`。不要提交真实 `.env`。

```sh
export OPENAI_API_KEY='你的密钥'
export OPENAI_BASE_URL='https://api.openai.com/v1'
export OPENAI_MODEL='gpt-4o-mini'
python -m pipeline collect
python -m pipeline research --topic '研究主题' --urls 'https://example.com/article'
python -m pipeline research --task-file research-task.json
```

开发服务器启动时，Vite 插件自动将源配置同步到 `public/sources.json`。生产部署也会同步。

## 结构与数据流

```text
config/sources.json → Python 采集 / 研究 → public/data/index.json
                                              ↓
                                   React 静态站 → GitHub Pages
```

- `src/`：响应式界面和 Markdown 阅读器。
- `pipeline/`：采集、AI 摘要、字幕/正文提取、研究生成。
- `public/data/index.json`：可审计、可版本回溯的真实内容。
- `public/data/demo.json`：单独的排版示例；首次真实采集后停止自动展示。
- `.github/workflows/`：检查、发布、每日定时任务、Issue/手动调研。

两个内容工作流共用并发组，避免同时覆盖数据；90 期归档以外的日报和不再引用的原始条目会清理，调研报告持续保留。所有数据是公开静态文件，不支持多用户私有报告。模型调用和可选检索由你配置的服务计费；GitHub 的 Actions/Pages 限额以账号方案为准。
