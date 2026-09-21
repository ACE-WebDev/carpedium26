const assetPathPrefix = '/assets';
const imgBackside1 = `${assetPathPrefix}/ae0a9.png`;
const imgRectangle94 = `${assetPathPrefix}/101a5.png`;
const imgHeaderCircle = `${assetPathPrefix}/46e3a.svg`;
const imgGroup112 = `${assetPathPrefix}/96c34.svg`;
const imgGroup39574 = `${assetPathPrefix}/a1b56.svg`;
const imgGroup39575 = `${assetPathPrefix}/cb141.svg`;
const imgGroup39576 = `${assetPathPrefix}/d2e60.svg`;
const imgGroup39577 = `${assetPathPrefix}/7af6b.svg`;
const imgPriceTagGreen = `${assetPathPrefix}/24d53.svg`;
const imgLine10 = `${assetPathPrefix}/25417.svg`;
const imgLine11 = `${assetPathPrefix}/89fe9.svg`;
const imgLine12 = `${assetPathPrefix}/9f3c3.svg`;
const imgLine13 = `${assetPathPrefix}/b9c88.svg`;

// Design canvas: 1455 × 1950 px
const W = 1455;
const H = 1950;
const NAVBAR_HEIGHT = 94;

const navLinksLeft = ['Home', 'About', 'Events'];
const navLinksRight = ['Sponsors', 'Merch', 'Contact'];

export default function App() {
  return (
    <div style={{ background: '#efd4a3', minHeight: '100dvh' }}>
      <style>{`
        .nav-link {
          font-family: "Lexend Deca:Medium";
          font-weight: 500;
          font-size: 18px;
          color: #fff1d8;
          text-decoration: none;
          white-space: nowrap;
          padding: 8px 4px;
          position: relative;
          transition: opacity 0.2s ease;
          letter-spacing: 0.01em;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 2px;
          height: 2px;
          background: #fff1d8;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.25s ease;
        }
        .nav-link:hover {
          opacity: 0.85;
        }
        .nav-link:hover::after {
          transform: scaleX(1);
        }
      `}</style>

      {/* ── Full-width fixed navbar (lives outside the fixed-width canvas) ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: NAVBAR_HEIGHT,
          background: '#c28b5b',
          zIndex: 50,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '0 clamp(24px, 5vw, 80px)',
          boxSizing: 'border-box',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        {/* Left links */}
        <div style={{ display: 'flex', gap: 40, justifySelf: 'start' }}>
          {navLinksLeft.map(label => (
            <a key={label} href="#" className="nav-link">
              {label}
            </a>
          ))}
        </div>

        {/* Centered logo */}
        <div
          style={{
            position: 'relative',
            width: 220,
            height: 86,
            justifySelf: 'center',
          }}
        >
          <img
            src={imgHeaderCircle}
            alt="Carpe Diem"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <div
            style={{
              position: 'absolute',
              background: '#fff1d8',
              height: '68px',
              width: '128px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              maskImage: `url("${imgRectangle94}")`,
              maskSize: '120px 57px',
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
              WebkitMaskImage: `url("${imgRectangle94}")`,
              WebkitMaskSize: '120px 57px',
              WebkitMaskPosition: 'center',
              WebkitMaskRepeat: 'no-repeat',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Right links */}
        <div style={{ display: 'flex', gap: 40, justifySelf: 'end' }}>
          {navLinksRight.map(label => (
            <a key={label} href="#" className="nav-link">
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Scrollable canvas, pushed down below the fixed navbar ── */}
      <div style={{ overflowX: 'auto', paddingTop: NAVBAR_HEIGHT }}>
        <div
          style={{
            position: 'relative',
            width: W,
            height: H,
            margin: '0 auto',
            background: '#efd4a3',
          }}
        >
          {/* ── Gradient band ── */}
          <div
            style={{
              position: 'absolute',
              background: 'linear-gradient(to bottom, rgba(239,212,163,0.25) 0%, #dfc298 94.231%)',
              borderRadius: 20,
              height: 1115,
              left: -219,
              top: 110,
              width: 1853,
              pointerEvents: 'none',
            }}
          />

          {/* ── OUR MERCH heading ── */}
          <p
            style={{
              position: 'absolute',
              fontFamily: '"BBH Hegarty:Regular"',
              fontWeight: 400,
              fontSize: 180,
              lineHeight: 'normal',
              color: '#283618',
              left: 'calc(50% - 629px)',
              top: 70,
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            OUR MERCH
          </p>

          {/* ── T-shirt ── */}
          <div
            style={{
              position: 'absolute',
              width: 605,
              height: 980,
              left: 'calc(50% - 302.5px)',
              top: 311,
            }}
          >
            <img
              alt="Merch T-shirt"
              src={imgBackside1}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* ── Left annotation: Designed by 300dpi ── */}
          <p
            style={{
              position: 'absolute',
              fontFamily: '"Bricolage Grotesque:Regular"',
              fontWeight: 400,
              fontSize: 40,
              fontVariationSettings: '"opsz" 14, "wdth" 100',
              lineHeight: 'normal',
              color: '#000',
              left: 134,
              top: 417,
              width: 366,
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {'Designed by 300dpi '}
          </p>

          {/* ── Right annotation: Marketed by ks merchandise ── */}
          <div
            style={{
              position: 'absolute',
              fontFamily: '"Bricolage Grotesque:Regular"',
              fontWeight: 400,
              fontSize: 40,
              fontVariationSettings: '"opsz" 14, "wdth" 100',
              lineHeight: 0,
              color: '#000',
              right: 87,
              top: 559,
              width: 366,
              textAlign: 'right',
              whiteSpace: 'pre-wrap',
            }}
          >
            <p style={{ lineHeight: 'normal', margin: 0 }}>{'Marketed by '}</p>
            <p style={{ lineHeight: 'normal', margin: 0 }}>ks merchandise</p>
          </div>

          {/* ── Line 10 ── */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              height: 61,
              alignItems: 'center',
              justifyContent: 'center',
              left: `calc(16.67% + 236.16px)`,
              top: 490.25,
              width: 91,
            }}
          >
            <div style={{ transform: 'rotate(-146.16deg)' }}>
              <div style={{ height: 0, position: 'relative', width: 109.554 }}>
                <div style={{ position: 'absolute', inset: '-1.5px -1.37%' }}>
                  <img
                    src={imgLine10}
                    alt=""
                    style={{ display: 'block', maxWidth: 'none', width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Line 11 ── */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              height: 0,
              alignItems: 'center',
              justifyContent: 'center',
              left: `calc(16.67% + 111px)`,
              top: 490.5,
              width: 127,
            }}
          >
            <div style={{ transform: 'rotate(180deg)' }}>
              <div style={{ height: 0, position: 'relative', width: 127 }}>
                <div style={{ position: 'absolute', inset: '-1.5px -1.18%' }}>
                  <img
                    src={imgLine11}
                    alt=""
                    style={{ display: 'block', maxWidth: 'none', width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Line 12 ── */}
          <div
            style={{
              position: 'absolute',
              height: 50.594,
              left: `calc(50% + 195.69px)`,
              top: 653,
              width: 75.476,
            }}
          >
            <div
              style={{
                transform: 'scaleY(-1) rotate(33.84deg)',
                transformOrigin: 'left center',
              }}
            >
              <div
                style={{
                  height: 0,
                  position: 'relative',
                  width: 90.865,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '-1.58px -1.73%',
                  }}
                >
                  <img
                    src={imgLine12}
                    alt=""
                    style={{
                      display: 'block',
                      maxWidth: 'none',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Line 13 ── */}
          <div
            style={{
              position: 'absolute',
              height: 0,
              left: `calc(66.67% + 30.61px)`,
              top: 601.17,
              width: 69.503,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-1.51px -2.18%',
                transform: 'scaleX(-1)',
                transformOrigin: 'center',
              }}
            >
              <img
                src={imgLine13}
                alt=""
                style={{
                  display: 'block',
                  maxWidth: 'none',
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          </div>

          {/* ── Price tag ── */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              left: `calc(50% + 149px)`,
              width: 131.048,
              height: 131.048,
              top: 941,
            }}
          >
            <div style={{ transform: 'rotate(-15deg)' }}>
              <div style={{ overflow: 'hidden', position: 'relative', width: 107, height: 107 }}>
                <div style={{ position: 'absolute', inset: '0.05% 0 0.04% 0' }}>
                  <img
                    src={imgPriceTagGreen}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      maxWidth: 'none',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    inset: '10.77% 17.71% 14.58% 10.44%',
                    containerType: 'size',
                  }}
                >
                  <div style={{ transform: 'rotate(48.1deg)' }}>
                    <p
                      style={{
                        fontFamily: '"Bricolage Grotesque:Regular"',
                        fontWeight: 400,
                        fontSize: 30,
                        fontVariationSettings: '"opsz" 14, "wdth" 100',
                        lineHeight: 'normal',
                        color: '#000',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        margin: 0,
                      }}
                    >
                      ₹300
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Plant: Group112 (left base) ── */}
          <div
            style={{
              position: 'absolute',
              top: `${(44.07 * H) / 100}px`,
              right: `${(73.42 * W) / 100}px`,
              bottom: `${(40 * H) / 100}px`,
              left: 0,
            }}
          >
            <img
              src={imgGroup112}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                maxWidth: 'none',
                width: '100%',
                height: '100%',
              }}
            />
          </div>

          {/* ── Plant: Group39574 (left, rotated) ── */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              top: `${(42.57 * H) / 100}px`,
              right: `${(78.38 * W) / 100}px`,
              bottom: `${(35 * H) / 100}px`,
              left: `${(-11.11 * W) / 100}px`,
              containerType: 'size',
            }}
          >
            <div style={{ transform: 'rotate(-19.06deg)', flexShrink: 0 }}>
              <img
                src={imgGroup39574}
                alt=""
                style={{ display: 'block', maxWidth: 'none', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* ── Plant: Group39575 (right, rotated) ── */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              top: `${(45.7 * H) / 100}px`,
              right: `${(0.78 * W) / 100}px`,
              bottom: `${(40 * H) / 100}px`,
              left: `${(74.1 * W) / 100}px`,
              containerType: 'size',
            }}
          >
            <div style={{ transform: 'rotate(3.45deg)', flexShrink: 0 }}>
              <img
                src={imgGroup39575}
                alt=""
                style={{ display: 'block', maxWidth: 'none', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* ── Plant: Group39576 (right, flipped+rotated) ── */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              top: `${(46.82 * H) / 100}px`,
              right: `${(2.38 * W) / 100}px`,
              bottom: `${(40 * H) / 100}px`,
              left: `${(72.5 * W) / 100}px`,
              containerType: 'size',
            }}
          >
            <div style={{ transform: 'scaleX(-1) rotate(-3.45deg)', flexShrink: 0 }}>
              <img
                src={imgGroup39576}
                alt=""
                style={{ display: 'block', maxWidth: 'none', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* ── Plant: Group39577 (right, flipped+rotated) ── */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              top: `${(45.42 * H) / 100}px`,
              right: `${(-1.26 * W) / 100}px`,
              bottom: `${(40 * H) / 100}px`,
              left: `${(75.14 * W) / 100}px`,
              containerType: 'size',
            }}
          >
            <div style={{ transform: 'scaleX(-1) rotate(6.49deg)', flexShrink: 0 }}>
              <img
                src={imgGroup39577}
                alt=""
                style={{ display: 'block', maxWidth: 'none', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* ── SIZE CHARTS dark banner ── */}
          <div
            style={{
              position: 'absolute',
              background: '#283618',
              height: 118,
              left: 74,
              borderRadius: 20,
              top: 1162,
              width: 1288,
            }}
          />

          <p
            style={{
              position: 'absolute',
              fontFamily: '"BBH Hegarty:Regular"',
              fontWeight: 400,
              fontSize: 48,
              lineHeight: 'normal',
              color: '#fff',
              height: 48,
              left: 'calc(50% - 189px)',
              top: 1194,
              width: 377,
              margin: 0,
            }}
          >
            SIZE CHARTS
          </p>

          {/* ── SIZE CHARTS green body ── */}
          <div
            style={{
              position: 'absolute',
              background: '#606c38',
              height: 402,
              left: 74,
              borderRadius: 20,
              top: 1297,
              width: 1288,
            }}
          />

          {/* ── Size items ── */}
          {[
            { label: 'XS', boxTop: 1328, textTop: 1331.14 },
            { label: 'S', boxTop: 1376.67, textTop: 1380.59 },
            { label: 'M', boxTop: 1426.12, textTop: 1429.26 },
            { label: 'L', boxTop: 1474.78, textTop: 1477.92 },
            { label: 'XL', boxTop: 1524.24, textTop: 1528.16 },
            { label: '2XL', boxTop: 1572.9, textTop: 1576.04 },
            { label: '3XL', boxTop: 1622.36, textTop: 1625.5 },
          ].map(({ label, boxTop, textTop }) => (
            <div key={label}>
              <div
                style={{
                  position: 'absolute',
                  background: '#45582d',
                  height: 43.172,
                  left: 110,
                  top: boxTop,
                  width: 85,
                }}
              />
              <p
                style={{
                  position: 'absolute',
                  fontFamily: '"BBH Hegarty:Regular"',
                  fontWeight: 400,
                  fontSize: 28.258,
                  lineHeight: 'normal',
                  color: '#fff',
                  top: textTop,
                  left: 124,
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </p>
            </div>
          ))}

          {/* ── BUY NOW button ── */}
          <div
            style={{
              position: 'absolute',
              left: 'calc(50% - 151.5px)',
              top: 1765,
            }}
          >
            <button
              style={{
                background: '#1c1f2a',
                borderRadius: 50.129,
                height: 76.196,
                width: 303,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: '"BBH Hegarty:Regular"',
                  fontWeight: 400,
                  fontSize: 35.09,
                  lineHeight: 'normal',
                  color: '#fefae0',
                  textShadow: '0px 2.005px 4.512px rgba(0,0,0,0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                BUY NOW!
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
