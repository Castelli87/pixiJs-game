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
  fighter.anchor.set(0.5, 1);
  fighter.x = app.screen.width / 2;
  fighter.y = app.screen.height * 0.8;
  app.stage.addChild(fighter);

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

  const CENTER_FRAME = 29;       // true neutral frame
  const MAX_BANK_FRAMES = 8;     // frames 15 → 11
  const MIRROR_THRESHOLD = 1.2;  // when mirroring is allowed

  const BANK_IN_SPEED = 0.35;    // fast into bank
  const BANK_OUT_SPEED = 0.55;   // slow back to idle

  let currentBank = 0;
  let facing = 1; // 1 = normal, -1 = mirrored

  fighter.gotoAndStop(CENTER_FRAME);

  // =====================================================
  // GAME LOOP
  // =====================================================
  app.ticker.add((delta) => {
    // --------------------
    // Background
    // --------------------
    background.tilePosition.y += 5 * delta;

    // --------------------
    // Movement
    // --------------------
    if (keys.left) fighter.x -= MOVE_SPEED * delta;
    if (keys.right) fighter.x += MOVE_SPEED * delta;

    fighter.x = Math.max(
      fighter.width / 2,
      Math.min(app.screen.width - fighter.width / 2, fighter.x)
    );

    // --------------------
    // BANKING STATE
    // --------------------
    let targetBank = 0;
    if (keys.left || keys.right) targetBank = MAX_BANK_FRAMES;

    const speed =
      targetBank > currentBank ? BANK_IN_SPEED : BANK_OUT_SPEED;

    if (currentBank < targetBank) currentBank += speed * delta;
    if (currentBank > targetBank) currentBank -= speed * delta;

    currentBank = Math.max(0, Math.min(MAX_BANK_FRAMES, currentBank));

    // --------------------
    // FRAME SELECTION
    // (always LEFT-side frames)
    // --------------------
    const frameIndex = CENTER_FRAME - Math.round(currentBank);
    fighter.gotoAndStop(frameIndex);

    // --------------------
    // SAFE MIRROR (DELAYED)
    // --------------------
    if (keys.right) facing = -1;
    if (keys.left) facing = 1;

    if (currentBank > MIRROR_THRESHOLD) {
      fighter.scale.x = facing;
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
