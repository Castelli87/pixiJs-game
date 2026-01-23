// (async () => {
//   const app = new PIXI.Application({
//     resizeTo: window,
//     backgroundAlpha: 0,
//     antialias: true,
//   });

//   document.body.appendChild(app.view);

//   const sheet = await PIXI.Assets.load("./assets/sprites.json");

//   const frames = Object.keys(sheet.textures)
//     .sort((a, b) => {
//       const na = parseInt(a.replace("sprite", ""));
//       const nb = parseInt(b.replace("sprite", ""));
//       return na - nb;
//     })
//     .map(key => sheet.textures[key]);

//   const fighter = new PIXI.AnimatedSprite(frames);

//   fighter.anchor.set(0.5, 1);
//   fighter.x = app.screen.width / 2;
//   fighter.y = app.screen.height * 0.8;

//   fighter.animationSpeed = 0.14;
//   fighter.loop = true;
//   fighter.play();

//   app.stage.addChild(fighter);

//   window.addEventListener("resize", () => {
//     fighter.x = app.screen.width / 2;
//     fighter.y = app.screen.height * 0.8;
//   });
// })();

(async () => {
  const app = new PIXI.Application({
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
  });

  document.body.appendChild(app.view);

  const sheet = await PIXI.Assets.load("./assets/sprites__.json");
  const space = await  PIXI.Assets.load("./assets/space.jpg");

  const textures = Object.keys(sheet.textures)
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? 0, 10);
      const nb = parseInt(b.match(/\d+/)?.[0] ?? 0, 10);
      return na - nb;
    })
    .map(key => sheet.textures[key]);

  const fighter = new PIXI.AnimatedSprite(textures);
  const background =new PIXI.TilingSprite(space)

  background.width = app.screen.width;
  background.height = app.screen.height;

  // ---- Movement state
const keys = {
  left: false,
  right: false,
};

const MOVE_SPEED = 15;

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'ArrowRight') keys.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'ArrowRight') keys.right = false;
});


   
  fighter.anchor.set(0.5, 1);
  fighter.x = app.screen.width / 2;
  fighter.y = app.screen.height * 0.8;

  fighter.animationSpeed = 0.15; // very slow
  fighter.loop = false;
  app.stage.addChild(background);
  app.stage.addChild(fighter);

app.ticker.add((delta) => {
  // background scroll
  background.tilePosition.y += 5 * delta;

  // plane movement
  if (keys.left) {
    fighter.x -= MOVE_SPEED * delta;
  }

  if (keys.right) {
    fighter.x += MOVE_SPEED * delta;
  }

  // keep plane inside screen
  fighter.x = Math.max(
    fighter.width / 2,
    Math.min(app.screen.width - fighter.width / 2, fighter.x)
  );
});


  let forward = true;

  fighter.onComplete = () => {
    forward = !forward;

    fighter.animationSpeed = forward ? 0.15 : -0.15;
    fighter.play();
  };

  fighter.play();

  window.addEventListener("resize", () => {
    fighter.x = app.screen.width / 2;
    fighter.y = app.screen.height * 0.8;
  });
})();

// add the commands to move the plane L-R

// Add the feature to flight without rotation and if the command is pressed for to long is movin in
//in that specific side and if a little movement actionate few frames if is longer rotate once 

// Add some bomb and if touched is Game Over 

// Revise the code in a better way 