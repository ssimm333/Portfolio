// Double Pendulum Simulation
class DoublePendulum {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.origin = { x: this.width / 2, y: 100 };

        // Pendulum parameters
        this.m1 = 10; // mass 1
        this.m2 = 10; // mass 2
        this.l1 = 150; // length 1
        this.l2 = 150; // length 2
        this.g = 9.81; // gravity

        // Angles (in radians)
        this.a1 = 0; // angle 1 (vertical)
        this.a2 = 0; // angle 2 (vertical)
        this.a1_v = 0; // angular velocity 1
        this.a2_v = 0; // angular velocity 2

        // Trace
        this.trace = [];
        this.maxTraceLength = 500;
        this.showTrace = true;

        // Animation
        this.isPaused = true;
        this.lastTime = 0;

        // Dragging
        this.dragging = null; // 'bob1' or 'bob2'
        // Initialize theme
        this.updateThemeColors(ThemeManager.currentTheme);

        // Listen for theme changes
        window.addEventListener('themeChanged', (e) => {
            this.updateThemeColors(e.detail.theme);
            if (this.isPaused) this.draw(); // Redraw if paused
        });

        this.setupEventListeners();
    }

    updateThemeColors(theme) {
        if (theme === 'light') {
            this.colors = {
                bg: '#f9f8f4',
                rod: '#1a1a1a',
                bob: '#1a1a1a',
                trace: 'rgba(230, 32, 32,',
                text: '#1a1a1a'
            };
        } else {
            this.colors = {
                bg: '#0a0a0a',
                rod: '#ffffff',
                bob: '#ffffff',
                trace: 'rgba(230, 32, 32,',
                text: '#ffffff'
            };
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const { x1, y1, x2, y2 } = this.getBobPositions();

        // Check distance to bobs
        const d1 = Math.hypot(mouseX - x1, mouseY - y1);
        const d2 = Math.hypot(mouseX - x2, mouseY - y2);

        if (d1 < 20) {
            this.dragging = 'bob1';
            this.isPaused = true;
        } else if (d2 < 20) {
            this.dragging = 'bob2';
            this.isPaused = true;
        }
    }

    handleMouseMove(e) {
        if (!this.dragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.dragging === 'bob1') {
            const dx = mouseX - this.origin.x;
            const dy = mouseY - this.origin.y;
            this.a1 = Math.atan2(dx, dy);
            this.a1_v = 0;
            this.a2_v = 0;
        } else if (this.dragging === 'bob2') {
            const { x1, y1 } = this.getBobPositions();
            const dx = mouseX - x1;
            const dy = mouseY - y1;
            this.a2 = Math.atan2(dx, dy);
            this.a1_v = 0;
            this.a2_v = 0;
        }

        this.trace = []; // Clear trace when dragging
        this.draw();
    }

    handleMouseUp() {
        if (this.dragging) {
            this.dragging = null;
            this.isPaused = false;

            // Update button UI
            const pauseBtn = document.getElementById('pauseBtn');
            if (pauseBtn) pauseBtn.textContent = 'Pause';
        }
    }

    getBobPositions() {
        const x1 = this.origin.x + this.l1 * Math.sin(this.a1);
        const y1 = this.origin.y + this.l1 * Math.cos(this.a1);
        const x2 = x1 + this.l2 * Math.sin(this.a2);
        const y2 = y1 + this.l2 * Math.cos(this.a2);
        return { x1, y1, x2, y2 };
    }

    update(dt) {
        if (this.isPaused && !this.dragging) return;

        const m1 = this.m1;
        const m2 = this.m2;
        const l1 = this.l1;
        const l2 = this.l2;
        const g = this.g;
        const a1 = this.a1;
        const a2 = this.a2;
        const a1_v = this.a1_v;
        const a2_v = this.a2_v;

        // Equations of Motion
        const num1 = -g * (2 * m1 + m2) * Math.sin(a1);
        const num2 = -m2 * g * Math.sin(a1 - 2 * a2);
        const num3 = -2 * Math.sin(a1 - a2) * m2;
        const num4 = a2_v * a2_v * l2 + a1_v * a1_v * l1 * Math.cos(a1 - a2);
        const den = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
        const a1_a = (num1 + num2 + num3 * num4) / den;

        const num1_2 = 2 * Math.sin(a1 - a2);
        const num2_2 = (a1_v * a1_v * l1 * (m1 + m2));
        const num3_2 = g * (m1 + m2) * Math.cos(a1);
        const num4_2 = a2_v * a2_v * l2 * m2 * Math.cos(a1 - a2);
        const den_2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
        const a2_a = (num1_2 * (num2_2 + num3_2 + num4_2)) / den_2;

        this.a1_v += a1_a * dt * 20; // Speed factor
        this.a2_v += a2_a * dt * 20;
        this.a1 += this.a1_v * dt * 20;
        this.a2 += this.a2_v * dt * 20;

        // Damping
        this.a1_v *= 0.999;
        this.a2_v *= 0.999;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        const { x1, y1, x2, y2 } = this.getBobPositions();

        // Draw trace
        if (this.showTrace) {
            this.trace.push({ x: x2, y: y2 });
            if (this.trace.length > this.maxTraceLength) {
                this.trace.shift();
            }

            this.ctx.beginPath();
            for (let i = 1; i < this.trace.length; i++) {
                const alpha = i / this.trace.length;
                this.ctx.strokeStyle = `${this.colors.trace} ${alpha * 0.6})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.trace[i - 1].x, this.trace[i - 1].y);
                this.ctx.lineTo(this.trace[i].x, this.trace[i].y);
                this.ctx.stroke();
            }
        }

        // Draw rods
        this.ctx.strokeStyle = this.colors.rod;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.origin.x, this.origin.y);
        this.ctx.lineTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // Draw origin point
        this.ctx.fillStyle = '#e62020';
        this.ctx.beginPath();
        this.ctx.arc(this.origin.x, this.origin.y, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw bob 1
        const radius1 = Math.max(10, Math.min(30, this.m1));
        this.ctx.fillStyle = this.colors.bob;
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, radius1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = this.colors.bg; // Use bg color for stroke
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw bob 2
        const radius2 = Math.max(10, Math.min(30, this.m2));
        this.ctx.fillStyle = '#e62020';
        this.ctx.beginPath();
        this.ctx.arc(x2, y2, radius2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = this.colors.bg; // Use bg color for stroke
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw energy info
        this.drawInfo();
    }

    drawInfo() {
        const { x1, y1, x2, y2 } = this.getBobPositions();

        // Calculate kinetic and potential energy
        const v1x = this.l1 * this.a1_v * Math.cos(this.a1);
        const v1y = this.l1 * this.a1_v * Math.sin(this.a1);
        const v2x = v1x + this.l2 * this.a2_v * Math.cos(this.a2);
        const v2y = v1y + this.l2 * this.a2_v * Math.sin(this.a2);

        const KE1 = 0.5 * this.m1 * (v1x * v1x + v1y * v1y);
        const KE2 = 0.5 * this.m2 * (v2x * v2x + v2y * v2y);
        const PE1 = this.m1 * this.g * (this.origin.y - y1);
        const PE2 = this.m2 * this.g * (this.origin.y - y2);

        const totalEnergy = KE1 + KE2 + PE1 + PE2;

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`Total Energy: ${totalEnergy.toFixed(2)} J`, 10, 20);
        this.ctx.fillText(`Kinetic: ${(KE1 + KE2).toFixed(2)} J`, 10, 40);
        this.ctx.fillText(`Potential: ${(PE1 + PE2).toFixed(2)} J`, 10, 60);
    }
    // ... rest of class remains valid ... 
    animate(currentTime) {
        // ... animate method ...
        const dt = this.lastTime ? Math.min((currentTime - this.lastTime) / 1000, 0.016) : 0.016;
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.animate(t));
    }

    // ... other methods ...
    reset() {
        this.a1 = 0;
        this.a2 = 0;
        this.a1_v = 0;
        this.a2_v = 0;
        this.trace = [];
        this.isPaused = true;

        // Update button text to match state
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.textContent = 'Resume';
    }

    updateParameters() {
        this.m1 = parseFloat(document.getElementById('mass1').value);
        this.m2 = parseFloat(document.getElementById('mass2').value);
        this.l1 = parseFloat(document.getElementById('length1').value);
        this.l2 = parseFloat(document.getElementById('length2').value);
        this.g = parseFloat(document.getElementById('gravity').value);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pendulumCanvas');
    if (canvas) {
        const pendulum = new DoublePendulum(canvas);

        // Controls
        document.getElementById('resetBtn').addEventListener('click', () => {
            pendulum.reset();
        });

        document.getElementById('pauseBtn').textContent = 'Resume';
        document.getElementById('pauseBtn').addEventListener('click', (e) => {
            pendulum.isPaused = !pendulum.isPaused;
            e.target.textContent = pendulum.isPaused ? 'Resume' : 'Pause';
        });

        document.getElementById('showTrace').addEventListener('change', (e) => {
            pendulum.showTrace = e.target.checked;
            if (!e.target.checked) {
                pendulum.trace = [];
            }
        });

        // Update parameters on change
        ['mass1', 'mass2', 'length1', 'length2', 'gravity'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                pendulum.updateParameters();
            });
        });

        // Start animation
        pendulum.animate(0);
    }
});
