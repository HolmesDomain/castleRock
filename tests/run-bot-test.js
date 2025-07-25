// castleRock/tests/run-bot-test.js
import { analyzeCastleRockSite } from "../humn.js"; // Assuming humn.js is in the parent directory

async function runBotTests() {
  const intervalMs = 7000; // 7 seconds
  let runCount = 0;

  console.log(
    "🤖 Castle Rock Bot starting - runs every 7 seconds like a bitcoin miner",
  );
  console.log("🛑 Press Ctrl+C to stop");

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log(`\n🛑 Bot stopped after ${runCount} runs`);
    process.exit(0);
  });

  // Infinite loop
  while (true) {
    runCount++;
    console.log(`\n--- Run #${runCount} at ${new Date().toISOString()} ---`);

    try {
      const result = await analyzeCastleRockSite();
      console.log(`✅ Run #${runCount} completed successfully`);
    } catch (error) {
      console.error(`❌ Run #${runCount} failed:`, error.message);
      console.error("Full error:", error);
    }

    console.log(`⏳ Waiting ${intervalMs / 1000} seconds before next run...`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

runBotTests();
