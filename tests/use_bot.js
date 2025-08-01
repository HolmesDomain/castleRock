#!/usr/bin/env bun

// use_bot.js – Example script that uses the humn_mark1 bot with parallel sessions for efficiency

// Copy these from humn_mark1.js (or export them there and import here)
const proxyBase = {
  host: "proxy.soax.com",
  port: 5000,
  username: "package-307508-sessionid-", // Base username; we'll append unique ID
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
const sleep = (min, max) =>
  new Promise((r) =>
    setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min),
  );

import { createStealthBrowser, impressionSession } from "../humn_mark1.js";
import plimit from "p-limit"; // Install via `bun add p-limit` for concurrency control

// Get args: numSessions from argv[2] (default 1), concurrency from argv[3] (default 3 for safety)
const numSessions = parseInt(process.argv[2]) || 1;
const concurrency = parseInt(process.argv[3]) || 3; // Lowered default to avoid rate limits
const targetUrl = "https://castle-rock.vercel.app/"; // Replace with your target URL

// Function to run a single session (now async, launches its own browser)
const runSession = async (sessionId) => {
  console.log(`\n--- Starting session ${sessionId} ---`);
  let browser = null;
  let page = null;

  try {
    // Stagger start with random delay to slow down and mimic natural traffic
    await sleep(1000, 5000); // 1-5 seconds delay
    console.log(`[LOG] Session ${sessionId} staggered delay completed.`);

    // Generate unique proxy session ID to avoid conflicts/detection in parallel runs
    const uniqueSessionId = `${Math.random().toString(36).substring(2, 15)}-sessionlength-300`;
    const uniqueProxy = {
      ...proxyBase,
      username: `${proxyBase.username}${uniqueSessionId}`,
    };
    console.log(`[LOG] Using unique proxy session ID: ${uniqueProxy.username}`);

    // Launch a dedicated browser for this session with unique proxy
    const browserSetup = await createStealthBrowser(uniqueProxy);
    browser = browserSetup.browser;
    page = browserSetup.page; // Use the initial page

    // Reset page state
    await page.setCacheEnabled(false);
    await page.deleteCookie(...(await page.cookies()));

    // Reapply configs (if not already in createStealthBrowser)
    const device = getRandomDevice();
    const geo = pickGeo();
    await page.setUserAgent(device.ua());
    await page.setViewport({ width: device.width, height: device.height });
    await page.setExtraHTTPHeaders({ "Accept-Language": geo.lang });
    await page.emulateTimezone(geo.tz);

    // Set up ad response promise
    console.log("[LOG] Waiting for ad script response...");
    const adResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("ad.a-ads.com") && response.status() === 200,
      { timeout: 30000 },
    );

    // Debug responses
    page.on("response", (response) => {
      if (response.url().includes("ad.a-ads.com")) {
        console.log(
          `[DEBUG] Ad response: ${response.url()} - Status: ${response.status()}`,
        );
      }
    });

    // Navigate
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 30000 });
    console.log("Page loaded successfully.");

    // Await ad
    await adResponsePromise;
    console.log("[LOG] Ad script response received.");

    // Impression with longer dwell time
    await impressionSession(page, undefined, 5000, 10000); // Increased to 5-10s
    console.log("Impression session completed.");
  } catch (error) {
    console.error(`Error in session ${sessionId}:`, error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log(`Session ${sessionId} ended.`);
    }
  }
};

(async () => {
  console.log(
    `Starting ${numSessions} bot session(s) for URL: ${targetUrl} with concurrency ${concurrency}`,
  );

  // Use p-limit to control concurrency
  const limit = plimit(concurrency);
  const sessionPromises = Array.from({ length: numSessions }, (_, i) =>
    limit(() => runSession(i + 1)),
  );

  // Run all sessions in parallel (limited by concurrency)
  await Promise.all(sessionPromises);

  console.log(`All ${numSessions} bot sessions completed.`);
})();
