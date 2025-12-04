# 德州扑克智囊 Pro (Poker Advisor Pro)

[![React](https://img.shields.io/badge/React-18.x-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-blue?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Jest](https://img.shields.io/badge/Tests-Jest-blue?style=flat-square&logo=jest)](https://jestjs.io/)

一款基于 GTO（最优游戏理论）的实时德州扑克辅助工具，旨在通过数据分析和蒙特卡洛模拟，为玩家提供科学的决策建议。

*(在这里可以放一张应用截图)*

---

## ✨ 核心功能

- **实时胜率计算**: 通过高效的蒙特卡洛模拟，精确计算当前手牌在任意情况下的胜率 (Equity)。
- **GTO 决策建议**: 结合胜率、底池赔率 (Pot Odds)、SPR 等关键指标，提供加注、跟注、弃牌或诈唬的 GTO 建议。
- **动态策略调整**: 支持 **保守型**、**激进型**、**疯鱼型** 三种玩家风格，AI 建议会随之调整。
- **手牌与牌面分析**: 自动识别手牌类型（如顶对、听花、组合听牌）和牌面结构（如干燥面、听花面），并给出相应策略解读。
- **翻牌前范围指导**: 内置标准 6 人桌 GTO 范围，检查您的起手牌是否在推荐范围内。
- **智能下注尺度**: 根据牌力、牌面和策略，推荐合理的价值下注和诈唬下注大小。
- **多语言支持**: 内置中文和英文界面，轻松切换。
- **全面的单元测试**: 核心算法 (`evaluateHand`, `analyzeHandFeatures`) 经过 Jest 全面测试，确保逻辑稳定可靠。

## 🚀 技术栈

- **前端**: React.js
- **UI 样式**: Tailwind CSS
- **测试**: Jest
- **图标**: Lucide React

## 🛠️ 如何运行

本项目使用 `npm` 进行包管理。

1.  **克隆仓库**
    ```bash
    git clone <your-repository-url>
    cd Poker-Advisor-Pro
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发服务器**
    
    *注意：本项目是一个纯前端 React 应用，需要在一个 HTML 文件中被挂载。你需要一个简单的 `index.html` 文件来引入编译后的 JS。*

    通常使用 `create-react-app` 或 `Vite` 等脚手架会包含此步骤。如果手动配置，请确保你的构建工具（如 Webpack）能正确处理。

    假设你已配置好开发环境，运行：
    ```bash
    npm start
    ```

4.  **运行测试**
    ```bash
    npm test
    ```

## 📂 项目结构

```
Poker-Advisor-Pro/
├── public/
│   ├── index.html         # React 应用挂载点
│   └── PokerData.js       # 全局数据层 (策略, 文本等)
├── src/
│   ├── PokerAdvisorPro.js # 核心应用组件和主逻辑
│   ├── components/        # (建议) 存放如 CardIcon, SettingsPanel 等组件
│   └── index.js           # 应用入口文件
├── PokerAdvisorPro.test.js # 核心算法的单元测试
├── package.json
└── README.md
```

## 💡 核心逻辑

1.  **`evaluateHand`**: 评估 7 张牌能组成的最大牌力，返回一个数值分数用于比较。
2.  **`analyzeHandFeatures`**: 分析手牌和公共牌，返回一个描述性的键（如 `top_pair_with_draw`）。
3.  **`runMonteCarloSimulation`**: 核心模拟器。通过上千次随机发牌，计算英雄手牌的胜率。经过了性能优化，速度更快。
4.  **`getGtoAdvice`**: 决策引擎。根据胜率、赔率和玩家风格，输出最终的行动建议。

## 🤝 贡献

欢迎提交 Pull Requests 或 Issues 来改进这个项目。

## 📄 许可证

本项目采用 MIT License。