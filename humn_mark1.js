// humn_v2_diverse.js – stealth bot with geo, device, UA, & impression spoofing + SOAX proxy integration
import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";
import { createCursor } from "ghost-cursor";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
puppeteer.use(Stealth());

/* ---------- Global Constants ---------- */
const AD_UNIT_ID = "2403936"; // Set your ad unit ID here

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
  console.log("[LOG] Starting human activity simulation...");
  const cursor = createCursor(page);
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log("[LOG] Scroll height:", scrollHeight);

  await cursor.move("body");
  await sleep(500, 1500); // Reduced for speed

  await page.evaluate(async (maxY) => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    let y = 0;
    for (let i = 0; i < 8; i++) {
      // Reduced loops
      const delta = Math.random() > 0.7 ? -200 : 200;
      y += delta * (Math.random() * 1.5 + 0.5);
      y = Math.max(0, Math.min(y, maxY));
      window.scrollTo({ top: y, behavior: "smooth" });
      await delay(Math.random() * 1500 + 500); // Reduced delays
    }
  }, scrollHeight);

  await sleep(8000, 12000); // Reduced overall
  console.log("[LOG] Human activity simulation completed.");
};

/* ---------- impression routine ---------- */
export const impressionSession = async (
  page,
  adSelector = `iframe[data-aa="${AD_UNIT_ID}"]`, // Use global ID
  minDwell = 1000,
  maxDwell = 2500, // Reduced for speed
) => {
  console.log("[LOG] Starting impression session...");

  // Removed waitForResponse here – it's now handled before/after goto in the CLI

  const cursor = createCursor(page);

  console.log("[LOG] Attempting to wait for iframe selector:", adSelector);
  let iframeElement;
  try {
    iframeElement = await page.waitForSelector(adSelector, { timeout: 30000 }); // Reduced from 45s
    console.log("[LOG] Iframe found.");
  } catch (err) {
    console.error("[LOG] Iframe timeout error:", err.message);
    const pageContent = await page.content();
    console.log("[LOG] Page HTML after load:", pageContent); // Debug full HTML
    // Fallback to general ad container (updated to match iframe style in your HTML logs)
    console.log("[LOG] Falling back to general ad container.");
    adSelector = 'iframe[style*="overflow: hidden"]'; // Targets the iframe directly based on HTML
    iframeElement = await page.$(adSelector); // Use $ for immediate query, no wait
    if (iframeElement) console.log("[LOG] Fallback selector found.");
  }

  if (iframeElement) {
    const box = await page.$eval(adSelector, (el) => {
      const { top, height } = el.getBoundingClientRect();
      return { top, height };
    });
    console.log("[LOG] Iframe bounding box:", box);

    const scrollTarget = box.top + box.height / 2 - 250;
    await page.evaluate(
      (tgt) => window.scrollTo({ top: tgt, behavior: "smooth" }),
      scrollTarget,
    );
    await sleep(800, 1500); // Reduced
    console.log("[LOG] Scrolled to ad.");

    await cursor.move(adSelector, { paddingPercentage: 15 });
    await sleep(minDwell, maxDwell);
    console.log("[LOG] Hovered over ad.");

    await page.evaluate(() => window.scrollBy(0, Math.random() * 80 + 20));
    await sleep(3000, 5000); // Reduced
    console.log("[LOG] Performed secondary scroll.");
  } else {
    console.log(
      "[LOG] No ad selector found; proceeding with page simulation (impression already counted).",
    );
    await simulateHumanActivity(page); // Run general simulation as fallback
  }

  console.log("[LOG] Impression session completed.");
};

/* ---------- stealth browser with proxy ---------- */
export const createStealthBrowser = async (customProxy = proxy) => {
  console.log(
    "[LOG] Creating stealth browser with proxy:",
    customProxy.username,
  );
  const device = getRandomDevice();
  console.log("[LOG] Selected device:", device);
  const geo = pickGeo();
  console.log("[LOG] Selected geo profile:", geo);

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
      `--proxy-server=http://${customProxy.host}:${customProxy.port}`, // Use customProxy
      "--ignore-certificate-errors",
      "--ignore-http-errors",
      "--disable-images", // Disable images for speed
      "--disable-gpu", // Optional for headless
      "--disable-background-networking", // Headless opt: disable background net
      "--disable-sync", // Headless opt: disable sync
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    defaultViewport: null,
  });
  console.log("[LOG] Browser launched.");

  const page = await browser.newPage();
  console.log("[LOG] New page created.");

  // Disable non-essential resources for speed
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (
      ["image", "stylesheet", "font", "media", "other"].includes(
        req.resourceType(),
      )
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
  console.log(
    "[LOG] Resource interception enabled (disabled images/CSS/fonts/media).",
  );

  // Authenticate proxy (required for SOAX)
  await page.authenticate({
    username: customProxy.username,
    password: customProxy.password,
  });
  console.log("[LOG] Proxy authenticated.");

  await page.setUserAgent(device.ua());
  console.log("[LOG] User agent set:", device.ua());

  await page.setViewport({ width: device.width, height: device.height });
  console.log("[LOG] Viewport set:", device.width, "x", device.height);

  await page.setExtraHTTPHeaders({ "Accept-Language": geo.lang });
  console.log("[LOG] Accept-Language header set:", geo.lang);

  await page.emulateTimezone(geo.tz);
  console.log("[LOG] Timezone emulated:", geo.tz);

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
  console.log("[LOG] Fingerprint masking applied.");

  return { browser, page };
};

/* ---------- CLI ---------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  const TARGET_URL = "https://castle-rock.vercel.app/";
  (async () => {
    const startTime = performance.now(); // Start timing
    const { browser, page } = await createStealthBrowser();
    try {
      console.log("🚀 Visiting:", TARGET_URL);

      // NEW: Set up promise for ad response before goto to catch it during load
      console.log("[LOG] Waiting for ad script response...");
      const adResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("ad.a-ads.com") && response.status() === 200,
        { timeout: 30000 }, // Increase to 45000 if proxy is slow
      );

      // Optional debug: Log all responses to track ad-related ones
      page.on("response", (response) => {
        if (response.url().includes("ad.a-ads.com")) {
          console.log(
            `[DEBUG] Ad response: ${response.url()} - Status: ${response.status()}`,
          );
        }
      });

      await page.goto(TARGET_URL, {
        waitUntil: "networkidle2",
        timeout: 30_000,
      });
      console.log("[LOG] Page loaded successfully.");

      // NEW: Await the ad response after goto (confirms it happened during load)
      await adResponsePromise;
      console.log("[LOG] Ad script response received.");

      const initialContent = await page.content();
      console.log("[LOG] Initial page HTML:", initialContent); // Debug HTML after load
      await impressionSession(page);
      console.log("✅ Impression session finished.");
    } catch (err) {
      console.error("❌", err.message);
    } finally {
      await browser.close();
      console.log("[LOG] Browser closed.");
      const endTime = performance.now();
      console.log(
        `Script Execution Time: ${(endTime - startTime).toFixed(2)}ms`,
      );
    }
  })();
}
