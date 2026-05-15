#  TrustLayer v3

> **Overlay trust signals on AI-generated content. See confidence scores, hedge detection, and verification suggestions.**

TrustLayer is a sophisticated transparency and safety browser extension that injects real-time reliability analysis into your AI workflows. By evaluating linguistic patterns and epistemic grounding, it helps you identify when an AI is confident versus when it is "hallucinating" or hedging.

---

## ✨ Features

* **✦ Inline Confidence Badges:** Real-time 0–100% scoring injected directly into assistant responses.
* **✦ Deep Analysis Panel:** A slide-out side panel (Dark/Light mode supported) showing reasoning steps and knowledge gaps.
* **✦ Risk Domain Detection:** Automatic warnings for high-stakes content in **Medical**, **Legal**, **Financial**, and **Safety** domains.
* **✦ Destructive Action Guards:** Intercepts "Delete" or "Clear" buttons on AI platforms to prevent accidental data loss.
* **✦ Privacy First:** Local heuristic engine option ensures no data ever leaves your browser.

---

## 🛠 How It Works

TrustLayer uses a **Dual-Engine Architecture** to provide analysis:

### 1. The Local Heuristic Engine

Runs entirely in the browser using a **5-signal heuristic** to evaluate:

* **Hedge-to-Verify Ratio (HVR):** Detects non-committal language (e.g., "might", "possibly").
* **Specificity Scoring:** Analyzes the density of numbers, proper nouns, and citations.
* **Epistemic Grounding:** Differentiates between grounded testimony and ungrounded opinion.

### 2. Cloud API Intelligence

For deeper analysis, users can connect their own API keys to utilize:

* **Google Gemini:** Optimized for `gemini-3.1-flash-lite`.
* **OpenAI:** Utilizes `gpt-4.1-mini`.
* **Anthropic:** Powered by `claude-sonnet-4-6`.

---

## 🌐 Supported Platforms

TrustLayer is pre-configured to detect and inject into the following AI interfaces:

| Platform | Domain | Detectors |
| --- | --- | --- |
| **ChatGPT** | `chatgpt.com` | `[data-message-author-role="assistant"]` |
| **Claude** | `claude.ai` | `[data-is-streaming="false"] .prose` |
| **Gemini** | `gemini.google.com` | `message-content .markdown` |
| **Perplexity** | `perplexity.ai` | `.prose` |
| **Copilot** | `copilot.microsoft.com` | `.ac-textBlock` |
| **Bing AI** | `www.bing.com` | `cib-message-group` |

---

## 🚀 Getting Started

### Installation

1. Clone the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `trustlayer-3` directory.

### Configuration

1. Click the **TrustLayer ✦** icon in the browser toolbar.
2. Select your preferred **Analysis Provider**.
3. Enter your API keys if using Cloud providers (Keys are stored locally via `chrome.storage`).
4. Hit **Save Settings** and refresh your AI chat tab.

---

## 📄 Repository Structure

```text
trustlayer-3/
├── assets/icons/     # Extension icons (16, 32, 48, 128)
├── background/       # Analyzer.js (Core Logic & API Calls)
├── content/          # Badge, Panel, Detector, and Injector scripts
├── popup/            # Extension settings UI
├── styles/           # Main trustlayer.css overlay styles
├── utils/            # Constants.js and Storage.js wrappers
└── manifest.json     # Extension metadata

```

---

## ⚖️ License

Internal Design Project - **TrustLayer v3**

> *Disclaimer: TrustLayer provides confidence indicators based on linguistic patterns. It does not replace professional advice, especially in Medical, Legal, or Financial domains.*
