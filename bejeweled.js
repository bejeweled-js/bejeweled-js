"use strict";

function onDOMLoaded(cb) {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    cb();
  } else {
    document.addEventListener("DOMContentLoaded", cb);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

const audioBg = new Audio();
audioBg.src = "audio/background.mp3";
audioBg.loop = true;

const explosion = new Audio();
explosion.src = "audio/explosion.mp3";
explosion.loop = false;

const JewelType = {
  BLUE1: {
    src: "images/blue1.png",
  },
  GREEN: {
    src: "images/green1.png",
  },
  PINK: {
    src: "images/pink.png",
  },
  YELLOW: {
    src: "images/yellow.png",
  },
  /* ORANGE: {
    src: "images/orange.png",
  },
  GREEN2: {
    src: "images/green2.png",
  }, */
  NOIMAGE: {},
};

const squareUnit = 70; // cada quadradinho tem 70px por 70px

const jewelKeys = Object.keys(JewelType);

// bufferizar imagens
jewelKeys.forEach((type) => {
  const src = JewelType[type].src;
  if (src) {
    const image = new Image();
    image.src = src;
    JewelType[type]["image"] = image;
  }
});

jewelKeys.splice(jewelKeys.indexOf("NOIMAGE"), 1);

class Jewel {
  constructor(i, j, type, offset = 0) {
    this.i = i;
    this.j = j;
    this.type = type;
    this.offset = offset;
  }

  drawJewel(ctx) {
    if (typeof this.type.image !== "undefined") {
      if (this.offset <= 0) {
        this.offset = 0;
      } else {
        --this.offset;
      }
      ctx.drawImage(
        this.type.image,
        this.j * squareUnit,
        this.i * squareUnit - this.offset,
        squareUnit,
        squareUnit
      );
    }
  }

  isAdj(otherJewel) {
    if (
      (otherJewel.i === this.i && otherJewel.j === this.j + 1) ||
      (otherJewel.i === this.i && otherJewel.j + 1 === this.j) ||
      (otherJewel.j === this.j && otherJewel.i === this.i + 1) ||
      (otherJewel.j === this.j && otherJewel.i + 1 === this.i)
    ) {
      return true;
    }
    return false;
  }
}

class Board {
  constructor(gridSize) {
    this.canvas = document.getElementById("bejeweled");
    this.canvas.width = gridSize * squareUnit;
    this.canvas.height = gridSize * squareUnit;
    this.ctx = this.canvas.getContext("2d");
    this.scoreElem = document.getElementById("score");
    this.gridSize = gridSize;
    this.grid = [];
    this.score = 0;
    this.selectedRow = -1; // linha selecionada
    this.selectedCol = -1; // coluna selecionada
    this.fps = 60; // 60fps
    this.interval = 1000 / this.fps; // 16.6ms
    this.isAnimating = false;
    this.then = Date.now();

    for (let i = 0; i < gridSize; ++i) {
      this.grid[i] = [];
      for (let j = 0; j < gridSize; ++j) {
        this.grid[i][j] = null;
      }
    }
    this.canvas.addEventListener("click", this.onClick.bind(this));
  }

  // chamada ao clicar no canvas
  onClick(e) {
    const rect = this.canvas.getBoundingClientRect(); // corrige o valor de x e y
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSelectedRow = Math.floor(y / squareUnit);
    const newSelectedCol = Math.floor(x / squareUnit);

    // Desfazer a seleção do elemento se já estiver selecionado
    if (
      this.selectedRow === newSelectedRow &&
      this.selectedCol === newSelectedCol
    ) {
      this.selectedRow = -1;
      this.selectedCol = -1;
    } else {
      // tenta trocar uma joia com outra
      if (this.selectedCol !== -1 && this.selectedRow !== -1) {
        if (
          this.swap(
            this.selectedRow,
            this.selectedCol,
            newSelectedRow,
            newSelectedCol
          )
        ) {
          const matches = this.checkMatches();
          if (matches.length > 0) {
            this.selectedCol = -1;
            this.selectedRow = -1;
          } else {
            // desfaz a troca se não há match
            this.swap(
              newSelectedRow,
              newSelectedCol,
              this.selectedRow,
              this.selectedCol
            );
          }
        }
      } else {
        this.selectedRow = newSelectedRow;
        this.selectedCol = newSelectedCol;
      }
    }
  }
  swap(i, j, m, n) {
    const firstJewel = this.grid[i][j];
    const secondJewel = this.grid[m][n];
    if (firstJewel.isAdj(secondJewel)) {
      secondJewel.i = i;
      secondJewel.j = j;
      this.grid[i][j] = secondJewel;
      firstJewel.i = m;
      firstJewel.j = n;
      this.grid[m][n] = firstJewel;
      return true;
    }
    return false;
  }
  // checagem por joias do mesmo tipo
  checkMatches() {
    let matches = [];
    let groups = [];

    // checagem horizontal por 3 ou mais joias do mesmo tipo
    for (let i = 0; i < this.grid.length; ++i) {
      const tempArr = this.grid[i];
      groups = [];
      for (let j = 0; j < tempArr.length; ++j) {
        if (j < tempArr.length - 2)
          if (this.grid[i][j] && this.grid[i][j + 1] && this.grid[i][j + 2]) {
            if (
              this.grid[i][j].type === this.grid[i][j + 1].type &&
              this.grid[i][j + 1].type === this.grid[i][j + 2].type
            ) {
              if (groups.length > 0) {
                if (groups.indexOf(this.grid[i][j]) === -1) {
                  matches.push(groups);
                  groups = [];
                }
              }

              if (groups.indexOf(this.grid[i][j]) === -1) {
                groups.push(this.grid[i][j]);
              }
              if (groups.indexOf(this.grid[i][j + 1]) === -1) {
                groups.push(this.grid[i][j + 1]);
              }
              if (groups.indexOf(this.grid[i][j + 2]) === -1) {
                groups.push(this.grid[i][j + 2]);
              }
            }
          }
      }
      if (groups.length > 0) matches.push(groups);
      matches.sort((a, b) => {
        return a[0].i - b[0].i;
      });
    }

    // checagem vertical por 3 ou mais joias do mesmo tipo
    for (let j = 0; j < this.grid.length; ++j) {
      const tempArr = this.grid[j];
      groups = [];
      for (let i = 0; i < tempArr.length; ++i) {
        if (i < tempArr.length - 2)
          if (this.grid[i][j] && this.grid[i + 1][j] && this.grid[i + 2][j]) {
            if (
              this.grid[i][j].type === this.grid[i + 1][j].type &&
              this.grid[i + 1][j].type === this.grid[i + 2][j].type
            ) {
              if (groups.length > 0) {
                if (groups.indexOf(this.grid[i][j]) === -1) {
                  matches.push(groups);
                  groups = [];
                }
              }

              if (groups.indexOf(this.grid[i][j]) === -1) {
                groups.push(this.grid[i][j]);
              }
              if (groups.indexOf(this.grid[i + 1][j]) === -1) {
                groups.push(this.grid[i + 1][j]);
              }
              if (groups.indexOf(this.grid[i + 2][j]) === -1) {
                groups.push(this.grid[i + 2][j]);
              }
            }
          }
      }
      if (groups.length > 0) matches.push(groups);
    }

    return matches;
  }

  gameLoop() {
    this.now = Date.now();
    this.delta = this.now - this.then;

    // game loop : https://www.iditect.com/how-to/58560177.html
    if (this.delta > this.interval) {
      this.then = this.now - (this.delta % this.interval);
      if (!this.isAnimating) {
        // só fazer checagem se todas as pedras estão no lugar
        const matches = this.checkMatches();
        if (matches.length > 0) {
          explosion.play();
          this.removeMatchGroups(matches);
          // 10 pontos por cada joia
          this.score += matches.reduce(
            (val, group) => val + 10 * group.length,
            0
          );
          this.scoreElem.textContent = this.score;
          this.rearrangeJewels(matches);
        }
      }
      // limpa canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.isAnimating = false;
      for (let i = 0; i < this.gridSize; ++i) {
        for (let j = 0; j < this.gridSize; ++j) {
          if (this.grid[i][j]) {
            this.grid[i][j].drawJewel(this.ctx);
            if (this.grid[i][j].offset > 0) {
              this.isAnimating = true;
            }
          }
          // adiciona contorno ao elemento selecionado
          if (i === this.selectedRow && j === this.selectedCol) {
            this.ctx.strokeRect(
              j * squareUnit,
              i * squareUnit,
              squareUnit,
              squareUnit
            );
          }
        }
      }
    }

    // bind faz com que o "this" dentro da função gameLoop
    // aponte para o objeto Board atual
    // requestAnimationFrame é chamada pelo Browser
    // antes do próximo repaint acontecer
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  removeMatchGroups(matches) {
    for (let i = 0; i < matches.length; ++i) {
      let matchGroups = matches[i];
      for (let k = 0; k < matchGroups.length; ++k) {
        const match = matchGroups[k];
        this.grid[match.i][match.j] = new Jewel(
          match.i,
          match.j,
          JewelType.NOIMAGE
        );
      }
    }
  }

  replaceJewels(matches) {
    for (let i = 0; i < matches.length; ++i) {
      let matchGroups = matches[i];
      for (let k = 0; k < matchGroups.length; ++k) {
        const match = matchGroups[k];
        this.grid[match.i][match.j] = this.newJewel(match.i, match.j);
      }
    }
  }

  moveJewel(jewel, m, n, offset) {
    jewel.i = m;
    jewel.j = n;
    jewel.offset = offset;
    this.grid[m][n] = jewel;
  }

  addRow(minJ, maxJ) {
    for (let j = minJ; j <= maxJ; ++j) {
      this.grid[0][j] = this.newJewel(0, j, squareUnit * 2);
    }
  }

  addCol(j, n) {
    for (let i = 0; i < n; ++i) {
      this.grid[i][j] = this.newJewel(i, j, squareUnit * i);
    }
  }

  rearrangeJewels(matches) {
    for (let k = 0; k < matches.length; ++k) {
      console.log("GRID", JSON.parse(JSON.stringify(this.grid)), matches);
      const group = matches[k];
      // agrupamento horizontal
      if (group.length >= 3) {
        if (group[0].i === group[1].i) {
          console.log("GROUP hr => ", JSON.parse(JSON.stringify(group)));
          const i = group[0].i;
          if (i !== 0) {
            for (let j = 0; j < group.length; ++j) {
              const col = group[j].j;
              for (let x = i - 1; x >= 0; --x) {
                console.log(`GROUP hr => mov ${x},${col} => ${x + 1}, ${col}`);
                this.moveJewel(this.grid[x][col], x + 1, col, squareUnit);
              }
            }
          }
          console.log(
            `GROUP hr => add ${group[0].j} ${group[group.length - 1].j}`
          );
          this.addRow(group[0].j, group[group.length - 1].j);
        } else {
          // agrupamento vertical
          let j = group[0].j;
          let min = group[0].i;
          console.log("GROUP vt => ", JSON.parse(JSON.stringify(group)));
          for (let i = min - 1; i >= 0; --i) {
            console.log(
              `GROUP vt => mov ${i},${j} => ${i + group.length}, ${j}`
            );
            this.moveJewel(
              this.grid[i][j],
              i + group.length,
              j,
              squareUnit * group.length
            );
          }
          console.log(`GROUP vt => add ${j} ${group.length}`);
          this.addCol(j, group.length);
        }
      }
    }
    console.log("GROUP fim => ", JSON.parse(JSON.stringify(this.grid)));
  }

  newGame() {
    this.score = 0;
    this.grid = [];
    for (let i = 0; i < this.gridSize; ++i) {
      this.grid[i] = [];
      for (let j = 0; j < this.gridSize; ++j) {
        this.grid[i][j] = this.newJewel(i, j);
      }
    }
    this.scoreElem.textContent = this.score.toString();
    while (true) {
      const matches = this.checkMatches();
      if (matches.length === 0) {
        break;
      }
      this.replaceJewels(matches);
    }
    this.gameLoop();
  }

  // gera aleatoriamente
  newJewel(i, j, offset = 0) {
    const randomIdx = randomInt(0, jewelKeys.length);
    const randomType = JewelType[jewelKeys[randomIdx]];

    return new Jewel(i, j, randomType, offset);
  }
}

// espera DOM carregar
onDOMLoaded(() => {
  const canvas = document.getElementById("bejeweled");
  const startElem = document.getElementById("start-game");
  const menuElem = document.getElementById("menu");
  const scoreContainer = document.querySelector(".score-container");
  startElem.addEventListener("click", () => {
    canvas.style.display = "";
    menuElem.style.display = "none";
    scoreContainer.style.display = "";
    audioBg.play();
    const board = new Board(8);
    board.newGame();
  });
});
