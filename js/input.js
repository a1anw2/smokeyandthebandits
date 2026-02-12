// ============================================================
// INPUT MANAGER
// ============================================================
class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this._touchActive = false;
    this._showTouchHint = this._isMobile;
    this._touchHintTimer = 5; // seconds to show hint

    // Keyboard input
    window.addEventListener('keydown', e => {
      if (!this.keys[e.code]) this.justPressed[e.code] = true;
      this.keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','Minus','Equal','NumpadAdd','NumpadSubtract','Tab'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });

    // Touch input (mobile)
    if (this._isMobile) {
      this._setupTouch();
    }
  }

  _setupTouch() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    this._touches = {};
    this._lastDoubleTap = 0;

    const getPos = (touch) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (touch.clientX - rect.left) / rect.width,   // 0..1 normalized
        y: (touch.clientY - rect.top) / rect.height     // 0..1 normalized
      };
    };

    const processTouches = () => {
      // Reset touch-driven keys before recomputing
      this.keys['ArrowUp'] = false;
      this.keys['ArrowDown'] = false;
      this.keys['ArrowLeft'] = false;
      this.keys['ArrowRight'] = false;
      this.keys['Space'] = false;

      const ids = Object.keys(this._touches);
      for (const id of ids) {
        const pos = this._touches[id];
        if (pos.x < 0.5) {
          // LEFT HALF: Steering + throttle
          const steerX = pos.x / 0.5; // 0..1 within left half
          if (steerX < 0.35) this.keys['ArrowLeft'] = true;
          else if (steerX > 0.65) this.keys['ArrowRight'] = true;
          this.keys['ArrowUp'] = true; // always throttle when steering
        } else {
          // RIGHT HALF: bottom = gas, top = brake
          if (pos.y > 0.5) {
            this.keys['ArrowUp'] = true;
          } else {
            this.keys['ArrowDown'] = true;
          }
        }
      }
    };

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._touchActive = true;
      const now = Date.now();
      for (const touch of e.changedTouches) {
        const pos = getPos(touch);
        this._touches[touch.identifier] = pos;
        // Double-tap right side = handbrake
        if (pos.x >= 0.5 && now - this._lastDoubleTap < 350) {
          this.keys['Space'] = true;
        }
        if (pos.x >= 0.5) this._lastDoubleTap = now;
        // Tap = Enter for menu navigation
        if (!this.justPressed['Enter']) {
          this.justPressed['Enter'] = true;
          this.keys['Enter'] = true;
        }
      }
      processTouches();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        this._touches[touch.identifier] = getPos(touch);
      }
      processTouches();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        delete this._touches[touch.identifier];
      }
      if (Object.keys(this._touches).length === 0) this._touchActive = false;
      processTouches();
      this.keys['Enter'] = false;
    }, { passive: false });

    canvas.addEventListener('touchcancel', (e) => {
      for (const touch of e.changedTouches) {
        delete this._touches[touch.identifier];
      }
      processTouches();
    }, { passive: false });
  }

  isDown(code) { return !!this.keys[code]; }
  wasPressed(code) { return !!this.justPressed[code]; }

  clear() {
    this.justPressed = {};
    if (this._showTouchHint && this._touchHintTimer > 0) {
      this._touchHintTimer -= 1 / 60;
      if (this._touchHintTimer <= 0) this._showTouchHint = false;
    }
  }

  get isMobile() { return this._isMobile; }
  get showTouchHint() { return this._showTouchHint; }
}
