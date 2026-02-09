// PID Controller Simulation

class PID {
    constructor(kp, ki, kd) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        this.prevError = 0;
        this.integral = 0;
    }

    update(setpoint, processVariable, dt) {
        const error = setpoint - processVariable;

        // Integral term
        this.integral += error * dt;

        // Derivative term
        const derivative = (error - this.prevError) / dt;

        // Output calculation
        const output = (this.kp * error) + (this.ki * this.integral) + (this.kd * derivative);

        this.prevError = error;

        return output;
    }

    reset() {
        this.prevError = 0;
        this.integral = 0;
    }
}

class RotationalSystem {
    constructor() {
        this.angle = 0;           // Current angle (radians)
        this.velocity = 0;        // Angular velocity (rad/s)
        this.inertia = 0.5;       // Moment of inertia (kg*m^2)
        this.damping = 0.5;       // Viscous damping coefficient
    }

    update(torque, dt) {
        // Net torque = applied torque - damping torque
        const netTorque = torque - (this.damping * this.velocity);

        // Newton's Second Law for rotation: torque = I * alpha
        const acceleration = netTorque / this.inertia;

        // Integrate
        this.velocity += acceleration * dt;
        this.angle += this.velocity * dt;
    }
}

class PIDSimulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.pid = new PID(0.5, 0.0, 0.1);
        this.system = new RotationalSystem();

        // State
        this.setpoint = 0; // Target angle (radians)
        this.isDragging = false;

        // Graph Data
        this.history = [];
        this.maxHistory = 300;

        // Animation
        this.lastTime = 0;

        // Visual Constants
        this.updateThemeColors(ThemeManager.currentTheme);

        // Listen for theme changes
        window.addEventListener('themeChanged', (e) => {
            this.updateThemeColors(e.detail.theme);
            if (!this.isDragging) this.draw();
        });

        this.setupEventListeners();
    }

    updateThemeColors(theme) {
        if (theme === 'light') {
            this.colors = {
                bg: '#f9f8f4',
                text: '#1a1a1a',
                target: '#e62020', // Red
                output: '#1a1a1a', // Black
                grid: '#e0e0e0',
                graphBg: '#ffffff',
                graphGrid: '#eeeeee'
            };
        } else {
            this.colors = {
                bg: '#0a0a0a',
                text: '#ffffff',
                target: '#e62020', // Red
                output: '#ffffff', // White
                grid: '#333333',
                graphBg: '#111111',
                graphGrid: '#444444'
            };
        }
    }

    setupEventListeners() {
        // ... (standard listeners) ...
        // Mouse Events
        this.canvas.addEventListener('mousedown', (e) => this.handleInputStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleInputMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleInputEnd());
        this.canvas.addEventListener('mouseleave', () => this.handleInputEnd());

        // Touch Events (basic support)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInputStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleInputMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.handleInputEnd());
    }

    handleInputStart(e) {
        const { x, y } = this.getMousePos(e);
        const knobCenter = { x: this.width * 0.25, y: this.height / 2 };
        const dist = Math.sqrt((x - knobCenter.x) ** 2 + (y - knobCenter.y) ** 2);

        if (dist < 60) {
            this.isDragging = true;
            this.updateSetpoint(x, y);
        }
    }

    handleInputMove(e) {
        if (!this.isDragging) return;
        const { x, y } = this.getMousePos(e);
        this.updateSetpoint(x, y);
    }

    handleInputEnd() {
        this.isDragging = false;
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    updateSetpoint(x, y) {
        const knobCenter = { x: this.width * 0.25, y: this.height / 2 };
        // Atan2 returns -PI to PI. 
        // We want 0 to be at 12 o'clock, so we subtract PI/2
        this.setpoint = Math.atan2(y - knobCenter.y, x - knobCenter.x);
    }

    update(dt) {
        // PID Output (Torque)
        // Adjust for wrapping around PI/-PI
        let error = this.setpoint - this.system.angle;
        while (error > Math.PI) error -= 2 * Math.PI;
        while (error < -Math.PI) error += 2 * Math.PI;

        // Hack: Feed the error directly into PID instead of absolute values to handle wrapping
        // Actually, creating a "virtual" process variable relative to setpoint is easier
        // But for this simple demo, let's just use the wrapped error directly
        // The PID class expects (setpoint, pv), so we can pass (error, 0)

        const controlOutput = this.pid.update(error, 0, dt);

        // Apply Physics
        this.system.update(controlOutput * 50, dt); // Scale up torque

        // Wrap system angle visually
        while (this.system.angle > Math.PI) this.system.angle -= 2 * Math.PI;
        while (this.system.angle < -Math.PI) this.system.angle += 2 * Math.PI;

        // Update Graph History
        this.history.push({
            time: performance.now(),
            setpoint: this.setpoint,
            output: this.system.angle
        });
        if (this.history.length > this.maxHistory) this.history.shift();
    }

    draw() {
        // Clear
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        const knobRadius = 50;
        const centerY = this.height / 2;

        // --- Draw Controls UI (Knobs) ---

        // 1. Target Knob (Input)
        const targetX = this.width * 0.25;
        this.drawKnob(targetX, centerY, knobRadius, this.setpoint, this.colors.target, "Target");

        // 2. System Knob (Output)
        const outputX = this.width * 0.5;
        this.drawKnob(outputX, centerY, knobRadius, this.system.angle, this.colors.output, "Output");

        // --- Draw Graph ---
        this.drawGraph(this.width * 0.65, 50, this.width * 0.3, this.height - 100);
    }

    drawKnob(x, y, radius, angle, color, label) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // Outer ring
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        // Indicator Line
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(radius - 5, 0);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = "round";
        this.ctx.stroke();

        // Dot at the end
        this.ctx.beginPath();
        this.ctx.arc(radius - 10, 0, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        this.ctx.restore();

        // Label
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = "bold 14px 'Helvetica Neue', Arial, sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText(label.toUpperCase(), x, y + radius + 30);
    }

    drawGraph(x, y, w, h) {
        // Background
        this.ctx.fillStyle = this.colors.graphBg; // Dark graph bg
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.strokeRect(x, y, w, h);

        // Axis Lines (Middle = 0)
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + h / 2);
        this.ctx.lineTo(x + w, y + h / 2);
        this.ctx.strokeStyle = this.colors.graphGrid;
        this.ctx.stroke();

        this.ctx.save();
        this.ctx.rect(x, y, w, h);
        this.ctx.clip();

        // Plot Setpoint (Red)
        this.ctx.beginPath();
        this.history.forEach((pt, i) => {
            const px = x + (i / this.maxHistory) * w;
            // Map -PI to PI to 0 to h
            const py = y + h / 2 - (pt.setpoint / Math.PI) * (h / 2) * 0.8; // 0.8 scale to stay inside
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        });
        this.ctx.strokeStyle = this.colors.target;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Plot Output (Black)
        this.ctx.beginPath();
        this.history.forEach((pt, i) => {
            const px = x + (i / this.maxHistory) * w;
            const py = y + h / 2 - (pt.output / Math.PI) * (h / 2) * 0.8;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        });
        this.ctx.strokeStyle = this.colors.output;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    animate(currentTime) {
        const dt = this.lastTime ? Math.min((currentTime - this.lastTime) / 1000, 0.1) : 0.016;
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.animate(t));
    }

    updateGains(p, i, d) {
        this.pid.kp = p;
        this.pid.ki = i;
        this.pid.kd = d;
        this.pid.reset();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // We already have pendulum code, let's wrap this to avoid conflicts/errors
    // Check if the canvas exists
    const canvas = document.getElementById('pidCanvas');
    if (canvas) {
        const pidSim = new PIDSimulation(canvas);
        pidSim.animate(0);

        // Connect Sliders
        const kpInput = document.getElementById('kp');
        const kiInput = document.getElementById('ki');
        const kdInput = document.getElementById('kd');
        const kpVal = document.getElementById('kp-val');
        const kiVal = document.getElementById('ki-val');
        const kdVal = document.getElementById('kd-val');

        const updateParams = () => {
            const p = parseFloat(kpInput.value);
            const i = parseFloat(kiInput.value);
            const d = parseFloat(kdInput.value);

            kpVal.textContent = p.toFixed(2);
            kiVal.textContent = i.toFixed(2);
            kdVal.textContent = d.toFixed(2);

            pidSim.updateGains(p, i, d);
        };

        kpInput.addEventListener('input', updateParams);
        kiInput.addEventListener('input', updateParams);
        kdInput.addEventListener('input', updateParams);

        // Init values
        updateParams();
    }
});
