# Android Intent Experiments: Failed Cases (2025-12)

This document records intent patterns that failed to work as expected on Chrome for Android. Avoiding these patterns in future development is recommended.

## 1. Google App Specific Intents
Targeting specific features inside the Google App often fails due to security restrictions (non-exported activities) or browser blocking.

### ❌ Voice Search (`android.intent.action.VOICE_COMMAND`)
*   **Attempted Code**:
    ```html
    <a href="intent:#Intent;action=android.intent.action.VOICE_COMMAND;package=com.google.android.googlequicksearchbox;end">...</a>
    ```
*   **Result**: Redirects to the Google App page on Play Store.
*   **Reason**: The Activity handling `VOICE_COMMAND` is likely not exported for external browser triggering, causing the intent resolution to fail and fallback to the market.

### ❌ Web Search Action (`android.intent.action.WEB_SEARCH`)
*   **Attempted Code**:
    ```html
    <a href="intent:#Intent;action=android.intent.action.WEB_SEARCH;S.query=test;end">...</a>
    ```
*   **Result**: No response or Play Store redirect.
*   **Reason**: This generic action is often restricted in modern Android versions when invoked from a web context to prevent hijacking.

### ❌ Opening Search Results in App (`intent://...package=...`)
*   **Attempted Code**:
    ```html
    <a href="intent://www.google.com/search?q=...#Intent;scheme=https;package=com.google.android.googlequicksearchbox;end">...</a>
    ```
*   **Result**: Redirects to Play Store.
*   **Reason**: The Google App does not claim the `https` scheme for search URLs when launched from Chrome (to keep the user in the browser ecosystem), or the specific activity is protected.

---

## 2. Calendar Insertion (`android.intent.action.INSERT`)
Invoking the native calendar insert intent is notoriously unreliable from the web.

### ❌ Using `data` with `content://`
*   **Attempted Code**:
    ```html
    <a href="intent:#Intent;action=android.intent.action.INSERT;data=content://com.android.calendar/events;S.title=Test;end">...</a>
    ```
*   **Result**: Nothing happens (Silent failure).
*   **Reason**: Chrome treats `content://` URIs as local/protected resources and blocks them from being initiated by a web page for security reasons.

### ❌ Using `type` only (without `data`)
*   **Attempted Code**:
    ```html
    <a href="intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir/event;S.title=Test;end">...</a>
    ```
    (Tested with and without `package=com.google.android.calendar`)
*   **Result**: Nothing happens or Play Store redirect.
*   **Reason**: Without a data URI, the intent might be too ambiguous, or the `INSERT` action for this MIME type requires permissions or contexts that a browser cannot provide.

---

## 3. Generic "Dialer" Intent with `data` parameter
### ❌ `action=DIAL` with `data` extra
*   **Attempted Code**:
    ```html
    <a href="intent:#Intent;action=android.intent.action.DIAL;data=tel:090...;end">...</a>
    ```
*   **Result**: Failed to open correctly on some devices/versions.
*   **Reason**: The `tel:` URI should be in the intent's data field (URI part), not as an extra, or the syntax was slightly off for Chrome's parsing. The correct way is `intent://[NUMBER]#Intent;scheme=tel;action=...`.
