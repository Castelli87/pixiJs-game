# 🚀 PixiJS Arcade – Missile Dodge Game

A small arcade-style game built with **PixiJS**.

You control a fighter ship and dodge incoming missiles.
If you collide, a layered explosion plays and the game ends.

---

## 🎮 Controls

- ⬅ Arrow Left → Move left  
- ➡ Arrow Right → Move right  
- D → Toggle debug mode (show hitboxes)

---

## 🧠 Features

- Animated fighter with banking effect
- Dynamic polygon hitbox interpolation
- Missile spawning system
- Polygon vs bounds collision detection
- Explosion spritesheet animation (plays twice on impact) 
- Clean freeze state on game over

---

## 📦 Requirements

You only need:

- Node.js (v18+ recommended)
- A simple local server

---

## 🛠 Installation (From Scratch)

### 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd <your-project-folder>
```

## Run a local server

### Using npx serve:

```bash
npx serve 
```

## Then open:

```bash
http://localhost:3000
```

### IMPORTANT 
##  🌿 Branch Structure
The repository branches represent different development stages of the project:
- main → Initial starting point (basic setup)
- missile → Added missile spawning and collision detection
- feature/explosion → Collision handling with explosion animation

Each branch shows a progressive step in the development process.