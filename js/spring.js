// Spring physics shared by the fold and by UI transitions.
// Parameters follow SwiftUI's model so values read like Apple's:
//   response        — seconds for one oscillation (smaller = snappier)
//   dampingFraction — 1 = no overshoot, < 1 = bouncy

export function springCoefficients({ response, dampingFraction }) {
  const stiffness = (2 * Math.PI / response) ** 2;
  const damping = (4 * Math.PI * dampingFraction) / response;
  return { stiffness, damping };
}

export class Spring {
  constructor(params, x = 0) {
    this.x = x;
    this.v = 0;
    this.target = x;
    this.configure(params);
  }

  configure(params) {
    const { stiffness, damping } = springCoefficients(params);
    this.stiffness = stiffness;
    this.damping = damping;
  }

  // Semi-implicit Euler. `extra` is an additional acceleration (e.g. the magnet).
  step(dt, extra = 0) {
    const a = -this.stiffness * (this.x - this.target) - this.damping * this.v + extra;
    this.v += a * dt;
    this.x += this.v * dt;
  }

  isSettled(epsilon = 1e-4) {
    return Math.abs(this.x - this.target) < epsilon && Math.abs(this.v) < epsilon * 10;
  }
}

// Samples a unit spring into a CSS `linear()` easing so CSS / Web Animations
// share the exact feel of the physics. Falls back to a close cubic-bezier.
const supportsLinear =
  typeof CSS !== 'undefined' && CSS.supports('transition-timing-function', 'linear(0, 1)');

export function springEasing(params, { samples = 48, maxDuration = 2 } = {}) {
  const spring = new Spring(params, 0);
  spring.target = 1;
  const dt = 1 / 240;
  const values = [];
  let t = 0;
  while (t < maxDuration) {
    spring.step(dt);
    values.push(spring.x);
    t += dt;
    if (spring.isSettled(5e-4)) break;
  }
  const duration = Math.round(t * 1000);
  if (!supportsLinear) return { easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)', duration };
  const stride = Math.max(1, Math.floor(values.length / samples));
  const points = [0];
  for (let i = stride - 1; i < values.length; i += stride) points.push(+values[i].toFixed(4));
  points[points.length - 1] = 1;
  return { easing: `linear(${points.join(', ')})`, duration };
}
