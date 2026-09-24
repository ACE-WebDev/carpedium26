// Simulates the hero ball's fall through the maze: a rigid ball under
// gravity, colliding with the walls from public/Maze.svg and steered along
// the traced route. All the tunable numbers come from
// src/config/ballAnimation.js. Kept free of React and the DOM so it can be
// run and checked from Node.

/* Maze.svg is the same artwork maze.png was exported from, at a different
   size and crop: png = svg * SVG_SCALE + SVG_OFFSET. Found by rasterising
   the SVG's wall tops and matching them against the PNG (IoU 0.926). */
const SVG_SCALE = 0.902;
const SVG_OFFSET = [-12, -104];

/* Only the walls' top faces collide. The tan faces under them are the
   perspective extrusion: the ball rolls in front of them, as it is drawn
   over the maze anyway. Treating those as solid too narrows the traced
   route below the ball's width — nothing wider than ~44 gets past y=300. */
const SOLID_FILL = "#FEFAE0";

const SUBSTEP = 1 / 480; // integration step, s
const SAMPLE = 1 / 60; // recorded step, s
const MAX_TIME = 30; // give up on a fall that has not finished by then, s
const STUCK_AFTER = 1.5; // s without progress along the route counts as stuck
const SLIP_FOR = 0.35; // s the ball is let through walls to get unstuck
const CELL = 64; // spatial hash cell, maze px

/* Absolute M/L/H/V/C/Z path data -> polylines. That is all Maze.svg and the
   route use. */
export function flattenPath(d, steps = 14) {
  const tokens = d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const polys = [];
  let poly = [];
  let x = 0;
  let y = 0;
  let cmd = null;
  let i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Z]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "M") {
      if (poly.length) polys.push(poly);
      x = num();
      y = num();
      poly = [[x, y]];
      cmd = "L";
    } else if (cmd === "L") {
      x = num();
      y = num();
      poly.push([x, y]);
    } else if (cmd === "H") {
      x = num();
      poly.push([x, y]);
    } else if (cmd === "V") {
      y = num();
      poly.push([x, y]);
    } else if (cmd === "C") {
      const c = [num(), num(), num(), num(), num(), num()];
      for (let s = 1; s <= steps; s++) {
        const u = s / steps;
        const m = 1 - u;
        poly.push([
          m * m * m * x + 3 * m * m * u * c[0] + 3 * m * u * u * c[2] + u * u * u * c[4],
          m * m * m * y + 3 * m * m * u * c[1] + 3 * m * u * u * c[3] + u * u * u * c[5],
        ]);
      }
      x = c[4];
      y = c[5];
    } else if (cmd === "Z") {
      if (poly.length) poly.push(poly[0]);
      polys.push(poly);
      poly = [];
      cmd = null;
    } else {
      i++;
    }
  }
  if (poly.length) polys.push(poly);
  return polys;
}

/* Maze.svg text -> wall segments in maze.png space, bucketed by cell. */
function buildWalls(svgText) {
  const grid = new Map();
  let segments = 0;
  const paths = svgText.matchAll(/<path[^>]*?\sd="([^"]+)"[^>]*?fill="([^"]+)"/g);
  for (const [, d, fill] of paths) {
    if (fill.toUpperCase() !== SOLID_FILL) continue;
    for (const poly of flattenPath(d)) {
      for (let k = 1; k < poly.length; k++) {
        const ax = poly[k - 1][0] * SVG_SCALE + SVG_OFFSET[0];
        const ay = poly[k - 1][1] * SVG_SCALE + SVG_OFFSET[1];
        const bx = poly[k][0] * SVG_SCALE + SVG_OFFSET[0];
        const by = poly[k][1] * SVG_SCALE + SVG_OFFSET[1];
        if (Math.hypot(bx - ax, by - ay) < 1) continue;
        const wall = [ax, ay, bx, by, 0]; // [4]: lookup stamp
        segments++;
        for (let cx = Math.floor(Math.min(ax, bx) / CELL); cx <= Math.floor(Math.max(ax, bx) / CELL); cx++) {
          for (let cy = Math.floor(Math.min(ay, by) / CELL); cy <= Math.floor(Math.max(ay, by) / CELL); cy++) {
            const key = cx * 4096 + cy;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(wall);
          }
        }
      }
    }
  }
  return { grid, segments };
}

/* The route as a polyline with cumulative arc length. */
function buildRoute(d) {
  const points = flattenPath(d, 120)[0] ?? [[0, 0]];
  const lengths = [0];
  for (let k = 1; k < points.length; k++) {
    lengths.push(
      lengths[k - 1] +
        Math.hypot(points[k][0] - points[k - 1][0], points[k][1] - points[k - 1][1])
    );
  }
  const total = lengths[lengths.length - 1];

  const at = (s) => {
    s = Math.max(0, Math.min(total, s));
    let lo = 1;
    let hi = lengths.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid] < s) lo = mid + 1;
      else hi = mid;
    }
    const k = Math.max(1, lo);
    const f = (s - lengths[k - 1]) / (lengths[k] - lengths[k - 1] || 1);
    const [ax, ay] = points[k - 1];
    const [bx, by] = points[k];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    return {
      x: ax + (bx - ax) * f,
      y: ay + (by - ay) * f,
      tx: (bx - ax) / len,
      ty: (by - ay) / len,
    };
  };

  // Nearest point on the route, searched only forwards from `from` (and at
  // most `range` along it) so the tracker never jumps back to an earlier
  // pass of the same stretch.
  const track = (x, y, from, range = 260) => {
    let best = from;
    let bestD = Infinity;
    for (let s = from; s <= Math.min(total, from + range); s += 4) {
      const p = at(s);
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return { s: best, dist: Math.sqrt(bestD) };
  };

  return { points, total, at, track, end: points[points.length - 1] };
}

/* Runs the fall. Returns the path as samples every `dt` seconds — x, y in
   maze px and the spin angle in degrees — plus how it was moving when it
   left the maze, so the drop into About Us can carry on from there. */
export function simulateFall(svgText, config) {
  const { ball, physics, route: routeConfig } = config;
  const { grid, segments } = buildWalls(svgText);
  const route = buildRoute(routeConfig.path);

  const radius = ball.size / 2;
  const gravity = physics.gravity;
  const steerMax = routeConfig.maxForce * gravity;

  // The walls in the 3x3 cells around the ball, each once. Deduplicated with
  // a stamp rather than a Set: this runs thousands of times per fall.
  const nearby = [];
  let stamp = 0;
  const nearbyWalls = (x, y) => {
    nearby.length = 0;
    stamp++;
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    for (let i = cx - 1; i <= cx + 1; i++) {
      for (let j = cy - 1; j <= cy + 1; j++) {
        const cell = grid.get(i * 4096 + j);
        if (!cell) continue;
        for (const w of cell) {
          if (w[4] === stamp) continue;
          w[4] = stamp;
          nearby.push(w);
        }
      }
    }
    return nearby;
  };

  let x = ball.startX ?? route.points[0][0];
  let y = ball.startY;
  // A fall can start with the ball already rolling sideways (the one after
  // the Sponsors is launched off the end of a bar), spinning to match.
  let vx = ball.startVX ?? 0;
  let vy = 0;
  let angle = 0; // radians, clockwise on screen
  let spin = vx / radius; // rad/s
  // Where on the route it starts. Searched along the whole route: a fall
  // can start part-way down it (the Sponsors run starts below the first
  // arc), and a short search from the top would lock onto the wrong stretch.
  let tracked = route.track(x, y, 0, route.total).s;

  const xs = [];
  const ys = [];
  const angles = [];
  const record = () => {
    xs.push(x);
    ys.push(y);
    angles.push((angle * 180) / Math.PI);
  };

  let t = 0;
  let nextSample = 0;
  let lastTracked = tracked;
  let lastProgressAt = 0;
  let slipUntil = -1;
  let slips = 0;
  let deviationSum = 0;
  let deviationMax = 0;
  let steps = 0;

  while (t < MAX_TIME) {
    if (t >= nextSample) {
      record();
      nextSample += SAMPLE;
    }

    // Guidance: a spring toward a point a little further along the route,
    // plus damping of sideways drift only, so motion along it stays free.
    const found = route.track(x, y, tracked);
    tracked = found.s;
    const aim = route.at(tracked + routeConfig.lookahead);
    const here = route.at(tracked);
    const along = vx * here.tx + vy * here.ty;
    let ax =
      routeConfig.stiffness * (aim.x - x) -
      routeConfig.damping * (vx - along * here.tx);
    let ay =
      routeConfig.stiffness * (aim.y - y) -
      routeConfig.damping * (vy - along * here.ty);
    const steer = Math.hypot(ax, ay);
    if (steer > steerMax) {
      ax *= steerMax / steer;
      ay *= steerMax / steer;
    }

    vx += ax * SUBSTEP;
    vy += (ay + gravity) * SUBSTEP;
    x += vx * SUBSTEP;
    y += vy * SUBSTEP;
    angle += spin * SUBSTEP;

    // Collisions: push the ball out of every wall it overlaps, bounce the
    // part of its velocity going into the wall, keep the part along it, and
    // roll without slipping while in contact.
    if (t >= slipUntil) {
      for (let pass = 0; pass < 4; pass++) {
        let moved = false;
        for (const w of nearbyWalls(x, y)) {
          const dx = w[2] - w[0];
          const dy = w[3] - w[1];
          const f = Math.max(
            0,
            Math.min(1, ((x - w[0]) * dx + (y - w[1]) * dy) / (dx * dx + dy * dy))
          );
          const qx = x - (w[0] + dx * f);
          const qy = y - (w[1] + dy * f);
          const d2 = qx * qx + qy * qy;
          if (d2 >= radius * radius || d2 < 1e-9) continue;
          const d = Math.sqrt(d2);
          const nx = qx / d;
          const ny = qy / d;
          x += nx * (radius - d);
          y += ny * (radius - d);
          const vn = vx * nx + vy * ny;
          if (vn < 0) {
            const tx = -ny;
            const ty = nx;
            const vt =
              (vx * tx + vy * ty) * (1 - physics.rollingFriction * SUBSTEP);
            const out = -vn > physics.minBounceSpeed ? -vn * physics.bounciness : 0;
            vx = nx * out + tx * vt;
            vy = ny * out + ty * vt;
            spin = vt / radius;
          }
          moved = true;
        }
        if (!moved) break;
      }
    }

    deviationSum += found.dist;
    deviationMax = Math.max(deviationMax, found.dist);
    steps++;

    // If the settings leave it wedged somewhere, let it slip through the
    // wall rather than hang there forever.
    if (tracked > lastTracked + 2) {
      lastTracked = tracked;
      lastProgressAt = t;
    } else if (t - lastProgressAt > STUCK_AFTER) {
      slipUntil = t + SLIP_FOR;
      lastProgressAt = t;
      slips++;
    }

    t += SUBSTEP;
    if (tracked >= route.total - routeConfig.lookahead && y >= route.end[1] - radius) {
      break;
    }
  }
  record();

  return {
    xs: Float32Array.from(xs),
    ys: Float32Array.from(ys),
    angles: Float32Array.from(angles),
    count: xs.length,
    dt: SAMPLE,
    gravity,
    exit: { vx, vy, spin },
    stats: {
      seconds: t,
      segments,
      slips,
      finished: t < MAX_TIME,
      meanDeviation: deviationSum / steps,
      maxDeviation: deviationMax,
    },
  };
}

/* Fetches the walls and runs the fall once per page load, in idle time so
   it never costs a frame of the opening animation. */
const whenIdle = () =>
  new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(resolve, { timeout: 1500 });
    } else {
      setTimeout(resolve, 0);
    }
  });

const svgTexts = new Map();
const falls = new Map();

/* The fall from `start` ({ x, y } in maze px, and optionally `vx`, how fast
   it is already moving sideways) through the walls in `walls`, simulated
   once per page load per starting point: the hero and the Sponsors maze each
   start from their own, and the run after the Sponsors has walls of its own
   too. */
export function loadFall(config, start, walls = "/Maze.svg") {
  const key = `${walls} ${start.x},${start.y},${start.vx ?? 0}`;
  if (!falls.has(key)) {
    if (!svgTexts.has(walls)) {
      svgTexts.set(
        walls,
        fetch(walls).then((response) => {
          if (!response.ok) throw new Error(`${walls}: HTTP ${response.status}`);
          return response.text();
        })
      );
    }
    falls.set(
      key,
      svgTexts.get(walls).then(async (svg) => {
        await whenIdle();
        const fall = simulateFall(svg, {
          ...config,
          ball: { ...config.ball, startX: start.x, startY: start.y, startVX: start.vx },
        });
        if (fall.stats.slips || !fall.stats.finished) {
          console.warn(
            `Ball animation: starting from (${start.x}, ${start.y}) in ${walls} the ball got stuck ${fall.stats.slips} time(s) and was let through a wall` +
              (fall.stats.finished ? "." : ", and never reached the bottom.") +
              " Usually ball.size is too big for the gaps, or that fall's route.stiffness / route.maxForce are too low. (src/config/ballAnimation.js)"
          );
        }
        return fall;
      })
    );
  }
  return falls.get(key);
}
