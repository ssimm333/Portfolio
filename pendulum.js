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
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    }

    getBobPositions() {
        const x1 = this.origin.x + this.l1 * Math.sin(this.a1);
        const y1 = this.origin.y + this.l1 * Math.cos(this.a1);
        const x2 = x1 + this.l2 * Math.sin(this.a2);
        const y2 = y1 + this.l2 * Math.cos(this.a2);
        return { x1, y1, x2, y2 };
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const { x1, y1, x2, y2 } = this.getBobPositions();

        const dist1 = Math.sqrt((mouseX - x1) ** 2 + (mouseY - y1) ** 2);
        const dist2 = Math.sqrt((mouseX - x2) ** 2 + (mouseY - y2) ** 2);

        if (dist1 < 20) {
            this.dragging = 'bob1';
            this.isPaused = true;
        } else if (dist2 < 20) {
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
        } else if (this.dragging === 'bob2') {
            const { x1, y1 } = this.getBobPositions();
            const dx = mouseX - x1;
            const dy = mouseY - y1;
            this.a2 = Math.atan2(dx, dy);
            this.a2_v = 0;
        }

        this.trace = []; // Clear trace when dragging
    }

    handleMouseUp() {
        if (this.dragging) {
            this.dragging = null;
            this.isPaused = false;
        }
    }

    update(dt) {
        if (this.isPaused || this.dragging) return;

        // Speed up simulation
        const timeScale = 10;
        const targetDt = dt * timeScale;

        // Fixed time step for stability
        // Keep steps small to prevent energy drift in RK4
        const maxStepSize = 0.005; // 5ms maximum step size
        const steps = Math.ceil(targetDt / maxStepSize);
        const subDt = targetDt / steps;

        for (let i = 0; i < steps; i++) {
            this.rk4Step(subDt);
        }
    }

    rk4Step(dt) {
        // Current state
        const state = [this.a1, this.a1_v, this.a2, this.a2_v];

        // Calculate k1
        const k1 = this.derivatives(state);

        // Calculate k2
        const state2 = state.map((s, i) => s + k1[i] * dt / 2);
        const k2 = this.derivatives(state2);

        // Calculate k3
        const state3 = state.map((s, i) => s + k2[i] * dt / 2);
        const k3 = this.derivatives(state3);

        // Calculate k4
        const state4 = state.map((s, i) => s + k3[i] * dt);
        const k4 = this.derivatives(state4);

        // Update state
        this.a1 += (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * dt / 6;
        this.a1_v += (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * dt / 6;
        this.a2 += (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) * dt / 6;
        this.a2_v += (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]) * dt / 6;
    }

    derivatives(state) {
        const [a1, a1_v, a2, a2_v] = state;
        const m1 = this.m1;
        const m2 = this.m2;
        const l1 = this.l1;
        const l2 = this.l2;
        const g = this.g;

        const delta = a2 - a1;

        // Equations of motion for double pendulum
        const den1 = (m1 + m2) * l1 - m2 * l1 * Math.cos(delta) * Math.cos(delta);
        const den2 = (l2 / l1) * den1;

        const a1_a = (m2 * l1 * a1_v * a1_v * Math.sin(delta) * Math.cos(delta) +
            m2 * g * Math.sin(a2) * Math.cos(delta) +
            m2 * l2 * a2_v * a2_v * Math.sin(delta) -
            (m1 + m2) * g * Math.sin(a1)) / den1;

        const a2_a = (-m2 * l2 * a2_v * a2_v * Math.sin(delta) * Math.cos(delta) +
            (m1 + m2) * g * Math.sin(a1) * Math.cos(delta) -
            (m1 + m2) * l1 * a1_v * a1_v * Math.sin(delta) -
            (m1 + m2) * g * Math.sin(a2)) / den2;

        return [a1_v, a1_a, a2_v, a2_a];
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#f9f8f4';
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
                this.ctx.strokeStyle = `rgba(230, 32, 32, ${alpha * 0.6})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.trace[i - 1].x, this.trace[i - 1].y);
                this.ctx.lineTo(this.trace[i].x, this.trace[i].y);
                this.ctx.stroke();
            }
        }

        // Draw rods
        this.ctx.strokeStyle = '#1a1a1a';
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
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, radius1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#f9f8f4';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw bob 2
        const radius2 = Math.max(10, Math.min(30, this.m2));
        this.ctx.fillStyle = '#e62020';
        this.ctx.beginPath();
        this.ctx.arc(x2, y2, radius2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#f9f8f4';
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

        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`Total Energy: ${totalEnergy.toFixed(2)} J`, 10, 20);
        this.ctx.fillText(`Kinetic: ${(KE1 + KE2).toFixed(2)} J`, 10, 40);
        this.ctx.fillText(`Potential: ${(PE1 + PE2).toFixed(2)} J`, 10, 60);
    }

    animate(currentTime) {
        const dt = this.lastTime ? Math.min((currentTime - this.lastTime) / 1000, 0.016) : 0.016;
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.animate(t));
    }

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
});
