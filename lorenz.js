// Lorenz Attractor Visualization

class LorenzSimulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Parameters (Standard Lorenz values)
        this.sigma = 10;
        this.rho = 28;
        this.beta = 8 / 3;

        // State
        this.x = 0.1;
        this.y = 0;
        this.z = 0;

        this.points = [];
        this.maxPoints = 2000;

        // Camera / View
        this.angleX = 0;
        this.angleY = 0;
        this.scale = 8;
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        // Colors
        this.colorBase = { h: 0, s: 86, l: 51 }; // Swiss Red approx HSL

        this.setupEventListeners();

        // Initialize theme constants
        if (window.ThemeManager) {
            this.updateThemeColors(ThemeManager.currentTheme);
        } else {
            // Fallback if ThemeManager isn't ready yet or not found
            this.updateThemeColors('light');
        }

        window.addEventListener('themeChanged', (e) => {
            this.updateThemeColors(e.detail.theme);
            if (!this.isDragging) this.draw();
        });

        this.animate();
    }

    setupEventListeners() {
        // Mouse Controls for Rotation
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouse = this.getMousePos(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const pos = this.getMousePos(e);
            const dx = pos.x - this.lastMouse.x;
            const dy = pos.y - this.lastMouse.y;

            this.angleY += dx * 0.01;
            this.angleX += dy * 0.01;

            this.lastMouse = pos;
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Sliders
        const sigmaInput = document.getElementById('sigma');
        const rhoInput = document.getElementById('rho');
        const betaInput = document.getElementById('beta');

        if (sigmaInput && rhoInput && betaInput) {
            const updateParams = () => {
                this.sigma = parseFloat(sigmaInput.value);
                this.rho = parseFloat(rhoInput.value);
                this.beta = parseFloat(betaInput.value);

                document.getElementById('sigma-val').textContent = this.sigma.toFixed(1);
                document.getElementById('rho-val').textContent = this.rho.toFixed(1);
                document.getElementById('beta-val').textContent = this.beta.toFixed(2);

                // Reset simulation on parameter change to see new trajectory
                this.reset();
            };

            sigmaInput.addEventListener('input', updateParams);
            rhoInput.addEventListener('input', updateParams);
            betaInput.addEventListener('input', updateParams);
            updateParams(); // Init labels
        }
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    updateThemeColors(theme) {
        if (theme === 'light') {
            this.bgColor = '#f9f8f4';
            this.headColor = '#1a1a1a';
        } else {
            this.bgColor = '#0a0a0a';
            this.headColor = '#ffffff';
        }
    }

    reset() {
        this.x = 0.1;
        this.y = 0;
        this.z = 0;
        this.points = [];
    }

    step(dt) {
        // Lorenz Equations
        // dx/dt = sigma * (y - x)
        // dy/dt = x * (rho - z) - y
        // dz/dt = x * y - beta * z

        const dx = (this.sigma * (this.y - this.x)) * dt;
        const dy = (this.x * (this.rho - this.z) - this.y) * dt;
        const dz = (this.x * this.y - this.beta * this.z) * dt;

        this.x += dx;
        this.y += dy;
        this.z += dz;

        this.points.push({ x: this.x, y: this.y, z: this.z });
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }

    project(x, y, z) {
        // Simple rotation matrix application
        // Rotate around Y
        let x1 = x * Math.cos(this.angleY) - z * Math.sin(this.angleY);
        let z1 = x * Math.sin(this.angleY) + z * Math.cos(this.angleY);

        // Rotate around X
        let y2 = y * Math.cos(this.angleX) - z1 * Math.sin(this.angleX);
        let z2 = y * Math.sin(this.angleX) + z1 * Math.cos(this.angleX);

        // Perspective (optional, sticking to orthographic-ish for clarity or mild perspective)
        const perspective = 1; // 100 / (100 + z2); 

        return {
            x: this.width / 2 + x1 * this.scale * perspective,
            y: this.height / 2 + y2 * this.scale * perspective
        };
    }

    draw() {
        // Clear background
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw axes helper? Maybe too cluttered.

        this.ctx.beginPath();
        if (this.points.length > 0) {
            const start = this.project(this.points[0].x, this.points[0].y, this.points[0].z);
            this.ctx.moveTo(start.x, start.y);

            for (let i = 1; i < this.points.length; i++) {
                const p = this.project(this.points[i].x, this.points[i].y, this.points[i].z);
                this.ctx.lineTo(p.x, p.y);
            }
        }

        this.ctx.strokeStyle = '#e62020';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // Draw head
        const last = this.points[this.points.length - 1];
        if (last) {
            const p = this.project(last.x, last.y, last.z);
            this.ctx.fillStyle = this.headColor;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    animate() {
        if (this.canvas.offsetParent === null) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        // Run multiple steps per frame for smooth line
        for (let i = 0; i < 5; i++) {
            this.step(0.005);
        }

        this.draw();

        // Create slow auto-rotation if not dragging
        if (!this.isDragging) {
            this.angleY += 0.003;
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('lorenzCanvas');
    if (canvas) {
        new LorenzSimulation(canvas);
    }
});
