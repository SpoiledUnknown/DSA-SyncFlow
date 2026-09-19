# DSA-SyncFlow

<p align="center">
  <strong>Automatically sync your LeetCode and GeeksforGeeks solutions to GitHub.</strong>
</p>

<p align="center">
  Created with ❤️ by <strong>SpoiledUnknown</strong> | Based on <a href="https://github.com/arunbhardwaj/LeetHub-2.0" target="_blank">LeetHub v2</a>
</p>

---

## 🌟 Overview

**DSA-SyncFlow** is a modern, lightweight WebExtension (Manifest V3 for Google Chrome & Mozilla Firefox) that seamlessly tracks and pushes your Data Structures & Algorithms solutions to GitHub the moment you hit **Accepted**.

No more manual copying, pasting, or maintaining separate repositories. DSA-SyncFlow organizes your coding journey automatically.

---

## 🚀 Features

- **Automated Syncing:** Pushes clean solution code, runtime/memory benchmark percentiles, and problem descriptions instantly upon passing all test cases.
- **LeetCode Modern UI & Legacy Support:** Powered by a direct LeetCode GraphQL integration, fully compatible with modern dynamic SPA layouts.
- **GeeksforGeeks Integration:** Automatically extracts and records your GeeksforGeeks solutions.
- **Categorized Repository README:** Generates and maintains sorted topic tables (e.g., Arrays, Hash Tables, Dynamic Programming) in your repository root `README.md`.
- **Cross-Device Persistent Stats:** Automatically tracks total solved problems by difficulty (Easy, Medium, Hard) using an in-repo `stats.json`.
- **Manual Sync Button:** Injects a "Sync w/ DSA-SyncFlow" button directly into submission panels for on-demand re-syncing.
- **Modern Dark UI:** Sleek, accessible popup and onboarding interface built with pure modern CSS.

---

## 💻 Development & Building

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Tests (Vitest)

```bash
npm test
```

### 3. Build Extension (Vite)

```bash
npm run build
```

The compiled extension will be output to `./dist/`.

### 4. Load into Browser

#### Google Chrome:

1. Open `chrome://extensions` in your browser.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `dist/` directory.

#### Mozilla Firefox:

1. Open `about:debugging#/runtime/this-firefox` in your browser.
2. Click **Load Temporary Add-on...**.
3. Select `dist/manifest.json`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
