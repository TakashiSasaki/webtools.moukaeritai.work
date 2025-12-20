# Android Intent Experiments: Successful Cases (2025-12)

This document records intent patterns and URI schemes that successfully launched external applications from Chrome on Android.

## 1. Custom & Standard URI Schemes
The most reliable method. These work across most devices and do not rely on complex `intent:` syntax.

### ✅ Messaging / Social Apps
*   **LINE**: `<a href="line://msg/text/Message">`
*   **Slack**: `<a href="slack://open">`
*   **Discord**: `discord://` (if supported) or HTTPS Links.

### ✅ Standard Tools
*   **Phone**: `<a href="tel:09012345678">`
*   **SMS**: `<a href="sms:?body=Message">`
*   **Mail**: `<a href="mailto:?subject=Test">`
*   **Maps (Geo)**: `<a href="geo:0,0?q=Tokyo+Tower">`
*   **Maps (Nav)**: `<a href="google.navigation:q=Tokyo+Tower">`

---

## 2. HTTPS App Links (Universal Links)
The modern standard. If the app is installed, it intercepts the URL; otherwise, it loads the webpage.

### ✅ YouTube
*   **Code**: `<a href="https://www.youtube.com/watch?v=...">`
*   **Code (Intent Fallback)**: `<a href="intent://www.youtube.com/watch?v=...#Intent;scheme=https;package=com.google.android.youtube;end">`
*   **Result**: Reliably opens the YouTube app.

### ✅ Discord
*   **Code**: `<a href="https://discord.com/app">`
*   **Result**: Reliably opens the Discord app via App Link.

### ⚠️ Google Chat (Conditional)
*   **Code**: `<a href="https://chat.google.com/">` or `<a href="https://mail.google.com/chat/u/0/">`
*   **Result**: May open the app, but often redirects to a "Install App" landing page in the browser. Unreliable as a direct app launcher.

---

## 3. Specific `intent:` Syntax (Conditional)

### ⚠️ Correct `tel:` Intent
*   **Code**: `intent://09012345678#Intent;scheme=tel;action=android.intent.action.DIAL;end`
*   **Result**: Opens the dialer. This works because the Dialer explicitly supports external intents.
*   **Note**: General "Package Launch" intents (`action=MAIN`) often fail to the Play Store on modern Android/Chrome. Use standard schemes instead.