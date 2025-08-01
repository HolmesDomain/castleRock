#!/usr/bin/env bun

// use_bot.js – Example script that uses the humn_mark1 bot with single browser reuse for efficiency

// Copy these from humn_mark1.js (or export them there and import here)
const proxy = {
  host: "proxy.soax.com",
  port: 5000,
  username: "package-307508-sessionid-7tMNBI9GBZmZ6yaI-sessionlength-300",
  password: "F7z92WUCQUo6vgGc",
};
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
const getRandomDevice = () => pick(deviceProfiles);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

import { createStealthBrowser, impressionSession } from "../humn_mark1.js";

// Get the number of sessions from command-line argument (default to 1 if not provided)
const numSessions = parseInt(process.argv[2]) || 1;
const targetUrl = "https://castle-rock.vercel.app/"; // Replace with your target URL

(async () => {
  console.log(`Starting ${numSessions} bot session(s) for URL: ${targetUrl}`);
  let browser = null; // Declare browser outside the loop

  try {
    // Launch a single stealth browser for all sessions (efficient reuse)
    const browserSetup = await createStealthBrowser();
    browser = browserSetup.browser; // We only need the browser here; we'll create pages inside the loop
    console.log("[LOG] Single browser instance launched for all sessions.");

    for (let i = 1; i <= numSessions; i++) {
      console.log(`\n--- Starting session ${i} of ${numSessions} ---`);
      let page = null;

      try {
        // Create a new page for this session
        page = await browser.newPage();
        console.log("[LOG] New page created for session.");

        // Reset page state for freshness and stealth
        await page.setCacheEnabled(false);
        await page.deleteCookie(...(await page.cookies()));
        console.log(
          "[LOG] Page state reset (cookies cleared, cache disabled).",
        );

        // Reapply page-specific configs (from createStealthBrowser logic)
        const device = getRandomDevice();
        const geo = pickGeo();
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
        await page.authenticate({
          username: proxy.username,
          password: proxy.password,
        });
        await page.setUserAgent(device.ua());
        await page.setViewport({ width: device.width, height: device.height });
        await page.setExtraHTTPHeaders({ "Accept-Language": geo.lang });
        await page.emulateTimezone(geo.tz);

        // Reapply fingerprint masking (evaluateOnNewDocument must be called before any navigation)
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
        console.log("[LOG] Page configs and fingerprint masking reapplied.");

        // Set up promise for ad response before goto
        console.log("[LOG] Waiting for ad script response...");
        const adResponsePromise = page.waitForResponse(
          (response) =>
            response.url().includes("ad.a-ads.com") &&
            response.status() === 200,
          { timeout: 30000 },
        );

        // Debug: Log ad-related responses
        page.on("response", (response) => {
          if (response.url().includes("ad.a-ads.com")) {
            console.log(
              `[DEBUG] Ad response: ${response.url()} - Status: ${response.status()}`,
            );
          }
        });

        // Navigate to the target URL
        await page.goto(targetUrl, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        console.log("Page loaded successfully.");

        // Await ad response
        await adResponsePromise;
        console.log("[LOG] Ad script response received.");

        // Run the impression session
        await impressionSession(page);
        console.log("Impression session completed.");
      } catch (error) {
        console.error(`Error during bot session ${i}:`, error.message);
      } finally {
        // Close the page (not the browser) to free resources
        if (page) {
          await page.close();
          console.log(`Session ${i} page closed.`);
        }
      }
    }
  } catch (error) {
    console.error("Error initializing browser:", error.message);
  } finally {
    // Close the single browser instance at the end
    if (browser) {
      await browser.close();
      console.log("Single browser instance closed.");
    } else {
      console.log("No browser to close.");
    }
  }

  console.log(`All ${numSessions} bot sessions completed.`);
})();
