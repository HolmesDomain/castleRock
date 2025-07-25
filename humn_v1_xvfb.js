// humn_v2_xvfb.js
import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";
import { createCursor } from "ghost-cursor";
import { spawn, execSync } from "child_process";
import { platform } from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
puppeteer.use(Stealth());

/* ---------- tiny Xvfb helper ---------- */
let xvfbProcess;
const ensureXvfb = () => {
  if (platform() !== "linux") return; // macOS / Windows – skip
  if (process.env.DISPLAY) return; // already have GUI

  try {
    // check if Xvfb is installed
    execSync("which Xvfb", { stdio: "ignore" });
    xvfbProcess = spawn("Xvfb", [":99", "-screen", "0", "1024x768x24"], {
      stdio: "inherit",
    });
    process.env.DISPLAY = ":99";
    console.log("🖥️  Started Xvfb on :99");
  } catch {
    console.warn("⚠️  Xvfb not found; install with 'sudo apt install xvfb'");
  }
};

/* ---------- graceful cleanup ---------- */
process.on("exit", () => xvfbProcess?.kill());
process.on("SIGINT", () => xvfbProcess?.kill());

/* ---------- utilities ---------- */
const sleep = (min, max) =>
  new Promise((r) =>
    setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min),
  );
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- stealth browser ---------- */
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

export const createStealthBrowser = async () => {
  ensureXvfb(); // << 1-liner addition

  const viewport = getRandomViewport();
  const userAgent = getCurrentUserAgent();

  const browser = await puppeteer.launch({
    headless: false, // keep GUI → Xvfb hides it on Linux
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
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  await page.emulateTimezone("America/New_York");

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
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

/* ---------- CLI example ---------- */
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
      await simulateHumanActivity(page);
      console.log("✅ Done.");
    } catch (err) {
      console.error("❌", err.message);
    } finally {
      await browser.close();
    }
  })();
}
