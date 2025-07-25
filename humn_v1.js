// humn_v2.js  —  stealth-bot on steroids
import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";
import { createCursor } from "ghost-cursor";
import { readFileSync } from "fs"; // only used for quick UA list
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ---------- 1.  utility helpers ---------- */
const sleep = (min, max) =>
  new Promise((r) =>
    setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min),
  );

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- 2.  viewport / UA ---------- */
const getRandomViewport = () =>
  pick([
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1536, height: 864 },
  ]);

const getCurrentUserAgent = () => {
  const versions = ["122.0.6261.94", "123.0.6312.86", "124.0.6367.60"];
  return (
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
    `(KHTML, like Gecko) Chrome/${pick(versions)} Safari/537.36`
  );
};

/* ---------- 3.  puppeteer plugins ---------- */
puppeteer.use(Stealth());

/* ---------- 4.  human-like activity ---------- */
const simulateHumanActivity = async (page) => {
  const cursor = createCursor(page);
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);

  // 4a. gentle mouse wiggle
  await cursor.move("body");
  await sleep(800, 2000);

  // 4b. realistic scroll (bi-directional + pauses)
  await page.evaluate(async (maxY) => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    let y = 0;
    for (let i = 0; i < 12; i++) {
      const delta = Math.random() > 0.7 ? -200 : 200; // 30 % chance to scroll up
      y += delta * (Math.random() * 1.5 + 0.5);
      y = Math.max(0, Math.min(y, maxY));
      window.scrollTo({ top: y, behavior: "smooth" });
      await delay(Math.random() * 2500 + 1000);
    }
  }, scrollHeight);

  // 4c. random idle
  await sleep(12000, 20000);
};

/* ---------- 5.  stealth browser factory ---------- */
export const createStealthBrowser = async () => {
  const viewport = getRandomViewport();
  const userAgent = getCurrentUserAgent();

  const browser = await puppeteer.launch({
    headless: "new", // ← flip to true / "new" if you have Xvfb
    executablePath: executablePath(),
    args: [
      `--window-size=${viewport.width},${viewport.height}`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-features=site-per-process,TranslateUI",
      "--disable-blink-features=AutomationControlled",
      "--disable-background-timer-throttling",
      "--disable-extensions",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  await page.setViewport(viewport);
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    // Referer removed – leaks fixed
  });
  await page.emulateTimezone("America/New_York");

  /* 5a. fingerprint patchwork */
  await page.evaluateOnNewDocument(() => {
    // webdriver
    Object.defineProperty(navigator, "webdriver", { get: () => false });

    // languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    // plugins (real-ish MIME array)
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        {
          0: { type: "application/pdf" },
          description: "Portable Document Format",
        },
        {
          0: { type: "application/x-google-chrome-pdf" },
          description: "Chrome PDF Plugin",
        },
      ],
    });

    // cpu / ram
    Object.defineProperty(navigator, "hardwareConcurrency", {
      get: () => pick([2, 4, 6, 8, 12]),
    });
    Object.defineProperty(navigator, "deviceMemory", {
      get: () => pick([4, 8, 16]),
    });

    // WebGL vendor
    const getParam = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (p) {
      if (p === 37445) return "Intel Inc.";
      if (p === 37446) return "Intel Iris OpenGL Engine";
      return getParam.apply(this, arguments);
    };

    // Function.toString masking
    const nativeToString = Function.prototype.toString;
    Function.prototype.toString = function () {
      if (this === navigator.webdriver)
        return "function webdriver() { [native code] }";
      return nativeToString.call(this);
    };
  });

  return { browser, page };
};

/* ---------- 6.  quick self-test (optional) ---------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  const TARGET_URL =
    "https://castle-rock-84pq0v03i-holmesdomains-projects.vercel.app";

  (async () => {
    const { browser, page } = await createStealthBrowser();
    try {
      console.log(`🚀 Visiting: ${TARGET_URL}`);
      await page.goto(TARGET_URL, {
        waitUntil: "networkidle2",
        timeout: 30_000,
      });
      await simulateHumanActivity(page);
      console.log("✅ Done — no obvious leaks.");
    } catch (err) {
      console.error("❌ Crash:", err.message);
    } finally {
      await browser.close();
    }
  })();
}
