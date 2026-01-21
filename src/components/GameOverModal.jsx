const GameOverModal = ({ coins, onRestart }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content game-over-modal">
        <h1 className="game-over-title">💀 GAME OVER 💀</h1>
        
        <div className="game-over-stats">
          <p className="stats-text">You ran out of lives!</p>
          <p className="stats-text">Coins collected: <strong>{coins}</strong> 🪙</p>
        </div>
        
        <div className="game-over-message">
          <p>Remember: Workplace safety is no accident!</p>
          <p>Learn from your mistakes and try again.</p>
        </div>
        
        <button 
          className="restart-button"
          onClick={onRestart}
        >
          🔄 Restart Level
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
