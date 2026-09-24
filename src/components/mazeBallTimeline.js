// Turns the simulated fall (mazeBallPhysics.js) into something that can be
// played by scroll or by time. Kept free of React and the DOM so it can be
// checked from Node.

/* maze.png's intrinsic size — the coordinate system of the fall */
export const VB_W = 2344;
export const VB_H = 1731;

const WARP_STEPS = 400;

/* The whole fall in maze units: the simulated run through the maze, then a
   ballistic drop — same gravity, velocity and spin it left the maze with —
   to (targetX, targetY), the centre of the About Us image. That last leg
   is built here because how far below the maze About Us sits, in maze
   units, depends on the viewport. */
export function buildTimeline(sim, targetX, targetY) {
  const simulated = sim.count;
  const x0 = sim.xs[simulated - 1];
  const y0 = sim.ys[simulated - 1];
  const a0 = sim.angles[simulated - 1];
  const { vx, vy, spin } = sim.exit;
  const g = sim.gravity;

  // Time to fall the remaining height: g/2 t² + vy t = drop.
  const drop = Math.max(0, targetY - y0);
  const fall = drop > 0 ? (-vy + Math.sqrt(vy * vy + 2 * g * drop)) / g : 0;
  const tail = Math.max(1, Math.ceil(fall / sim.dt));

  const count = simulated + tail;
  const xs = new Float32Array(count);
  const ys = new Float32Array(count);
  const angles = new Float32Array(count);
  xs.set(sim.xs);
  ys.set(sim.ys);
  angles.set(sim.angles);
  for (let k = 1; k <= tail; k++) {
    const t = (fall * k) / tail;
    // Keep the ballistic x, but ease it onto the target so it lands dead
    // centre rather than wherever the exit velocity would carry it.
    const u = k / tail;
    const w = u * u * (3 - 2 * u);
    xs[simulated - 1 + k] = (x0 + vx * t) * (1 - w) + targetX * w;
    ys[simulated - 1 + k] = k === tail ? targetY : y0 + vy * t + 0.5 * g * t * t;
    angles[simulated - 1 + k] = a0 + (spin * t * 180) / Math.PI;
  }

  // Running maximum of depth. The ball bounces, so y itself is not
  // monotonic, but "how deep has it got by now" is, which makes it
  // searchable.
  const deepest = new Float32Array(count);
  // How far a bounce ever carries it back up above that — the margin the
  // pacing below needs, since it only tracks depth reached.
  let rebound = 0;
  for (let i = 0; i < count; i++) {
    deepest[i] = Math.max(ys[i], i ? deepest[i - 1] : -Infinity);
    rebound = Math.max(rebound, deepest[i] - ys[i]);
  }

  return { count, xs, ys, angles, deepest, rebound, dt: sim.dt };
}

/* Position and angle at a fractional index into the timeline. */
export function sampleTimeline(timeline, index) {
  const { count, xs, ys, angles } = timeline;
  const i = Math.max(0, Math.min(count - 2, Math.floor(index)));
  const u = Math.max(0, Math.min(1, index - i));
  return {
    x: xs[i] + (xs[i + 1] - xs[i]) * u,
    y: ys[i] + (ys[i + 1] - ys[i]) * u,
    angle: angles[i] + (angles[i + 1] - angles[i]) * u,
  };
}

/* How scroll progress maps onto simulated time.
 *
 * Played in plain simulated time, the ball falls behind the page: it spends
 * real time rolling and bouncing near the top while the page keeps
 * scrolling, and by two thirds of the way down it is off the top of the
 * screen. So for every scroll position this finds the earliest moment in
 * the fall that keeps the ball clear of the navbar, and plays time along
 * the smallest concave curve above that. Concave means time runs a little
 * faster early and slower late, never jumping — so what plays is still the
 * simulated motion, bounces and all, only paced to stay in view.
 *
 * `scale` is maze units -> page px, `span` is the scroll distance the fall
 * is spread over, `originY` is where the maze's y=0 is on screen before any
 * of it has been scrolled (0 for the hero, which starts at the top of the
 * page), `clearance` is how far below the viewport's top edge the ball's top
 * must stay, in px, and `ballSize` is its diameter in maze units. */
export function buildWarp(timeline, { scale, span, originY = 0, clearance, ballSize }) {
  const { count, deepest, rebound } = timeline;
  const lastIndex = count - 1;
  const radius = (ballSize / 2) * scale;

  // Earliest index at which the ball is deep enough to be on screen below
  // the navbar at progress p.
  const required = new Float64Array(WARP_STEPS + 1);
  for (let k = 0; k <= WARP_STEPS; k++) {
    const p = k / WARP_STEPS;
    const needDepth = (p * span - originY + clearance + radius) / scale + rebound;
    let lo = 0;
    let hi = lastIndex;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (deepest[mid] >= needDepth) hi = mid;
      else lo = mid + 1;
    }
    let index = lo;
    if (lo > 0 && deepest[lo] > deepest[lo - 1]) {
      index = lo - 1 + (needDepth - deepest[lo - 1]) / (deepest[lo] - deepest[lo - 1]);
    }
    required[k] = Math.max(Math.min(index, lastIndex), p * lastIndex);
  }
  required[WARP_STEPS] = lastIndex;

  // Upper concave hull of (p, required): a monotone chain that only keeps
  // points where the slope keeps falling.
  const hull = [0];
  for (let k = 1; k <= WARP_STEPS; k++) {
    while (hull.length >= 2) {
      const a = hull[hull.length - 2];
      const b = hull[hull.length - 1];
      const cross =
        (b - a) * (required[k] - required[a]) -
        (required[b] - required[a]) * (k - a);
      if (cross >= 0) hull.pop();
      else break;
    }
    hull.push(k);
  }

  const warp = new Float32Array(WARP_STEPS + 1);
  for (let h = 1; h < hull.length; h++) {
    const a = hull[h - 1];
    const b = hull[h];
    for (let k = a; k <= b; k++) {
      warp[k] = required[a] + ((required[b] - required[a]) * (k - a)) / (b - a || 1);
    }
  }
  return warp;
}

/* Fractional timeline index for scroll progress p in [0, 1]. */
export function indexAt(warp, p) {
  const f = Math.max(0, Math.min(1, p)) * WARP_STEPS;
  const k = Math.min(WARP_STEPS - 1, Math.floor(f));
  return warp[k] + (warp[k + 1] - warp[k]) * (f - k);
}
