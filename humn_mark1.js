// humn_v2_diverse.js – stealth bot with geo, device, UA, & impression spoofing + SOAX proxy integration
import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";
import { createCursor } from "ghost-cursor";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
puppeteer.use(Stealth());

/* ---------- helpers ---------- */
const sleep = (min, max) =>
  new Promise((r) =>
    setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min),
  );
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- geo + language + TZ profiles ---------- */
const geoProfiles = [
  { country: "US", lang: "en-US,en;q=0.9", tz: "America/New_York" },
  { country: "DE", lang: "de-DE,de;q=0.9", tz: "Europe/Berlin" },
  { country: "JP", lang: "ja-JP,ja;q=0.9", tz: "Asia/Tokyo" },
  { country: "BR", lang: "pt-BR,pt;q=0.9", tz: "America/Sao_Paulo" },
  { country: "IN", lang: "en-IN,en;q=0.9", tz: "Asia/Kolkata" },
  { country: "GB", lang: "en-GB,en;q=0.9", tz: "Europe/London" },
  { country: "FR", lang: "fr-FR,fr;q=0.9", tz: "Europe/Paris" },
];
const pickGeo = () => pick(geoProfiles);

/* ---------- device + UA profiles ---------- */
const deviceProfiles = [
  // Desktop
  {
    width: 1920,
    height: 1080,
    ua: () =>
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${pick(["122", "123", "124"])}.0.0.0 Safari/537.36`,
  },
  {
    width: 1366,
    height: 768,
    ua: () =>
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${pick(["122", "123", "124"])}.0.0.0 Edg/${pick(["122", "123", "124"])}.0.0.0`,
  },
  {
    width: 1440,
    height: 900,
    ua: () =>
      `Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15`,
  },
  // Mobile
  {
    width: 390,
    height: 844,
    ua: () =>
      `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1`,
  },
  {
    width: 412,
    height: 915,
    ua: () =>
      `Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${pick(["122", "123", "124"])}.0.6367.60 Mobile Safari/537.36`,
  },
];

/* ---------- random viewport + UA generator ---------- */
const getRandomDevice = () => pick(deviceProfiles);

/* ---------- SOAX proxy config (updated credentials with session) ---------- */
const proxy = {
  host: "proxy.soax.com",
  port: 5000,
  username: "package-307508-sessionid-7tMNBI9GBZmZ6yaI-sessionlength-300",
  password: "F7z92WUCQUo6vgGc",
};

/* ---------- generic human scroll (optional) ---------- */
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

/* ---------- impression routine ---------- */
export const impressionSession = async (
  page,
  adSelector = 'iframe[data-aa="2404457"]',
  minDwell = 2000,
  maxDwell = 4000,
) => {
  const cursor = createCursor(page);

  await page.waitForSelector(adSelector, { timeout: 15_000 });

  const box = await page.$eval(adSelector, (el) => {
    const { top, height } = el.getBoundingClientRect();
    return { top, height };
  });
  const scrollTarget = box.top + box.height / 2 - 250;
  await page.evaluate(
    (tgt) => window.scrollTo({ top: tgt, behavior: "smooth" }),
    scrollTarget,
  );
  await sleep(1200, 2000);

  await cursor.move(adSelector, { paddingPercentage: 15 });
  await sleep(minDwell, maxDwell);

  await page.evaluate(() => window.scrollBy(0, Math.random() * 80 + 20));
  await sleep(4000, 7000);
};

/* ---------- stealth browser with proxy ---------- */
export const createStealthBrowser = async () => {
  const device = getRandomDevice();
  const geo = pickGeo();

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: executablePath(),
    args: [
      `--window-size=${device.width},${device.height}`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-features=site-per-process,TranslateUI",
      "--disable-blink-features=AutomationControlled",
      "--disable-background-timer-throttling",
      "--disable-extensions",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      `--proxy-server=http://${proxy.host}:${proxy.port}`, // SOAX proxy server (HTTP for mobile)
      "--ignore-certificate-errors",
      "--ignore-http-errors",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // Authenticate proxy (required for SOAX)
  await page.authenticate({
    username: proxy.username,
    password: proxy.password,
  });

  await page.setUserAgent(device.ua());
  await page.setViewport({ width: device.width, height: device.height });
  await page.setExtraHTTPHeaders({ "Accept-Language": geo.lang });
  await page.emulateTimezone(geo.tz);

  // fingerprints
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "languages", {
      get: () => (navigator.language || "en-US").split(","),
    });
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
    Object.defineProperty(navigator, "hardwareConcurrency", {
      get: () => pick([2, 4, 6, 8, 12]),
    });
    Object.defineProperty(navigator, "deviceMemory", {
      get: () => pick([4, 8, 16]),
    });
    const gp = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (p) {
      if (p === 37445) return "Intel Inc.";
      if (p === 37446) return "Intel Iris OpenGL Engine";
      return gp.apply(this, arguments);
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
      await impressionSession(page, 'iframe[data-aa="2403936"]');
      console.log("✅ Impression session finished.");
    } catch (err) {
      console.error("❌", err.message);
    } finally {
      await browser.close();
    }
  })();
}
