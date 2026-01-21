import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './MainScene';

const PhaserGame = ({ onQuestionBlock, onCoinCollect, onLifeLost, onGameOver }) => {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const callbacksRef = useRef({ onQuestionBlock, onCoinCollect, onLifeLost, onGameOver });

  // Update callbacks without causing game recreation
  useEffect(() => {
    callbacksRef.current = { onQuestionBlock, onCoinCollect, onLifeLost, onGameOver };
  }, [onQuestionBlock, onCoinCollect, onLifeLost, onGameOver]);

  useEffect(() => {
    if (phaserGameRef.current) {
      return; // Game already initialized
    }

    // Phaser game configuration (scene added manually to pass data once)
    const config = {
      type: Phaser.AUTO,
      width: 1400,
      height: 500,
      parent: gameRef.current,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      input: {
        keyboard: {
          capture: [32, 37, 38, 39, 40] // Capture arrow keys and space
        }
      },
      scene: []
    };

    // Initialize Phaser game
    phaserGameRef.current = new Phaser.Game(config);

    // Auto-focus the game canvas after creation
    setTimeout(() => {
      const canvas = gameRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.focus();
        canvas.setAttribute('tabindex', '0');
        console.log('Game canvas focused');
      }
    }, 100);

    // Resume audio context on first user interaction
    const resumeAudioContext = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      document.removeEventListener('click', resumeAudioContext);
      document.removeEventListener('keydown', resumeAudioContext);
    };
    document.addEventListener('click', resumeAudioContext);
    document.addEventListener('keydown', resumeAudioContext);

    // Add and start the main scene with React callbacks passed once
    phaserGameRef.current.scene.add('MainScene', MainScene, true, {
      onQuestionBlock: () => callbacksRef.current.onQuestionBlock(),
      onCoinCollect: () => callbacksRef.current.onCoinCollect(),
      onLifeLost: () => callbacksRef.current.onLifeLost(),
      onGameOver: () => callbacksRef.current.onGameOver()
    });

    // Cleanup on unmount
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []); // Empty dependency - game created only once

  // Method to resume game after question
  const resumeGame = (isCorrect) => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('MainScene');
      if (scene && scene.resumeGame) {
        scene.resumeGame(isCorrect);
      }
    }
  };

  const playWinSound = () => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('MainScene');
      if (scene && scene.playWinSound) {
        scene.playWinSound();
      }
    }
  };

  const playLoseSound = () => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('MainScene');
      if (scene && scene.playLoseSound) {
        scene.playLoseSound();
      }
    }
  };

  // Expose methods to parent
  useEffect(() => {
    console.log('Setting up window.phaserGameInstance...');
    if (window.phaserGameInstance) {
      console.log('Updating existing phaserGameInstance');
      window.phaserGameInstance.resumeGame = resumeGame;
      window.phaserGameInstance.playWinSound = playWinSound;
      window.phaserGameInstance.playLoseSound = playLoseSound;
    } else {
      console.log('Creating new phaserGameInstance');
      window.phaserGameInstance = { resumeGame, playWinSound, playLoseSound };
    }
    console.log('phaserGameInstance setup complete:', window.phaserGameInstance);
  }, []);

  return (
    <div 
      ref={gameRef} 
      style={{ 
        width: '1400px', 
        height: '500px',
        margin: '0 auto',
        border: '3px solid #333',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
};

export default PhaserGame;
