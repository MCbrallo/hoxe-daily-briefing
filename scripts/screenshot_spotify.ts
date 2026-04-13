import puppeteer from "puppeteer";
async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");
  await page.goto("https://open.spotify.com/search/Queen%20Bohemian%20Rhapsody/tracks", { waitUntil: "networkidle2" });
  await page.screenshot({ path: "artifacts/spotify_test.png" });
  await browser.close();
}
run();
