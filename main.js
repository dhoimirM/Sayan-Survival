const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GROUND_LEVEL = 300;
const GOKU_X = 50;

const FRIEZA_SIZE = 40;
const CELL_SIZE = 40;
const GOKU_SIZE = 80;

const GOKU_IMAGE = new Image();
GOKU_IMAGE.src = "goku.png";

const CELL_IMAGE = new Image();
CELL_IMAGE.src = "cell-jr.png";

const FRIEZA_IMAGE = new Image();
FRIEZA_IMAGE.src = "frieza.png";

class Entity {
  constructor(x, y, width, height, image) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
  }

  draw(context) {
    context.drawImage(this.image, this.x, this.y, this.width, this.height);

    // Draw hitbox
    context.strokeStyle = "#ff000050";
    context.lineWidth = 1;
    context.strokeRect(this.x, this.y, this.width, this.height);
  }
}

class Goku extends Entity {
  constructor(x, y) {
    super(x, y, GOKU_SIZE, GOKU_SIZE, GOKU_IMAGE);
    this.jumpVelocity = 0;
    this.gravity = 0.8; // Force de gravité
    this.fallMultiplier = 1.5; // Multiplicateur de chute pour augmenter la vitesse de descente
    this.terminalVelocity = 50; // Vitesse terminale pour limiter la vitesse de chute
    this.trail = [];
  }

  update() {
    this.y += this.jumpVelocity;
    if (this.jumpVelocity > 0) {
      this.jumpVelocity += this.gravity * this.fallMultiplier;
    } else {
      this.jumpVelocity += this.gravity;
    }

    if (this.jumpVelocity > this.terminalVelocity) {
      this.jumpVelocity = this.terminalVelocity;
    }

    if (this.y > GROUND_LEVEL) {
      this.y = GROUND_LEVEL;
      this.jumpVelocity = 0;
    }

    this.trail.forEach((t) => {
      t.x -= 5;
    });
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 20) {
      this.trail.shift();
    }
  }

  draw(context) {
    context.fillStyle = "#D5840F";
    this.trail.forEach((pos) => {
      context.fillRect(pos.x + this.width / 2, pos.y + this.height / 2, 5, 5);
    });
    super.draw(context);
  }

  jump() {
    if (this.y === GROUND_LEVEL) {
      this.jumpVelocity = -20;
    }
  }
}

class Frieza extends Entity {
  constructor(x, speed) {
    super(
      x,
      GROUND_LEVEL - FRIEZA_SIZE * 1.3,
      FRIEZA_SIZE,
      FRIEZA_SIZE,
      FRIEZA_IMAGE
    );
    this.speed = speed;
    this.time = 0;
  }
  update() {
    this.x -= this.speed;

    this.y += Math.sin(this.time) * 2;
    this.time += 0.1;
  }
}

class Cell extends Entity {
  constructor(x, speed) {
    super(x, GROUND_LEVEL + CELL_SIZE, CELL_SIZE, CELL_SIZE, CELL_IMAGE);
    this.speed = speed;
  }
  update() {
    this.x -= this.speed;
  }
}

const collides = (entity1, entity2) => {
  return (
    entity1.x < entity2.x + entity2.width &&
    entity1.x + entity1.width > entity2.x &&
    entity1.y < entity2.y + entity2.height &&
    entity1.y + entity1.height > entity2.y
  );
};

class Game {
  constructor(context) {
    this.context = context;
    this.bestScore = localStorage.getItem("bestScore") || 0;
    this.goku = new Goku(GOKU_X, GROUND_LEVEL);
    this.entities = [this.goku];
    this.score = 0;
    this.speed = 5;
    this.play = true;
    this.spawnObstacle();
    document.addEventListener("keydown", () => {
      this.goku.jump();
    });

    document.getElementById("replayButton")?.addEventListener("click", () => {
      this.replay();
    });

    this.scoreInterval = setInterval(() => {
      this.increseScore();
    }, 100);
    this.speedInterval = setInterval(() => {
      this.increseSpeed();
    }, 1000);
    this.playMusic();
  }

  playMusic() {
    const backgroundMusic = document.getElementById("backgroundMusic");
    backgroundMusic?.play();
  }
  stopMusic() {
    const backgroundMusic = document.getElementById("backgroundMusic");
    backgroundMusic?.pause();
    backgroundMusic.currentTime = 0;
  }

  increseScore() {
    this.score++;
    if (Number(this.score) > Number(this.bestScore)) {
      this.bestScore = this.score;
      localStorage.setItem("bestScore", this.bestScore); // Update the best score in localStorage
    }
  }

  increseSpeed() {
    this.speed += 0.2;
  }

  spawnObstacle() {
    if (Math.random() < 0.5) {
      this.entities.push(new Cell(GAME_WIDTH, this.speed));
    } else {
      this.entities.push(new Frieza(GAME_WIDTH, this.speed));
    }

    setTimeout(() => {
      if (this.play) {
        this.spawnObstacle();
      }
    }, Math.max(500, 2000 - this.speed * 100));
  }

  update() {
    this.context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.drawScore();
    this.drawBestScore();
    this.context.fillStyle = "#800000";

    this.context.fillRect(
      0,
      GROUND_LEVEL + GOKU_SIZE,
      GAME_WIDTH,
      GAME_HEIGHT - (GROUND_LEVEL + GOKU_SIZE)
    );
    this.entities.forEach((entity) => {
      entity.update();
      entity.draw(this.context);
    });
    const isCollides = this.entities.some((entity) => {
      if (entity === this.goku) return false;
      return collides(this.goku, entity);
    });
    if (isCollides) {
      this.play = false;
      clearInterval(this.scoreInterval);
      clearInterval(this.speedInterval);
      this.stopMusic();
    }
  }

  drawScore() {
    this.context.font = "20px Arial";
    this.context.fillStyle = "#000000";
    this.context.fillText(`Score: ${this.score}`, 10, 30);
  }

  drawBestScore() {
    this.context.font = "20px Arial";
    this.context.fillStyle = "#000000";
    this.context.fillText(`Best Score: ${this.bestScore}`, 10, 50);
  }

  replay() {
    location.reload();
  }
}

const canvas = document.querySelector("canvas");
const context = canvas?.getContext("2d");
const game = new Game(context);

const frame = () => {
  if (game.play) {
    game.update();
    requestAnimationFrame(frame);
  } else {
    context.font = "64px Arial";
    context.fillStyle = "#ff0000";
    context.fillText("GAME OVER", GAME_WIDTH / 4, GAME_HEIGHT / 2);
  }
};
requestAnimationFrame(frame);
