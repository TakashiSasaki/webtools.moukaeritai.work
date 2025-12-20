# Android Intent Experiments: Successful Cases (2025-12)

This document records intent patterns and URI schemes that successfully launched external applications from Chrome on Android.

## 1. Standard URI Schemes
The most reliable method. These work across most devices and do not rely on complex `intent:` syntax.

### ✅ Phone / SMS / Mail
*   **Phone**: `<a href="tel:09012345678">`
*   **SMS**: `<a href="sms:?body=Message">` (Note: `?body=` is the standard, though support varies slightly).
*   **Mail**: `<a href="mailto:?subject=Test">`

### ✅ Maps & Navigation
*   **Geo URI**: `<a href="geo:0,0?q=Tokyo+Tower">` (Opens default map app).
*   **Google Maps Navigation**: `<a href="google.navigation:q=Tokyo+Tower">` (Specific to Google Maps, highly reliable).

### ✅ Messaging Apps
*   **LINE**: `<a href="line://msg/text/Message">`

---

## 2. HTTPS App Links (Universal Links)
The modern standard. If the app is installed, it intercepts the URL; otherwise, it loads the webpage.

### ✅ Google Calendar
*   **Code**: `<a href="https://calendar.google.com/calendar/r/eventedit?text=Event&details=Desc">`
*   **Result**: Opens the Google Calendar app if installed and configured to handle this URL. This is the **recommended replacement** for the failed `INSERT` intent.

### ✅ YouTube
*   **Code**: `<a href="https://www.youtube.com/watch?v=...">`
*   **Code (Intent Fallback)**: `<a href="intent://www.youtube.com/watch?v=...#Intent;scheme=https;package=com.google.android.youtube;end">`
*   **Result**: Reliably opens the YouTube app.

---

## 3. Specific `intent:` Syntax

### ✅ Launching an App (Main Launcher)
*   **Code**: `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.google.android.googlequicksearchbox;end`
*   **Result**: Opens the Google App (Home screen).
*   **Note**: Requires knowing the exact package name. Useful for simply "opening" an app without passing complex data.

### ✅ Correct `tel:` Intent
*   **Code**: `intent://09012345678#Intent;scheme=tel;action=android.intent.action.DIAL;end`
*   **Result**: Opens the dialer. Useful if you need to specify `S.browser_fallback_url` (which `tel:` links don't support).
