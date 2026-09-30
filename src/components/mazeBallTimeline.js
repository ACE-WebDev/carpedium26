// Turns the simulated fall (mazeBallPhysics.js) into something that can be
// played by scroll or by time. Kept free of React and the DOM so it can be
// checked from Node.

/* maze.png's intrinsic size — the coordinate system of the fall */
export const VB_W = 2344;
export const VB_H = 1731;

/* The part of maze.png the hero shows, in maze.png px. It is framed the way
   the Sponsors section shows the same maze (sponsormaze1.png at 118% of the
   width): a little of each side cropped and a little room above, centred on
   the maze's centre line — and, like that one, sized by the screen's width,
   so the whole maze fits on any screen rather than being cropped to fill a
   fixed-height box. */
export const HERO_VIEW = { x: 158, y: -50, width: 2028, height: 1781 };

const WARP_STEPS = 400;

/* Slowest the ball rolls in at, maze px/s, so it still gets there when the
   launch speed is 0. */
const MIN_ROLL_SPEED = 150;

/* The simulated fall with a roll along a flat floor put in front of it:
   from `fromX` (maze units) to where the fall starts, at `speed`, spinning as
   a ball of `radius` rolling without slipping would. The run after the
   Sponsors uses it for the stretch between the two bars before it is
   launched off their end at that same speed. */
export function withRollIn(sim, fromX, speed, radius) {
  const distance = sim.xs[0] - fromX;
  const steps = Math.ceil(distance / Math.max(speed, MIN_ROLL_SPEED) / sim.dt);
  if (!(steps > 0)) return sim;

  const count = steps + sim.count;
  const xs = new Float32Array(count);
  const ys = new Float32Array(count);
  const angles = new Float32Array(count);
  for (let k = 0; k < steps; k++) {
    // Still to roll; the angle counts down to the fall's starting 0.
    const left = distance * (1 - k / steps);
    xs[k] = sim.xs[0] - left;
    ys[k] = sim.ys[0];
    angles[k] = (-left / radius) * (180 / Math.PI);
  }
  xs.set(sim.xs, steps);
  ys.set(sim.ys, steps);
  angles.set(sim.angles, steps);
  return { ...sim, count, xs, ys, angles };
}

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

  // The ball bounces, so y itself is not monotonic, but these are, which
  // makes them searchable: the deepest it has been by each sample, and the
  // highest it ever gets again from each sample on (so how far down it is
  // for good by then).
  const deepest = new Float32Array(count);
  const settled = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    deepest[i] = Math.max(ys[i], i ? deepest[i - 1] : -Infinity);
  }
  for (let i = count - 1; i >= 0; i--) {
    settled[i] = Math.min(ys[i], i < count - 1 ? settled[i + 1] : Infinity);
  }

  return { count, xs, ys, angles, deepest, settled, dt: sim.dt };
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

/* First (fractional) index at which the non-decreasing `values` reach `y`,
   or `end` if they never do before it. */
function firstReaching(values, y, end) {
  let lo = 0;
  let hi = Math.floor(end);
  if (values[hi] < y) return end;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (values[mid] >= y) hi = mid;
    else lo = mid + 1;
  }
  if (lo > 0 && values[lo] > values[lo - 1]) {
    return lo - 1 + (y - values[lo - 1]) / (values[lo] - values[lo - 1]);
  }
  return lo;
}

/* Last (fractional) index up to which the non-decreasing `values` stay at
   or under `y`, at most `end`. */
function lastWithin(values, y, end) {
  const last = Math.floor(end);
  if (values[0] > y) return 0;
  if (values[last] <= y) return end;
  let lo = 0;
  let hi = last;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (values[mid] > y) hi = mid;
    else lo = mid + 1;
  }
  return lo - 1 + (y - values[lo - 1]) / (values[lo] - values[lo - 1]);
}

/* How scroll progress maps onto simulated time.
 *
 * Played in plain simulated time, the ball falls behind the page: it spends
 * real time rolling and bouncing near the top while the page keeps
 * scrolling, and by two thirds of the way down it is off the top of the
 * screen. So for every scroll position this finds the earliest moment in
 * the fall from which the ball stays clear of the navbar, and plays time
 * along the smallest concave curve above that, kept to moments when the
 * ball is not yet below the bottom of the screen. Concave means time runs a
 * little faster early and slower late, never jumping — so what plays is
 * still the simulated motion, bounces and all, only paced to stay in view.
 *
 * `scale` is maze units -> page px, `span` is the scroll distance the fall
 * is spread over, `hold` px of which the maze is held still for (pinned),
 * from `holdAt` px in, `originY` is where the maze's y=0 is on screen when
 * the fall begins, `clearance` is how far below the viewport's top edge the
 * ball's top must stay and `bottom` how far down it its bottom may go, in
 * px, `ballSize` is its diameter in maze units, and `endIndex` is the point
 * in the fall to have reached at the end of it. */
export function buildWarp(
  timeline,
  {
    scale,
    span,
    hold = 0,
    holdAt = 0,
    originY = 0,
    clearance,
    bottom = Infinity,
    ballSize,
    endIndex = timeline.count - 1,
  }
) {
  const { deepest, settled } = timeline;
  const radius = (ballSize / 2) * scale;

  // At each progress p: the earliest index from which the ball stays below
  // the navbar (never less than an even pace, so it always keeps moving),
  // and the latest before it has been below the bottom of the screen.
  const required = new Float64Array(WARP_STEPS + 1);
  const allowed = new Float64Array(WARP_STEPS + 1);
  for (let k = 0; k <= WARP_STEPS; k++) {
    const p = k / WARP_STEPS;
    // How far the page has carried the maze up by now: all of the scrolling
    // but what went into the hold.
    const u = p * span;
    const scrolled = u - Math.min(Math.max(u - holdAt, 0), hold);
    const top = (scrolled - originY + clearance + radius) / scale;
    const low = (scrolled - originY + bottom - radius) / scale;
    required[k] = Math.max(firstReaching(settled, top, endIndex), p * endIndex);
    allowed[k] = lastWithin(deepest, low, endIndex);
  }
  required[WARP_STEPS] = endIndex;

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

  // Full precision, so the end of the range lands exactly on `endIndex`.
  const warp = new Float64Array(WARP_STEPS + 1);
  for (let h = 1; h < hull.length; h++) {
    const a = hull[h - 1];
    const b = hull[h];
    for (let k = a; k <= b; k++) {
      warp[k] = required[a] + ((required[b] - required[a]) * (k - a)) / (b - a || 1);
    }
  }
  // Held back wherever the curve would run the ball off the bottom of the
  // screen, but never below what keeps it clear of the navbar, and never
  // running backwards.
  for (let k = 0; k <= WARP_STEPS; k++) {
    warp[k] = Math.max(required[k], Math.min(warp[k], allowed[k]));
    if (k) warp[k] = Math.max(warp[k], warp[k - 1]);
  }
  return warp;
}

/* The warp for a fall whose maze is held still for `hold` px somewhere in
 * its scroll range. Where makes a difference: held while the ball is still
 * rolling about the arcs, it is not rushed through them later by the page
 * carrying them off the top of the screen. So this tries the hold at a few
 * points of the stretch the page scrolls the maze through, and keeps the
 * one that plays the fall most evenly (the least sum of squared steps: an
 * even pace is the least of all). Returns the warp and where the hold
 * begins, in px of scrolling from the start of the fall. */
export function pacedWarp(timeline, options) {
  const { span, hold = 0 } = options;
  const moving = span - hold;
  const tries = hold > 0 && moving > 0 ? 8 : 0;
  let best = null;
  for (let t = 0; t <= tries; t++) {
    const holdAt = tries ? (moving * t) / tries : 0;
    const warp = buildWarp(timeline, { ...options, holdAt });
    let uneven = 0;
    for (let k = 1; k <= WARP_STEPS; k++) {
      uneven += (warp[k] - warp[k - 1]) ** 2;
    }
    if (!best || uneven < best.uneven - 1e-9) best = { warp, holdAt, uneven };
  }
  return best;
}

/* How much of the scroll range steeredWarp smooths its pace over, either
   way of each point, and the fastest it lets time run, as a multiple of an
   even pace (unless keeping the ball in view needs more). */
const STEER_SMOOTH = 0.04;
const STEER_MAX_RATE = 2;

/* The warp for a fall further down the page (the Sponsors maze, the last
 * run), held still for its first `hold` px of scrolling and then carried on
 * by the page. The concave pacing of buildWarp front-loads it: the ball
 * races down the maze while it is held, then falls behind as the page takes
 * the maze on while it is rolling about the lower arcs, rising back up the
 * screen to the navbar to wait there — then drops into what it lands on.
 * This instead steers the ball steadily down the screen, from where it sets
 * off to where it lands, speeding time up through the stretches where it
 * mostly rolls sideways — but never to more than STEER_MAX_RATE times an
 * even pace, so it cannot skip them (a roll along a flat bar gets no
 * deeper), nor to less than an even pace, so it always keeps moving —
 * smoothed so it never lurches, and kept clear of the navbar and above the
 * bottom of the screen. Options as for buildWarp (the hold is always at the
 * start). */
export function steeredWarp(
  timeline,
  {
    scale,
    span,
    hold = 0,
    originY = 0,
    clearance,
    bottom = Infinity,
    ballSize,
    endIndex = timeline.count - 1,
  }
) {
  const { deepest, settled } = timeline;
  const radius = (ballSize / 2) * scale;
  const scrolledAt = (p) => Math.max(0, p * span - hold);
  const fromY = originY + sampleTimeline(timeline, 0).y * scale;
  const toY =
    originY + sampleTimeline(timeline, endIndex).y * scale - scrolledAt(1);

  const required = new Float64Array(WARP_STEPS + 1);
  const allowed = new Float64Array(WARP_STEPS + 1);
  const aim = new Float64Array(WARP_STEPS + 1);
  for (let k = 0; k <= WARP_STEPS; k++) {
    const p = k / WARP_STEPS;
    const scrolled = scrolledAt(p);
    const even = p * endIndex;
    required[k] = Math.max(
      firstReaching(settled, (scrolled - originY + clearance + radius) / scale, endIndex),
      even
    );
    allowed[k] = lastWithin(deepest, (scrolled - originY + bottom - radius) / scale, endIndex);
    // Where on the screen it is headed by now, and when in the fall it is
    // that far down for good.
    const y = fromY + (toY - fromY) * p;
    aim[k] = Math.max(firstReaching(settled, (y + scrolled - originY) / scale, endIndex), even);
  }

  const reach = Math.max(1, Math.round(WARP_STEPS * STEER_SMOOTH));
  const warp = new Float64Array(WARP_STEPS + 1);
  for (let k = 0; k <= WARP_STEPS; k++) {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, k - reach); j <= Math.min(WARP_STEPS, k + reach); j++) {
      sum += aim[j];
      n++;
    }
    warp[k] = sum / n;
  }
  warp[0] = required[0];
  const maxStep = (STEER_MAX_RATE * endIndex) / WARP_STEPS;
  for (let k = 0; k <= WARP_STEPS; k++) {
    if (k) warp[k] = Math.min(warp[k], warp[k - 1] + maxStep);
    warp[k] = Math.max(required[k], Math.min(warp[k], allowed[k]));
    if (k) warp[k] = Math.max(warp[k], warp[k - 1]);
  }
  warp[WARP_STEPS] = endIndex;
  return warp;
}

/* Fractional timeline index for scroll progress p in [0, 1]. */
export function indexAt(warp, p) {
  const f = Math.max(0, Math.min(1, p)) * WARP_STEPS;
  const k = Math.min(WARP_STEPS - 1, Math.floor(f));
  return warp[k] + (warp[k + 1] - warp[k]) * (f - k);
}
