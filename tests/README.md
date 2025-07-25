# Castle Rock Bot - Background Runner

Simple background bot that analyzes the Castle Rock site every 7 seconds.

## 🏆 Best Method: macOS Service (Survives laptop sleep!)

```bash
# Install as service (one time setup)
cp com.castlerock.bot.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.castlerock.bot.plist

# Check if running
launchctl list | grep castlerock

# View logs
tail -f logs/bot-service.log
```

**Stops/Starts service:**
```bash
# Stop
launchctl unload ~/Library/LaunchAgents/com.castlerock.bot.plist

# Start
launchctl load ~/Library/LaunchAgents/com.castlerock.bot.plist
```

## Quick & Dirty: nohup Method

```bash
# Run in background
nohup node tests/run-bot-test.js > bot.log 2>&1 &

# Stop it
pkill -f "node tests/run-bot-test.js"
```

## What It Does

- 🤖 Runs every 7 seconds like a bitcoin miner
- 📸 Takes screenshot of Castle Rock site  
- 💾 Saves as `tests/castle-rock-analysis.png`
- 🔄 Runs forever, survives laptop sleep (service method)

## Files

- `run-bot-test.js` - The bot runner script
- `castle-rock-analysis.png` - Latest screenshot
- `com.castlerock.bot.plist` - Service config
- `logs/bot-service.log` - Service logs

Simple and bulletproof! 🚀