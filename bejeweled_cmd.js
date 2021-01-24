const JewelType = {
  BLUE1: { symbol: "!" },
  GREEN: { symbol: "#" },
  PINK: { symbol: "@" },
  YELLOW: { symbol: "&" },
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

class Jewel {
  constructor(i, j, type) {
    this.i = i;
    this.j = j;
    this.type = type;
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

const jewelKeys = Object.keys(JewelType);
jewelKeys.splice(jewelKeys.indexOf("BLANK"), 1);

class Board {
  constructor(gridSize) {
    this.gridSize = gridSize;
    this.grid = [];
    this.score = 0;
  }

  printBoard() {
    let str = "  ";
    for (let j = 0; j < this.gridSize; ++j) {
      str += ` ${j}`;
    }
    console.log(str);
    for (let i = 0; i < this.gridSize; ++i) {
      str = `${i} `;
      for (let j = 0; j < this.gridSize; ++j) {
        if (this.grid[i][j]) {
          str += ` ${this.grid[i][j].type.symbol}`;
        } else {
          str += "  ";
        }
      }
      console.log(str);
    }
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

  removeMatches(matches) {
    for (let i = 0; i < matches.length; ++i) {
      const match = matches[i];
      this.score += 10 * match.length;
      for (let k = 0; k < match.length; ++k) {
        this.grid[match[k].i][match[k].j] = null;
      }
    }
  }

  fillWithNewJewels() {
    for (let i = 0; i < this.gridSize; ++i) {
      for (let j = 0; j < this.gridSize; ++j) {
        if (this.grid[i][j] === null) {
          this.grid[i][j] = this.newJewel(i, j);
        }
      }
    }
  }

  moveJewelsDown() {
    for (let j = 0; j < this.gridSize; ++j) {
      for (let i = this.gridSize - 1; i > 0; --i) {
        if (this.grid[i][j] === null && this.grid[i - 1][j] !== null) {
          const temp = this.grid[i - 1][j];
          temp.i = i;
          this.grid[i][j] = temp;
          this.grid[i - 1][j] = null;
          i = this.gridSize;
        }
      }
    }
  }

  swapJewels(i, j, m, n) {
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

  replaceJewels(matches) {
    for (let i = 0; i < matches.length; ++i) {
      let matchGroups = matches[i];
      for (let k = 0; k < matchGroups.length; ++k) {
        const match = matchGroups[k];
        this.grid[match.i][match.j] = this.newJewel(match.i, match.j);
      }
    }
  }

  new() {
    this.score = 0;
    this.grid = [];
    for (let i = 0; i < this.gridSize; ++i) {
      this.grid[i] = [];
      for (let j = 0; j < this.gridSize; ++j) {
        this.grid[i][j] = this.newJewel(i, j);
      }
    }

    while (true) {
      const matches = this.checkMatches();
      if (matches.length === 0) {
        break;
      }
      this.replaceJewels(matches);
    }
  }

  // gera aleatoriamente
  newJewel(i, j) {
    const randomIdx = randomInt(0, jewelKeys.length);
    const randomType = JewelType[jewelKeys[randomIdx]];

    return new Jewel(i, j, randomType);
  }
}

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function read(question) {
  const answer = await new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      resolve(answer);
    });
  });
  return answer;
}

class Game {
  constructor(size) {
    this.board = new Board(size);
  }

  validPosition(i, j) {
    const boardSize = this.board.gridSize;

    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize) {
      return false;
    }
    return true;
  }

  parsePosition(answer) {
    const resp = /(\d+)\s+(\d+)/.exec(answer);
    if (resp.length > 0) {
      const i = +resp[1];
      const j = +resp[2];
      if (!this.validPosition(i, j)) {
        return { error: true };
      }
      return { i, j };
    }
    return { error: true };
  }

  async start() {
    this.board.new();

    loop1: do {
      console.log("\n");
      this.board.printBoard();
      console.log(`\nPontos: ${this.board.score}`);
      let answer = await read(
        "\nEntre com as posições i (linha) e j (coluna) separadas por espaço"
      );
      const { i, j, error } = this.parsePosition(answer);
      if (error) {
        console.log("Posição inválida!\n");
        continue;
      }
      loop2: do {
        answer = await read(
          `Trocar (${i},${j}) em qual direção (cima, baixo, esquerda, direita) ou voltar`
        );
        let m = i;
        let n = j;
        switch (answer) {
          case "cima":
          case "c":
            --m;
            break;
          case "baixo":
          case "b":
            ++m;
            break;
          case "esquerda":
          case "e":
            --n;
            break;
          case "direita":
          case "d":
            ++n;
            break;
          case "voltar":
          case "v":
            continue loop1;
          default:
            console.log("Comando não reconhecido.");
            continue;
        }
        if (this.validPosition(m, n) && this.board.swapJewels(i, j, m, n)) {
          let matches = this.board.checkMatches();
          if (matches.length === 0) {
            console.log("Não há match! ");
            // desfaz a troca
            this.board.swapJewels(i, j, m, n);
            continue loop2;
          } else {
            // remove joias de mesmo tipo
            // move as joias para baixo
            // adiciona novas joias
            do {
              this.board.removeMatches(matches);
              this.board.moveJewelsDown();
              this.board.fillWithNewJewels();
              matches = this.board.checkMatches();
            } while (matches.length > 0);

            break loop2;
          }
        } else {
          console.log(`Não é possível mover para ${answer}`);
        }
      } while (true);
    } while (true);
  }
}

const game = new Game(8);
game.start();
