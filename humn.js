// stealth-bot.js
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";

// Apply stealth plugin
puppeteer.use(StealthPlugin());

// Generate random viewport sizes
const getRandomViewport = () => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1536, height: 864 },
  ];
  return viewports[Math.floor(Math.random() * viewports.length)];
};

// Get current Chrome user agent
const getCurrentUserAgent = () => {
  const chromeVersions = ["120.0.0.0", "121.0.0.0", "122.0.0.0", "123.0.0.0"];
  const version =
    chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
};

// Random delay function
const randomDelay = (min = 1000, max = 3000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min);
  });
};

const createStealthBrowser = async () => {
  const viewport = getRandomViewport();

  // Try to find system Chrome first, fall back to bundled Chromium
  let executablePath;
  try {
    // Common Chrome locations
    const chromePaths = [
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ];

    const fs = await import("fs");
    for (const path of chromePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        console.log(`Using system Chrome at: ${path}`);
        break;
      }
    }
  } catch (error) {
    console.log("Using bundled Chromium");
  }

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath, // Will be undefined if not found, causing Puppeteer to use bundled version
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=VizDisplayCompositor",
      "--disable-extensions",
      "--disable-plugins",
      "--disable-sync",
      "--disable-translate",
      "--disable-default-apps",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-features=BlockInsecurePrivateNetworkRequests",
      "--disable-features=VizDisplayCompositor,VizHitTestSurfaceLayer",
      "--disable-site-isolation-trials",
      "--disable-features=site-per-process",
      `--window-size=${viewport.width},${viewport.height}`,
      "--user-agent=" + getCurrentUserAgent(),
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    ignoreHTTPSErrors: true,
    timeout: 60000,
  });

  const page = await browser.newPage();

  // Set viewport
  await page.setViewport(viewport);

  // Increase timeouts
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  // Set additional headers
  await page.setExtraHTTPHeaders({
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    DNT: "1",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  });

  // Enhanced bot detection bypass
  await page.evaluateOnNewDocument(() => {
    // Pass webdriver test
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });

    // Pass chrome test
    window.chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    };

    // Pass plugins length test
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    // Pass languages test
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    // Enhanced anti-detection
    Object.defineProperty(navigator, "permissions", {
      get: () => ({
        query: () => Promise.resolve({ state: "granted" }),
      }),
    });

    // Mock realistic hardware
    Object.defineProperty(navigator, "hardwareConcurrency", {
      get: () => 4,
    });

    Object.defineProperty(navigator, "deviceMemory", {
      get: () => 8,
    });

    // Hide automation indicators
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

    // Override toString to hide function modifications
    const originalToString = Function.prototype.toString;
    Function.prototype.toString = function () {
      if (this === navigator.webdriver) {
        return "function webdriver() { [native code] }";
      }
      return originalToString.apply(this, arguments);
    };
  });

  return { browser, page };
};

// Test your site with comprehensive analysis
const analyzeCastleRockSite = async () => {
  console.log("Analyzing Castle Rock site...");
  let browser, page;

  try {
    console.log("Creating browser instance...");
    const browserInstance = await createStealthBrowser();
    browser = browserInstance.browser;
    page = browserInstance.page;

    const targetUrl =
      "https://castle-rock-84pq0v03i-holmesdomains-projects.vercel.app";
    console.log("Navigating to target site...");

    // Navigate to your site with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(targetUrl, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        console.log("Successfully loaded page");
        break;
      } catch (error) {
        retries--;
        console.log(`Navigation failed, retries left: ${retries}`);
        if (retries === 0) throw error;
        await randomDelay(2000, 4000);
      }
    }

    await randomDelay(2000, 4000);

    // Check if we're being blocked by Vercel bot protection
    const isBlocked = await page.evaluate(() => {
      return (
        document.title.includes("Login") ||
        document.title.includes("Vercel") ||
        window.location.href.includes("vercel.com/login") ||
        window.location.href.includes("sso-api")
      );
    });

    if (isBlocked) {
      console.log("🚫 FAILED: Vercel is still blocking access.");
      console.log(
        "   Please ensure bot protection is disabled in the Vercel dashboard.",
      );
      console.log("   URL:", await page.url());
      console.log("   Title:", await page.title());
      throw new Error("Access denied by Vercel bot protection.");
    } else {
      console.log("✅ Successfully accessed the site!");
    }

    // Take full page screenshot
    console.log("Taking screenshot...");
    await page.screenshot({
      path: "castle-rock-analysis.png",
      fullPage: true,
    });

    console.log("Screenshot saved as castle-rock-analysis.png");

    // Comprehensive site analysis
    const siteData = await page.evaluate(() => {
      // Extract all text content
      const allText = document.body.innerText;

      // Get all links
      const links = Array.from(document.querySelectorAll("a"))
        .map((a) => ({
          text: a.textContent.trim(),
          href: a.href,
          target: a.target,
        }))
        .filter((link) => link.text || link.href);

      // Get all images
      const images = Array.from(document.querySelectorAll("img")).map(
        (img) => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height,
        }),
      );

      // Get all forms
      const forms = Array.from(document.querySelectorAll("form")).map(
        (form) => ({
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll("input")).map((input) => ({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder,
          })),
        }),
      );

      // Get meta information
      const metaTags = Array.from(document.querySelectorAll("meta")).map(
        (meta) => ({
          name: meta.name,
          property: meta.property,
          content: meta.content,
        }),
      );

      // Check for any bot detection scripts
      const scripts = Array.from(document.querySelectorAll("script")).map(
        (script) => ({
          src: script.src,
          hasContent: !!script.textContent.trim(),
        }),
      );

      return {
        title: document.title,
        url: window.location.href,
        textLength: allText.length,
        wordCount: allText.split(/\s+/).length,
        links: links,
        images: images,
        forms: forms,
        metaTags: metaTags,
        scripts: scripts,
        bodyClasses: document.body.className,
        timestamp: new Date().toISOString(),
      };
    });

    console.log("Site Analysis Results:");
    console.log(`   Title: ${siteData.title}`);
    console.log(`   Text Length: ${siteData.textLength} characters`);
    console.log(`   Word Count: ${siteData.wordCount} words`);
    console.log(`   Links Found: ${siteData.links.length}`);
    console.log(`   Images Found: ${siteData.images.length}`);
    console.log(`   Forms Found: ${siteData.forms.length}`);
    console.log(`   Scripts Found: ${siteData.scripts.length}`);

    // Log interesting links
    if (siteData.links.length > 0) {
      console.log("\nLinks found:");
      siteData.links.slice(0, 10).forEach((link, i) => {
        console.log(`   ${i + 1}. ${link.text} -> ${link.href}`);
      });
    }

    // Test form interactions if any exist
    if (siteData.forms.length > 0) {
      console.log("\nTesting form interactions...");
      for (let i = 0; i < siteData.forms.length; i++) {
        const form = siteData.forms[i];
        console.log(`   Form ${i + 1}: ${form.method} ${form.action}`);

        // Try to interact with text inputs
        for (let input of form.inputs) {
          if (input.type === "text" || input.type === "email") {
            try {
              const selector = `input[name="${input.name}"]`;
              await page.type(selector, "test@example.com", { delay: 100 });
              console.log(`   SUCCESS: Successfully typed in ${input.name}`);
              await randomDelay(500, 1000);
            } catch (error) {
              console.log(`   FAILED: Could not interact with ${input.name}`);
            }
          }
        }
      }
    }

    return siteData;
  } catch (error) {
    console.error("ERROR: Error during site analysis:", error.message);
    console.error("Full error:", error);
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log("Browser closed successfully");
      } catch (closeError) {
        console.error("Error closing browser:", closeError.message);
      }
    }
  }
};

// Original stealth test (kept for comparison)
const testStealthiness = async () => {
  console.log("Testing stealth capabilities...");
  const { browser, page } = await createStealthBrowser();

  try {
    console.log("Testing bot detection...");

    // Test on bot detection site
    await page.goto("https://bot.sannysoft.com/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await randomDelay(2000, 4000);

    // Take screenshot for verification
    await page.screenshot({
      path: "stealth-test.png",
      fullPage: true,
    });

    console.log("Screenshot saved as stealth-test.png");

    // Check for bot detection indicators
    const results = await page.evaluate(() => {
      const webdriverResult = document.querySelector(
        "tr:nth-child(1) td:nth-child(2)",
      );
      const chromeResult = document.querySelector(
        "tr:nth-child(2) td:nth-child(2)",
      );

      return {
        webdriver: webdriverResult
          ? webdriverResult.textContent.trim()
          : "unknown",
        chrome: chromeResult ? chromeResult.textContent.trim() : "unknown",
      };
    });

    console.log("Detection Results:", results);
  } catch (error) {
    console.error("ERROR: Error during stealth test:", error.message);
  } finally {
    await browser.close();
  }
};

// Advanced scraping example with stealth
const stealthScrape = async (url, selector = null) => {
  console.log(`Scraping: ${url}`);
  const { browser, page } = await createStealthBrowser();

  try {
    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (
        resourceType === "stylesheet" ||
        resourceType === "image" ||
        resourceType === "font"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await randomDelay(1000, 3000);

    let data;
    if (selector) {
      // Wait for specific element and extract data
      await page.waitForSelector(selector, { timeout: 10000 });
      data = await page.$eval(selector, (el) => el.textContent.trim());
    } else {
      // Get page title and basic info
      data = {
        title: await page.title(),
        url: page.url(),
        timestamp: new Date().toISOString(),
      };
    }

    console.log("Scraped data:", data);
    return data;
  } catch (error) {
    console.error("ERROR: Scraping error:", error.message);
    return null;
  } finally {
    await browser.close();
  }
};

// Batch scraping with delays
const batchScrape = async (urls, delay = 5000) => {
  const results = [];

  for (let i = 0; i < urls.length; i++) {
    console.log(`Processing ${i + 1}/${urls.length}: ${urls[i]}`);

    const result = await stealthScrape(urls[i]);
    results.push(result);

    // Add delay between requests
    if (i < urls.length - 1) {
      console.log(`Waiting ${delay / 1000}s before next request...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
};

// Main execution
const main = async () => {
  try {
    // Analyze your Castle Rock site
    await analyzeCastleRockSite();

    // Optional: Test stealth capabilities
    // await testStealthiness();

    // Example: Scrape your site data
    // await stealthScrape('https://castle-rock-84pq0v03i-holmesdomains-projects.vercel.app');
  } catch (error) {
    console.error("FATAL: Main execution error:", error);
  }
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  createStealthBrowser,
  testStealthiness,
  stealthScrape,
  batchScrape,
  analyzeCastleRockSite,
};
