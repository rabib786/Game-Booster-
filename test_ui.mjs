import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Use http://localhost:3000 to test frontend components alone
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  console.log("Testing Toggle Monitor...");
  await page.getByRole('tab', { name: 'Boost', exact: true }).click();
  await page.waitForTimeout(1000);

  const startButton = page.locator('button', { hasText: 'Start Monitor' });
  if (await startButton.isVisible()) {
     await startButton.click();
     console.log("Clicked Start Monitor.");
  }
  await page.waitForTimeout(2000);

  const stopButton = page.locator('button', { hasText: 'Stop Monitor' });
  if (await stopButton.isVisible()) {
     await stopButton.click();
     console.log("Clicked Stop Monitor.");
  }
  await page.waitForTimeout(2000);

  console.log("Logs output:");
  let logs = await page.locator('[role="log"]').allTextContents();
  console.log(logs);

  const sessionSummaryModal = page.locator('[aria-labelledby="summary-modal-title"]');
  console.log("Session Summary Modal visible:", await sessionSummaryModal.isVisible());
  if (await sessionSummaryModal.isVisible()) {
      console.log("Modal contents:", await sessionSummaryModal.textContent());
  }

  await browser.close();
})();
