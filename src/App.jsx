import { useState, useCallback, useEffect } from 'react'
import './App.css'
import PhaserGame from './game/PhaserGame'
import HUD from './components/HUD'
import QuestionModal from './components/QuestionModal'
import GameOverModal from './components/GameOverModal'
import LevelCompleteModal from './components/LevelCompleteModal'
import { getRandomQuestion } from './data/questions'

function App() {
  const [lives, setLives] = useState(3);
  const [coins, setCoins] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState([]);
  const [gameKey, setGameKey] = useState(0); // For restarting the game

  // Objectives
  const TARGET_COINS = 40; // adjust difficulty here
  const [showWin, setShowWin] = useState(false);

  // Handle question block collision
  const handleQuestionBlock = useCallback(() => {
    const question = getRandomQuestion(usedQuestionIds);
    if (question) {
      setCurrentQuestion(question);
      setUsedQuestionIds(prev => [...prev, question.id]);
    }
  }, [usedQuestionIds]);

  // Handle coin collection
  const handleCoinCollect = useCallback(() => {
    setCoins(prev => {
      const next = prev + 1;
      if (next >= TARGET_COINS) {
        setShowWin(true);
        if (window.phaserGameInstance?.playWinSound) {
          window.phaserGameInstance.playWinSound();
        }
      }
      return next;
    });
  }, []);

  // Handle life lost
  const handleLifeLost = useCallback(() => {
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setShowGameOver(true);
        if (window.phaserGameInstance?.playLoseSound) {
          window.phaserGameInstance.playLoseSound();
        }
      }
      return newLives;
    });
  }, []);

  // Handle game over
  const handleGameOver = useCallback(() => {
    setShowGameOver(true);
    if (window.phaserGameInstance?.playLoseSound) {
      window.phaserGameInstance.playLoseSound();
    }
  }, []);

  // Handle question answer
  const handleAnswer = (isCorrect) => {
    console.log('=== HANDLE ANSWER CALLED ===');
    console.log('Answer is correct:', isCorrect);
    console.log('window.phaserGameInstance exists:', !!window.phaserGameInstance);
    
    if (isCorrect) {
      // Correct answer: award coins
      setCoins(prev => {
        const next = prev + 4;
        if (next >= TARGET_COINS) {
          setShowWin(true);
          // Trigger win sound
          if (window.phaserGameInstance?.playWinSound) {
            window.phaserGameInstance.playWinSound();
          }
        }
        return next;
      });
    } else {
      // Wrong answer: lose a life
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setShowGameOver(true);
          // Trigger lose sound
          if (window.phaserGameInstance?.playLoseSound) {
            window.phaserGameInstance.playLoseSound();
          }
        }
        return newLives;
      });
    }

    // Resume the game
    console.log('Attempting to resume game...');
    if (window.phaserGameInstance) {
      console.log('Calling resumeGame with isCorrect:', isCorrect);
      window.phaserGameInstance.resumeGame(isCorrect);
    } else {
      console.error('ERROR: window.phaserGameInstance not found!');
    }
  };

  // Restart the game
  const handleRestart = () => {
    setLives(3);
    setCoins(0);
    setShowGameOver(false);
    setShowWin(false);
    setUsedQuestionIds([]);
    setCurrentQuestion(null);
    setGameKey(prev => prev + 1); // Force re-render of PhaserGame
  };

  return (
    <div className="app-container">
      <header className="game-header">
        <h1 className="game-title">⚠️ Safety Quest Adventure 🎮</h1>
        <p className="game-subtitle">Learn workplace safety while having fun!</p>
      </header>

      <HUD lives={lives} coins={coins} />

      <div className="game-container">
        <PhaserGame
          key={gameKey}
          onQuestionBlock={handleQuestionBlock}
          onCoinCollect={handleCoinCollect}
          onLifeLost={handleLifeLost}
          onGameOver={handleGameOver}
        />
      </div>

      <div className="controls-info">
        <h3>🎮 Controls:</h3>
        <div className="controls-grid">
          <div className="control-item">
            <kbd>←</kbd> <kbd>→</kbd> Move
          </div>
          <div className="control-item">
            <kbd>↑</kbd> Jump
          </div>
          <div className="control-item">
            <kbd>SPACE</kbd> Attack
          </div>
        </div>
      </div>

      <div className="game-info">
        <h3>❓ Instructions:</h3>
        <p><strong>🎯 Objective: Collect 40 coins to win. You have 3 lives (helmets).</strong></p>
        <ul>
          <li><strong style={{ color: '#000000' }}>⬅️ MOVEMENT:</strong> Use left/right arrow keys to move across the platforms. Jump with the up arrow to reach higher areas.</li>
          <li><strong style={{ color: '#ff6b6b' }}>⚔️ ATTACK:</strong> Press <strong>SPACE</strong> to swing your safety wrench and defeat monsters. You must be close to the monster to hit it.</li>
          <li><strong style={{ color: '#ffd700' }}>🪙 COINS:</strong> Collect golden circles scattered throughout the level. Each coin gives you +1 coin. Find all 25 coins!</li>
          <li><strong style={{ color: '#22c55e' }}>❓ QUESTIONS:</strong> Hit green question blocks to answer workplace safety questions. Answer correctly to earn +4 coins and learn safety facts!</li>
          <li><strong style={{ color: '#ff5722' }}>🔴 RED MONSTERS:</strong> Fire hazards that bob up and down. Defeat them for a coin reward, or avoid them to keep your helmets safe.</li>
          <li><strong style={{ color: '#9c27b0' }}>🟣 PURPLE MONSTERS:</strong> Mechanical hazards that move side-to-side. Defeat them to earn coins, but be careful not to touch them!</li>
          <li><strong style={{ color: '#ff9800' }}>❤️ LIVES:</strong> You start with 3 helmets. Lose one if you touch a monster without attacking, or answer a question wrong. Game Over at 0 helmets!</li>
        </ul>
      </div>

      {currentQuestion && (
        <QuestionModal
          question={currentQuestion}
          onAnswer={handleAnswer}
          onClose={() => setCurrentQuestion(null)}
        />
      )}

      {showWin && (
        <LevelCompleteModal
          coins={coins}
          onRestart={handleRestart}
        />
      )}

      {showGameOver && (
        <GameOverModal
          coins={coins}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}

export default App
