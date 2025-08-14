# MLB Tracker App ⚾

A comprehensive React Native app for tracking MLB games, building parlays, and getting real-time home run notifications.

## Features

### 🏟️ Games Screen
- View today's MLB games with live scores
- See probable/starting pitchers with stats (ERA, handedness)
- Expand games to view team lineups
- Real-time game status updates

### 🎯 Parlay Builder
- Select players from live and upcoming games
- Choose bet types: Hits, Total Bases, Home Runs, H+R+RBIs
- Set thresholds for each bet type
- Group selected players by matchup
- View player season stats (HR, H, R, RBI)

### 🌤️ Weather Screen
- Weather information for all games
- Temperature indicators (warm/cold icons)
- Wind speed and direction
- Rain chance and conditions

### 📊 My Parlays
- View saved parlay bets
- Track parlay creation dates and times
- Delete parlays with confirmation
- See player selections and thresholds

### 🔔 Home Run Notifications
- Real-time home run alerts
- Automatic monitoring of live games
- Push notifications with player details
- Works for games with live feed data

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **API**: MLB Stats API
- **Weather**: OpenWeather API
- **Notifications**: Expo Notifications
- **Styling**: React Native StyleSheet with theming

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd mlb-tracker-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables (optional)
   ```bash
   # Create .env file for weather API
   EXPO_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
   ```

4. Start the development server
   ```bash
   npx expo start
   ```

### Running the App

- **iOS Simulator**: Press `i` in the terminal or scan QR code with Expo Go
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan QR code with Expo Go app
- **Web**: Press `w` in the terminal

## Project Structure

```
mlb-tracker-app/
├── app/                   # Main app screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Games screen
│   │   ├── parlay-builder.tsx
│   │   ├── weather.tsx
│   │   └── parlays.tsx
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── services/              # API services
│   ├── mlbApi.ts          # MLB API integration
│   ├── weatherApi.ts      # Weather API integration
│   ├── notificationService.ts
│   └── homeRunMonitor.ts
├── context/               # React Context providers
├── utils/                 # Utility functions
├── types/                 # TypeScript type definitions
└── constants/             # App constants and theming
```

## API Integration

### MLB Stats API
- Game schedules and live data
- Player statistics and rosters
- Pitcher information and stats
- Play-by-play data for home run detection

### OpenWeather API
- Real-time weather data for ballparks
- Temperature, humidity, wind conditions
- Rain probability and forecasts

## Development

### Key Features Implemented
- ✅ Real-time game monitoring
- ✅ Home run notification system
- ✅ Parlay building interface
- ✅ Weather integration
- ✅ Responsive design with theming
- ✅ TypeScript support
- ✅ Error handling and fallbacks

### Available Scripts
- `npm start` - Start development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run reset-project` - Reset to fresh project

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues:
- Check the [Expo documentation](https://docs.expo.dev/)
- Review the [MLB Stats API documentation](https://statsapi.mlb.com/docs/)
