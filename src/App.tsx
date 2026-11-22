import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Bird,
  House,
  FileSearch,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Github,
  LoaderCircle,
  Menu,
  Plus,
  Radio,
  Rss,
  Search,
  Settings2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Data, Document, Item, Source } from "./types";

const repository =
  import.meta.env.VITE_GITHUB_REPOSITORY || "xiaoxiaoqing-win/ai-daily";
const repoUrl = `https://github.com/${repository}`;
const base = import.meta.env.BASE_URL;
const nav = [
  { id: "home", label: "阅读概览", icon: House },
  { id: "daily", label: "AI 日报", icon: BookOpen },
  { id: "research", label: "深度调研", icon: FileSearch },
];
const sourceLabels: Record<string, string> = {
  all: "全部动态",
  builders: "Builder 动态",
  github: "开源趋势",
  rss: "RSS 订阅",
};
function dateText(date: string, full = false) {
  return new Date(
    date + (date.length === 10 ? "T12:00:00" : ""),
  ).toLocaleDateString(
    "zh-CN",
    full
      ? { year: "numeric", month: "long", day: "numeric" }
      : { month: "long", day: "numeric" },
  );
}
function download(
  name: string,
  value: string,
  type = "text/markdown;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Mode({ mode }: { mode: string }) {
  return (
    <span className={`tag ${mode === "ai" ? "blue" : ""}`}>
      {mode === "ai" ? "AI 生成" : mode === "demo" ? "示例" : "原文汇编"}
    </span>
  );
}
function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty">
      <BookOpen size={28} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function App() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [route, setRoute] = useState(location.hash.slice(1) || "home");
  const [search, setSearch] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchWasOpen = useRef(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const change = () => {
      setRoute(location.hash.slice(1) || "home");
      setMobileMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    let cancelled = false;
    fetch(`${base}data/index.json`)
      .then((r) => {
        if (!r.ok) throw new Error("数据加载失败");
        return r.json();
      })
      .then(async (value: Data) => {
        if (
          !value.digests.length &&
          !value.reports.length &&
          value.collection.status === "not_run"
        ) {
          const r = await fetch(`${base}data/demo.json`);
          if (!r.ok) throw new Error("示例数据加载失败");
          value = await r.json();
          if (!cancelled) setDemo(true);
        }
        if (!cancelled) setData(value);
      })
      .catch(() => {
        if (!cancelled) setError("未能加载数据，请检查网络后重试。");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (e.key === "Escape") setSearch(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (search) {
      previousFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      searchRef.current?.focus();
    } else if (searchWasOpen.current) {
      (previousFocus.current?.isConnected
        ? previousFocus.current
        : searchTriggerRef.current
      )?.focus();
    }
    searchWasOpen.current = search;
  }, [search]);
  const go = (target: string) => {
    location.hash = target;
  };
  const documents = data ? [...data.digests, ...data.reports] : [];
  const opened = route.startsWith("read/")
    ? documents.find((d) => d.id === route.slice(5))
    : undefined;
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main");
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ block: "start" });
        }}
      >
        跳到正文
      </a>
      <aside className={`site-sidebar ${mobileMenu ? "menu-open" : ""}`}>
        <a className="brand" href="#home" aria-label="知更首页">
          <Bird size={34} strokeWidth={1.6} />
          <span>
            知更<small>ZHIGENG</small>
          </span>
        </a>
        <p className="brand-caption">AI 日报与深度调研</p>
        <nav id="main-navigation" aria-label="主导航">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              aria-current={route === n.id ? "page" : undefined}
              className={route === n.id ? "active" : ""}
            >
              <n.icon size={19} strokeWidth={1.7} />
              <span>{n.label}</span>
              {n.id === "daily" && data && (
                <small aria-hidden="true">{data.digests.length}</small>
              )}
              {n.id === "research" && data && (
                <small aria-hidden="true">{data.reports.length}</small>
              )}
            </a>
          ))}
        </nav>
        <a className="sidebar-create" href="#new">
          <Plus size={17} />
          发起一份调研
        </a>
        <div className="sidebar-bottom">
          <div className="sidebar-thought">
            <Bird size={28} strokeWidth={1.2} />
            <p>
              日有所知，
              <br />
              思有所进。
            </p>
          </div>
          <a
            href="#settings"
            className={`sidebar-settings ${route === "settings" ? "active" : ""}`}
          >
            <Settings2 size={18} />
            <span>信息源与设置</span>
          </a>
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="sidebar-github"
          >
            <Github size={15} />
            GitHub 项目
            <ArrowUpRight size={13} />
          </a>
        </div>
      </aside>
      <header className="site-header">
        <div className="header-inner">
          <a className="mobile-brand" href="#home" aria-label="知更首页">
            <Bird size={26} />
            知更
          </a>
          <div className="page-context">
            <span>我的阅读空间</span>
            <ChevronRight size={14} />
            <strong>
              {route.startsWith("read/")
                ? "正文阅读"
                : route === "new"
                  ? "发起调研"
                  : route === "settings"
                    ? "信息源与设置"
                    : nav.find((n) => n.id === route)?.label || "阅读概览"}
            </strong>
          </div>
          <div className="header-tools">
            <button
              className="search-button"
              ref={searchTriggerRef}
              aria-haspopup="dialog"
              aria-expanded={search}
              onClick={() => setSearch(true)}
              aria-label="搜索日报与报告"
            >
              <Search size={17} />
              <span>搜索日报、报告…</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button mobile-toggle"
              aria-label={mobileMenu ? "收起导航" : "展开导航"}
              aria-expanded={mobileMenu}
              aria-controls="main-navigation"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className={route.startsWith("read/") ? "main reading-main" : "main"}
      >
        {demo && (
          <div className="demo-banner">
            <CircleHelp size={15} />
            <span>
              当前为示例预览。运行首次采集后，这里会自动展示真实内容。
            </span>
            <a href="#settings">查看接入步骤</a>
          </div>
        )}
        {error ? (
          <Empty title="加载遇到问题">
            {error}
            <br />
            <button className="button small" onClick={() => location.reload()}>
              重新加载
            </button>
          </Empty>
        ) : !data ? (
          <div className="loading">
            <LoaderCircle className="spin" />
            <p>正在整理你的信息世界…</p>
          </div>
        ) : opened ? (
          <Reader
            doc={opened}
            onBack={() =>
              go(
                data.reports.some((d) => d.id === opened.id)
                  ? "research"
                  : "daily",
              )
            }
          />
        ) : route.startsWith("read/") ? (
          <Empty title="没有找到这篇内容">
            它可能尚未发布。<a href="#home">返回首页</a>
          </Empty>
        ) : route === "daily" ? (
          <Daily data={data} onOpen={(doc) => go("read/" + doc.id)} />
        ) : route === "research" ? (
          <Research data={data} onOpen={(doc) => go("read/" + doc.id)} />
        ) : route === "new" ? (
          <NewResearch />
        ) : route === "settings" ? (
          <Settings data={data} demo={demo} />
        ) : (
          <Home
            data={data}
            demo={demo}
            onOpen={(doc) => go("read/" + doc.id)}
          />
        )}
      </main>
      <footer className="footer">
        <div>
          <span className="footer-brand">
            <Bird size={17} />
            知更
          </span>
          <span>日有所知，思有所进。</span>
        </div>
        <a href={repoUrl} target="_blank" rel="noreferrer">
          <Github size={15} />在 GitHub 查看项目
          <ExternalLink size={12} />
        </a>
      </footer>
      {search && (
        <div className="dialog-backdrop" onClick={() => setSearch(false)}>
          <section
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const focusables =
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    "input,button,a",
                  );
                if (e.shiftKey && document.activeElement === focusables[0]) {
                  e.preventDefault();
                  focusables[focusables.length - 1]?.focus();
                } else if (
                  !e.shiftKey &&
                  document.activeElement === focusables[focusables.length - 1]
                ) {
                  e.preventDefault();
                  focusables[0]?.focus();
                }
              }
            }}
          >
            <div className="search-input-row">
              <Search size={21} />
              <label
                className="sr-only"
                id="search-title"
                htmlFor="global-search"
              >
                搜索日报与调研报告
              </label>
              <input
                ref={searchRef}
                id="global-search"
                placeholder="搜索日报、调研主题或关键词…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={() => setSearch(false)}
                className="icon-button"
                aria-label="关闭搜索"
              >
                <X size={18} />
              </button>
            </div>
            <div className="search-results">
              {documents
                .filter((d) =>
                  `${d.title} ${d.summary} ${d.content}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .slice(0, 12)
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSearch(false);
                      go("read/" + d.id);
                    }}
                  >
                    <FileText size={18} />
                    <span>
                      <strong>{d.title}</strong>
                      <small>
                        {dateText(d.date)} · {d.summary.slice(0, 65)}
                      </small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              {!documents.some((d) =>
                `${d.title} ${d.summary} ${d.content}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && (
                <p className="search-empty">
                  没有找到相关内容，试试其他关键词。
                </p>
              )}
            </div>
            <div className="search-footer">
              搜索已发布的日报与调研报告
              <span>
                <kbd>esc</kbd> 关闭
              </span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Home({
  data,
  demo,
  onOpen,
}: {
  data: Data;
  demo: boolean;
  onOpen: (doc: Document) => void;
}) {
  const latest = data.digests[0];
  const sourceCount = data.sources.filter((source) => source.enabled).length;
  const date = latest ? new Date(latest.date + "T12:00:00") : new Date();
  return (
    <>
      <section className="hero">
        <div>
          <h1>
            每天，<span>知新一点。</span>
          </h1>
          <p>读懂 AI 的新变化，把好奇心留给更深的问题。</p>
        </div>
        <a href="#new" className="button">
          <Plus size={17} />
          发起调研
        </a>
      </section>
      <div className="overview-meta">
        <span>
          <span className="status-dot" />
          {demo
            ? "示例阅读空间"
            : latest
              ? `最近一期 · ${dateText(latest.date, true)}`
              : "等待第一期日报"}
        </span>
        <span>有来源的阅读，有依据的思考。</span>
      </div>
      <div className="home-grid">
        <section className="daily-section">
          <div className="section-heading">
            <div>
              <h2>今日阅读</h2>
              <p>重要的变化，整理在这里。</p>
            </div>
            <a className="text-link" href="#daily">
              全部日报
              <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="daily-list">
            {data.digests.slice(0, 3).map((d, i) => (
              <button
                className={`digest-card ${i === 0 ? "featured" : ""}`}
                key={d.id}
                onClick={() => onOpen(d)}
              >
                <div className="digest-meta">
                  <span className="tag blue">
                    {i === 0 ? "最新一期" : "历史日报"}
                  </span>
                  <Mode mode={d.mode} />
                  <span>{dateText(d.date)}</span>
                </div>
                <div className="edition-body">
                  {i === 0 && (
                    <div className="edition-date" aria-hidden="true">
                      <span>
                        {date
                          .toLocaleDateString("en-US", { month: "short" })
                          .toUpperCase()}
                      </span>
                      <strong>{String(date.getDate()).padStart(2, "0")}</strong>
                      <small>
                        {date.toLocaleDateString("zh-CN", { weekday: "long" })}
                      </small>
                    </div>
                  )}
                  <div className="edition-copy">
                    <div className="digest-title">
                      <h3>{d.title}</h3>
                      {i > 0 && <ChevronRight size={18} />}
                    </div>
                    <p>{d.summary}</p>
                  </div>
                </div>
                {i === 0 && (
                  <div className="digest-bottom">
                    <span>
                      {d.mode === "demo"
                        ? "示例内容"
                        : `${d.itemCount || 0} 条信息`}
                      <i />
                      {d.sourceCount} 个信息源
                    </span>
                    <span className="read-action">
                      阅读本期
                      <ArrowRight size={16} />
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
          {!latest && (
            <Empty title="第一份日报正在路上">
              前往 GitHub Actions 运行 Daily Digest，即可生成第一份日报。
            </Empty>
          )}
          <a className="archive-link" href="#daily">
            <span>
              <CalendarDays size={15} />
              每一天的变化，都值得留存。
            </span>
            <span>
              浏览 {data.digests.length} 期归档
              <ChevronRight size={14} />
            </span>
          </a>
        </section>
        <aside className="home-aside">
          <div className="section-heading">
            <div>
              <h2>阅读日历</h2>
              <p>找回某一天的灵感。</p>
            </div>
            <CalendarDays size={19} />
          </div>
          <Calendar
            dates={data.digests.map((d) => d.date)}
            onSelect={(selected) => {
              const d = data.digests.find((d) => d.date === selected);
              if (d) onOpen(d);
            }}
          />
        </aside>
      </div>
      <section className="research-section">
        <div className="section-heading">
          <div>
            <h2>再往深处读</h2>
            <p>从一条信息出发，找到有依据的答案。</p>
          </div>
          <a className="text-link" href="#research">
            全部调研
            <ArrowUpRight size={15} />
          </a>
        </div>
        {data.reports.length > 0 ? (
          <div className="research-grid">
            {data.reports.slice(0, 2).map((r, i) => (
              <ReportCard
                key={r.id}
                doc={r}
                index={i}
                onOpen={() => onOpen(r)}
              />
            ))}
            <a className="new-report-card" href="#new">
              <Plus size={24} />
              <h3>下一个好问题，是什么？</h3>
              <p>带上主题与资料，让零散信息成为系统的理解。</p>
              <span className="text-link">
                发起深度调研
                <ArrowUpRight size={15} />
              </span>
            </a>
          </div>
        ) : (
          <div className="research-invitation">
            <div className="invitation-copy">
              <FileSearch size={30} strokeWidth={1.4} />
              <h3>有个问题，想认真弄明白？</h3>
              <p>
                放进文章、链接或可用的视频字幕，
                <br className="desktop-break" />
                把一次好奇，沉淀为一份带引用的研究。
              </p>
              <a href="#new" className="button">
                开始第一份调研
                <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="research-process" aria-label="调研流程">
              <div>
                <span>
                  <FileText size={19} />
                </span>
                <strong>带上资料</strong>
                <small>文章 · 链接 · 原文</small>
              </div>
              <ArrowRight size={18} />
              <div>
                <span>
                  <LayersIcon />
                </span>
                <strong>梳理证据</strong>
                <small>提取 · 比较 · 核验</small>
              </div>
              <ArrowRight size={18} />
              <div>
                <span>
                  <BookOpen size={19} />
                </span>
                <strong>留下理解</strong>
                <small>结论 · 引用 · 局限</small>
              </div>
            </div>
          </div>
        )}
      </section>
      <section className="sources-section">
        <div className="section-heading">
          <div>
            <h2>好信息，从源头开始</h2>
            <p>{sourceCount} 个已启用来源，保留每一条原始出处。</p>
          </div>
          <a className="text-link" href="#settings">
            管理信息源
            <Settings2 size={15} />
          </a>
        </div>
        <div className="source-shelf">
          {data.sources.slice(0, 4).map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className={`source-icon ${source.kind}`}>
                {source.kind === "github" ? (
                  <Github size={21} />
                ) : source.kind === "rss" ? (
                  <Rss size={21} />
                ) : (
                  <Radio size={21} />
                )}
              </span>
              <div>
                <strong>{source.name}</strong>
                <small>
                  <span
                    className={`status-dot ${source.status === "error" ? "error" : source.status === "ok" && !demo ? "" : "pending"}`}
                  />
                  {!source.enabled
                    ? "已停用"
                    : demo
                      ? "示例来源"
                      : source.status === "ok"
                        ? `已采集 ${source.count || 0} 条`
                        : source.status === "error"
                          ? "采集失败"
                          : source.status === "empty"
                            ? "暂无新内容"
                            : "等待采集"}
                </small>
              </div>
              <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
        {!data.sources.length && (
          <p className="source-empty">
            尚未加载来源记录。
            <a href="#settings">
              查看信息源配置
              <ArrowUpRight size={14} />
            </a>
          </p>
        )}
      </section>
      <div className="bottom-strip">
        <span>
          <CheckCheck size={16} />
          每一条信息，都有来源可循。
        </span>
        <span>保持好奇，持续知更。</span>
      </div>
    </>
  );
}

function LayersIcon() {
  return <FileSearch size={19} />;
}

function Calendar({
  dates,
  onSelect,
}: {
  dates: string[];
  onSelect: (date: string) => void;
}) {
  const initial = dates[0] ? new Date(dates[0] + "T12:00:00") : new Date();
  const [month, setMonth] = useState(
    new Date(initial.getFullYear(), initial.getMonth(), 1),
  );
  const start = (month.getDay() + 6) % 7;
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const available = new Set(dates);
  const today = new Date().toLocaleDateString("sv-SE");
  const change = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  return (
    <section className="calendar" aria-label="日报日历">
      <div className="calendar-title">
        <button
          className="icon-button"
          onClick={() => change(-1)}
          aria-label="上个月"
        >
          <ChevronLeft size={15} />
        </button>
        <h3>
          {month.getFullYear()} 年 {month.getMonth() + 1} 月
        </h3>
        <button
          className="icon-button"
          onClick={() => change(1)}
          aria-label="下个月"
        >
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="calendar-grid">
        {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
          <span className="weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: start }, (_, i) => (
          <span key={`space-${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const day = i + 1;
          const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return (
            <button
              key={date}
              disabled={!available.has(date)}
              className={`${available.has(date) ? "has-digest" : ""} ${date === today ? "today" : ""}`}
              onClick={() => onSelect(date)}
              aria-label={`${date}${available.has(date) ? "，阅读日报" : "，暂无日报"}`}
            >
              {day}
              {available.has(date) && <span />}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span>
          <i />
          有日报
        </span>
        <span>
          <i />
          今天
        </span>
        <span>点击日期阅读</span>
      </div>
    </section>
  );
}

function ReportCard({
  doc,
  index,
  onOpen,
}: {
  doc: Document;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button className="report-card" onClick={onOpen}>
      <div className={`report-cover cover-${index % 2}`}>
        <FileSearch size={23} strokeWidth={1.5} />
        <span>{doc.mode === "demo" ? "示例报告" : "深度调研"}</span>
        <ArrowUpRight size={19} />
      </div>
      <div className="report-info">
        <div className="report-meta">
          <span>
            <FileText size={12} />
            {doc.topic ? "专题研究" : "技术观察"}
          </span>
          <span>{dateText(doc.date)}</span>
        </div>
        <h3>{doc.title}</h3>
        <p>{doc.summary}</p>
        <div className="report-bottom">
          <span>{doc.sourceCount} 份参考资料</span>
          <span>
            阅读报告
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}

function Daily({
  data,
  onOpen,
}: {
  data: Data;
  onOpen: (doc: Document) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [view, setView] = useState<"digest" | "feed">("digest");
  const edition = selectedDate
    ? data.digests.find((d) => d.date === selectedDate)
    : data.digests[0];
  const items = (
    selectedDate
      ? data.items.filter((i) => edition?.itemIds?.includes(i.id))
      : data.items.filter((i) => data.digests[0]?.itemIds?.includes(i.id))
  ).filter((i) => filter === "all" || i.kind === filter);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            每日 AI 日报<span className="heading-dot">.</span>
          </h1>
          <p>关注创造者，发现新趋势。你的每日 AI 阅读清单。</p>
        </div>
        <a
          className="button secondary"
          href={`${repoUrl}/actions/workflows/daily.yml`}
          target="_blank"
          rel="noreferrer"
        >
          <Github size={15} />
          运行采集
        </a>
      </div>
      <div className="daily-layout">
        <div>
          <div className="view-tabs" role="tablist" aria-label="日报视图">
            <button
              role="tab"
              aria-selected={view === "digest"}
              onClick={() => setView("digest")}
            >
              <FileText size={15} />
              日报归档<span>{data.digests.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={view === "feed"}
              onClick={() => setView("feed")}
            >
              <Radio size={15} />
              信息源动态
            </button>
          </div>
          {view === "digest" ? (
            <div className="archive-list">
              {data.digests
                .filter((d) => !selectedDate || d.date === selectedDate)
                .map((d) => (
                  <button
                    className="digest-card"
                    key={d.id}
                    onClick={() => onOpen(d)}
                  >
                    <div className="digest-meta">
                      <Mode mode={d.mode} />
                      <span>{dateText(d.date, true)}</span>
                      <span>{d.itemCount || 0} 条信息</span>
                    </div>
                    <div className="digest-title">
                      <h3>{d.title}</h3>
                      <ChevronRight size={18} />
                    </div>
                    <p>{d.summary}</p>
                  </button>
                ))}
              {!data.digests.length && (
                <Empty title="还没有日报">
                  运行 Daily Digest 工作流开始采集。
                </Empty>
              )}
            </div>
          ) : (
            <>
              <div className="filter-row">
                {Object.entries(sourceLabels).map(([key, value]) => (
                  <button
                    className={filter === key ? "selected" : ""}
                    onClick={() => setFilter(key)}
                    key={key}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="feed-list">
                {items.map((item) => (
                  <FeedItem key={item.id} item={item} />
                ))}
                {!items.length && (
                  <Empty title="暂无这类动态">
                    试试其他来源，或在下次采集后查看。
                  </Empty>
                )}
              </div>
            </>
          )}
        </div>
        <aside>
          <Calendar
            dates={data.digests.map((d) => d.date)}
            onSelect={setSelectedDate}
          />
          {selectedDate && (
            <button
              className="clear-filter"
              onClick={() => setSelectedDate("")}
            >
              已选 {dateText(selectedDate)} · 清除筛选
              <X size={13} />
            </button>
          )}
          <div className="aside-panel">
            <h3>你的每日信息地图</h3>
            <p>
              Builder 的一手观点、正在流行的开源项目，以及你关心的订阅更新。
            </p>
            <a href="#settings" className="text-link">
              查看信息源
              <ChevronRight size={14} />
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

function FeedItem({ item }: { item: Item }) {
  return (
    <article className="feed-card">
      <div className="feed-avatar">
        {item.kind === "github" ? (
          <Github size={20} />
        ) : item.kind === "rss" ? (
          <Rss size={20} />
        ) : (
          item.author.slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="feed-body">
        <div className="feed-meta">
          <strong>{item.author || item.source}</strong>
          <span>{item.handle ? "@" + item.handle : item.source}</span>
          {item.publishedAt && <time>{dateText(item.publishedAt)}</time>}
        </div>
        <a
          className="feed-title"
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          {item.title}
          <ArrowUpRight size={15} />
        </a>
        <p>{item.excerpt}</p>
        <div className="feed-bottom">
          <span>{item.source}</span>
          {item.language && (
            <span>
              <Code2 size={12} />
              {item.language}
            </span>
          )}
          {item.likes !== undefined && (
            <span>{item.likes.toLocaleString()} 次喜欢</span>
          )}
          {item.stars && <span>{item.stars} stars</span>}
          <a href={item.url} target="_blank" rel="noreferrer">
            查看原文
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  );
}

function Research({
  data,
  onOpen,
}: {
  data: Data;
  onOpen: (doc: Document) => void;
}) {
  const [query, setQuery] = useState("");
  const reports = data.reports.filter((r) =>
    (r.title + r.summary).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            深度调研<span className="heading-dot">.</span>
          </h1>
          <p>把一个好问题，变成一份有依据的答案。</p>
        </div>
        <a className="button" href="#new">
          <Plus size={16} />
          发起调研
        </a>
      </div>
      <div className="report-toolbar">
        <span>{data.reports.length} 份研究沉淀</span>
        <label className="inline-search">
          <Search size={16} />
          <input
            aria-label="筛选调研报告"
            placeholder="搜索研究主题…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="research-grid all-research">
        {reports.map((r, i) => (
          <ReportCard doc={r} index={i} key={r.id} onOpen={() => onOpen(r)} />
        ))}
      </div>
      {!reports.length && (
        <Empty title={query ? "没有找到相关报告" : "让第一个好问题开始"}>
          {query ? "换个关键词试试。" : <a href="#new">发起一份深度调研</a>}
        </Empty>
      )}
      <div className="research-explainer">
        <BookOpen size={24} />
        <div>
          <h3>从阅读，到理解</h3>
          <p>
            提交主题与来源链接，知更会提取可用正文或字幕，交叉整理证据并标注引用。B
            站、YouTube、小红书、公众号均可作为资料来源；受限内容可补充转录或原文。
          </p>
        </div>
      </div>
    </>
  );
}

function Reader({ doc, onBack }: { doc: Document; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const markdown = `# ${doc.title}\n\n${doc.date} · ${doc.mode === "demo" ? "示例报告" : doc.mode === "ai" ? "AI 生成，需核验" : "原文汇编"}\n\n${doc.summary}\n\n${doc.content}\n\n## 参考资料\n\n${doc.references.map((r) => `- [${r.id}] ${r.title}${r.url ? ` — ${r.url}` : "（用户补充材料）"}`).join("\n")}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      download(`${doc.title}.md`, markdown);
    }
  };
  return (
    <>
      <div className="reader-topbar">
        <button className="back-button" onClick={onBack}>
          <ChevronLeft size={16} />
          返回列表
        </button>
        <div>
          <button className="button secondary small" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
            {copied ? "已复制" : "复制"}
          </button>
          <button
            className="button secondary small"
            onClick={() => download(`${doc.title}.md`, markdown)}
          >
            <Download size={14} />
            导出 Markdown
          </button>
        </div>
      </div>
      <article className="reader">
        <div className="reader-meta">
          <Mode mode={doc.mode} />
          <span>{dateText(doc.date, true)}</span>
          <span>{doc.sourceCount} 份资料</span>
          <span>
            <Clock3 size={13} />
            {Math.max(2, Math.ceil(doc.content.length / 500))} 分钟阅读
          </span>
        </div>
        <h1>{doc.title}</h1>
        <p className="reader-summary">{doc.summary}</p>
        {doc.mode === "demo" && (
          <div className="reader-notice">
            这是一份示例报告，用于展示内容结构与阅读体验。
          </div>
        )}
        {doc.mode === "collection" && (
          <div className="reader-notice">
            本期为来源原文汇编，尚未进行 AI 总结。配置 API
            密钥后可生成中文分析。
          </div>
        )}
        <div className="markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {doc.content}
          </ReactMarkdown>
        </div>
        {!!doc.failures?.length && (
          <section className="extraction-failures">
            <h2>资料读取限制</h2>
            {doc.failures.map((f, i) => (
              <p key={i}>
                {f.url && (
                  <a href={f.url} target="_blank" rel="noreferrer">
                    来源 {i + 1}
                  </a>
                )}{" "}
                {f.message}
              </p>
            ))}
          </section>
        )}
        <section className="references">
          <h2>参考资料</h2>
          {doc.references.map((ref) => (
            <div key={ref.id}>
              <span>{ref.id}</span>
              {ref.url ? (
                <a href={ref.url} target="_blank" rel="noreferrer">
                  {ref.title}
                  <ExternalLink size={13} />
                </a>
              ) : (
                <span>{ref.title}</span>
              )}
            </div>
          ))}
        </section>
        <p className="reader-disclaimer">
          {doc.mode === "ai"
            ? "本报告由 AI 基于所列资料生成。重要判断请核验原文，资料覆盖范围以引用及读取限制为准。"
            : "内容仅覆盖本次已采集的资料。来源观点不代表本站立场。"}
        </p>
      </article>
    </>
  );
}

function NewResearch() {
  const [topic, setTopic] = useState("");
  const [urls, setUrls] = useState("");
  const [notes, setNotes] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [issueUrl, setIssueUrl] = useState("");
  const [error, setError] = useState("");
  const task = {
    topic: topic.trim(),
    urls: urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean),
    notes,
    webSearch,
  };
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const links = task.urls;
    if (links.length > 8) {
      setError("最多提交 8 个来源链接。");
      return;
    }
    if (
      links.some((u) => {
        try {
          return !["https:", "http:"].includes(new URL(u).protocol);
        } catch {
          return true;
        }
      })
    ) {
      setError("请每行填写一个完整的 http/https 链接。");
      return;
    }
    if (!links.length && notes.trim().length < 100 && !webSearch) {
      setError("请至少添加一个来源链接、100 字原文，或启用联网检索。");
      return;
    }
    const body = `## 调研请求\n\n由知更网页创建。报告生成后会发布到深度调研页面。\n\n\`\`\`json\n${JSON.stringify(task, null, 2)}\n\`\`\``;
    const link = `${repoUrl}/issues/new?title=${encodeURIComponent("[Research] " + task.topic)}&body=${encodeURIComponent(body)}`;
    if (link.length > 7000) {
      setError(
        "资料较长，请下载任务 JSON，使用本地命令运行；或精简原文后提交 GitHub。",
      );
      return;
    }
    setIssueUrl(link);
  }
  return (
    <>
      <a href="#research" className="back-button">
        <ChevronLeft size={16} />
        返回深度调研
      </a>
      <div className="page-heading">
        <div>
          <h1>
            让好奇心，更进一步<span className="heading-dot">.</span>
          </h1>
          <p>从一个主题、一段视频或一篇文章开始。</p>
        </div>
      </div>
      <div className="new-research-layout">
        <form className="research-form" onSubmit={submit}>
          <label htmlFor="topic">
            你想研究什么？<span>必填</span>
          </label>
          <input
            id="topic"
            required
            minLength={2}
            maxLength={200}
            placeholder="例如：AI Agent 的记忆系统，应该怎么设计？"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setIssueUrl("");
            }}
          />
          <label htmlFor="urls">
            参考资料链接<span>每行一个，最多 8 个</span>
          </label>
          <textarea
            id="urls"
            rows={4}
            placeholder={
              "https://www.youtube.com/watch?v=…\nhttps://www.bilibili.com/video/…\n或文章、公众号、小红书链接"
            }
            value={urls}
            onChange={(e) => {
              setUrls(e.target.value);
              setIssueUrl("");
            }}
          />
          <label htmlFor="notes">
            补充原文与关注点<span>选填，最多 30,000 字符</span>
          </label>
          <textarea
            id="notes"
            rows={6}
            maxLength={30000}
            placeholder="粘贴无法公开读取的正文、视频字幕或转录；也可以说明希望重点比较的问题。"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setIssueUrl("");
            }}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={webSearch}
              onChange={(e) => {
                setWebSearch(e.target.checked);
                setIssueUrl("");
              }}
            />
            <span>
              联网检索，补充交叉验证资料
              <small>需要在仓库中配置 TAVILY_API_KEY</small>
            </span>
          </label>
          <div className="form-note">
            <Github size={16} />
            <p>
              下一步会创建 GitHub
              Issue。提交前请检查资料，任务和生成报告将在仓库及网页中公开；只有仓库所有者与协作者的请求会自动执行。
            </p>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button type="submit" className="button">
              <Sparkles size={16} />
              准备调研任务
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={topic.trim().length < 2}
              onClick={() =>
                download(
                  "research-task.json",
                  JSON.stringify(task, null, 2),
                  "application/json",
                )
              }
            >
              下载任务 JSON
            </button>
          </div>
          {issueUrl && (
            <div className="submit-ready" role="status">
              <CheckCheck size={23} />
              <div>
                <h3>任务已准备好</h3>
                <p>
                  在 GitHub 检查并提交 Issue，Actions
                  会开始研究。完成后报告会自动发布。
                </p>
                <a
                  className="button small"
                  href={issueUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  到 GitHub 提交
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}
        </form>
        <aside className="research-guide">
          <div className="guide-mark">
            <Sparkles size={23} />
          </div>
          <h2>一份研究，如何诞生</h2>
          <ol>
            <li>
              <strong>读取资料</strong>
              <p>提取公开文章与可用字幕，保留原始来源。</p>
            </li>
            <li>
              <strong>梳理与验证</strong>
              <p>围绕你的问题整理证据，区分事实、推断与未知。</p>
            </li>
            <li>
              <strong>沉淀为报告</strong>
              <p>以清晰的结构呈现结论、局限和参考资料。</p>
            </li>
          </ol>
          <p className="guide-footnote">
            读取不到的来源会明确标注，不会被当作已读资料。
          </p>
        </aside>
      </div>
    </>
  );
}

function Settings({ data, demo }: { data: Data; demo: boolean }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [configError, setConfigError] = useState(false);
  useEffect(() => {
    fetch(`${base}sources.json`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((value) => setSources(value.sources))
      .catch(() => setConfigError(true));
  }, []);
  const sourceList = sources.length ? sources : data.sources;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            信息源与设置<span className="heading-dot">.</span>
          </h1>
          <p>让每天的信息收集，按你的节奏运行。</p>
        </div>
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="button secondary"
        >
          <Github size={16} />
          项目仓库
          <ExternalLink size={13} />
        </a>
      </div>
      <section className="settings-section">
        <div className="settings-title">
          <h2>信息源</h2>
          <p>配置保存在仓库中，每次提交后自动生效。</p>
        </div>
        <div className="source-table">
          <div className="source-table-head">
            <span>来源</span>
            <span>类型</span>
            <span>最近采集</span>
            <span>状态</span>
          </div>
          {sourceList.map((s) => {
            const status = data.sources.find((item) => item.id === s.id);
            return (
              <div className="source-table-row" key={s.id}>
                <div className="source-name">
                  <span className={`source-icon ${s.kind}`}>
                    {s.kind === "github" ? (
                      <Github size={18} />
                    ) : s.kind === "rss" ? (
                      <Rss size={18} />
                    ) : (
                      <Radio size={18} />
                    )}
                  </span>
                  <div>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.name}
                      <ExternalLink size={11} />
                    </a>
                    <small>{s.url.replace("https://", "")}</small>
                  </div>
                </div>
                <span>
                  {s.kind === "rss"
                    ? "RSS / Atom"
                    : s.kind === "github"
                      ? "开源趋势"
                      : "Builder 动态"}
                </span>
                <span
                  className={`source-status ${status?.status === "error" ? "failed" : ""}`}
                >
                  {!s.enabled
                    ? "已停用"
                    : demo || !status?.status
                      ? "等待首次采集"
                      : status.status === "ok"
                        ? `${status.count} 条 · 已更新`
                        : status.status === "empty"
                          ? "暂无新内容"
                          : "采集失败"}
                </span>
                <span className={`enabled-label ${s.enabled ? "enabled" : ""}`}>
                  {s.enabled ? "已启用" : "停用"}
                </span>
              </div>
            );
          })}
        </div>
        {configError && (
          <p className="form-error">信息源配置加载失败，请刷新或到仓库查看。</p>
        )}
        <div className="settings-actions">
          <a
            className="text-link"
            href={`${repoUrl}/edit/main/config/sources.json`}
            target="_blank"
            rel="noreferrer"
          >
            <Settings2 size={14} />
            编辑信息源
            <ExternalLink size={12} />
          </a>
          <button
            className="text-link"
            onClick={() =>
              download(
                "sources.json",
                JSON.stringify(
                  {
                    timezone: "Asia/Shanghai",
                    lookback_hours: 72,
                    max_items_per_source: 12,
                    sources: sourceList,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            <Download size={14} />
            导出配置
          </button>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-title">
          <h2>运行与生成</h2>
          <p>采集在 GitHub Actions 中执行，关闭网页也会继续运行。</p>
        </div>
        <div className="settings-detail">
          <div>
            <CalendarDays size={19} />
            <span>
              <strong>每日自动采集</strong>
              <small>北京时间 08:17 · GitHub 调度可能延迟</small>
            </span>
            <a
              href={`${repoUrl}/edit/main/.github/workflows/daily.yml`}
              target="_blank"
              rel="noreferrer"
            >
              修改时间
              <ExternalLink size={12} />
            </a>
          </div>
          <div>
            <Sparkles size={19} />
            <span>
              <strong>AI 生成</strong>
              <small>
                {demo
                  ? "尚未接入 · 请配置兼容 OpenAI 的服务"
                  : data.collection.aiEnabled
                    ? "采集运行时检测到 AI 密钥"
                    : "未配置 AI 密钥 · 目前提供原文汇编"}
              </small>
            </span>
            <a
              href={`${repoUrl}/settings/secrets/actions`}
              target="_blank"
              rel="noreferrer"
            >
              配置 Secrets
              <ExternalLink size={12} />
            </a>
          </div>
          <div>
            <Clock3 size={19} />
            <span>
              <strong>最近更新</strong>
              <small>
                {demo
                  ? "示例预览，尚未运行采集"
                  : data.updatedAt
                    ? new Date(data.updatedAt).toLocaleString("zh-CN")
                    : "尚未运行"}
                {data.collection.aiError && ` · ${data.collection.aiError}`}
              </small>
            </span>
            <a href={`${repoUrl}/actions`} target="_blank" rel="noreferrer">
              运行记录
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <a
          href={`${repoUrl}/actions/workflows/daily.yml`}
          target="_blank"
          rel="noreferrer"
          className="button secondary small"
        >
          <Zap size={14} />在 GitHub 运行采集
        </a>
      </section>
      <section className="setup-guide">
        <CircleHelp size={21} />
        <div>
          <h2>首次接入，只需要三步</h2>
          <ol>
            <li>
              仓库 Settings → Pages，将 Source 设为 <code>GitHub Actions</code>
              。
            </li>
            <li>
              在 Actions Secrets 添加 <code>OPENAI_API_KEY</code>。可选添加{" "}
              <code>OPENAI_BASE_URL</code>、<code>OPENAI_MODEL</code>
              ，以及联网检索用的 <code>TAVILY_API_KEY</code>。
            </li>
            <li>Actions → Daily Digest → Run workflow，生成第一份日报。</li>
          </ol>
          <p>
            密钥只由 Actions 读取，网页不会索取或保存密钥。未填写 AI
            密钥也可以采集和阅读来源原文。
          </p>
        </div>
      </section>
    </>
  );
}
export default App;
