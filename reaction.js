// Reaction-Diffusion (Gray-Scott Model)

class ReactionDiffusion {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 200; // Low res for performance, scaled up via CSS
        this.height = 150;

        // Set actual canvas size to low res
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Grid
        this.grid = [];
        this.next = [];

        // Parameters (Gray-Scott)
        // Defaults for "Mitosis" or "Coral" like patterns
        this.dA = 1.0;
        this.dB = 0.5;
        this.feed = 0.055;
        this.kill = 0.062;

        this.initGrid();
        this.setupEventListeners();
        this.animate();
    }

    initGrid() {
        // Initialize A=1, B=0
        for (let x = 0; x < this.width; x++) {
            this.grid[x] = [];
            this.next[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.grid[x][y] = { a: 1, b: 0 };
                this.next[x][y] = { a: 1, b: 0 };
            }
        }

        // Seed a spot with B
        this.seed(this.width / 2, this.height / 2, 10);
    }

    seed(x, y, r) {
        for (let i = Math.floor(x - r); i < x + r; i++) {
            for (let j = Math.floor(y - r); j < y + r; j++) {
                if (i >= 0 && i < this.width && j >= 0 && j < this.height) {
                    this.grid[i][j].b = 1;
                }
            }
        }
    }

    setupEventListeners() {
        // Mouse interaction: Add B
        let isDrawing = false;

        const handleDraw = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Scale mouse pos to internal resolution
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            this.seed(x, y, 5);
        };

        this.canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            handleDraw(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDrawing && e.target === this.canvas) {
                handleDraw(e);
            }
        });

        window.addEventListener('mouseup', () => isDrawing = false);

        // Preset Buttons or Sliders could go here
        // For now, simple mouse painting
    }

    swap() {
        let temp = this.grid;
        this.grid = this.next;
        this.next = temp;
    }

    laplacian(x, y, Component) {
        let sum = 0;

        // 3x3 Convolution
        // Weights:
        // 0.05  0.2  0.05
        // 0.2  -1.0  0.2
        // 0.05  0.2  0.05

        sum += this.grid[x][y][Component] * -1;

        // Neighbors
        sum += this.grid[x - 1][y][Component] * 0.2;
        sum += this.grid[x + 1][y][Component] * 0.2;
        sum += this.grid[x][y - 1][Component] * 0.2;
        sum += this.grid[x][y + 1][Component] * 0.2;

        // Diagonals
        sum += this.grid[x - 1][y - 1][Component] * 0.05;
        sum += this.grid[x + 1][y - 1][Component] * 0.05;
        sum += this.grid[x - 1][y + 1][Component] * 0.05;
        sum += this.grid[x + 1][y + 1][Component] * 0.05;

        return sum;
    }

    update() {
        for (let x = 1; x < this.width - 1; x++) {
            for (let y = 1; y < this.height - 1; y++) {
                const a = this.grid[x][y].a;
                const b = this.grid[x][y].b;

                const lapA = this.laplacian(x, y, 'a');
                const lapB = this.laplacian(x, y, 'b');

                const reaction = a * b * b;

                let newA = a + (this.dA * lapA - reaction + this.feed * (1 - a));
                let newB = b + (this.dB * lapB + reaction - (this.kill + this.feed) * b);

                // Clamp
                newA = Math.max(0, Math.min(1, newA));
                newB = Math.max(0, Math.min(1, newB));

                this.next[x][y].a = newA;
                this.next[x][y].b = newB;
            }
        }

        this.swap();
    }

    draw() {
        const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imgData.data;

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const i = (x + y * this.width) * 4;
                const a = this.grid[x][y].a;
                const b = this.grid[x][y].b;

                // Visualization:
                // We want to see the difference between A and B, or just B concentration
                // Let's do: Dark background, B is White/Red

                const val = Math.floor((a - b) * 255);

                // Swiss Style: 
                // Background usually #f9f8f4 (249, 248, 244)
                // Color usually #1a1a1a (26, 26, 26)
                // or Red #e62020 (230, 32, 32)

                // Let's map "val" (0 to 255, where 0 is high B) to the gradient
                // If val is low (high B), use Red/Black. If val is high (high A), use White.

                // Simple Black on White
                // val is 255 (Pure A) -> 249, 248, 244
                // val is 0 (Pure B) -> 26, 26, 26

                const t = val / 255;

                // Lerp between ink (black) and paper (white)
                // Actually, let's make the chemical Black
                const r = 26 + (249 - 26) * t;
                const g = 26 + (248 - 26) * t;
                const blue = 26 + (244 - 26) * t;

                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = blue;
                data[i + 3] = 255;
            }
        }

        this.ctx.putImageData(imgData, 0, 0);
    }

    animate() {
        // Check if visible
        if (this.canvas.offsetParent === null) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        // Speed up simulation
        for (let i = 0; i < 8; i++) {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('reactionCanvas');
    if (canvas) {
        new ReactionDiffusion(canvas);
    }
});
