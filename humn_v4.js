// humn_v4.js
// Full stealth bot with Crawlee integration for proxy rotation and diverse behavioral simulation
import { PuppeteerCrawler, ProxyConfiguration } from "crawlee";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { createCursor } from "ghost-cursor";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use Stealth plugin with puppeteer-extra
puppeteerExtra.use(StealthPlugin());

/* ---------- Tiny Helpers ---------- */
const sleep = (min, max) =>
  new Promise((r) =>
    setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min),
  );
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- Geo + Language + TZ Profiles ---------- */
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

/* ---------- Device + UA Profiles ---------- */
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

/* ---------- Proxy Pool ---------- */
const proxyPool = [
  {
    host: "89.58.45.94",
    port: 43476,
    username: "",
    password: "",
  },
  {
    host: "57.129.81.201",
    port: 8080,
    username: "",
    password: "",
  },
  {
    host: "20.27.14.220",
    port: 8561,
    username: "",
    password: "",
  },
  {
    host: "1.55.196.10",
    port: 16000,
    username: "",
    password: "",
  },
  {
    host: "116.107.175.128",
    port: 10003,
    username: "",
    password: "",
  },
];

/* ---------- Enhanced Human Activity Simulation ---------- */
const simulateHumanActivity = async (page) => {
  const cursor = createCursor(page);
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);

  // Initial cursor movement
  await cursor.move("body");
  await sleep(800, 2000);

  // Diverse scrolling with pauses and reversals
  await page.evaluate(async (maxY) => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    let y = 0;
    for (let i = 0; i < 15; i++) {
      const delta =
        Math.random() > 0.6 ? -pick([100, 200, 300]) : pick([150, 250, 400]);
      y += delta * (Math.random() * 1.5 + 0.5);
      y = Math.max(0, Math.min(y, maxY));
      window.scrollTo({ top: y, behavior: pick(["smooth", "auto"]) });
      if (Math.random() > 0.8) await delay(4000); // Occasional long pause
      await delay(Math.random() * 3000 + 1000);
    }
  }, scrollHeight);

  // Random click on non-ad elements (links or buttons)
  const clickableElements = await page.$$("a, button");
  if (clickableElements.length > 0 && Math.random() > 0.4) {
    const target = pick(clickableElements);
    try {
      await cursor.click(target);
      await sleep(1000, 3000);
    } catch (err) {
      console.warn("Non-critical click error:", err.message);
    }
  }

  // Random form interaction (if form exists)
  const inputFields = await page.$$("input[type='text'], textarea");
  if (inputFields.length > 0 && Math.random() > 0.6) {
    const target = pick(inputFields);
    try {
      await cursor.click(target);
      await page.keyboard.type(pick(["hello", "search", "test", "info"]), {
        delay: pick([50, 100, 150]),
      });
      await sleep(1000, 2000);
    } catch (err) {
      console.warn("Non-critical form interaction error:", err.message);
    }
  }

  // Random navigation to internal link
  const links = await page.$$("a[href^='/'], a[href^='./'], a[href^='#']");
  if (links.length > 0 && Math.random() > 0.3) {
    const targetLink = pick(links);
    try {
      const href = await page.evaluate((el) => el.href, targetLink);
      await page.goto(href, { waitUntil: "networkidle2", timeout: 20_000 });
      await sleep(5000, 10000);
    } catch (err) {
      console.warn("Non-critical navigation error:", err.message);
    }
  }

  await sleep(10000, 18000);
};

/* ---------- Impression Routine with Jitter ---------- */
const jitterSession = async (
  page,
  adSelector = 'iframe[data-aa="2404457"]',
  minDwell = 3000,
  maxDwell = 6000,
) => {
  const cursor = createCursor(page);
  await page.waitForSelector(adSelector, { timeout: 15_000 });

  // Scroll ad into viewport center
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

  // Hover + micro-wiggle
  await cursor.move(adSelector, { paddingPercentage: 15 });
  await sleep(200, 600);
  await cursor.move(adSelector, { paddingPercentage: pick([10, 20]) });
  await sleep(minDwell, maxDwell);

  // Secondary scroll (mimic “real read”)
  await page.evaluate(() => window.scrollBy(0, Math.random() * 120 + 60));
  await sleep(3000, 5000);
};

// Crawlee setup with Stealth and proxy rotation
const proxyConfiguration = new ProxyConfiguration({
  newUrlFunction: (sessionId, options) => {
    const proxy = pick(proxyPool);
    if (proxy.username && proxy.password) {
      return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    } else {
      return `http://${proxy.host}:${proxy.port}`;
    }
  },
});

const crawler = new PuppeteerCrawler({
  proxyConfiguration,
  launchContext: {
    launcher: puppeteerExtra,
    launchOptions: {
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-features=site-per-process,TranslateUI",
        "--disable-blink-features=AutomationControlled",
        "--disable-background-timer-throttling",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-dev-shm-usage",
      ],
    },
  },
  preNavigationHooks: [
    async ({ page }) => {
      // Fingerprint masking
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
    },
  ],
  requestHandler: async ({ page, request, log }) => {
    log.info(`Processing ${request.url}...`);

    const geo = rotateProfile();
    const device = getRandomDevice();
    await page.setUserAgent(device.ua());
    await page.setViewport({ width: device.w, height: device.h });
    await page.setExtraHTTPHeaders({ "Accept-Language": geo.lang });
    await page.emulateTimezone(geo.tz);

    await page.goto(request.url, {
      waitUntil: "networkidle2",
      timeout: 30_000,
    });
    await jitterSession(page, 'iframe[data-aa="2404102"]');
    await simulateHumanActivity(page);
  },
  failedRequestHandler: ({ request, log }) => {
    log.error(`Request ${request.url} failed too many times.`);
  },
});

const TARGET_URL =
  "https://castle-rock-84pq0v03i-holmesdomains-projects.vercel.app";
await crawler.run([{ url: TARGET_URL }]);

console.log("✅ Diverse impression session finished.");
