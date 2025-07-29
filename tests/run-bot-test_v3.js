// castleRock/tests/run-bot-test.js
import { createStealthBrowser, jitterSession } from "../humn_v3.js";

const TARGET_URL =
  "https://castle-rock-84pq0v03i-holmesdomains-projects.vercel.app";
const AD_SELECTOR = 'iframe[data-aa="2404457"]';
const INTERVAL_MS = 7000;

let runCount = 0;

console.log("🤖 Castle Rock Bot starting – 7 s loop (Ctrl+C to stop)");

process.on("SIGINT", () => {
  console.log(`\n🛑 Bot stopped after ${runCount} runs`);
  process.exit(0);
});

while (true) {
  runCount++;
  console.log(`\n--- Run #${runCount} at ${new Date().toISOString()} ---`);

  try {
    const { browser, page } = await createStealthBrowser();
    await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: 30_000 });
    await jitterSession(page, AD_SELECTOR);
    console.log(`✅ Run #${runCount} completed successfully`);
    await browser.close();
  } catch (error) {
    console.error(`❌ Run #${runCount} failed:`, error.message);
  }

  console.log(`⏳ Waiting ${INTERVAL_MS / 1000} seconds…`);
  await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
}
