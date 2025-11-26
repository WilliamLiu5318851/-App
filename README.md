# Poker Advisor Pro (德州扑克智囊 Pro)

![Poker Advisor Pro Banner](linkimg.jpg)

> **Live Demo:** [https://pokeradvice.netlify.app/](https://pokeradvice.netlify.app/)

## 📖 Introduction (项目介绍)

**Poker Advisor Pro** is a sophisticated, web-based decision support system for Texas Hold'em. It functions as a real-time HUD (Heads-Up Display) simulation, helping players calculate equity, track pots, manage bankrolls, and make mathematically sound decisions based on Game Theory Optimal (GTO) concepts and exploitative strategies.

Unlike traditional static calculators, this app tracks the entire lifecycle of a hand—from Pre-flop to River—handling complex scenarios like **Side Pots**, **All-ins**, and **Multi-deck** configurations.

## 🚀 Key Features (核心功能)

### 🧠 Core Engine (核心引擎)
* **Real-time Equity Calculation:** Uses **Monte Carlo simulations** (1500+ iterations/run) to accurately predict win rates against random ranges.
* **Multi-Street Tracking:** Simulates the full game flow: Pre-flop -> Flop -> Turn -> River.
* **Multi-Deck Support:** Configurable deck count (1-8 decks) to simulate standard games or reduced-removal environments.

### 💰 Pot & Bankroll Management (资金管理)
* **Smart Pot Logic:** Automatically tracks Main Pot and **Side Pots** when multiple players are All-in with different stack sizes.
* **SPR Tracking:** Real-time **Stack-to-Pot Ratio** calculation with "Pot Committed" warnings when SPR < 1.
* **Dynamic Rebuy:** Bankruptcy protection with customizable buy-in amounts.

### 🤖 Strategy Advisor (策略建议)
* **Persona-based Advice:** Switch between three distinct strategy engines:
    * 🛡️ **Conservative (Tight):** Solid, value-heavy playstyle.
    * ⚔️ **Aggressive:** Balanced semi-bluffs and pressure.
    * 🔥 **Maniac (Bluff):** High variance, exploits fold equity with frequent bluffs.
* **Smart Bet Sizing:** Context-aware bet suggestions (1/3 Pot, 2/3 Pot, Overbet) that automatically cap at the Hero's maximum stack.

## 🛠 Tech Stack (技术栈)

This project utilizes a modern **Zero-Build Architecture**, allowing it to run directly in the browser without a complex Node.js build step.

* **Frontend:** React 18 (via ESM)
* **Styling:** Tailwind CSS (via CDN)
* **Icons:** Lucide React
* **Compiler:** Babel Standalone (In-browser JSX compilation)
* **Deployment:** Netlify (CI/CD via GitHub)

## 📂 Installation & Usage (安装与使用)

Since this project uses a standalone architecture, no `npm install` is required.

### Local Development
1.  Clone the repository:
    ```bash
    git clone [https://github.com/WilliamLiu5318851/poker-advisor-pro.git](https://github.com/WilliamLiu5318851/poker-advisor-pro.git)
    ```
2.  Navigate to the project directory.
3.  Open `index.html` directly in any modern browser (Chrome/Edge/Safari).
    * *Note: An internet connection is required to load the CDN dependencies.*

### Deployment
This project is optimized for static hosting. Simply deploy the `index.html` and assets to:
* Netlify (Recommended)
* Vercel
* GitHub Pages

## 📸 Screenshots (截图)

| Equity Calculation | Settlement Mode |
|:---:|:---:|
| *Real-time advice based on your hand strength.* | *Automatic Main/Side pot distribution.* |

## 👤 Author

**William Liu (z5318851)**
* University of New South Wales (UNSW)
* Computer Science Undergraduate

---
*Disclaimer: This tool is for educational and simulation purposes only.*