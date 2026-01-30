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
  fighter.gotoAndStop(29);
  app.stage.addChild(fighter);

  // =====================================================
  // HITBOX POLYGONS (SAME POINT COUNT!)
  // =====================================================

  const hitTriangleNormal = new PIXI.Polygon([
     0,  -260,
    -25, -160,
    -95, -60,
    -40, -20,
     40, -20,
     95, -60,
     25, -160
  ]);

  const hitTriangleBanked = new PIXI.Polygon([
     0,  -260,
    -25, -130,
    -35, -50,
    -30, -20,
     30, -20,
     35, -50,
     25, -130
  ]);

  // =====================================================
  // HITBOX DEBUG
  // =====================================================
  const hitboxDebug = new PIXI.Graphics();
  fighter.addChild(hitboxDebug);

  function redrawHitbox(points) {
    hitboxDebug.clear();
    hitboxDebug
      .beginFill(0xff0000, 0.6)
      .drawPolygon(points)
      .endFill();
  }

  // =====================================================
  // POLYGON INTERPOLATION HELPERS
  // =====================================================
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpPolygon(polyA, polyB, t) {
    const result = [];
    for (let i = 0; i < polyA.points.length; i++) {
      result[i] = lerp(polyA.points[i], polyB.points[i], t);
    }
    return result;
  }

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
    obs.beginFill(0xf00000, 1);
    obs.drawRoundedRect(-25, -25, 50, 50, 8);
    obs.endFill();

    obs.x = Math.random() * app.screen.width;
    obs.y = -50;
    obs.speed = OBSTACLE_SPEED;

    app.stage.addChild(obs);
    obstacles.push(obs);
  }

  // =====================================================
  // COLLISION
  // =====================================================
  function polygonHitTest(sprite, obstacle) {
    if (!sprite.getBounds().intersects(obstacle.getBounds())) return false;
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

    // Background
    background.tilePosition.y += 5 * delta;

    // Movement
    if (keys.left) fighter.x -= MOVE_SPEED * delta;
    if (keys.right) fighter.x += MOVE_SPEED * delta;

    fighter.x = Math.max(
      fighter.width / 2,
      Math.min(app.screen.width - fighter.width / 2, fighter.x)
    );

    // Banking logic
    let targetBank = (keys.left || keys.right) ? MAX_BANK_FRAMES : 0;
    const speed = targetBank > currentBank ? BANK_IN_SPEED : BANK_OUT_SPEED;

    currentBank += Math.sign(targetBank - currentBank) * speed * delta;
    currentBank = Math.max(0, Math.min(MAX_BANK_FRAMES, currentBank));

    fighter.gotoAndStop(CENTER_FRAME - Math.round(currentBank));

    if (keys.right) facing = -1;
    if (keys.left) facing = 1;
    fighter.scale.x = facing;

    // =================================================
    // HITBOX EASING (THE IMPORTANT PART)
    // =================================================
    const bankT = currentBank / MAX_BANK_FRAMES;

    // ease-in curve (feels better than linear)
    const easedT = bankT * bankT;

    const blendedPoints = lerpPolygon(
      hitTriangleNormal,
      hitTriangleBanked,
      easedT
    );

    fighter.hitArea = new PIXI.Polygon(blendedPoints);
    redrawHitbox(blendedPoints);

    // Obstacles
    spawnTimer += delta;
    if (spawnTimer > SPAWN_INTERVAL) {
      spawnTimer = 0;
      createObstacle();
    }

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
