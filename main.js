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
  const missileSheet = await PIXI.Assets.load('./assets/missile-sprite.json');
  const explosionSheet = await PIXI.Assets.load('./assets/sprites-explotion.json');

  const missileTexture = missileSheet.textures['missile.png'];

  const fighterTextures = Object.keys(sheet.textures)
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const nb = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return na - nb;
    })
    .map(key => sheet.textures[key]);

  const explosionTextures = Object.keys(explosionSheet.textures)
    .sort((a, b) => Number(a) - Number(b))
    .map(key => explosionSheet.textures[key]);

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
  const fighter = new PIXI.AnimatedSprite(fighterTextures);
  fighter.anchor.set(0.5, 1);
  fighter.x = app.screen.width / 2;
  fighter.y = app.screen.height * 0.8;
  fighter.gotoAndStop(29);
  app.stage.addChild(fighter);

  // =====================================================
  // HITBOX
  // =====================================================
  const hitTriangleNormal = new PIXI.Polygon([
     0, -260,
    -25, -160,
    -95,  -60,
    -40,  -20,
     40,  -20,
     95,  -60,
     25, -160
  ]);

  const hitTriangleBanked = new PIXI.Polygon([
     0, -260,
    -25, -130,
    -35,  -50,
    -30,  -20,
     30,  -20,
     35,  -50,
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

  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
  });

  // =====================================================
  // MOVEMENT CONFIG
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
    const obs = new PIXI.Sprite(missileTexture);
    obs.anchor.set(0.5, 0.85);
    obs.x = Math.random() * app.screen.width;
    obs.y = -100;
    obs.scale.set(0.25);
    obs.speed = OBSTACLE_SPEED;

    app.stage.addChild(obs);
    obstacles.push(obs);
    const debugDot = new PIXI.Graphics();
debugDot.beginFill(0x00ff00);
debugDot.drawCircle(0, 0, 9);
debugDot.endFill();

obs.addChild(debugDot);
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
  // EXPLOSION
  // =====================================================
  let explosionContainer = null;

function spawnExplosion(x, y) {

  const explosion = new PIXI.AnimatedSprite(explosionTextures);

  explosion.anchor.set(0.5);
  explosion.position.set(x, y);
  explosion.scale.set(0.25);
  explosion.animationSpeed = 0.6;
  explosion.loop = false;
  explosion.blendMode = PIXI.BLEND_MODES.ADD;

  let playCount = 0;

  explosion.onComplete = () => {
    playCount++;

    if (playCount < 2) {
      explosion.gotoAndPlay(0);
    } else {
      explosion.destroy();   // 🔥 remove explosion completely
      showGameOverText();
    }
  };

  app.stage.addChild(explosion);
  explosion.play();
}


  function showGameOverText() {
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
  // GAME STATE
  // =====================================================
  let isGameOver = false;

  // =====================================================
  // GAME LOOP
  // =====================================================
 app.ticker.add((delta) => {

  if (isGameOver) return;   // NOTHING moves anymore

  // Background
  background.tilePosition.y += 5 * delta;

  // Fighter movement
  if (keys.left) fighter.x -= MOVE_SPEED * delta;
  if (keys.right) fighter.x += MOVE_SPEED * delta;

  fighter.x = Math.max(
    fighter.width / 2,
    Math.min(app.screen.width - fighter.width / 2, fighter.x)
  );

  // Banking
  let targetBank = (keys.left || keys.right) ? MAX_BANK_FRAMES : 0;
  const speed = targetBank > currentBank ? BANK_IN_SPEED : BANK_OUT_SPEED;

  currentBank += Math.sign(targetBank - currentBank) * speed * delta;
  currentBank = Math.max(0, Math.min(MAX_BANK_FRAMES, currentBank));

  fighter.gotoAndStop(CENTER_FRAME - Math.round(currentBank));

  if (keys.right) facing = -1;
  if (keys.left) facing = 1;
  fighter.scale.x = facing;

  const bankT = currentBank / MAX_BANK_FRAMES;
  const easedT = bankT * bankT;

    const blendedPoints = lerpPolygon(
      hitTriangleNormal,
      hitTriangleBanked,
      easedT
    );

    fighter.hitArea = new PIXI.Polygon(blendedPoints);
  redrawHitbox(blendedPoints);
  // Spawn obstacles
  spawnTimer += delta;
  if (spawnTimer > SPAWN_INTERVAL) {
    spawnTimer = 0;
    createObstacle();
  }

  // Update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.y += obs.speed * delta;

    if (polygonHitTest(fighter, obs)) {

      isGameOver = true;

      const x = fighter.x;
      const y = fighter.y - 100;

      fighter.destroy();

      obstacles.forEach(o => o.destroy());
      obstacles.length = 0;

      spawnExplosion(x, y);

      return;
    }

    if (obs.y > app.screen.height + 50) {
      obs.destroy();
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
  });

})();
