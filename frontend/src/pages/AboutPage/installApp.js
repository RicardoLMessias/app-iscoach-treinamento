export function mobilePlatform(userAgent, touchPoints = 0) {
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && touchPoints > 1)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return null;
}

export function isStandaloneApp(displayModeStandalone, navigatorStandalone) {
  return displayModeStandalone || navigatorStandalone === true;
}

export function shouldShowInstallPrompt({ platform, standalone, installed, dismissedUntil, now }) {
  return Boolean(platform && !standalone && !installed && (!dismissedUntil || dismissedUntil <= now));
}
