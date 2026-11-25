import test from "node:test";
import assert from "node:assert/strict";
import { isStandaloneApp, mobilePlatform, shouldShowInstallPrompt } from "../src/pages/AboutPage/installApp.js";

test("identifies Android, iPhone and iPad without treating desktop as mobile", () => {
  assert.equal(mobilePlatform("Mozilla/5.0 (Linux; Android 15; Pixel 9)"), "android");
  assert.equal(mobilePlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)"), "ios");
  assert.equal(mobilePlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X)", 5), "ios");
  assert.equal(mobilePlatform("Mozilla/5.0 (Windows NT 10.0)"), null);
});

test("does not offer the hint when opened as an app or after the user opted out", () => {
  const now = Date.now();
  assert.equal(isStandaloneApp(true, false), true);
  assert.equal(isStandaloneApp(false, true), true);
  assert.equal(shouldShowInstallPrompt({ platform: "android", standalone: false, installed: false, dismissedUntil: null, now }), true);
  assert.equal(shouldShowInstallPrompt({ platform: "ios", standalone: true, installed: false, dismissedUntil: null, now }), false);
  assert.equal(shouldShowInstallPrompt({ platform: "ios", standalone: false, installed: true, dismissedUntil: null, now }), false);
  assert.equal(shouldShowInstallPrompt({ platform: "ios", standalone: false, installed: false, dismissedUntil: now + 1000, now }), false);
  assert.equal(shouldShowInstallPrompt({ platform: "ios", standalone: false, installed: false, dismissedUntil: now - 1000, now }), true);
});
