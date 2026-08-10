/**
 * DOMShatter — Rips real DOM elements out of a container and flings them
 * around with physics (explosion → bounce walls → gravity → settle).
 *
 * Supports excluding specific elements (e.g. keep the input field visible).
 */

interface PhysicsBody {
  el: HTMLElement;
  sourceEl: HTMLElement;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
}

export interface ShatterOptions {
  /** CSS selector for elements that should NOT fly away (they stay in place) */
  excludeSelector?: string;
}

export class GlassShatter {
  private bodies: PhysicsBody[] = [];
  private overlay: HTMLElement | null = null;
  private targetEl: HTMLElement;
  private animId: number | null = null;
  private phase: 'idle' | 'exploding' | 'resetting' = 'idle';
  private hiddenSources: HTMLElement[] = [];
  private options: ShatterOptions;

  // Reset lerp
  private resetT = 0;
  private resetStarts: Array<{ x: number; y: number; angle: number }> = [];
  private onDone: (() => void) | null = null;
  private savedOverflow = '';

  constructor(target: HTMLElement, options?: ShatterOptions) {
    this.targetEl = target;
    this.options = options || {};
  }

  // ━━━ PUBLIC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  shatter(): void {
    if (this.phase !== 'idle') return;
    // Prevent scrollbar from flying pieces
    this.savedOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    this.createOverlay();
    this.captureElements();
    this.applyExplosion();
    this.phase = 'exploding';
    this.tick();
  }

  resetForm(callback?: () => void): void {
    if (this.phase !== 'exploding') {
      callback?.();
      return;
    }
    this.onDone = callback || null;
    this.resetT = 0;
    this.resetStarts = this.bodies.map(b => ({ x: b.x, y: b.y, angle: b.angle }));
    this.phase = 'resetting';
  }

  destroy(): void {
    if (this.animId != null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    // Restore hidden source elements
    this.hiddenSources.forEach(el => {
      el.style.visibility = '';
      el.style.opacity = '';
    });
    this.hiddenSources = [];
    if (this.overlay?.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    this.overlay = null;
    this.bodies = [];
    // Restore body overflow
    document.documentElement.style.overflow = this.savedOverflow;
    document.body.style.overflow = this.savedOverflow;
    this.phase = 'idle';
  }

  // ━━━ OVERLAY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '999999',
      overflow: 'hidden' // Hard clip — nothing escapes the viewport
    });
    document.body.appendChild(this.overlay);
  }

  // ━━━ CAPTURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private captureElements(): void {
    this.bodies = [];
    this.hiddenSources = [];

    const excludeSel = this.options.excludeSelector || '';

    // Walk direct children + nested meaningful elements
    const allEls: HTMLElement[] = [];

    // First pass: get all leaf-level visible elements
    const walk = (parent: HTMLElement, depth: number) => {
      for (let i = 0; i < parent.children.length; i++) {
        const child = parent.children[i] as HTMLElement;
        const rect = child.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        const style = getComputedStyle(child);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        // Check if this element should be excluded
        if (excludeSel && child.matches(excludeSel)) continue;
        // Check if this element is INSIDE an excluded element
        if (excludeSel && child.closest(excludeSel)) continue;

        // If it has few/no children or is a specific component, treat as leaf
        const meaningfulChildren = Array.from(child.children).filter(c => {
          const r = c.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        }).length;

        if (meaningfulChildren === 0 || depth >= 2) {
          allEls.push(child);
        } else {
          walk(child, depth + 1);
        }
      }
    };

    walk(this.targetEl, 0);

    // Deduplicate: remove ancestors if their descendants are also captured
    const finalEls = allEls.filter((el, _i, arr) => {
      return !arr.some(other => other !== el && el.contains(other));
    });

    finalEls.forEach(srcEl => {
      const rect = srcEl.getBoundingClientRect();
      const computed = getComputedStyle(srcEl);

      // Deep-clone and position as fixed overlay
      const clone = srcEl.cloneNode(true) as HTMLElement;

      // Preserve the REAL appearance
      const bgColor = computed.backgroundColor;
      const hasBg = bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';

      Object.assign(clone.style, {
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        transformOrigin: 'center center',
        willChange: 'transform',
        zIndex: '999999',
        // Preserve original colors — don't override
        backgroundColor: hasBg ? bgColor : '',
        color: computed.color,
        font: computed.font,
        lineHeight: computed.lineHeight,
        textAlign: computed.textAlign,
        border: computed.border,
        borderRadius: computed.borderRadius,
        padding: computed.padding,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        transition: 'none'
      });

      this.overlay!.appendChild(clone);

      // Hide the ORIGINAL element (not the whole container!)
      srcEl.style.visibility = 'hidden';
      srcEl.style.opacity = '0';
      this.hiddenSources.push(srcEl);

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      this.bodies.push({
        el: clone,
        sourceEl: srcEl,
        origX: cx,
        origY: cy,
        origW: rect.width,
        origH: rect.height,
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0
      });
    });
  }

  // ━━━ EXPLOSION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private applyExplosion(): void {
    const containerRect = this.targetEl.getBoundingClientRect();
    const cx = containerRect.left + containerRect.width / 2;
    const cy = containerRect.top + containerRect.height / 2;

    this.bodies.forEach(b => {
      const dx = b.x - cx;
      const dy = b.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // ★ VERY strong force — things fly far and fast
      const force = 40 + Math.random() * 45;
      b.vx = (dx / dist) * force + (Math.random() - 0.5) * 25;
      b.vy = (dy / dist) * force - (12 + Math.random() * 25); // massive upward kick
      b.vAngle = (Math.random() - 0.5) * 0.7;
    });
  }

  // ━━━ LOOP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private tick = (): void => {
    if (this.phase === 'exploding') {
      this.stepPhysics();
    } else if (this.phase === 'resetting') {
      this.stepReset();
    }
    this.updateDOM();
    if (this.phase !== 'idle') {
      this.animId = requestAnimationFrame(this.tick);
    }
  };

  // ━━━ PHYSICS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private stepPhysics(): void {
    const G = 0.7;
    const DRAG = 0.994;
    const BOUNCE = 0.4;
    const FLOOR_FRICTION = 0.6;
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.clientHeight;

    this.bodies.forEach(b => {
      b.vy += G;
      b.vx *= DRAG;
      b.vy *= DRAG;
      b.x += b.vx;
      b.y += b.vy;
      b.angle += b.vAngle;

      const hw = b.origW / 2;
      const hh = b.origH / 2;

      if (b.x - hw < 0) {
        b.x = hw;
        b.vx = Math.abs(b.vx) * BOUNCE;
        b.vAngle *= -0.5;
      }
      if (b.x + hw > W) {
        b.x = W - hw;
        b.vx = -Math.abs(b.vx) * BOUNCE;
        b.vAngle *= -0.5;
      }
      if (b.y - hh < 0) {
        b.y = hh;
        b.vy = Math.abs(b.vy) * BOUNCE;
      }
      if (b.y + hh > H) {
        b.y = H - hh;
        b.vy = -Math.abs(b.vy) * BOUNCE;
        b.vx *= FLOOR_FRICTION;
        b.vAngle *= FLOOR_FRICTION;
        if (Math.abs(b.vy) < 1.5) {
          b.vy = 0;
          b.y = H - hh;
        }
      }
    });
  }

  // ━━━ RESET ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private stepReset(): void {
    this.resetT += 0.022;
    if (this.resetT > 1) this.resetT = 1;
    const t = this.easeInOutQuart(this.resetT);

    this.bodies.forEach((b, i) => {
      const s = this.resetStarts[i];
      b.x = s.x + (b.origX - s.x) * t;
      b.y = s.y + (b.origY - s.y) * t;
      b.angle = s.angle * (1 - t);
    });

    if (this.resetT >= 1) {
      this.destroy();
      this.onDone?.();
    }
  }

  private easeInOutQuart(x: number): number {
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
  }

  // ━━━ DOM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private updateDOM(): void {
    this.bodies.forEach(b => {
      b.el.style.left = `${b.x - b.origW / 2}px`;
      b.el.style.top = `${b.y - b.origH / 2}px`;
      b.el.style.transform = `rotate(${b.angle}rad)`;
    });
  }
}
