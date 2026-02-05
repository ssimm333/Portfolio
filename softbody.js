// Soft Body Phsyics (Jelly Analysis)

class Particle {
    constructor(x, y, mass) {
        this.x = x;
        this.y = y;
        this.oldx = x; // For Verlet Integration
        this.oldy = y;
        this.mass = mass;
        this.vx = 0; // For damping calcs if needed, mainly implicit in verlet
        this.vy = 0;
        this.isPinned = false;
    }

    update(dt, gravity, friction) {
        if (this.isPinned) return;

        // Verlet Integration
        // x_new = 2*x - x_old + a * dt^2

        let vx = (this.x - this.oldx) * friction;
        let vy = (this.y - this.oldy) * friction;

        this.oldx = this.x;
        this.oldy = this.y;

        this.x += vx;
        this.y += vy;
        this.y += gravity * dt * dt; // Gravity

        // Boundaries
        const bounce = 0.8;
        // Floor
        if (this.y > 600 - 10) {
            this.y = 600 - 10;
            this.oldy = this.y + vy * bounce;
        }
        // Walls
        if (this.x > 800 - 10) {
            this.x = 800 - 10;
            this.oldx = this.x + vx * bounce;
        }
        if (this.x < 10) {
            this.x = 10;
            this.oldx = this.x + vx * bounce;
        }
        // Ceiling
        if (this.y < 10) {
            this.y = 10;
            this.oldy = this.y + vy * bounce;
        }
    }
}

class Spring {
    constructor(p1, p2, stiffness, damping) {
        this.p1 = p1;
        this.p2 = p2;
        this.stiffness = stiffness;
        this.length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }

    update() {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return;

        const diff = (this.length - dist) / dist * this.stiffness;
        const offsetX = dx * diff * 0.5;
        const offsetY = dy * diff * 0.5;

        if (!this.p1.isPinned) {
            this.p1.x -= offsetX;
            this.p1.y -= offsetY;
        }
        if (!this.p2.isPinned) {
            this.p2.x += offsetX;
            this.p2.y += offsetY;
        }
    }
}

class SoftBodySimulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.particles = [];
        this.springs = [];

        // Physics Params
        this.gravity = 500;
        this.friction = 0.99;
        this.stiffness = 0.5;
        this.iterations = 5; // Solver iterations

        // Interaction
        this.draggedParticle = null;
        this.mouse = { x: 0, y: 0 };

        this.createJelly(250, 100, 5, 5, 60);

        this.setupEventListeners();
        this.animate();
    }

    createJelly(startX, startY, cols, rows, spacing) {
        this.particles = [];
        this.springs = [];

        // Create Particles
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.particles.push(new Particle(startX + x * spacing, startY + y * spacing, 1));
            }
        }

        // Create Springs (Structural + Shear + Bend)
        // Structural (Right and Down)
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                if (x < cols - 1) { // Right neighbor
                    this.springs.push(new Spring(this.particles[i], this.particles[i + 1], 0.8));
                }
                if (y < rows - 1) { // Down neighbor
                    this.springs.push(new Spring(this.particles[i], this.particles[i + cols], 0.8));
                }
                // Shear (Cross diagonals) for stability
                if (x < cols - 1 && y < rows - 1) {
                    this.springs.push(new Spring(this.particles[i], this.particles[i + cols + 1], 0.8));
                    this.springs.push(new Spring(this.particles[i + 1], this.particles[i + cols], 0.8));
                }
            }
        }

        // Pin corners initially? No, let it fall.
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            const pos = this.getMousePos(e);
            this.mouse = pos;

            // Find nearest particle
            let minDist = 50;
            let nearest = null;

            for (let p of this.particles) {
                const d = Math.hypot(p.x - pos.x, p.y - pos.y);
                if (d < minDist) {
                    minDist = d;
                    nearest = p;
                }
            }

            if (nearest) {
                this.draggedParticle = nearest;
                this.draggedParticle.isPinned = true;
            } else {
                // Throw impulse?
                this.applyExplosion(pos.x, pos.y);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.draggedParticle) {
                const pos = this.getMousePos(e);
                this.draggedParticle.x = pos.x;
                this.draggedParticle.y = pos.y;
                this.draggedParticle.oldx = pos.x; // Stop momentum while dragging
                this.draggedParticle.oldy = pos.y;
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.draggedParticle) {
                this.draggedParticle.isPinned = false;
                this.draggedParticle = null;
            }
        });

        // Touch support can be added similarly

        // Sliders
        const stiffnessInput = document.getElementById('stiffness');
        if (stiffnessInput) {
            stiffnessInput.addEventListener('input', (e) => {
                const k = parseFloat(e.target.value);
                this.stiffness = k;
                this.springs.forEach(s => s.stiffness = k);
                document.getElementById('stiffness-val').textContent = k.toFixed(2);
            });
        }
    }

    applyExplosion(x, y) {
        for (let p of this.particles) {
            const dx = p.x - x;
            const dy = p.y - y;
            const d = Math.hypot(dx, dy);
            if (d < 150) {
                const force = (150 - d) * 0.2;
                p.oldx -= (dx / d) * force;
                p.oldy -= (dy / d) * force;
            }
        }
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    update(dt) {
        // Update particles
        for (let p of this.particles) {
            p.update(dt, this.gravity, this.friction);
        }

        // Solve constraints (Springs)
        // Multiple iterations for stability (Constraint Relaxation)
        for (let i = 0; i < this.iterations; i++) {
            for (let s of this.springs) {
                s.update();
            }

            // Constrain to box again if needed within iterations for super stiffness
        }
    }

    draw() {
        this.ctx.fillStyle = '#f9f8f4';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Springs
        this.ctx.beginPath();
        for (let s of this.springs) {
            this.ctx.moveTo(s.p1.x, s.p1.y);
            this.ctx.lineTo(s.p2.x, s.p2.y);
        }
        this.ctx.strokeStyle = 'rgba(26, 26, 26, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Fill Jelly body (Triangulation or simple hull)
        // Simple visual: Connect outer nodes?
        // Actually, just drawing particles is fine for minimal swiss style

        // Draw Particles
        for (let p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#e62020';
            this.ctx.fill();
        }

        // Draw Drag Line
        if (this.draggedParticle) {
            this.ctx.beginPath();
            this.ctx.arc(this.draggedParticle.x, this.draggedParticle.y, 8, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#1a1a1a';
            this.ctx.stroke();
        }
    }

    animate() {
        if (this.canvas.offsetParent === null) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        this.update(0.016); // Fixed timestep for verlet is best
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('softBodyCanvas');
    if (canvas) {
        new SoftBodySimulation(canvas);
    }
});
