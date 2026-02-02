# ML Interview Prep Tracker

A lightweight, browser-based interview prep tracker designed for ML Engineers targeting SF-based machine learning roles. Built with vanilla HTML, CSS, and JavaScript with localStorage for data persistence.

## Features

### 📊 Dashboard
- Daily streak tracking with visual indicators
- Weekly progress monitoring (14-hour goal)
- Motivational quotes rotation
- Personalized topic recommendations
- Quick stats overview
- One-click navigation to key features

### 📝 Daily Log
- Log practice sessions with time tracking
- Track questions across multiple platforms:
  - Interview Prep PDF Review
  - Stratascratch
  - HackerRank
  - LeetCode
  - TryExponent
  - Claude Q&A sessions
- Tag sessions with topics covered
- Add optional notes (200 char limit)
- View last 30 days of practice history
- Edit and delete log entries

### 📚 Topics
- Comprehensive ML topic list covering:
  - ML Algorithms & Neural Networks
  - Computer Vision
  - NLP & LLMs
  - Statistics & Probability
  - Model Evaluation & Validation
  - Regression & Optimization
  - Data Engineering
  - System Design & Architecture
  - Software Engineering
  - Behavioral & Soft Skills
- Visual status indicators (practiced recently, needs attention, stale)
- Click to increment practice count
- Sort by multiple criteria
- Coverage summary and progress tracking

### 💼 Job Applications
- Track applications with status management
- Application statuses: Applied, Phone Screen, Technical Interview, Onsite, Offer, Rejected, Withdrawn
- Visual warnings for stale applications (14+ days)
- Filter and sort capabilities
- Direct links to job postings
- Notes field for each application

### 📈 Analytics
- Practice time trends with goal indicators
- Topic coverage heatmap by category
- Weekly activity patterns
- Resource distribution charts
- Streak calendar visualization
- Burnout prevention insights
- Flexible time period filtering (7 days, 30 days, all time)

## Getting Started

### Installation

1. Clone or download this repository
2. No build process required - just open `index.html` in your browser

### Deployment to GitHub Pages

1. Create a new GitHub repository
2. Push all files to the repository
3. Go to repository Settings → Pages
4. Select "Deploy from a branch" and choose `main` branch
5. Your app will be available at `https://yourusername.github.io/repository-name/`

### Local Development

Simply open `index.html` in any modern web browser. All data is stored locally in your browser's localStorage.

## Demo Data

To test the app with sample data:

1. Click "Load Demo Data" button in the footer, OR
2. Press `Ctrl/Cmd + Shift + D` keyboard shortcut

This will populate the app with:
- 30 days of practice logs (with realistic gaps)
- Sample job applications
- Topic practice history
- A milestone target date

**Note:** Demo data is added to existing data, not replacing it.

## Data Management

### Data Storage
All data is stored in browser localStorage with the following structure:

- **Daily Logs**: Practice sessions with time, resources, topics, and notes
- **Topics**: 150+ ML topics with practice counts and last practiced dates
- **Applications**: Job applications with status tracking
- **Settings**: Weekly goals, daily goals, and milestone dates

### Reset Data
Click "Reset All Data" button in the footer to clear all stored data. This action requires double confirmation and cannot be undone.

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari

Note: Data is stored per browser. Using a different browser or clearing browser data will reset the app.

## Project Structure

```
ml-interview-tracker/
├── index.html              # Dashboard page
├── log.html                # Daily log page
├── topics.html             # Topics tracking page
├── applications.html       # Job applications page
├── analytics.html          # Analytics and insights page
├── css/
│   └── styles.css          # All styles and design system
├── js/
│   ├── app.js              # Core utilities and data management
│   ├── dashboard.js        # Dashboard page logic
│   ├── log.js              # Daily log page logic
│   ├── topics.js           # Topics page logic
│   ├── applications.js     # Applications page logic
│   ├── analytics.js        # Analytics page logic
│   └── demo-data.js        # Demo data loader
└── data/
    └── initial-topics.json # Topic seed data
```

## Design Principles

- **Clean, minimal interface** to reduce cognitive load
- **Calming color scheme** (blues and teals) to reduce stress
- **Fast loading** with no external dependencies
- **Desktop-optimized** for evening study sessions
- **Streak tracking** for motivation without pressure
- **Burnout prevention** with gentle reminders

## Color Palette

- Primary: Deep Blue (#2563eb) - trustworthy, calm
- Secondary: Teal (#0d9488) - growth, progress
- Accent: Amber (#f59e0b) - warnings, attention
- Success: Green (#10b981) - completed, on track
- Danger: Rose (#f43f5e) - overdue, alerts

## Tips for Success

1. **Be consistent**: Log practice daily, even short sessions
2. **Track everything**: All resources, all topics - the data helps you improve
3. **Review analytics**: Check weekly patterns to spot gaps
4. **Set milestones**: Use the target date feature to stay focused
5. **Avoid burnout**: Heed the burnout prevention insights
6. **Balance topics**: Use the heatmap to ensure comprehensive coverage

## Version

**v1.0** - Initial Release

## License

This project is provided as-is for personal use. Feel free to modify and adapt to your needs.

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

---

Built with ❤️ for ML Engineers in their job search journey. Good luck! 🚀
