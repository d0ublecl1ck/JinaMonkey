// ==UserScript==
// @name         Jina Reader: Page to Markdown
// @namespace    https://jina.ai/reader
// @version      0.1.0
// @description  Convert current page to Markdown via r.jina.ai with optional API key, selector waits, and quick copy.
// @author       d0ublecl1ck
// @match        http://*/*
// @match        https://*/*
// @grant        GM_openInTab
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @connect      r.jina.ai
// ==/UserScript==

(function () {
  "use strict";

  const DEFAULTS = {
    apiKey: "",
    respondWith: "markdown", // markdown | html | text | screenshot
    waitForSelector: "",
    targetSelector: "",
    cacheToleranceSeconds: "",
    noCache: false,
    openInNewTab: true,
    autoCopy: false,
    hotkey: "Alt+J",
  };

  function getConfig() {
    return {
      apiKey: GM_getValue("apiKey", DEFAULTS.apiKey),
      respondWith: GM_getValue("respondWith", DEFAULTS.respondWith),
      waitForSelector: GM_getValue("waitForSelector", DEFAULTS.waitForSelector),
      targetSelector: GM_getValue("targetSelector", DEFAULTS.targetSelector),
      cacheToleranceSeconds: GM_getValue(
        "cacheToleranceSeconds",
        DEFAULTS.cacheToleranceSeconds
      ),
      noCache: GM_getValue("noCache", DEFAULTS.noCache),
      openInNewTab: GM_getValue("openInNewTab", DEFAULTS.openInNewTab),
      autoCopy: GM_getValue("autoCopy", DEFAULTS.autoCopy),
      hotkey: GM_getValue("hotkey", DEFAULTS.hotkey),
    };
  }

  function setConfig(patch) {
    Object.keys(patch).forEach((key) => GM_setValue(key, patch[key]));
  }

  function promptAndSet(label, key, currentValue, transform) {
    const input = window.prompt(`${label} (current: ${currentValue || "empty"})`, currentValue || "");
    if (input === null) return;
    const value = transform ? transform(input) : input;
    setConfig({ [key]: value });
  }

  function buildHeaders(config) {
    const headers = {};
    if (config.respondWith) headers["x-respond-with"] = config.respondWith;
    if (config.waitForSelector) headers["x-wait-for-selector"] = config.waitForSelector;
    if (config.targetSelector) headers["x-target-selector"] = config.targetSelector;
    if (config.cacheToleranceSeconds !== "") {
      headers["x-cache-tolerance"] = String(config.cacheToleranceSeconds);
    }
    if (config.noCache) headers["x-no-cache"] = "true";
    if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
    return headers;
  }

  function buildReaderUrl(pageUrl) {
    return `https://r.jina.ai/${pageUrl}`;
  }

  function openResult(text, config) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    if (config.openInNewTab) {
      GM_openInTab(url, { active: true, insert: true });
    } else {
      window.location.href = url;
    }
  }

  function openHelp() {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Jina Reader: Help</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; line-height: 1.6; color: #111; }
    h1 { margin: 0 0 12px; font-size: 22px; }
    h2 { margin: 24px 0 8px; font-size: 16px; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
    ul { padding-left: 18px; }
    .muted { color: #6b7280; }
  </style>
</head>
<body>
  <h1>Jina Reader: Page to Markdown</h1>
  <p class="muted">Tampermonkey userscript</p>
  <h2>English</h2>
  <ul>
    <li><b>Convert page now</b>: send current page to Jina Reader and open Markdown.</li>
    <li><b>Set API Key</b>: set your API key to increase rate limits.</li>
    <li><b>respondWith</b>: choose <code>markdown</code> / <code>html</code> / <code>text</code> / <code>screenshot</code>.</li>
    <li><b>waitForSelector</b>: wait for a selector before fetching (dynamic pages).</li>
    <li><b>targetSelector</b>: extract only the target element.</li>
    <li><b>cacheToleranceSeconds</b>: allow cached result within N seconds.</li>
    <li><b>noCache</b>: force fresh fetch.</li>
    <li><b>openInNewTab</b>: open result in a new tab.</li>
    <li><b>autoCopy</b>: copy result to clipboard automatically.</li>
    <li><b>hotkey</b>: set the hotkey (default <code>Alt+J</code>).</li>
  </ul>
  <h2>中文说明</h2>
  <ul>
    <li><b>Convert page now</b>：立即转换当前页面并打开 Markdown。</li>
    <li><b>Set API Key</b>：设置 API Key 提升速率限制。</li>
    <li><b>respondWith</b>：返回格式 <code>markdown</code> / <code>html</code> / <code>text</code> / <code>screenshot</code>。</li>
    <li><b>waitForSelector</b>：等待选择器出现再抓取（动态页面）。</li>
    <li><b>targetSelector</b>：只提取指定元素。</li>
    <li><b>cacheToleranceSeconds</b>：允许使用 N 秒内缓存结果。</li>
    <li><b>noCache</b>：强制不使用缓存。</li>
    <li><b>openInNewTab</b>：新标签打开结果。</li>
    <li><b>autoCopy</b>：自动复制到剪贴板。</li>
    <li><b>hotkey</b>：设置快捷键（默认 <code>Alt+J</code>）。</li>
  </ul>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    GM_openInTab(url, { active: true, insert: true });
  }

  function showToast(message, type) {
    const existing = document.getElementById("jina-reader-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "jina-reader-toast";
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.zIndex = "2147483647";
    toast.style.right = "16px";
    toast.style.bottom = "16px";
    toast.style.maxWidth = "360px";
    toast.style.padding = "10px 12px";
    toast.style.borderRadius = "10px";
    toast.style.fontSize = "13px";
    toast.style.lineHeight = "1.4";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.18)";
    toast.style.color = "#fff";
    toast.style.background =
      type === "error" ? "rgba(220, 38, 38, 0.92)" : "rgba(17, 24, 39, 0.92)";
    toast.style.backdropFilter = "blur(6px)";
    toast.style.webkitBackdropFilter = "blur(6px)";
    toast.style.transition = "opacity 200ms ease, transform 200ms ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    document.documentElement.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      window.setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  function fetchMarkdown() {
    const config = getConfig();
    const readerUrl = buildReaderUrl(window.location.href);
    const headers = buildHeaders(config);

    showToast("Jina Reader 正在获取页面内容，请稍等约 10 秒...");

    GM_xmlhttpRequest({
      method: "GET",
      url: readerUrl,
      headers,
      onload: (response) => {
        const text = response.responseText || "";
        if (config.autoCopy) GM_setClipboard(text, "text");
        openResult(text, config);
      },
      onerror: (error) => {
        const status = error && error.status ? ` (status: ${error.status})` : "";
        showToast(`Jina Reader 请求失败${status}，请检查网络或 API Key。`, "error");
      },
    });
  }

  function parseHotkey(hotkey) {
    const parts = hotkey.split("+").map((p) => p.trim().toLowerCase());
    return {
      alt: parts.includes("alt"),
      ctrl: parts.includes("ctrl") || parts.includes("control"),
      shift: parts.includes("shift"),
      meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("command"),
      key: parts[parts.length - 1],
    };
  }

  function matchesHotkey(event, hotkey) {
    const parsed = parseHotkey(hotkey);
    const key = event.key ? event.key.toLowerCase() : "";
    const code = event.code ? event.code.toLowerCase() : "";
    const codeKey =
      parsed.key.length === 1 ? `key${parsed.key}` : parsed.key;
    return (
      event.altKey === parsed.alt &&
      event.ctrlKey === parsed.ctrl &&
      event.shiftKey === parsed.shift &&
      event.metaKey === parsed.meta &&
      (key === parsed.key || code === codeKey)
    );
  }

  function registerMenu() {
    GM_registerMenuCommand("Jina Reader: Convert page now", fetchMarkdown);
    GM_registerMenuCommand("Jina Reader: Help (EN/中文)", openHelp);
    GM_registerMenuCommand("Jina Reader: Set API Key", () =>
      promptAndSet("API Key", "apiKey", getConfig().apiKey)
    );
    GM_registerMenuCommand("Jina Reader: Set respondWith (markdown/html/text/screenshot)", () =>
      promptAndSet("respondWith", "respondWith", getConfig().respondWith)
    );
    GM_registerMenuCommand("Jina Reader: Set waitForSelector", () =>
      promptAndSet("waitForSelector", "waitForSelector", getConfig().waitForSelector)
    );
    GM_registerMenuCommand("Jina Reader: Set targetSelector", () =>
      promptAndSet("targetSelector", "targetSelector", getConfig().targetSelector)
    );
    GM_registerMenuCommand("Jina Reader: Set cacheToleranceSeconds", () =>
      promptAndSet(
        "cacheToleranceSeconds",
        "cacheToleranceSeconds",
        getConfig().cacheToleranceSeconds,
        (val) => val.replace(/[^\d]/g, "")
      )
    );
    GM_registerMenuCommand("Jina Reader: Toggle noCache", () =>
      setConfig({ noCache: !getConfig().noCache })
    );
    GM_registerMenuCommand("Jina Reader: Toggle openInNewTab", () =>
      setConfig({ openInNewTab: !getConfig().openInNewTab })
    );
    GM_registerMenuCommand("Jina Reader: Toggle autoCopy", () =>
      setConfig({ autoCopy: !getConfig().autoCopy })
    );
    GM_registerMenuCommand("Jina Reader: Set hotkey (default Alt+J)", () =>
      promptAndSet("hotkey", "hotkey", getConfig().hotkey)
    );
  }

  function registerHotkey() {
    window.addEventListener(
      "keydown",
      (event) => {
        if (matchesHotkey(event, getConfig().hotkey)) {
          event.preventDefault();
          fetchMarkdown();
        }
      },
      true
    );
  }

  registerMenu();
  registerHotkey();
})();
