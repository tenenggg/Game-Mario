# Game Mario

An interactive Mario-style game built with **React**, **Phaser**, and **Vite**. Features multiple levels, engaging gameplay mechanics, and educational quiz questions throughout.

## 🎮 Features

- **Interactive Gameplay** - Classic Mario-style platformer mechanics
- **Multiple Levels** - Progressively challenging levels with completion modals
- **Quiz Questions** - Educational questions integrated into gameplay
- **HUD Display** - Real-time score, health, and level information
- **Game Over Screen** - Comprehensive game over modal with retry options
- **Responsive Design** - Works on various screen sizes
- **Fast Build Tool** - Powered by Vite for rapid development

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/game-mario.git
   cd game-mario
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173` (default Vite port)

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## 🎯 How to Play

- Use **Arrow Keys** or **WASD** to move
- **Spacebar** to jump
- Complete quiz questions to progress
- Reach the end of each level to advance
- Avoid enemies and obstacles

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── GameOverModal.jsx      # Game over screen
│   │   ├── HUD.jsx                # Head-up display
│   │   ├── LevelCompleteModal.jsx # Level completion screen
│   │   └── QuestionModal.jsx      # Quiz questions modal
│   ├── game/
│   │   ├── MainScene.js           # Main game logic (Phaser)
│   │   └── PhaserGame.jsx         # Phaser game wrapper
│   ├── data/
│   │   └── questions.js           # Quiz questions database
│   ├── App.jsx                    # Main app component
│   └── main.jsx                   # Entry point
├── public/                        # Static assets
├── index.html                     # HTML template
├── vite.config.js                 # Vite configuration
└── eslint.config.js              # ESLint rules
```

## 🛠️ Tech Stack

- **Frontend Framework** - React 18
- **Game Engine** - Phaser 3
- **Build Tool** - Vite
- **Styling** - CSS3
- **Linting** - ESLint


## Gameplay

![Demo](demo.gif)


## 📝 Configuration

### Vite Setup
The project uses Vite for optimal build performance. Configuration is in `vite.config.js`.

### Game Settings
Modify game parameters in `src/game/MainScene.js`:
- Player speed and jump height
- Enemy behavior
- Level difficulty
- Scoring system

### Quiz Questions
Add or modify questions in `src/data/questions.js`.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💡 Future Enhancements

- [ ] Multiplayer mode
- [ ] Power-ups and special abilities
- [ ] Leaderboard system
- [ ] Sound effects and background music
- [ ] Mobile touch controls
- [ ] Save/load game progress

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if applicable)

## 📧 Contact & Support

For questions or support, please reach out or open an issue on GitHub.

---

**Enjoy the game! 🎮**
