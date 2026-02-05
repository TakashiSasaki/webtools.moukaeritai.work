# Android Intent Experiments: Failed Cases (2025-12)

This document records intent patterns that failed to work as expected on Chrome for Android. Avoiding these patterns in future development is recommended.

## 1. Google App Specific Intents
Targeting specific features inside the Google App often fails due to security restrictions (non-exported activities) or browser blocking.

### ❌ Voice Search (`android.intent.action.VOICE_COMMAND`)
*   **Result**: Redirects to the Google App page on Play Store.

### ❌ Web Search Action (`android.intent.action.WEB_SEARCH`)
*   **Result**: No response or Play Store redirect.

---

## 2. Generic "Launcher" Intents (Package Specified)
Even attempting to simply "Launch" an app by its package name often fails if the app doesn't explicitly export its Launcher Activity for browser invocation.

### ❌ `action=MAIN`, `category=LAUNCHER`
*   **Attempted Code**:
    ```html
    <a href="intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.discord;end">...</a>
    ```
*   **Result**: **Redirects to Play Store** (even if the app is installed).
*   **Reason**: Modern Android/Chrome restricts launching arbitrary activities. Unless the app's Manifest specifically adds the `BROWSABLE` category to its Main Activity (which is rare), the Intent resolution fails from the browser context, triggering the Market fallback.
*   **Solution**: Use **Custom Schemes** (e.g., `slack://`) or **HTTPS App Links**.

---

## 3. Calendar Insertion (`android.intent.action.INSERT`)
Invoking the native calendar insert intent is notoriously unreliable from the web.

### ❌ Using `data` with `content://`
*   **Result**: Nothing happens (Silent failure).

### ❌ Using `type` only (without `data`)
*   **Result**: Nothing happens or Play Store redirect.