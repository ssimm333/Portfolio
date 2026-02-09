// Fourier Series Drawing Demo

class Complex {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }

    add(c) {
        return new Complex(this.re + c.re, this.im + c.im);
    }

    multiply(c) {
        return new Complex(
            this.re * c.re - this.im * c.im,
            this.re * c.im + this.im * c.re
        );
    }
}

class FourierSimulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Data
        this.drawing = []; // User input points {x, y}
        this.fourierX = []; // DFT results
        this.path = []; // Reconstructed path

        // State
        this.state = 'IDLE'; // IDLE, DRAWING, COMPUTING, ANIMATING
        this.time = 0;
        this.isMouseDown = false;

        // Colors
        this.updateThemeColors(ThemeManager.currentTheme);

        window.addEventListener('themeChanged', (e) => {
            this.updateThemeColors(e.detail.theme);
            if (this.state !== 'ANIMATING') this.drawLoop(0); // Redraw
        });

        this.setupEventListeners();
        this.draw(); // Initial draw
    }

    updateThemeColors(theme) {
        if (theme === 'light') {
            this.colors = {
                bg: '#f9f8f4',
                line: '#1a1a1a',
                accent: '#e62020',
                epicycle: 'rgba(26, 26, 26, 0.1)',
                epicycleLine: 'rgba(26, 26, 26, 0.3)'
            };
        } else {
            this.colors = {
                bg: '#0a0a0a',
                line: '#ffffff',
                accent: '#e62020',
                epicycle: 'rgba(255, 255, 255, 0.1)',
                epicycleLine: 'rgba(255, 255, 255, 0.3)'
            };
        }
    }

    setupEventListeners() {
        // Mouse
        this.canvas.addEventListener('mousedown', (e) => this.inputStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.inputMove(e));
        this.canvas.addEventListener('mouseup', () => this.inputEnd());
        this.canvas.addEventListener('mouseleave', () => this.finishDrawing());

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.inputStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.inputMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.inputEnd());
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    inputStart(e) {
        if (this.state === 'ANIMATING' || this.state === 'IDLE') {
            // Reset for new drawing
            this.state = 'DRAWING';
            this.drawing = [];
            this.fourierX = [];
            this.path = [];
            this.time = 0;
        }

        this.isMouseDown = true;
        const pos = this.getMousePos(e);
        this.drawing.push({ x: pos.x, y: pos.y });
    }

    inputMove(e) {
        if (this.state === 'DRAWING' && this.isMouseDown) {
            const pos = this.getMousePos(e);
            this.drawing.push({ x: pos.x, y: pos.y });
        }
    }

    inputEnd() {
        this.isMouseDown = false;
        this.finishDrawing();
    }

    finishDrawing() {
        if (this.state === 'DRAWING') {
            if (this.drawing.length > 5) {
                this.state = 'COMPUTING';
                // Small delay to allow render to show "Computing..." if we wanted
                setTimeout(() => this.computeDFT(), 10);
            } else {
                this.state = 'IDLE'; // Too short
            }
        }
    }

    // Discrete Fourier Transform
    // X_k = sum_{n=0}^{N-1} x_n * e^{-i * 2*PI * k * n / N}
    dft(x) {
        const X = [];
        const N = x.length;

        for (let k = 0; k < N; k++) {
            let sum = new Complex(0, 0);

            for (let n = 0; n < N; n++) {
                const phi = (Math.PI * 2 * k * n) / N;
                const c = new Complex(Math.cos(phi), -Math.sin(phi));
                sum = sum.add(x[n].multiply(c));
            }

            sum.re = sum.re / N;
            sum.im = sum.im / N;

            let freq = k;
            let amp = Math.sqrt(sum.re * sum.re + sum.im * sum.im);
            let phase = Math.atan2(sum.im, sum.re);

            X[k] = { re: sum.re, im: sum.im, freq, amp, phase };
        }

        return X;
    }

    computeDFT() {
        // Prepare complex input
        const complexDrawing = this.drawing.map(p => new Complex(p.x, p.y));

        // Compute DFT
        this.fourierX = this.dft(complexDrawing);

        // Sort by amplitude (radius) - descending
        this.fourierX.sort((a, b) => b.amp - a.amp);

        this.state = 'ANIMATING';
        this.animate(0);
    }

    drawEpicycles(x, y, rotation, fourier) {
        for (let i = 0; i < fourier.length; i++) {
            let prevx = x;
            let prevy = y;

            let freq = fourier[i].freq;
            let radius = fourier[i].amp;
            let phase = fourier[i].phase;

            x += radius * Math.cos(freq * this.time + phase + rotation);
            y += radius * Math.sin(freq * this.time + phase + rotation);

            // Draw circle
            this.ctx.strokeStyle = this.colors.epicycle;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(prevx, prevy, radius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Draw radius line
            this.ctx.strokeStyle = this.colors.epicycleLine;
            this.ctx.beginPath();
            this.ctx.moveTo(prevx, prevy);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }

        return { x, y };
    }

    animate(currentTime) {
        if (this.state !== 'ANIMATING') {
            requestAnimationFrame((t) => this.drawLoop(t)); // Keep loop running for other states
            return;
        }

        this.drawLoop(currentTime);

        const dt = Math.PI * 2 / this.fourierX.length;
        this.time += dt;

        if (this.time > Math.PI * 2) {
            this.time = 0;
            this.path = [];
        }

        requestAnimationFrame((t) => this.animate(t));
    }

    drawLoop(t) {
        // Clear screen
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'IDLE') {
            this.ctx.fillStyle = '#aaa';
            this.ctx.font = "24px 'Helvetica Neue', Arial, sans-serif";
            this.ctx.textAlign = 'center';
            this.ctx.fillText("Draw something continuous here...", this.width / 2, this.height / 2);
        }
        else if (this.state === 'DRAWING') {
            // Draw user path
            this.ctx.beginPath();
            if (this.drawing.length > 0) {
                this.ctx.moveTo(this.drawing[0].x, this.drawing[0].y);
                for (let i = 1; i < this.drawing.length; i++) {
                    this.ctx.lineTo(this.drawing[i].x, this.drawing[i].y);
                }
            }
            this.ctx.strokeStyle = this.colors.line;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        else if (this.state === 'ANIMATING') {
            // Calculate epicycles
            let v = this.drawEpicycles(0, 0, 0, this.fourierX); // Center at 0,0 because coordinates are embedded in DFT

            // Add point to path
            // We want to reconstruct the drawing, but prevent infinite growth
            // In our case, animate loop resets path when full circle done
            this.path.unshift(v);
            if (this.path.length > this.fourierX.length) {
                this.path.pop();
                // Alternatively keep full path to draw "ink"
            }

            // Draw path
            this.ctx.beginPath();
            if (this.path.length > 0) {
                this.ctx.moveTo(this.path[0].x, this.path[0].y);
                for (let i = 1; i < this.path.length; i++) {
                    this.ctx.lineTo(this.path[i].x, this.path[i].y);
                }
            }
            this.ctx.strokeStyle = this.colors.accent;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Draw original faint trace for reference?
            // Maybe cluttering. Let's stick to reconstruction.
        }

        // Request next frame is handled by animate or fallback
        if (this.state !== 'ANIMATING') {
            requestAnimationFrame((t) => this.drawLoop(t));
        }
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fourierCanvas');
    if (canvas) {
        new FourierSimulation(canvas);
    }
});
