const HUD = ({ lives, coins }) => {
  return (
    <div className="hud">
      <div className="hud-item">
        <span className="hud-icon">⛑️</span>
        <span className="hud-label">Helmets:</span>
        <span className="hud-value">{lives}</span>
      </div>
      <div className="hud-item">
        <span className="hud-icon">🪙</span>
        <span className="hud-label">Coins:</span>
        <span className="hud-value">{coins}</span>
      </div>
    </div>
  );
};

export default HUD;
