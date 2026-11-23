import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // A stable first-run state keeps the reading and search checks independent
  // of whichever daily collection is currently published in the checkout.
  await page.route("**/data/index.json", (route) =>
    route.fulfill({
      json: {
        schemaVersion: 1,
        updatedAt: null,
        repository: "xiaoxiaoqing-win/ai-daily",
        collection: { status: "not_run", aiEnabled: false },
        sources: [],
        items: [],
        reports: [],
        digests: [],
      },
    }),
  );
});

test("no-new-items check is shown without inventing another daily edition", async ({
  page,
}) => {
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Shanghai",
  });
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(
    "sv-SE",
    { timeZone: "Asia/Shanghai" },
  );
  await page.route("**/data/index.json", (route) =>
    route.fulfill({
      json: {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        repository: "xiaoxiaoqing-win/ai-daily",
        collection: {
          status: "ok",
          aiEnabled: true,
          date: today,
          newItemCount: 0,
          duplicateCount: 12,
        },
        sources: [],
        items: [],
        reports: [],
        digests: [
          {
            id: "previous",
            date: yesterday,
            createdAt: yesterday + "T00:00:00Z",
            mode: "ai",
            title: "上一期日报",
            summary: "保留已有内容",
            content: "已有正文",
            sourceCount: 1,
            itemCount: 1,
            references: [],
          },
        ],
      },
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText(
    "本次采集暂无新增，未调用模型",
  );
  await expect(
    page.getByRole("heading", { name: "上一期日报", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("home, reading, archive, source filters and search", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "每天，知新一点。" }),
  ).toBeVisible();
  await expect(page.getByText("当前为示例预览。")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "从 Prompt 到 Harness：让 Agent 稳定交付的关键",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `.impeccable/review/${testInfo.project.name}-home.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", {
        name: "从 Prompt 到 Harness：让 Agent 稳定交付的关键",
      }),
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "今日观察", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "参考资料", exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 Markdown" }).click();
  expect((await downloadPromise).suggestedFilename()).toContain(".md");
  await page.getByRole("button", { name: "返回列表" }).click();
  await page.getByRole("tab", { name: "信息源动态" }).click();
  await page.getByRole("button", { name: "开源趋势", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "开源项目将在这里展示" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "构建 Agent 时，验证应该成为工作流的一部分",
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "搜索日报与报告" }).click();
  await page
    .getByRole("textbox", { name: "搜索日报与调研报告" })
    .fill("操作系统");
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: "Agent 的操作系统" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Agent 的操作系统：从工具调用到系统架构",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `.impeccable/review/${testInfo.project.name}-reader.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});

test("research form prepares encoded GitHub task and settings show source configuration", async ({
  page,
}, testInfo) => {
  await page.goto("/#new");
  await page.getByLabel("你想研究什么？").fill("测试 Agent 记忆设计");
  await page.getByRole("button", { name: "准备调研任务" }).click();
  await expect(page.getByRole("alert")).toContainText("请至少添加一个来源链接");
  await page.getByLabel("参考资料链接").fill("https://example.com/article");
  await page.getByRole("button", { name: "准备调研任务" }).click();
  const target = page.getByRole("link", { name: "到 GitHub 提交" });
  await expect(target).toBeVisible();
  const url = new URL((await target.getAttribute("href"))!);
  expect(url.hostname).toBe("github.com");
  expect(url.searchParams.get("title")).toBe("[Research] 测试 Agent 记忆设计");
  expect(url.searchParams.get("body")).toContain("https://example.com/article");
  await page.screenshot({
    path: `.impeccable/review/${testInfo.project.name}-research.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/#settings");
  await expect(
    page.getByRole("heading", { name: "信息源与设置." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Follow Builders", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "编辑信息源" })).toHaveAttribute(
    "href",
    /edit\/main\/config\/sources.json/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `.impeccable/review/${testInfo.project.name}-settings.png`,
    fullPage: true,
    animations: "disabled",
  });
});

test("load failure has retry and unknown document has recovery", async ({
  page,
}) => {
  await page.route("**/data/index.json", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "加载遇到问题" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "重新加载" })).toBeVisible();
  await page.unroute("**/data/index.json");
  await page.getByRole("button", { name: "重新加载" }).click();
  await expect(
    page.getByRole("heading", { name: "每天，知新一点。" }),
  ).toBeVisible();
  await page.goto("/#read/missing");
  await expect(
    page.getByRole("heading", { name: "没有找到这篇内容" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "返回首页", exact: true }),
  ).toBeVisible();
});

test("published source collection replaces demonstration and keeps original-text label", async ({
  page,
}) => {
  await page.route("**/data/index.json", (route) =>
    route.fulfill({
      json: {
        schemaVersion: 1,
        updatedAt: "2026-11-22T00:17:00Z",
        repository: "xiaoxiaoqing-win/ai-daily",
        collection: {
          status: "ok",
          aiEnabled: false,
          message: "Test collection",
        },
        sources: [],
        items: [],
        reports: [],
        digests: [
          {
            id: "test-daily",
            date: "2026-11-22",
            createdAt: "2026-11-22T00:17:00Z",
            mode: "collection",
            title: "测试原文汇编",
            summary: "测试来源记录",
            content: "## 原始内容\n\n这是已采集的来源原文。",
            sourceCount: 1,
            itemCount: 1,
            references: [],
          },
        ],
      },
    }),
  );
  await page.goto("/");
  await expect(page.getByText("当前为示例预览。")).toHaveCount(0);
  await expect(page.getByText("原文汇编", { exact: true })).toBeVisible();
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", { name: "测试原文汇编", exact: true }),
    })
    .click();
  await expect(
    page.getByText("本期为来源原文汇编，尚未进行 AI 总结。"),
  ).toBeVisible();
});

test("search returns keyboard focus and mobile menu exposes expanded state", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "搜索日报与报告" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  if (testInfo.project.name === "mobile") {
    const menu = page.getByRole("button", { name: "展开导航" });
    await menu.click();
    await expect(
      page.getByRole("button", { name: "收起导航" }),
    ).toHaveAttribute("aria-expanded", "true");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "AI 日报", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "展开导航" }),
    ).toHaveAttribute("aria-expanded", "false");
  }
  await page.goto("/#read/%");
  await expect(
    page.getByRole("heading", { name: "没有找到这篇内容" }),
  ).toBeVisible();
});

test("skip link preserves form values and reader route while moving keyboard focus", async ({
  page,
}) => {
  await page.goto("/#new");
  await page.getByLabel("你想研究什么？").fill("Agent 记忆设计");
  const skip = page.getByRole("link", { name: "跳到正文" });
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#new$/);
  await expect(page.getByLabel("你想研究什么？")).toHaveValue("Agent 记忆设计");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("main").getByRole("link", { name: "查看接入步骤" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "返回深度调研" })).toBeFocused();

  await page.goto("/");
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", {
        name: "从 Prompt 到 Harness：让 Agent 稳定交付的关键",
      }),
    })
    .click();
  const readerUrl = page.url();
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(readerUrl);
  await expect(
    page.getByRole("heading", { name: "今日观察", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("main").getByRole("link", { name: "查看接入步骤" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "返回列表" })).toBeFocused();
});
