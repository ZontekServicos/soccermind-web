⚽ SoccerMind Web

SoccerMind Web is the frontend application of the SoccerMind platform, a football scouting and player intelligence system designed to support data-driven recruitment decisions.

The platform provides tools to analyze football players using advanced metrics, projections, and comparisons, helping clubs, analysts, and scouts identify high-potential talents and evaluate recruitment strategies.

🚀 Key Features

📊 Player Ranking

Global ranking based on performance and potential metrics.

🔎 Advanced Player Analysis

Detailed player profiles with attributes, projections and statistics.

🧠 Career Projection

Predictive analysis of player development and future performance.

⚖️ Player Comparison

Side-by-side comparison of players using performance metrics.

🔁 Similar Players

AI-driven similarity engine to identify players with comparable profiles.

💰 Financial Efficiency Analysis

Evaluate market value vs performance to identify cost-efficient transfers.

📋 Watchlist

Track players of interest for scouting and recruitment planning.

📈 Team Analysis

Squad insights to identify strengths, weaknesses and potential gaps.

🏗️ Tech Stack

Frontend built with modern web technologies:

React

TypeScript

Vite

Recharts

REST API Integration

🔗 Backend Integration

This frontend communicates with the Scout Engine API, which provides player data, analytics, projections and scouting intelligence.

API Base:

https://scout-engine-production.up.railway.app/api

Documentation:

https://scout-engine-production.up.railway.app/api/docs
📁 Project Structure
src/
 ├ app/
 │ ├ pages/
 │ │ ├ Dashboard
 │ │ ├ PlayersRanking
 │ │ ├ PlayerDetails
 │ │ ├ Compare
 │ │ ├ Reports
 │ │ ├ Alerts
 │ │ ├ Governance
 │ │ ├ ServiceDesk
 │ │ └ Squad
 │
 ├ services/
 │ ├ api.ts
 │ ├ players.ts
 │ ├ compare.ts
 │ ├ watchlist.ts
 │ ├ alerts.ts
 │ ├ reports.ts
 │ ├ simulation.ts
 │ └ team.ts
 │
 ├ mappers/
 │ ├ player.mapper.ts
 │ └ compare.mapper.ts
 │
 ├ hooks/
 │ └ useApi.ts
 │
 └ config/
   └ api-config.ts
🎯 Vision

SoccerMind aims to bridge football expertise and data science, enabling clubs and analysts to make smarter, faster and more objective recruitment decisions.

The long-term goal is to evolve into a complete football intelligence platform, combining scouting, analytics, predictive modeling and financial decision support.

Se quiser, eu também posso montar uma versão MUITO forte de README estilo startup, com:

badges

screenshots

arquitetura

roadmap

contribuição

licença

seção de IA / analytics
