// Conway's Game of Life

class GameOfLife {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Grid Params
        this.cellSize = 10;
        this.cols = Math.floor(canvas.width / this.cellSize);
        this.rows = Math.floor(canvas.height / this.cellSize);

        this.grid = this.createGrid();
        this.nextGrid = this.createGrid();

        this.isRunning = false;
        this.lastFrameTime = 0;
        this.fps = 15; // Limit speed for nice visualization
        this.interval = 1000 / this.fps;

        // Initialize theme constants
        this.updateThemeColors(ThemeManager.currentTheme);
        window.addEventListener('themeChanged', (e) => {
            this.updateThemeColors(e.detail.theme);
            this.draw();
        });

        this.setupEventListeners();
        this.init();
    }

    updateThemeColors(theme) {
        if (theme === 'light') {
            this.colors = {
                bg: '#f9f8f4',
                alive: '#e62020', // Red cells in light mode? Or black? Let's go red
                dead: '#f9f8f4',
                grid: '#e0e0e0'
            };
        } else {
            this.colors = {
                bg: '#0a0a0a',
                alive: '#ffffff',
                dead: '#0a0a0a',
                grid: '#333333'
            };
        }
    }

    init() {
        this.grid = this.createGrid();
        // Randomize initial state
        this.randomize();
        this.draw();
        this.animate(0);
    }

    createGrid() {
        return new Array(this.cols).fill(null)
            .map(() => new Array(this.rows).fill(0));
    }

    randomize() {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                this.grid[i][j] = Math.random() > 0.85 ? 1 : 0;
            }
        }
    }

    clear() {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                this.grid[i][j] = 0;
            }
        }
        this.draw();
        this.isRunning = false;
        this.updateBtnState();
    }

    toggleCell(x, y) {
        const i = Math.floor(x / this.cellSize);
        const j = Math.floor(y / this.cellSize);

        if (i >= 0 && i < this.cols && j >= 0 && j < this.rows) {
            this.grid[i][j] = this.grid[i][j] ? 0 : 1;
            this.draw();
        }
    }

    setupEventListeners() {
        // Click to toggle
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.toggleCell(x, y);

            // Allow drag drawing
            const mouseMoveHandler = (ev) => {
                const rx = ev.clientX - rect.left;
                const ry = ev.clientY - rect.top;
                // Simple paint (only add life) for drag
                const i = Math.floor(rx / this.cellSize);
                const j = Math.floor(ry / this.cellSize);
                if (i >= 0 && i < this.cols && j >= 0 && j < this.rows) {
                    this.grid[i][j] = 1;
                    this.draw();
                }
            };

            const mouseUpHandler = () => {
                window.removeEventListener('mousemove', mouseMoveHandler);
                window.removeEventListener('mouseup', mouseUpHandler);
            };

            window.addEventListener('mousemove', mouseMoveHandler);
            window.addEventListener('mouseup', mouseUpHandler);
        });

        // Buttons
        const runBtn = document.getElementById('gol-run');
        const randBtn = document.getElementById('gol-random');
        const clearBtn = document.getElementById('gol-clear');

        if (runBtn) {
            runBtn.addEventListener('click', () => {
                this.isRunning = !this.isRunning;
                this.updateBtnState();
            });
        }
        if (randBtn) randBtn.addEventListener('click', () => this.randomize());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clear());
    }

    updateBtnState() {
        const btn = document.getElementById('gol-run');
        if (btn) btn.textContent = this.isRunning ? "Pause" : "Run";
    }

    countNeighbors(x, y) {
        let sum = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                const col = (x + i + this.cols) % this.cols;
                const row = (y + j + this.rows) % this.rows;
                sum += this.grid[col][row];
            }
        }
        sum -= this.grid[x][y];
        return sum;
    }

    update() {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const state = this.grid[i][j];
                const neighbors = this.countNeighbors(i, j);

                if (state === 0 && neighbors === 3) {
                    this.nextGrid[i][j] = 1;
                } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
                    this.nextGrid[i][j] = 0;
                } else {
                    this.nextGrid[i][j] = state;
                }
            }
        }

        // Swap
        let temp = this.grid;
        this.grid = this.nextGrid;
        this.nextGrid = temp;
    }

    draw() {
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines? Maybe too noisy.
        // Let's draw squares

        this.ctx.fillStyle = this.colors.alive;
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.grid[i][j] === 1) {
                    this.ctx.fillRect(i * this.cellSize, j * this.cellSize, this.cellSize - 1, this.cellSize - 1);
                }
            }
        }
    }

    animate(timestamp) {
        // Visibility Check
        if (this.canvas.offsetParent === null) {
            requestAnimationFrame((t) => this.animate(t));
            return;
        }

        requestAnimationFrame((t) => this.animate(t));

        const elapsed = timestamp - this.lastFrameTime;

        if (this.isRunning && elapsed > this.interval) {
            this.lastFrameTime = timestamp - (elapsed % this.interval);
            this.update();
            this.draw();
        }
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('golCanvas');
    if (canvas) {
        new GameOfLife(canvas);
    }
});
