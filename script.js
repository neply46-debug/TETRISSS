// ============ КОНСТАНТЫ ============
const COLS = 10;
const ROWS = 20;
const CELL = 30;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");

const COLORS = {
    I: "#ff5c7a",
    O: "#ffd93d",
    T: "#c06eff",
    S: "#5ce6a1",
    Z: "#ff7a9c",
    L: "#ffa63d",
    J: "#5c9eff",
};

// ============================================================
// ФИГУРЫ В СИСТЕМЕ SRS (Super Rotation System)
// Каждая фигура описана в матрице 4×4, как в официальном Тетрисе.
// Поворот = матричное вращение всей сетки 4×4 вокруг её центра (1.5, 1.5).
// Это гарантирует, что фигура НЕ прыгает.
// ============================================================
const SRS_SHAPES = {
    I: [
        // состояние 0 (спавн)
        [[0,0,0,0],
         [1,1,1,1],
         [0,0,0,0],
         [0,0,0,0]],
        // состояние R (90° по часовой)
        [[0,0,1,0],
         [0,0,1,0],
         [0,0,1,0],
         [0,0,1,0]],
        // состояние 2 (180°)
        [[0,0,0,0],
         [0,0,0,0],
         [1,1,1,1],
         [0,0,0,0]],
        // состояние L (270°)
        [[0,1,0,0],
         [0,1,0,0],
         [0,1,0,0],
         [0,1,0,0]],
    ],
    O: [
        [[0,1,1,0],
         [0,1,1,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,1,1,0],
         [0,1,1,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,1,1,0],
         [0,1,1,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,1,1,0],
         [0,1,1,0],
         [0,0,0,0],
         [0,0,0,0]],
    ],
    T: [
        [[0,1,0,0],
         [1,1,1,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,1,0,0],
         [0,1,1,0],
         [0,1,0,0],
         [0,0,0,0]],
        [[0,0,0,0],
         [1,1,1,0],
         [0,1,0,0],
         [0,0,0,0]],
        [[0,1,0,0],
         [1,1,0,0],
         [0,1,0,0],
         [0,0,0,0]],
    ],
    S: [
        [[0,1,1,0],
         [1,1,0,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,1,0,0],
         [0,1,1,0],
         [0,0,1,0],
         [0,0,0,0]],
        [[0,0,0,0],
         [0,1,1,0],
         [1,1,0,0],
         [0,0,0,0]],
        [[1,0,0,0],
         [1,1,0,0],
         [0,1,0,0],
         [0,0,0,0]],
    ],
    Z: [
        [[1,1,0,0],
         [0,1,1,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,0,1,0],
         [0,1,1,0],
         [0,1,0,0],
         [0,0,0,0]],
        [[0,0,0,0],
         [1,1,0,0],
         [0,1,1,0],
         [0,0,0,0]],
        [[0,1,0,0],
         [1,1,0,0],
         [1,0,0,0],
         [0,0,0,0]],
    ],
    L: [
        [[0,0,1,0],
         [1,1,1,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,1,0,0],
         [0,1,0,0],
         [0,1,1,0],
         [0,0,0,0]],
        [[0,0,0,0],
         [1,1,1,0],
         [1,0,0,0],
         [0,0,0,0]],
        [[1,1,0,0],
         [0,1,0,0],
         [0,1,0,0],
         [0,0,0,0]],
    ],
    J: [
        [[1,0,0,0],
         [1,1,1,0],
         [0,0,0,0],
         [0,0,0,0]],
        [[0,1,1,0],
         [0,1,0,0],
         [0,1,0,0],
         [0,0,0,0]],
        [[0,0,0,0],
         [1,1,1,0],
         [0,0,1,0],
         [0,0,0,0]],
        [[0,1,0,0],
         [0,1,0,0],
         [1,1,0,0],
         [0,0,0,0]],
    ],
};

// SRS wall-kick таблицы (стандарт Tetris Guideline)
// Индекс = [из_состояния][в_состояние], значения = список смещений (x, y).
// y положительный вниз (экранная система).
const KICKS_JLSTZ = {
    "0->1": [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    "1->0": [[0,0], [ 1,0], [ 1, 1], [0,-2], [ 1,-2]],
    "1->2": [[0,0], [ 1,0], [ 1, 1], [0,-2], [ 1,-2]],
    "2->1": [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    "2->3": [[0,0], [ 1,0], [ 1,-1], [0,2], [ 1,2]],
    "3->2": [[0,0], [-1,0], [-1, 1], [0,-2], [-1,-2]],
    "3->0": [[0,0], [-1,0], [-1, 1], [0,-2], [-1,-2]],
    "0->3": [[0,0], [ 1,0], [ 1,-1], [0,2], [ 1,2]],
};

const KICKS_I = {
    "0->1": [[0,0], [-2,0], [ 1,0], [-2, 1], [ 1,-2]],
    "1->0": [[0,0], [ 2,0], [-1,0], [ 2,-1], [-1, 2]],
    "1->2": [[0,0], [-1,0], [ 2,0], [-1,-2], [ 2, 1]],
    "2->1": [[0,0], [ 1,0], [-2,0], [ 1, 2], [-2,-1]],
    "2->3": [[0,0], [ 2,0], [-1,0], [ 2,-1], [-1, 2]],
    "3->2": [[0,0], [-2,0], [ 1,0], [-2, 1], [ 1,-2]],
    "3->0": [[0,0], [ 1,0], [-2,0], [ 1, 2], [-2,-1]],
    "0->3": [[0,0], [-1,0], [ 2,0], [-1,-2], [ 2, 1]],
};

// ============ ИГРА ============
class Tetris {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.fallInterval = 500;
        this.fallTimer = 0;
        this.lastTime = 0;

        this.piece = this.randomPiece();
        this.nextPiece = this.randomPiece();

        overlay.classList.add("hidden");
        this.updateUI();
    }

    randomPiece() {
        const kind = Object.keys(SRS_SHAPES)[Math.floor(Math.random() * 7)];
        return {
            kind,
            color: COLORS[kind],
            rotation: 0,                    // 0, 1, 2, 3
            matrix: SRS_SHAPES[kind][0],    // текущая матрица 4×4
            x: Math.floor(COLS / 2) - 2,    // левый верхний угол матрицы на поле
            y: -1,                           // чуть выше поля, чтобы выезжала
        };
    }

    // Возвращает массив абсолютных координат клеток фигуры
    getCells(matrix = this.piece.matrix, dx = 0, dy = 0) {
        const cells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (matrix[row][col]) {
                    cells.push([this.piece.x + col + dx, this.piece.y + row + dy]);
                }
            }
        }
        return cells;
    }

    collides(matrix = this.piece.matrix, dx = 0, dy = 0) {
        return this.getCells(matrix, dx, dy).some(([x, y]) => {
            if (x < 0 || x >= COLS || y >= ROWS) return true;
            if (y >= 0 && this.board[y][x]) return true;
            return false;
        });
    }

    move(dx, dy) {
        if (this.gameOver) return false;
        if (!this.collides(this.piece.matrix, dx, dy)) {
            this.piece.x += dx;
            this.piece.y += dy;
            return true;
        }
        return false;
    }

    // ---- ПОВОРОТ С SRS WALL KICK ----
    rotate() {
        if (this.gameOver) return;
        if (this.piece.kind === "O") return; // квадрат не вращаем

        const from = this.piece.rotation;
        const to = (from + 1) % 4;
        const newMatrix = SRS_SHAPES[this.piece.kind][to];

        const key = `${from}->${to}`;
        const kicks = this.piece.kind === "I" ? KICKS_I[key] : KICKS_JLSTZ[key];

        for (const [kx, ky] of kicks) {
            // В SRS положительный y = вверх, поэтому инвертируем
            if (!this.collides(newMatrix, kx, -ky)) {
                this.piece.matrix = newMatrix;
                this.piece.rotation = to;
                this.piece.x += kx;
                this.piece.y += -ky;
                return;
            }
        }
        // Ни один кик не подошёл — поворот отменён
    }

    drop() {
        if (this.gameOver) return;
        while (this.move(0, 1)) {}
        this.lock();
    }

    lock() {
        for (const [x, y] of this.getCells()) {
            if (y < 0) {
                this.endGame();
                return;
            }
            this.board[y][x] = this.piece.color;
        }
        this.clearLines();
        this.spawn();
    }

    clearLines() {
        const remaining = this.board.filter(row => row.some(c => !c));
        const cleared = ROWS - remaining.length;

        if (cleared > 0) {
            this.score += [0, 100, 300, 500, 800][cleared] * this.level;
            this.lines += cleared;
            this.level = 1 + Math.floor(this.lines / 10);
            this.fallInterval = Math.max(100, 500 - (this.level - 1) * 40);

            while (remaining.length < ROWS) {
                remaining.unshift(Array(COLS).fill(null));
            }
            this.board = remaining;
            this.updateUI();
        }
    }

    spawn() {
        this.piece = this.nextPiece;
        this.nextPiece = this.randomPiece();

        if (this.collides()) {
            this.endGame();
        }
        this.drawNext();
    }

    endGame() {
        this.gameOver = true;
        overlayTitle.textContent = "GAME OVER";
        overlayText.textContent = `Очки: ${this.score}`;
        overlay.classList.remove("hidden");
    }

    updateUI() {
        scoreEl.textContent = this.score;
        linesEl.textContent = this.lines;
        levelEl.textContent = this.level;
    }

    // ===== Отрисовка =====
    drawCell(context, px, py, size, color) {
        context.fillStyle = color;
        context.fillRect(px, py, size, size);

        context.fillStyle = "rgba(255,255,255,0.35)";
        context.fillRect(px + 3, py + 3, size - 10, 4);

        context.fillStyle = "rgba(0,0,0,0.25)";
        context.fillRect(px + 4, py + size - 6, size - 8, 3);

        context.strokeStyle = "rgba(0,0,0,0.35)";
        context.lineWidth = 2;
        context.strokeRect(px + 1, py + 1, size - 2, size - 2);
    }

    drawBoard() {
        ctx.fillStyle = "#12142b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let x = 1; x < COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL, 0);
            ctx.lineTo(x * CELL, ROWS * CELL);
            ctx.stroke();
        }
        for (let y = 1; y < ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL);
            ctx.lineTo(COLS * CELL, y * CELL);
            ctx.stroke();
        }

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawCell(ctx, x * CELL, y * CELL, CELL, this.board[y][x]);
                }
            }
        }

        if (!this.gameOver) {
            for (const [x, y] of this.getCells()) {
                if (y >= 0) {
                    this.drawCell(ctx, x * CELL, y * CELL, CELL, this.piece.color);
                }
            }
        }
    }

    drawNext() {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        nextCtx.fillStyle = "#0e1023";
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

        const size = 24;
        const matrix = this.nextPiece.matrix;

        // Находим границы занятых клеток для центрирования
        let minX = 4, maxX = -1, minY = 4, maxY = -1;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (matrix[r][c]) {
                    minX = Math.min(minX, c);
                    maxX = Math.max(maxX, c);
                    minY = Math.min(minY, r);
                    maxY = Math.max(maxY, r);
                }
            }
        }
        const w = (maxX - minX + 1) * size;
        const h = (maxY - minY + 1) * size;
        const offsetX = (nextCanvas.width - w) / 2 - minX * size;
        const offsetY = (nextCanvas.height - h) / 2 - minY * size;

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (matrix[r][c]) {
                    this.drawCell(
                        nextCtx,
                        offsetX + c * size,
                        offsetY + r * size,
                        size,
                        this.nextPiece.color
                    );
                }
            }
        }
    }

    tick(time) {
        if (this.gameOver) {
            this.drawBoard();
            return;
        }

        const dt = time - this.lastTime;
        this.lastTime = time;

        this.fallTimer += dt;
        if (this.fallTimer >= this.fallInterval) {
            this.fallTimer = 0;
            if (!this.move(0, 1)) this.lock();
        }

        this.drawBoard();
    }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
const game = new Tetris();

function loop(time) {
    game.tick(time);
    requestAnimationFrame(loop);
}

game.drawNext();
requestAnimationFrame((t) => {
    game.lastTime = t;
    loop(t);
});

// ============ УПРАВЛЕНИЕ ============
document.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowLeft":  e.preventDefault(); game.move(-1, 0); break;
        case "ArrowRight": e.preventDefault(); game.move(1, 0);  break;
        case "ArrowDown":  e.preventDefault(); if (game.move(0, 1)) game.fallTimer = 0; break;
        case "ArrowUp":    e.preventDefault(); game.rotate();    break;
        case " ":          e.preventDefault(); game.drop();      break;
        case "r": case "R": case "к": case "К":
            game.reset(); game.drawNext(); break;
    }
});

document.getElementById("restart").addEventListener("click", () => {
    game.reset(); game.drawNext();
});

document.getElementById("overlay-btn").addEventListener("click", () => {
    game.reset(); game.drawNext();
});

document.querySelectorAll(".mobile-controls button").forEach(btn => {
    const action = btn.dataset.action;
    const handler = (e) => {
        e.preventDefault();
        if (action === "left") game.move(-1, 0);
        else if (action === "right") game.move(1, 0);
        else if (action === "down") { if (game.move(0, 1)) game.fallTimer = 0; }
        else if (action === "rotate") game.rotate();
        else if (action === "drop") game.drop();
    };
    btn.addEventListener("touchstart", handler, { passive: false });
    btn.addEventListener("click", handler);
});