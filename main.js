(async () => {
  // =====================================================
  // APP
  // =====================================================
  const app = new PIXI.Application({
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
  });

  document.body.appendChild(app.view);

  // =====================================================
  // ASSETS
  // =====================================================
  const sheet = await PIXI.Assets.load('./assets/sprites__.json');
  const space = await PIXI.Assets.load('./assets/space.jpg');

  const textures = Object.keys(sheet.textures)
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const nb = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return na - nb;
    })
    .map((key) => sheet.textures[key]);

  // =====================================================
  // BACKGROUND
  // =====================================================
  const background = new PIXI.TilingSprite(space);
  background.width = app.screen.width;
  background.height = app.screen.height;
  app.stage.addChild(background);

  // =====================================================
  // FIGHTER
  // =====================================================
  const fighter = new PIXI.AnimatedSprite(textures);
  fighter.anchor.set(0.5, 1); // bottom-center
  fighter.x = app.screen.width / 2;
  fighter.y = app.screen.height * 0.8;
  app.stage.addChild(fighter);

  fighter.gotoAndStop(29);

  // =====================================================
  // HIT AREA (PIXIJ v8 CORRECT)
  // =====================================================

  /**
   * Local coordinates relative to fighter anchor (0.5, 1)
   *  (0,0) is bottom-center of sprite
   */
const hitTriangle = new PIXI.Polygon([
   0,  -250,   // nose (LONGER)
  -70, -65,    // left wing root
   70, -65     // right wing root
]);


  // LOGIC hit area
  fighter.hitArea = hitTriangle;

  // DEBUG VISUAL (red triangle)
  const hitboxDebug = new PIXI.Graphics();
  hitboxDebug
    .beginFill(0xFF0000, 0.50)
    .drawPolygon(hitTriangle.points)
    .endFill();

  fighter.addChild(hitboxDebug);

  // =====================================================
  // INPUT
  // =====================================================
  const keys = { left: false, right: false };

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
  });

  // =====================================================
  // MOVEMENT + BANKING CONFIG
  // =====================================================
  const MOVE_SPEED = 15;

  const CENTER_FRAME = 29;
  const MAX_BANK_FRAMES = 8;
  const MIRROR_THRESHOLD = 1.2;

  const BANK_IN_SPEED = 0.35;
  const BANK_OUT_SPEED = 0.55;

  let currentBank = 0;
  let facing = 1;

  // =====================================================
  // OBSTACLES
  // =====================================================
  const obstacles = [];
  const OBSTACLE_SPEED = 6;
  const SPAWN_INTERVAL = 90;
  let spawnTimer = 0;

  function createObstacle() {
    const obs = new PIXI.Graphics();
    obs.beginFill(0xf00000,1);
    obs.drawRoundedRect(-25, -25, 50, 50, 8);
    obs.endFill();

    obs.x = Math.random() * app.screen.width;
    obs.y = -50;
    obs.speed = OBSTACLE_SPEED;

    app.stage.addChild(obs);
    obstacles.push(obs);
  }

  // =====================================================
  // COLLISION (POLYGON AWARE)
  // =====================================================
  function polygonHitTest(sprite, obstacle) {
    // quick reject using bounds
    if (!sprite.getBounds().intersects(obstacle.getBounds())) return false;

    // convert obstacle center into fighter local space
    const localPoint = sprite.toLocal(obstacle.position);

    return sprite.hitArea.contains(localPoint.x, localPoint.y);
  }

  // =====================================================
  // GAME OVER
  // =====================================================
  let isGameOver = false;

  function gameOver() {
    if (isGameOver) return;
    isGameOver = true;

    app.ticker.stop();

    const text = new PIXI.Text('GAME OVER', {
      fontSize: 64,
      fill: 0xffffff,
      fontWeight: 'bold',
    });

    text.anchor.set(0.5);
    text.x = app.screen.width / 2;
    text.y = app.screen.height / 2;

    app.stage.addChild(text);
  }

  // =====================================================
  // GAME LOOP
  // =====================================================
  app.ticker.add((delta) => {
    if (isGameOver) return;

    // --------------------
    // Background
    // --------------------
    background.tilePosition.y += 5 * delta;

    // --------------------
    // Fighter movement
    // --------------------
    if (keys.left) fighter.x -= MOVE_SPEED * delta;
    if (keys.right) fighter.x += MOVE_SPEED * delta;

    fighter.x = Math.max(
      fighter.width / 2,
      Math.min(app.screen.width - fighter.width / 2, fighter.x)
    );

    // --------------------
    // Banking
    // --------------------
    let targetBank = 0;
    if (keys.left || keys.right) targetBank = MAX_BANK_FRAMES;

    const speed =
      targetBank > currentBank ? BANK_IN_SPEED : BANK_OUT_SPEED;

    if (currentBank < targetBank) currentBank += speed * delta;
    if (currentBank > targetBank) currentBank -= speed * delta;

    currentBank = Math.max(0, Math.min(MAX_BANK_FRAMES, currentBank));

    fighter.gotoAndStop(CENTER_FRAME - Math.round(currentBank));

    if (keys.right) facing = -1;
    if (keys.left) facing = 1;

    if (currentBank > MIRROR_THRESHOLD) {
      fighter.scale.x = facing;
    }

    // --------------------
    // Obstacles spawn
    // --------------------
    spawnTimer += delta;
    if (spawnTimer > SPAWN_INTERVAL) {
      spawnTimer = 0;
      createObstacle();
    }

    // --------------------
    // Obstacles movement + collision
    // --------------------
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.y += obs.speed * delta;

      if (polygonHitTest(fighter, obs)) {
        gameOver();
        return;
      }

      if (obs.y > app.screen.height + 50) {
        app.stage.removeChild(obs);
        obstacles.splice(i, 1);
      }
    }
  });

  // =====================================================
  // RESIZE
  // =====================================================
  window.addEventListener('resize', () => {
    background.width = app.screen.width;
    background.height = app.screen.height;
    fighter.x = app.screen.width / 2;
    fighter.y = app.screen.height * 0.8;
  });
})();
