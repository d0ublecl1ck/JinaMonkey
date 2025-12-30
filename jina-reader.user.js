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

  function fetchMarkdown() {
    const config = getConfig();
    const readerUrl = buildReaderUrl(window.location.href);
    const headers = buildHeaders(config);

    window.alert("Jina Reader 正在获取页面内容，请稍等约 10 秒...");

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
        window.alert(`Jina Reader 请求失败${status}，请检查网络或 API Key。`);
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
    return (
      event.altKey === parsed.alt &&
      event.ctrlKey === parsed.ctrl &&
      event.shiftKey === parsed.shift &&
      event.metaKey === parsed.meta &&
      event.key.toLowerCase() === parsed.key
    );
  }

  function registerMenu() {
    GM_registerMenuCommand("Jina Reader: Convert page now", fetchMarkdown);
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
