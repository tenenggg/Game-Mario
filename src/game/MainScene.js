import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  init(data) {
    // Receive callbacks from React
    this.onQuestionBlock = data.onQuestionBlock;
    this.onCoinCollect = data.onCoinCollect;
    this.onLifeLost = data.onLifeLost;
    this.onGameOver = data.onGameOver;
  }

  preload() {
    // No audio files needed - using Web Audio API for sound generation
  }

  create() {
    // === LEVEL LAYOUT CONSTANTS - Define FIRST before creating objects ===
    // Canvas height is 500px, ground should be at the bottom
    this.GROUND_HEIGHT = 40;  // Height of ground platform
    this.GROUND_Y = 500 - (this.GROUND_HEIGHT / 2);  // Position ground at absolute bottom (480)
    this.WORLD_WIDTH = 5400;  // Increased from 3600 to allow more space
    this.WORLD_HEIGHT = 500;
    
    // Create simple shapes for game objects
    this.createPlayer();
    this.createPlatforms();
    this.createMonsters();
    this.createQuestionBlocks();
    this.createCoins();
    this.createWeapon();
    
    // Audio system using Web Audio API
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.backgroundMusicOscillators = [];
    this.backgroundMusicLoop = null;
    this.backgroundMusicNoteTimers = [];
    console.log('AudioContext created:', this.audioContext.state);
    
    // Resume audio context on first interaction if needed
    const resumeAudio = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('AudioContext resumed');
          this.playBackgroundMusic();
        });
      }
    };
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
    
    // Start background music
    this.time.delayedCall(500, () => {
      this.playBackgroundMusic();
    });
    
    // Track question modal state to avoid unwanted collisions during pause
    this.questionActive = false;
    this.monsterOverlapCollider = null;
    
    // Track player invincibility state
    this.playerInvincible = false;
    
    // Player direction (1 = right, -1 = left)
    this.playerDirection = 1;
    
    // Set up controls
    this.input.keyboard.enabled = true;
    this.input.enabled = true;
    
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Manual key binding as backup
    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    
    // Camera follows player - bounded to world dimensions
    this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player);
    
    // Physics world bounds - prevents objects from falling below ground
    // This creates an invisible wall at world edges and bottom
    this.physics.world.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
    
    // Track used question blocks
    this.usedQuestionBlocks = new Set();
  }

  createPlayer() {
    // Build a larger, more visible OSH-styled worker using a container
    const body = this.add.rectangle(0, 3, 38, 38, 0x2c3e50);
    const vest = this.add.rectangle(0, 5, 32, 22, 0xf59e0b);
    const vestStripe = this.add.rectangle(0, 5, 30, 5, 0x111111);
    const helmet = this.add.rectangle(0, -18, 36, 14, 0xfbbf24);
    const helmetBand = this.add.rectangle(0, -14, 36, 4, 0x111111);
    const helmetVisor = this.add.rectangle(0, -18, 32, 3, 0x666666);
    const badge = this.add.circle(-12, -2, 6, 0x00c853);
    const badgeMark = this.add.text(-15, -9, '$', { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' });
    const bootLeft = this.add.rectangle(-10, 22, 12, 8, 0x5a3a2a);
    const bootRight = this.add.rectangle(10, 22, 12, 8, 0x5a3a2a);

    // Spawn player on the ground - starting position
    // Y = GROUND_Y - (GROUND_HEIGHT/2) - (player_height/2) to stand on top of ground
    const startY = this.GROUND_Y - (this.GROUND_HEIGHT / 2) - 24;  // 24 = half of player height
    
    this.player = this.add.container(100, startY, [body, vest, vestStripe, helmet, helmetBand, helmetVisor, badge, badgeMark, bootLeft, bootRight]);
    this.physics.add.existing(this.player);
    this.player.body.setSize(38, 48);
    this.player.body.setOffset(-19, -22);
    
    // CRITICAL: Prevent player from falling through or past world bounds (including ground)
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setGravityY(800);

    this.playerVisuals = { body, vest, vestStripe, helmet, helmetBand, helmetVisor, badge, bootLeft, bootRight };

    // Player state
    this.playerState = {
      isAttacking: false,
      canJump: true
    };
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    const addPlatform = (x, y, width, height, color) => {
      const platform = this.add.rectangle(x, y, width, height, color);
      platform.setStrokeStyle(3, 0x1a1a1a);
      this.physics.add.existing(platform, true);
      this.platforms.add(platform);
    };
    
    // === GROUND LAYER (BLUE) - THE ABSOLUTE BOTTOM ===
    // This is the lowest solid surface - nothing should go below this
    // Positioned at GROUND_Y (480) which is 20px from canvas bottom (500)
    for (let i = 0; i < 28; i++) {
      addPlatform(i * 200 + 100, this.GROUND_Y, 200, this.GROUND_HEIGHT, 0x3f8fc7);
    }
    
    // === FLOATING PLATFORMS (ORANGE) - ABOVE GROUND ONLY ===
    // All Y positions must be < GROUND_Y to appear above ground
    // Using consistent height intervals for visual grid alignment
    const PLATFORM_HEIGHT = 20;
    const TILE_HEIGHT = 60;  // Vertical spacing unit
    
    const platformPositions = [
      // Format: { x, tilesAboveGround } - calculated Y = GROUND_Y - (tiles * TILE_HEIGHT)
      { x: 300, tilesAboveGround: 1.5 },   // Increased height
      { x: 500, tilesAboveGround: 2 },   
      { x: 800, tilesAboveGround: 1.5 },
      { x: 1100, tilesAboveGround: 2.5 },  // Higher platform
      { x: 1400, tilesAboveGround: 1.5 },
      { x: 1700, tilesAboveGround: 2.5 },
      { x: 2000, tilesAboveGround: 1.5 },
      { x: 2300, tilesAboveGround: 2 },
      { x: 2600, tilesAboveGround: 2.5 },
      { x: 2900, tilesAboveGround: 1.5 },
      { x: 3200, tilesAboveGround: 2.5 },
      { x: 3500, tilesAboveGround: 1.5 },
      { x: 3800, tilesAboveGround: 2 },
      { x: 4100, tilesAboveGround: 2.5 },
      { x: 4400, tilesAboveGround: 1.5 },
      { x: 4700, tilesAboveGround: 2 },
      { x: 5000, tilesAboveGround: 2.5 }
    ];
    
    platformPositions.forEach(pos => {
      const yPos = this.GROUND_Y - (pos.tilesAboveGround * TILE_HEIGHT) - (this.GROUND_HEIGHT / 2) - (PLATFORM_HEIGHT / 2);
      addPlatform(pos.x, yPos, 150, PLATFORM_HEIGHT, 0xd97706);
    });
    
    this.platforms.refresh();
    
    // CRITICAL: Add collision between player and ALL platforms (ground + floating)
    // This prevents player from falling through platforms
    this.physics.add.collider(this.player, this.platforms);
  }

  createMonsters() {
    this.monsters = this.physics.add.group();
    
    // Spawn monsters ABOVE ground - positioned so they stand on top of ground platform
    // Monster is 50px tall, so position it 25px (half height) above the ground surface
    const groundLevel = this.GROUND_Y - (this.GROUND_HEIGHT / 2) - 25;  // 25 = half monster height
    
    const monsterData = [
      { x: 200, y: groundLevel, type: 'fire', color: 0xff5722 },
      { x: 600, y: groundLevel, type: 'mechanical', color: 0x9c27b0 },
      { x: 950, y: groundLevel, type: 'mechanical', color: 0x9c27b0 },
      { x: 1250, y: groundLevel, type: 'fire', color: 0xff5722 },
      { x: 1550, y: groundLevel, type: 'mechanical', color: 0x9c27b0 },
      { x: 1850, y: groundLevel, type: 'fire', color: 0xff5722 },
      { x: 2150, y: groundLevel, type: 'mechanical', color: 0x9c27b0 },
      { x: 2450, y: groundLevel, type: 'fire', color: 0xff5722 },
      { x: 2750, y: groundLevel, type: 'mechanical', color: 0x9c27b0 },
      { x: 3050, y: groundLevel, type: 'fire', color: 0xff5722 },
      { x: 3350, y: groundLevel, type: 'mechanical', color: 0x9c27b0 },
      { x: 3650, y: groundLevel, type: 'fire', color: 0xff5722 },
      { x: 3950, y: groundLevel, type: 'mechanical', color: 0x9c27b0 },
      { x: 4250, y: groundLevel, type: 'fire', color: 0xff5722 },
      { x: 4550, y: groundLevel, type: 'mechanical', color: 0x9c27b0 },
      { x: 4850, y: groundLevel, type: 'fire', color: 0xff5722 }
    ];
    
    monsterData.forEach(data => {
      // Create monster as a container with skull/creature shape
      // Red skull = fire hazard, Grey skull = mechanical hazard
      const skullShape = this.add.container(data.x, data.y);
      
      // Main skull body - BIGGER
      const skull = this.add.ellipse(0, 0, 40, 50, data.color);
      skull.setStrokeStyle(3, 0x1a1a1a);
      
      // Skull jaw/mouth - BIGGER
      const jaw = this.add.ellipse(0, 14, 32, 18, data.color);
      jaw.setStrokeStyle(3, 0x1a1a1a);
      
      // Left eye socket - BIGGER
      const eyeLeft = this.add.circle(-10, -6, 7, 0x1a1a1a);
      const eyeLeftWhite = this.add.circle(-10, -6, 4, 0xffffff);
      const eyeLeftPupil = this.add.circle(-10, -6, 2, 0x000000);
      
      // Right eye socket - BIGGER
      const eyeRight = this.add.circle(10, -6, 7, 0x1a1a1a);
      const eyeRightWhite = this.add.circle(10, -6, 4, 0xffffff);
      const eyeRightPupil = this.add.circle(10, -6, 2, 0x000000);
      
      // Mouth teeth detail - BIGGER
      const teeth1 = this.add.rectangle(-12, 12, 3, 6, 0x1a1a1a);
      const teeth2 = this.add.rectangle(-2, 12, 3, 6, 0x1a1a1a);
      const teeth3 = this.add.rectangle(8, 12, 3, 6, 0x1a1a1a);
      
      skullShape.add([skull, jaw, eyeLeft, eyeLeftWhite, eyeLeftPupil, eyeRight, eyeRightWhite, eyeRightPupil, teeth1, teeth2, teeth3]);
      
      this.physics.add.existing(skullShape);
      
      // Set hitbox to match the skull visual size (40x50)
      skullShape.body.setSize(40, 50);
      skullShape.body.setOffset(-20, -25); // Center the hitbox
      
      // Monsters respect world bounds (won't fall below ground)
      skullShape.body.setCollideWorldBounds(true);
      
      // Set initial velocity based on type
      skullShape.hazardType = data.type;
      skullShape.initialX = data.x;
      skullShape.initialY = data.y;
      
      if (data.type === 'fire') {
        // Red monsters bob up and down (stay above ground)
        this.tweens.add({
          targets: skullShape,
          y: skullShape.initialY - 40,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      } else {
        // Purple monsters move left and right
        this.tweens.add({
          targets: skullShape,
          x: skullShape.initialX + 120,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
      
      this.monsters.add(skullShape);
    });
    
    // Monsters collide with platforms (walk on them, don't fall through)
    this.physics.add.collider(this.monsters, this.platforms);
    
    // Store the overlap collider so we can disable/enable it
    this.monsterOverlapCollider = this.physics.add.overlap(this.player, this.monsters, this.handleMonsterCollision, null, this);
  }

  createQuestionBlocks() {
    this.questionBlocks = this.physics.add.staticGroup();
    
    // Position question blocks above ground using tile-based positioning
    const BLOCK_SIZE = 40;
    const TILE_HEIGHT = 60;
    
    const hazardIcons = ['⚠', '⛑', '☣', '⚡', '🔥', '🧯', '🧤', '🪑'];
    const blockPositions = [
      // Format: { x, tilesAboveGround } - positioned between platforms to avoid overlap
      { x: 200, tilesAboveGround: 3 },
      { x: 600, tilesAboveGround: 4 },
      { x: 950, tilesAboveGround: 3.5 },
      { x: 1250, tilesAboveGround: 4.5 },
      { x: 1550, tilesAboveGround: 3 },
      { x: 1850, tilesAboveGround: 4 },
      { x: 2150, tilesAboveGround: 3.5 },
      { x: 2450, tilesAboveGround: 4 },
      { x: 2750, tilesAboveGround: 3 },
      { x: 3050, tilesAboveGround: 4.5 },
      { x: 3350, tilesAboveGround: 3.5 },
      { x: 3650, tilesAboveGround: 4 },
      { x: 3950, tilesAboveGround: 3 },
      { x: 4250, tilesAboveGround: 4.5 }
    ];
    
    blockPositions.forEach((pos, index) => {
      // Calculate Y position relative to ground
      const yPos = this.GROUND_Y - (pos.tilesAboveGround * TILE_HEIGHT) - (this.GROUND_HEIGHT / 2) - (BLOCK_SIZE / 2);
      
      const block = this.add.rectangle(pos.x, yPos, BLOCK_SIZE, BLOCK_SIZE, 0x22c55e);
      block.setStrokeStyle(4, 0x111111);
      block.blockId = index;
      this.physics.add.existing(block, true); // enable physics body for overlap detection
      this.questionBlocks.add(block);
      
      // Add OSH icon text - centered in the box
      const iconText = this.add.text(pos.x, yPos, hazardIcons[index % hazardIcons.length], {
        fontSize: '26px',
        fontWeight: 'bold',
        color: '#111'
      });
      iconText.setOrigin(0.5, 0.5); // Center the text both horizontally and vertically
    });
    
    this.physics.add.overlap(this.player, this.questionBlocks, this.handleQuestionBlock, null, this);
  }

  createCoins() {
    this.coins = this.physics.add.group();
    
    // Platform X positions to avoid
    const platformXPositions = [300, 500, 800, 1100, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500, 3800, 4100, 4400, 4700, 5000];
    const platformWidth = 150;
    
    // Question block positions to avoid
    const questionBlockXPositions = [200, 600, 950, 1250, 1550, 1850, 2150, 2450, 2750, 3050, 3350, 3650, 3950, 4250];
    const blockSize = 60; // Block size + margin
    
    // Spawn fewer coins in safe zones
    const minY = 100;  // Top of play area
    const maxY = this.GROUND_Y - this.GROUND_HEIGHT - 40;  // Above ground
    
    for (let i = 0; i < 25; i++) {
      let x, y;
      let validPosition = false;
      let attempts = 0;
      
      // Keep trying until we find a position that doesn't overlap
      while (!validPosition && attempts < 100) {
        x = 150 + Math.random() * (this.WORLD_WIDTH - 300);
        y = minY + Math.random() * (maxY - minY);
        attempts++;
        
        validPosition = true;
        
        // Check if coin overlaps with any platform
        for (let platX of platformXPositions) {
          if (Math.abs(x - platX) < platformWidth / 2 + 20) {
            validPosition = false;
            break;
          }
        }
        
        // Check if coin overlaps with any question block
        if (validPosition) {
          for (let blockX of questionBlockXPositions) {
            if (Math.abs(x - blockX) < blockSize && Math.abs(y - (this.GROUND_Y - 200)) < 150) {
              validPosition = false;
              break;
            }
          }
        }
      }
      
      if (validPosition) {
        const coin = this.add.circle(x, y, 10, 0xffd700);
        this.physics.add.existing(coin);
        coin.body.setAllowGravity(false);
        this.coins.add(coin);
      }
    }
    
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
  }

  createWeapon() {
    // Weapon display group for melee attacks
    this.weapons = this.add.group();
  }

  meleeAttack() {
    // Play attack sound (non-blocking)
    this.playSound(600, 0.15, 0.15);
    
    // Create an extended wrench that sits outside the player's body
    const isRight = this.playerDirection > 0;
    const handleLength = 90;
    const startX = this.player.x + (this.playerDirection * 32); // mount near the player's hand
    const centerY = this.player.y - 2;
    
    const weaponContainer = this.add.container(startX, centerY);
    
    // Long handle in safety-yellow
    const handle = this.add.rectangle(handleLength / 2, 0, handleLength, 10, 0xf4d23b);
    handle.setStrokeStyle(2, 0xc08a00);
    
    // Red wrench head parked fully outside the body
    const headBaseX = handleLength - 8;
    const headMain = this.add.rectangle(headBaseX, 0, 32, 32, 0xd90429);
    headMain.setStrokeStyle(2, 0x990019);
    const headTop = this.add.rectangle(headBaseX + 10, -14, 26, 10, 0xd90429);
    const headBottom = this.add.rectangle(headBaseX + 10, 14, 26, 10, 0xd90429);
    const headGap = this.add.rectangle(headBaseX + 2, 0, 12, 8, 0x1a1a1a);
    
    weaponContainer.add([handle, headMain, headTop, headBottom, headGap]);
    
    // Mirror when facing left so the head still points forward
    if (!isRight) {
      weaponContainer.scaleX = -1;
    }
    
    weaponContainer.setDepth(100);
    this.weapons.add(weaponContainer);
    
    // Check collision with monsters once immediately
    const weaponBounds = weaponContainer.getBounds();
    const monstersToDestroy = [];
    
    this.monsters.children.entries.forEach(monster => {
      if (Phaser.Geom.Rectangle.Overlaps(weaponBounds, monster.getBounds())) {
        monstersToDestroy.push(monster);
      }
    });
    
    // Destroy hit monsters and create coins
    monstersToDestroy.forEach(monster => {
      const coin = this.add.circle(monster.x, monster.y, 10, 0xffd700);
      this.physics.add.existing(coin);
      coin.body.setAllowGravity(false);
      coin.body.setVelocity(0, -100);
      this.coins.add(coin);
      
      this.cameras.main.flash(100, 255, 255, 255);
      monster.destroy();
      
      // Play monster defeat sound (victory chime)
      this.playSound(800, 0.1, 0.25);
      this.time.delayedCall(80, () => {
        this.playSound(1000, 0.1, 0.2);
      });
    });
    
    // Remove weapon quickly (brief flash only)
    this.time.delayedCall(120, () => {
      if (weaponContainer && weaponContainer.active) {
        weaponContainer.destroy();
      }
    });
  }



  handleMonsterCollision(player, monster) {
    // Extra safety check - ignore if question is active
    if (this.questionActive) return;
    
    // Check if player is already invincible
    if (this.playerInvincible) return;

    if (this.playerState.isAttacking) {
      // Player defeats monster
      monster.destroy();
      
      // Create coin reward
      const coin = this.add.circle(monster.x, monster.y, 10, 0xffd700);
      this.physics.add.existing(coin);
      coin.body.setAllowGravity(false);
      coin.body.setVelocity(0, -100);
      this.coins.add(coin);
    } else {
      // Set invincible flag immediately to prevent multiple hits
      this.playerInvincible = true;
      
      // Play hit sound (low descending tone)
      this.playSound(300, 0.15, 0.3);
      this.time.delayedCall(100, () => {
        this.playSound(200, 0.2, 0.25);
      });
      
      // Player loses life
      if (this.onLifeLost) {
        this.onLifeLost();
      }
      
      // Show -1 popup text
      const popupText = this.add.text(this.player.x, this.player.y - 40, '-1', {
        fontSize: '28px',
        color: '#ff5252',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      });
      popupText.setOrigin(0.5, 0.5);
      this.tweens.add({
        targets: popupText,
        y: popupText.y - 40,
        alpha: 0,
        duration: 1000,
        onComplete: () => popupText.destroy()
      });
      
      // Brief invincibility (don't teleport player)
      this.player.setAlpha(0.5);
      
      // Disable monster collision temporarily
      if (this.monsterOverlapCollider) {
        this.monsterOverlapCollider.active = false;
      }
      
      this.time.delayedCall(2000, () => {
        this.player.setAlpha(1);
        // Re-enable monster collision
        if (this.monsterOverlapCollider) {
          this.monsterOverlapCollider.active = true;
        }
        // Remove invincibility flag
        this.playerInvincible = false;
      });
    }
  }

  handleQuestionBlock(player, block) {
    if (!this.usedQuestionBlocks.has(block.blockId)) {
      this.usedQuestionBlocks.add(block.blockId);
      
      // Change block color to indicate it's been used
      block.setFillStyle(0x9e9e9e);
      
      // Mark question as active and DISABLE monster overlap to prevent any collisions
      this.questionActive = true;
      if (this.monsterOverlapCollider) {
        this.monsterOverlapCollider.active = false;
      }
      
      // Stop background music during pause
      this.stopBackgroundMusic();

      // Pause the game
      this.scene.pause();
      
      // Trigger question modal in React
      if (this.onQuestionBlock) {
        this.onQuestionBlock(block.blockId);
      }
    }
  }

  collectCoin(player, coin) {
    const coinX = coin.x;
    const coinY = coin.y;
    coin.destroy();
    
    // Play coin collect sound (bright ding)
    this.playSound(900, 0.08, 0.2);
    this.time.delayedCall(50, () => {
      this.playSound(1200, 0.08, 0.15);
    });
    
    if (this.onCoinCollect) {
      this.onCoinCollect();
    }
    
    // Show +1 popup text
    const popupText = this.add.text(coinX, coinY, '+1', {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    popupText.setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: popupText,
      y: popupText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => popupText.destroy()
    });
  }

  respawnPlayer() {
    if (this.questionActive) return; // avoid respawn during question modal
    
    // Reset player position to starting point ON the ground
    const startY = this.GROUND_Y - (this.GROUND_HEIGHT / 2) - 24;  // 24 = half of player height
    this.player.x = 100;
    this.player.y = startY;
    this.player.body.setVelocity(0, 0);
    
    // Brief invincibility
    this.player.setAlpha(0.5);
    this.time.delayedCall(2000, () => {
      this.player.setAlpha(1);
    });
  }

  setAura(color = 0x00e676, alpha = 0.18) {
    // Aura removed - this method now does nothing
    // Kept for compatibility with existing effect code
  }

  showCorrectEffect() {
    // Play correct answer sound (cheerful ascending tones)
    this.playSound(600, 0.1, 0.2);
    this.time.delayedCall(80, () => {
      this.playSound(800, 0.1, 0.2);
    });
    this.time.delayedCall(160, () => {
      this.playSound(1000, 0.15, 0.25);
    });
    
    const tick = this.add.text(this.player.x - 6, this.player.y - 38, '✔', {
      fontSize: '18px',
      color: '#00e676',
      fontStyle: 'bold'
    });
    this.tweens.add({
      targets: tick,
      y: tick.y - 20,
      alpha: 0,
      duration: 600,
      onComplete: () => tick.destroy()
    });
    
    // Show +4 popup text
    const popupText = this.add.text(this.player.x + 20, this.player.y - 38, '+4', {
      fontSize: '24px',
      color: '#00e676',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    popupText.setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: popupText,
      y: popupText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => popupText.destroy()
    });
  }

  showIncorrectEffect() {
    // Play incorrect answer sound (sad descending tones)
    this.playSound(500, 0.15, 0.25);
    this.time.delayedCall(100, () => {
      this.playSound(350, 0.15, 0.25);
    });
    this.time.delayedCall(200, () => {
      this.playSound(250, 0.2, 0.3);
    });
    
    if (this.playerVisuals?.helmetBand) {
      const original = this.playerVisuals.helmetBand.fillColor;
      this.playerVisuals.helmetBand.fillColor = 0xff5252;
      this.time.delayedCall(600, () => {
        this.playerVisuals.helmetBand.fillColor = original;
      });
    }
    const spark = this.add.text(this.player.x - 6, this.player.y - 44, '⚡', {
      fontSize: '18px',
      color: '#ff5252',
      fontStyle: 'bold'
    });
    this.tweens.add({
      targets: spark,
      y: spark.y - 12,
      alpha: 0,
      duration: 500,
      onComplete: () => spark.destroy()
    });
    
    // Show -1 popup text
    const popupText = this.add.text(this.player.x + 20, this.player.y - 44, '-1', {
      fontSize: '24px',
      color: '#ff5252',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    popupText.setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: popupText,
      y: popupText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => popupText.destroy()
    });
  }

  playBackgroundMusic() {
    // Create an engaging looping background melody
    if (!this.audioContext) return;
    
    // Stop any existing loop and timers
    if (this.backgroundMusicLoop) {
      this.backgroundMusicLoop.remove();
      this.backgroundMusicLoop = null;
    }
    
    // Clear all note timers
    this.backgroundMusicNoteTimers.forEach(timer => {
      if (timer) timer.remove();
    });
    this.backgroundMusicNoteTimers = [];
    
    // Stop any existing background oscillators
    this.backgroundMusicOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.backgroundMusicOscillators = [];
    
    console.log('Background music started');
    
    // Create a more interesting melody pattern (8 notes + rhythm)
    // Based on a catchy game music style
    const melodySequence = [
      { freq: 262, duration: 0.2, delay: 0 },      // C4
      { freq: 330, duration: 0.2, delay: 0.22 },   // E4
      { freq: 392, duration: 0.2, delay: 0.44 },   // G4
      { freq: 523, duration: 0.25, delay: 0.66 },  // C5
      { freq: 392, duration: 0.2, delay: 0.95 },   // G4
      { freq: 330, duration: 0.2, delay: 1.17 },   // E4
      { freq: 294, duration: 0.25, delay: 1.39 },  // D4
      { freq: 262, duration: 0.3, delay: 1.68 },   // C4
      { freq: 349, duration: 0.2, delay: 2.02 },   // F4
      { freq: 392, duration: 0.2, delay: 2.24 },   // G4
      { freq: 440, duration: 0.25, delay: 2.46 },  // A4
      { freq: 523, duration: 0.25, delay: 2.75 },  // C5
      { freq: 440, duration: 0.2, delay: 3.04 },   // A4
      { freq: 392, duration: 0.2, delay: 3.26 },   // G4
      { freq: 349, duration: 0.25, delay: 3.48 },  // F4
      { freq: 330, duration: 0.3, delay: 3.77 }    // E4
    ];
    
    const totalLoopTime = 4.2; // seconds for full sequence
    
    // Create looping background pattern
    const loop = () => {
      // Play the melody sequence
      melodySequence.forEach(note => {
        const timer = this.time.delayedCall(note.delay * 1000, () => {
          this.playBackgroundNote(note.freq, note.duration, 0.12);
        });
        this.backgroundMusicNoteTimers.push(timer);
      });
      
      // Schedule next loop
      this.backgroundMusicLoop = this.time.delayedCall(totalLoopTime * 1000, loop);
    };
    
    // Start the loop
    loop();
  }
  
  stopBackgroundMusic() {
    // Stop background music
    if (this.backgroundMusicLoop) {
      this.backgroundMusicLoop.remove();
      this.backgroundMusicLoop = null;
    }
    
    // Remove all note timers
    this.backgroundMusicNoteTimers.forEach(timer => {
      if (timer) timer.remove();
    });
    this.backgroundMusicNoteTimers = [];
    
    this.backgroundMusicOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.backgroundMusicOscillators = [];
    
    console.log('Background music stopped');
  }
  
  playBackgroundNote(frequency, duration, volume) {
    // Play a note for background music
    try {
      if (!this.audioContext) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
      
      this.backgroundMusicOscillators.push(oscillator);
    } catch (e) {
      console.error('Background note error:', e);
    }
  }

  playWinSound() {
    console.log('Win sound triggered');
    // Stop background music
    this.stopBackgroundMusic();
    
    // Triumphant ascending arpeggio
    const winNotes = [
      { freq: 262, duration: 0.15, delay: 0 },    // C4
      { freq: 330, duration: 0.15, delay: 0.17 }, // E4
      { freq: 392, duration: 0.15, delay: 0.34 }, // G4
      { freq: 523, duration: 0.2, delay: 0.51 },  // C5
      { freq: 659, duration: 0.3, delay: 0.75 }   // E5
    ];
    
    winNotes.forEach(note => {
      setTimeout(() => {
        this.playSound(note.freq, note.duration, 0.4);
      }, note.delay * 1000);
    });
  }

  playLoseSound() {
    console.log('Lose sound triggered');
    // Stop background music
    this.stopBackgroundMusic();
    
    // Sad descending progression
    const loseNotes = [
      { freq: 392, duration: 0.2, delay: 0 },     // G4
      { freq: 330, duration: 0.2, delay: 0.22 },  // E4
      { freq: 294, duration: 0.2, delay: 0.44 },  // D4
      { freq: 262, duration: 0.35, delay: 0.66 }  // C4
    ];
    
    loseNotes.forEach(note => {
      setTimeout(() => {
        this.playSound(note.freq, note.duration, 0.35);
      }, note.delay * 1000);
    });
  }

  playSound(frequency, duration, volume) {
    // Generate sound using Web Audio API
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
      
      console.log(`Sound played: ${frequency}Hz for ${duration}s`);
    } catch (e) {
      console.error('Sound error:', e);
    }
  }

  // Called from React when question is answered
  resumeGame(isCorrect) {
    this.questionActive = false;
    // Re-enable monster overlap detection
    if (this.monsterOverlapCollider) {
      this.monsterOverlapCollider.active = true;
    }
    this.scene.resume();
    
    // Restart background music immediately
    console.log('Resuming background music');
    this.playBackgroundMusic();
    
    // Visual feedback for answers
    if (isCorrect) {
      this.showCorrectEffect();
    } else {
      this.showIncorrectEffect();
    }
    // Do not respawn/reset position on question answers; lives are handled in React
  }

  update() {
    // If scene is paused (question modal), stop updates
    if (this.scene.isPaused()) return;
    
    // Check if player and cursors exist
    if (!this.player || !this.cursors) {
      console.error('Player or cursors not initialized!');
      return;
    }

    // === SAFETY CHECK: Prevent player from going below ground ===
    // Even with collideWorldBounds, this ensures player never clips through
    const maxPlayerY = this.GROUND_Y - (this.GROUND_HEIGHT / 2) - 24; // 24 = half player height
    if (this.player.y > maxPlayerY) {
      this.player.y = maxPlayerY;
      this.player.body.setVelocityY(0);
    }

    // Player movement - try both cursor keys and manual keys
    const leftPressed = this.cursors.left.isDown || this.leftKey.isDown;
    const rightPressed = this.cursors.right.isDown || this.rightKey.isDown;
    const upPressed = this.cursors.up.isDown || this.upKey.isDown;
    
    if (leftPressed) {
      this.player.body.setVelocityX(-200);
      this.playerDirection = -1;
    } else if (rightPressed) {
      this.player.body.setVelocityX(200);
      this.playerDirection = 1;
    } else {
      this.player.body.setVelocityX(0);
    }
    
    // Jump
    if (upPressed && this.player.body.touching.down) {
      this.player.body.setVelocityY(-520);
      // Play jump sound
      this.playSound(400, 0.12, 0.3);
    }
    
    // Attack - melee strike with wrench
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.meleeAttack();
    }
    
    // Monster AI - prevent falling
    this.monsters.children.entries.forEach(monster => {
      // Disable gravity for monsters so tweens control movement
      monster.body.setGravityY(-1);
    });
  }
}
