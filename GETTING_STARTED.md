# 🚀 Getting Started - Sportwetten Quoten

A modern Austrian sports betting odds comparison website built with Next.js and Express.js.

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL 14+ (optional for now - we're using mock data)

## 🛠️ Quick Setup

### 1. Install Dependencies

```bash
# Install all dependencies for the monorepo
npm install
```

### 2. Environment Variables

```bash
# Copy example environment file
cp env.example .env

# Edit the .env file with your configuration
# For now, only NEXT_PUBLIC_API_URL is required
```

### 3. Start Development Servers

```bash
# Start both frontend and backend in development mode
npm run dev
```

This will start:
- **Frontend (Next.js)**: http://localhost:3000
- **Backend (Express API)**: http://localhost:3001

## 🎯 What's Available Now

### ✅ Working Features

1. **Homepage** with Austrian Bundesliga matches
2. **Odds Comparison Table** with multiple betting markets:
   - 1X2 (Home/Draw/Away)
   - Both Teams to Score (Yes/No) 
   - Over/Under 2.5 Goals
3. **Best Odds Highlighting** in green
4. **Responsive Design** for desktop and mobile
5. **Mock Data** for 6 Austrian bookmakers:
   - tipp3
   - win2day
   - bet365
   - Interwetten
   - bwin
   - Admiral

### 🔧 API Endpoints

- `GET /api/matches` - All upcoming matches
- `GET /api/matches/:id` - Match details with odds
- `GET /api/odds/compare/:matchId?market=ONE_X_TWO` - Odds comparison
- `GET /api/bookmakers` - All bookmakers
- `GET /api/leagues` - All leagues

## 🏗️ Project Structure

```
sportwetten-quoten-at/
├── apps/
│   ├── web/                   # Next.js Frontend (Port 3000)
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   └── lib/             # Utilities
│   └── api/                  # Express.js Backend (Port 3001)
│       └── src/             # API routes and logic
├── packages/
│   └── database/            # Prisma schema (future)
└── turbo.json              # Monorepo configuration
```

## 🧩 Key Components

### Frontend Components
- `MatchCard` - Displays match information with teams and timing
- `OddsTable` - Core feature showing odds comparison with best odds highlighting
- `LeagueFilter` - Filter matches by league
- `Header` - Navigation with search
- `Footer` - Links and disclaimers

### Backend Routes  
- `/api/matches` - Match data with Austrian teams
- `/api/odds` - Odds comparison logic
- `/api/bookmakers` - Bookmaker information

## 📱 Responsive Design

The application is fully responsive with:
- **Desktop**: Full table view with all bookmakers
- **Tablet**: Optimized table scrolling
- **Mobile**: Stacked cards and horizontal scrolling

## 🎨 Styling

Using **Tailwind CSS** with custom odds highlighting:
- **Green**: Best odds available
- **Amber**: Good odds 
- **Red**: Poor odds (planned)

## ⚽ Mock Data

Currently showing Austrian Bundesliga matches:
- RB Salzburg vs Rapid Wien
- Austria Wien vs Sturm Graz  
- LASK vs Wolfsberg
- TSV Hartberg vs WSG Tirol
- Austria Klagenfurt vs SCR Altach

## 🔄 Development Workflow

1. **Frontend changes**: Edit files in `apps/web/` - hot reload enabled
2. **Backend changes**: Edit files in `apps/api/src/` - auto-restart enabled  
3. **New components**: Add to `apps/web/components/`
4. **API routes**: Add to `apps/api/src/routes/`

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start both frontend and backend
npm run build        # Build both applications
npm run lint         # Lint all code
npm run format       # Format with Prettier

# Individual apps
cd apps/web && npm run dev      # Frontend only
cd apps/api && npm run dev      # Backend only
```

## 🎯 Next Steps

### Phase 1 - Current (✅ Complete)
- [x] Basic project structure
- [x] Mock data and API
- [x] Core odds comparison functionality
- [x] Responsive design
- [x] Austrian bookmaker integration (mock)

### Phase 2 - Planned
- [ ] Real data integration with web scrapers
- [ ] Database integration (PostgreSQL + Prisma)
- [ ] User authentication
- [ ] Favorites and alerts
- [ ] Historical odds data

### Phase 3 - Future
- [ ] Live odds updates
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] More betting markets

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on ports 3000 or 3001
   npx kill-port 3000 3001
   ```

2. **Module not found errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules
   npm install
   ```

3. **API not responding**
   - Check if backend is running on port 3001
   - Verify NEXT_PUBLIC_API_URL in environment variables

## 💡 Development Tips

- **Hot Reload**: Both frontend and backend have hot reloading
- **TypeScript**: Full type safety across the stack
- **API Testing**: Use browser dev tools or Postman to test API endpoints
- **Component Development**: Check the Shadcn/UI documentation for consistent styling

## 🎉 You're Ready!

The application should now be running with:
- Beautiful, responsive Austrian odds comparison interface
- Working API with realistic mock data
- Professional design matching modern betting sites
- Full TypeScript support and modern tooling

Visit http://localhost:3000 to see your Austrian odds comparison site in action!

---

**Happy coding! 🇦🇹⚽**