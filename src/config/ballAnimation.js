// Everything about the hero ball's animation, in one place.
//
// Edit a value, save, and reload the page. The ball's fall is simulated from
// these numbers when the page loads, so physics changes (bounce, gravity,
// size…) take effect straight away — there is nothing to rebuild.
//
// Units: "maze px" are pixels of public/maze.png (2344 x 1731). The maze is
// scaled to fit the screen, and everything measured in maze px scales with
// it, so the ball stays the same size relative to the walls on any device.

const ballAnimation = {
  // "scroll" — the ball's fall follows the page: scroll down to move it,
  //            scroll back up to rewind it. It is paced to stay on screen.
  // "auto"   — the ball falls on its own in real time, starting once the
  //            maze has appeared. Scrolling does not move it.
  mode: "scroll",

  ball: {
    image: "/ball.png",
    // Diameter, in maze px. This is also the size it collides at, so it
    // decides what gaps it fits through: much above ~70 and it will jam in
    // the route's narrowest gaps.
    size: 60,
    // Where it sits before it starts to fall, in maze px — in both mazes,
    // the hero and the one above the Sponsors section. The maze is 2344
    // wide and its centre line is x=1172; smaller x is further left. Anything
    // from ~990 to ~1150 drops cleanly onto the first arc; keep it above
    // ~950 or phones (which only show the middle of the maze) crop it off.
    startX: 1080,
    // Down from the top of the maze. The first arc is at ~290; much higher
    // than ~200 and it starts partly hidden behind the navbar.
    startY: 35,
  },

  // Spin. 1 = spins exactly as a ball rolling along the surface would.
  // 0 = never spins, 2 = twice as fast, -1 = the wrong way round.
  rotation: 1,

  physics: {
    // Pull downwards, in maze px/s². Higher falls faster — in "auto" mode
    // that is the speed you see; in "scroll" mode your scrolling sets the
    // pace, so it mostly changes how flat the bounces are.
    gravity: 2200,
    // How high it bounces: the fraction of its speed kept when it hits a
    // wall. 0 = lands dead, 0.3 = small hops, 0.6 = lively. Above ~0.6 it
    // bounces far enough to wander well off the route (still finishes).
    bounciness: 0.3,
    // Hits slower than this (maze px/s) don't bounce at all — the ball just
    // settles. Raise it to cut out small jittery hops, lower it for more.
    minBounceSpeed: 390,
    // How quickly it slows while rolling along a surface, per second.
    // 0 = never slows; 1 = loses most of its speed within a second.
    rollingFriction: 0.35,
  },

  // The route the ball is steered along — traced over maze.png, in maze px.
  // A free ball could not get through this maze on its own (it would land
  // on the first arc and stay there), so a guiding force pulls it along the
  // route while gravity and the walls still act on it.
  route: {
    path: "M1148.98 0.00V311.00C1087.48 292.67 959.88 261.50 941.48 283.50C923.08 305.50 762.78 527.80 856.48 592.00C973.98 672.50 1185.98 498.00 1240.98 785.50C1173.98 770.00 1058.48 782.30 1132.48 955.50C1206.48 1128.70 1189.64 1543.67 1171.98 1729.50",
    // How hard it is pulled toward the route. 20–30 follows it best. Lower
    // lets it wander and bounce further off; much higher overshoots the
    // turns and swings from side to side.
    stiffness: 26,
    // How much sideways drift away from the route is damped. Higher = less
    // swinging from side to side.
    damping: 20,
    // The most the guiding force may push, as a multiple of gravity. It has
    // to be above 1 to recover from hard bounces; too high and the ball
    // looks like it is being dragged rather than falling.
    maxForce: 2.2,
    // How far ahead along the route it aims, in maze px. Longer cuts corners
    // more smoothly; shorter follows every turn more exactly.
    lookahead: 80,
  },

  // The last run, after the Sponsors: the ball rolls in from the left
  // between the two bars, shoots off their end and drops out through the
  // bottom of the maze below them (endmaze1.png), landing on the Carpe Diem
  // logo under it, which lights up. Walls: public/EndMaze.svg. Plays in
  // `mode` like the others.
  end: {
    // How fast it rolls along the bars and leaves their end, sideways, in
    // maze px/s — so how far it shoots out before it drops. 0 = it drops
    // dead off the end. ~600–1000 carries it across to the arc on the right,
    // which throws it back down the middle; much faster and it lands on top
    // of that arc and rolls back off it instead.
    launchSpeed: 1800,
    // Once it lands on the logo it shrinks away to nothing over this long,
    // in ms. 0 = it stays.
    vanishMs: 450,
    // Its route through this maze and how hard it is pulled along it, as in
    // `route` above. Kept gentle, so the launch and the walls do the
    // throwing about and the pull only makes sure it ends up in the middle.
    route: {
      path: "M1120.70 767.60C1250.00 767.60 1360.00 850.00 1401.00 925.00C1330.00 1000.00 1187.00 1100.00 1187.00 1231.00L1187.00 1497.00",
      stiffness: 10,
      damping: 8,
      maxForce: 2.2,
      lookahead: 80,
    },
  },

  auto: {
    // Playback speed. 1 = real time, 0.5 = half speed, 2 = double.
    speed: 0.3,
    // Wait this long (ms) after the maze appears before the ball drops.
    startDelay: 400,
    // Scroll the page along with the ball as it falls, so it never drops
    // off the bottom of the screen. Keeps doing it the whole way down, even
    // while the visitor is scrolling: scrolling on ahead is left alone, but
    // scrolling back up while it is still falling gets pulled back to it.
    followBall: true,
    // How far down the screen the ball is held while the page follows it:
    // 0 = top edge, 0.5 = middle, 1 = bottom edge.
    followAt: 0.5,
  },

  scroll: {
    // How slowly the maze balls move for your scrolling: how much scrolling
    // each second of a fall takes, in screen heights. Higher = slower. Where
    // the page on its own does not give a fall that much room (on a phone
    // the whole maze fits on screen, so it gives next to none), the maze
    // holds still in view while the ball falls, until it has had it.
    // 0 = never hold; each fall gets only what the layout gives it.
    screensPerSecond: 0.4,
    // How long every scroll-driven ball takes to glide to where the
    // scrollbar says it should be, in ms, so wheel notches and flicks slide
    // it there rather than making it jump. 0 = locked to the scrollbar.
    glideMs: 75,
    // Space kept between the navbar's lowest point and the top of the ball,
    // in screen px, so it is never hidden behind the navbar.
    navbarMargin: 24,
  },

  // The black circle that grows out of the ball the moment it lands — on
  // the About Us artwork, then on the maze end above the Sponsors — then
  // shrinks away to reveal the next section: the Intro, then the Sponsors.
  // Everything above that section is gone afterwards.
  blackout: {
    color: "#000000",
    growMs: 700, // circle growing until it covers the screen
    holdMs: 180, // fully covered, while the page switches underneath
    shrinkMs: 700, // circle shrinking away to reveal the next section
    easing: "cubic-bezier(.65,0,.35,1)",
  },
};

export default ballAnimation;
