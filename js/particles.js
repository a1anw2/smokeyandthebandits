// ============================================================
// PARTICLE SYSTEM
// ============================================================
const PARTICLE_PROPS = {
  smoke:   { life: 0.8, size: 4 },
  exhaust: { life: 0.4, size: 2 },
  dirt:    { life: 0.5, size: 3 }
};

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.skidMarks = [];
    this._skidWriteIdx = 0;
  }

  emit(x, y, vx, vy, type) {
    if (this.particles.length >= MAX_PARTICLES) return;
    const props = PARTICLE_PROPS[type] || PARTICLE_PROPS.dirt;
    const p = {
      x, y, vx, vy, type,
      life: props.life,
      maxLife: props.life,
      size: props.size,
    };
    this.particles.push(p);
  }

  addSkidMark(x, y, alpha) {
    if (this.skidMarks.length < MAX_SKIDMARKS) {
      this.skidMarks.push({ x, y, alpha, age: 0 });
    } else {
      // Circular buffer: overwrite oldest entry
      this.skidMarks[this._skidWriteIdx] = { x, y, alpha, age: 0 };
      this._skidWriteIdx = (this._skidWriteIdx + 1) % MAX_SKIDMARKS;
    }
  }

  update(dt) {
    // Particles: swap-and-pop for O(1) removal
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vx *= PARTICLE_DRAG; p.vy *= PARTICLE_DRAG;
      if (p.type === 'smoke') p.size += dt * 8;
      if (p.life <= 0) {
        // Swap with last element and pop (O(1) instead of O(n) splice)
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
      }
    }
    // Skidmarks: fade in place, mark as invisible when alpha <= 0
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      this.skidMarks[i].age += dt;
      this.skidMarks[i].alpha -= dt * SKID_FADE_RATE;
    }
  }
}
