const LevelCompleteModal = ({ coins, onRestart }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content level-complete-modal">
        <h1 className="level-complete-title">🎉 LEVEL COMPLETE! 🎉</h1>
        
        <div className="level-complete-stats">
          <p className="stats-text">Congratulations!</p>
          <p className="stats-text">Coins collected: <strong>{coins}</strong> 🪙</p>
        </div>
        
        <div className="level-complete-message">
          <p>You've mastered workplace safety!</p>
          <p>Great job learning and staying safe!</p>
        </div>
        
        <button 
          className="restart-button"
          onClick={onRestart}
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  );
};

export default LevelCompleteModal;
