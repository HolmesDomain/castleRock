#!/usr/bin/env bun

// use_bot.js – Example script that uses the humn_mark1 bot
import { createStealthBrowser, impressionSession } from "../humn_mark1.js";

// Get the number of sessions from command-line argument (default to 1 if not provided)
const numSessions = parseInt(process.argv[2]) || 1;
const targetUrl = "https://castle-rock.vercel.app/"; // Replace with your target URL

(async () => {
  console.log(`Starting ${numSessions} bot session(s) for URL: ${targetUrl}`);

  for (let i = 1; i <= numSessions; i++) {
    console.log(`\n--- Starting session ${i} of ${numSessions} ---`);
    let browser = null; // Declare browser outside try block
    let page = null;

    try {
      // Launch a new stealth browser for each session
      ({ browser, page } = await createStealthBrowser());

      // NEW: Set up promise for ad response before goto
      console.log("[LOG] Waiting for ad script response...");
      const adResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("ad.a-ads.com") && response.status() === 200,
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
      // Clean up: Close browser if it exists
      if (browser) {
        await browser.close();
        console.log(`Bot session ${i} ended.`);
      } else {
        console.log(`Bot session ${i} ended (no browser to close).`);
      }
    }
  }

  console.log(`All ${numSessions} bot sessions completed.`);
})();
