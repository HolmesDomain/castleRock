// humn_v3_diverse_impression.js
// full stealth bot with geo, device, UA, viewport, proxy, and impression spoofing
import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";
import { createCursor } from "ghost-cursor";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
puppeteer.use(Stealth());

/* ---------- tiny helpers ---------- */
const sleep = (min, max) =>
  new Promise((r) =>
    setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min),
  );
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- geo + language + TZ profiles ---------- */
const geoProfiles = [
  { cc: "US", lang: "en-US,en;q=0.9", tz: "America/New_York" },
  { cc: "DE", lang: "de-DE,de;q=0.9", tz: "Europe/Berlin" },
  { cc: "JP", lang: "ja-JP,ja;q=0.9", tz: "Asia/Tokyo" },
  { cc: "BR", lang: "pt-BR,pt;q=0.9", tz: "America/Sao_Paulo" },
  { cc: "IN", lang: "en-IN,en;q=0.9", tz: "Asia/Kolkata" },
  { cc: "GB", lang: "en-GB,en;q=0.9", tz: "Europe/London" },
  { cc: "FR", lang: "fr-FR,fr;q=0.9", tz: "Europe/Paris" },
];
const rotateProfile = () => pick(geoProfiles);

/* ---------- device + UA profiles ---------- */
const deviceProfiles = [
  // Desktop
  {
    w: 1920,
    h: 1080,
    ua: () =>
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${pick(["122", "123", "124"])}.0.0.0 Safari/537.36`,
  },
  {
    w: 1366,
    h: 768,
    ua: () =>
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${pick(["122", "123", "124"])}.0.0.0 Edg/${pick(["122", "123", "124"])}.0.0.0`,
  },
  {
    w: 1440,
    h: 900,
    ua: () =>
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  },
  // Mobile
  {
    w: 390,
    h: 844,
    ua: () =>
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    w: 412,
    h: 915,
    ua: () =>
      `Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${pick(["122", "123", "124"])}.0.6367.60 Mobile Safari/537.36`,
  },
];
const getRandomDevice = () => pick(deviceProfiles);

/* ---------- proxy stub (drop in residential proxy list) ---------- */
const proxyRequest = () => {
  // return { host: '127.0.0.1', port: 9000 }; // swap for residential proxy
};

/* ---------- generic human scroll (kept for re-use) ---------- */
export const simulateHumanActivity = async (page) => {
  const cursor = createCursor(page);
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);

  await cursor.move("body");
  await sleep(800, 2000);

  await page.evaluate(async (maxY) => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    let y = 0;
    for (let i = 0; i < 12; i++) {
      const delta = Math.random() > 0.7 ? -200 : 200;
      y += delta * (Math.random() * 1.5 + 0.5);
      y = Math.max(0, Math.min(y, maxY));
      window.scrollTo({ top: y, behavior: "smooth" });
      await delay(Math.random() * 2500 + 1000);
    }
  }, scrollHeight);

  await sleep(12000, 20000);
};

/* ---------- impression routine with jitter ---------- */
export const jitterSession = async (
  page,
  adSelector = 'iframe[data-aa="2404457"]',
  minDwell = 3000,
  maxDwell = 6000,
) => {
  const cursor = createCursor(page);
  await page.waitForSelector(adSelector, { timeout: 15_000 });

  // scroll ad into viewport center
  const box = await page.$eval(adSelector, (el) => {
    const { top, height } = el.getBoundingClientRect();
    return { top, height };
  });
  const y = box.top + box.height / 2 - (Math.random() * 200 + 150);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "smooth" }),
    y,
  );
  await sleep(1200, 2500);

  // hover + micro-wiggle
  await cursor.move(adSelector, { paddingPercentage: 15 });
  await sleep(200, 600);
  await cursor.move(adSelector, { paddingPercentage: pick([10, 20]) });
  await sleep(minDwell, maxDwell);

  // secondary scroll (mimic “real read”)
  await page.evaluate(() => window.scrollBy(0, Math.random() * 120 + 60));
  await sleep(3000, 5000);
};

/* ---------- stealth browser (rotates everything) ---------- */
export const createStealthBrowser = async () => {
  const geo = rotateProfile();
  const device = getRandomDevice();
  const proxy = proxyRequest();

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: executablePath(),
    args: [
      `--window-size=${device.w},${device.h}`,
      ...(proxy ? [`--proxy-server=${proxy.host}:${proxy.port}`] : []),
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
  await page.setUserAgent(device.ua());
  await page.setViewport({ width: device.w, height: device.h });
  await page.setExtraHTTPHeaders({ "Accept-Language": geo.lang });
  await page.emulateTimezone(geo.tz);

  // fingerprint masking
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "languages", {
      get: () => [navigator.language || "en-US"],
    });
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        {
          0: { type: "application/pdf" },
          description: "Portable Document Format",
        },
      ],
    });
    Object.defineProperty(navigator, "hardwareConcurrency", {
      get: () => pick([2, 4, 6, 8, 12]),
    });
    Object.defineProperty(navigator, "deviceMemory", {
      get: () => pick([4, 8, 16]),
    });
    const gp = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (k) {
      if (k === 37445) return "Intel Inc.";
      if (k === 37446) return "Intel Iris OpenGL Engine";
      return gp.call(this, k);
    };
    const nativeToString = Function.prototype.toString;
    Function.prototype.toString = function () {
      if (this === navigator.webdriver)
        return "function webdriver() { [native code] }";
      return nativeToString.call(this);
    };
  });

  return { browser, page };
};

/* ---------- CLI ---------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  const TARGET_URL =
    "https://castle-rock-84pq0v03i-holmesdomains-projects.vercel.app";
  (async () => {
    const { browser, page } = await createStealthBrowser();
    try {
      console.log("🚀 Visiting:", TARGET_URL);
      await page.goto(TARGET_URL, {
        waitUntil: "networkidle2",
        timeout: 30_000,
      });
      await jitterSession(page, 'iframe[data-aa="2404102"]');
      console.log("✅ Diverse impression session finished.");
    } catch (err) {
      console.error("❌", err.message);
    } finally {
      await browser.close();
    }
  })();
}
