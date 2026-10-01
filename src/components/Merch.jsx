'use client';
import { useState, useEffect } from 'react';
const assetPathPrefix = '/merch';

const imgBackside1 = `${assetPathPrefix}/front.png`;
const imgBackside2 = `${assetPathPrefix}/back.png`;
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

const W = 1455;
const H = 1950;
const CANVAS_H = 1225;

function ShirtPreview({ isFlipped, onFlip }) {
  const faceStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    pointerEvents: 'none',
  };

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={isFlipped ? 'Flip T-shirt to front' : 'Flip T-shirt to back'}
      className="block h-full w-full cursor-pointer border-0 bg-transparent p-0"
      style={{ perspective: 1500 }}
    >
      <span
        className="relative block h-full w-full transition-transform duration-600 ease-in-out motion-reduce:transition-none"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <img
          alt="Front of the Carpe Diem T-shirt"
          aria-hidden={isFlipped}
          src={imgBackside1}
          style={faceStyle}
        />
        <img
          alt="Back of the Carpe Diem T-shirt"
          aria-hidden={!isFlipped}
          src={imgBackside2}
          style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
        />
      </span>
    </button>
  );
}

/* ── Phones: the same merch stacked in one column at a readable size ── */
function MerchMobile({ isFlipped, onFlip }) {
  return (
    <div
      className="flex md:hidden"
      style={{
        width: '100%',
        maxWidth: 480,
        padding: '8px 20px 48px',
        boxSizing: 'border-box',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <h1
        style={{
          fontFamily: '"BBH Hegarty", sans-serif',
          fontWeight: 400,
          fontSize: 'clamp(44px, 14vw, 72px)',
          lineHeight: 1,
          color: '#283618',
          textAlign: 'center',
          margin: '16px 0 0',
        }}
      >
        OUR MERCH
      </h1>

      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 20,
          background: 'linear-gradient(to bottom, rgba(239,212,163,0.25) 0%, #dfc298 94.231%)',
          padding: '12px 12% 0',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '100%', aspectRatio: '2386 / 2617' }}>
          <ShirtPreview isFlipped={isFlipped} onFlip={onFlip} />
        </div>

        {/* Left Corner Leaf Cluster */}
        <div
          style={{
            position: 'absolute',
            left: '-12%',
            bottom: 0,
            width: '32%',
            aspectRatio: '382 / 336',
            pointerEvents: 'none',
          }}
        >
          <img
            src={imgGroup112}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'bottom left',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '-4%',
              bottom: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-19.06deg)',
              transformOrigin: 'bottom center',
            }}
          >
            <img
              src={imgGroup39574}
              alt=""
              aria-hidden="true"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'bottom left',
              }}
            />
          </div>
        </div>

        {/* Right Corner Leaf Cluster (Flipped) */}
        <div
          style={{
            position: 'absolute',
            right: '-12%',
            bottom: 0,
            width: '32%',
            aspectRatio: '382 / 336',
            transform: 'scaleX(-1)',
            transformOrigin: 'center',
            pointerEvents: 'none',
          }}
        >
          <img
            src={imgGroup112}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'bottom left',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '-4%',
              bottom: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-19.06deg)',
              transformOrigin: 'bottom center',
            }}
          >
            <img
              src={imgGroup39574}
              alt=""
              aria-hidden="true"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'bottom left',
              }}
            />
          </div>
        </div>

        {/* Price tag */}
        <div
          style={{
            position: 'absolute',
            right: '16%',
            bottom: '12%',
            width: 'clamp(64px, 18vw, 84px)',
            aspectRatio: '1',
            transform: 'rotate(-15deg)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <img
            src={imgPriceTagGreen}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '10.77% 17.71% 14.58% 10.44%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: 'clamp(16px, 4.6vw, 22px)',
                color: '#000',
                whiteSpace: 'nowrap',
                margin: 0,
                transform: 'rotate(48.1deg)',
              }}
            >
              ₹300
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onFlip}
        aria-label={isFlipped ? 'Show front of T-shirt' : 'Show back of T-shirt'}
        style={{
          minWidth: 220,
          minHeight: 52,
          padding: '12px 24px',
          background: '#fefae0',
          borderRadius: 50,
          border: 'none',
          cursor: 'pointer',
          fontFamily: '"BBH Hegarty", sans-serif',
          fontSize: 22,
          color: '#1c1f2a',
        }}
      >
        {isFlipped ? 'VIEW FRONT' : 'VIEW BACK'}
      </button>

      <p
        style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontSize: 'clamp(16px, 4.4vw, 20px)',
          lineHeight: 1.35,
          color: '#000',
          textAlign: 'center',
          margin: 0,
        }}
      >
        Designed by 300dpi
        <br />
        Marketed by ks merchandise
      </p>

    </div>
  );
}

export default function Merch() {
  const [scale, setScale] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const screenWidth = document.documentElement.clientWidth;
      if (screenWidth < W) {
        setScale(screenWidth / W);
      } else {
        setScale(1);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div
      style={{
        background: '#efd4a3',
        width: '100%',
        overflowX: 'hidden',
        paddingTop: 'clamp(64px, 9vh, 85px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <MerchMobile isFlipped={isFlipped} onFlip={() => setIsFlipped(f => !f)} />

      {/* ── Responsive Scaled Canvas Container ── (tablets and up: on a phone
          the whole canvas shrinks to a quarter, too small to read or tap) */}
      <div
        className="hidden md:flex"
        style={{
          width: '100%',
          justifyContent: 'center',
          overflow: 'hidden',
          height: Math.round(CANVAS_H * scale),
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: W,
            height: H,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            background: '#efd4a3',
            flexShrink: 0,
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

          {/* ── Left Corner Leaf ── */}
          <div
            style={{
              position: 'absolute',
              left: -145,
              bottom: 725,
              width: 382,
              height: 336,
              pointerEvents: 'none',
            }}
          >
            <img
              src={imgGroup112}
              alt=""
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'bottom left',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: -15,
                bottom: 0,
                width: '100%',
                height: '100%',
                transform: 'rotate(-19.06deg)',
                transformOrigin: 'bottom center',
              }}
            >
              <img
                src={imgGroup39574}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'bottom left',
                }}
              />
            </div>
          </div>

          {/* ── Right Corner Leaf (Flipped Left Leaf) ── */}
          <div
            style={{
              position: 'absolute',
              right: -145,
              bottom: 725,
              width: 382,
              height: 336,
              transform: 'scaleX(-1)',
              transformOrigin: 'center',
              pointerEvents: 'none',
            }}
          >
            <img
              src={imgGroup112}
              alt=""
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'bottom left',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: -15,
                bottom: 0,
                width: '100%',
                height: '100%',
                transform: 'rotate(-19.06deg)',
                transformOrigin: 'bottom center',
              }}
            >
              <img
                src={imgGroup39574}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'bottom left',
                }}
              />
            </div>
          </div>

          {/* ── OUR MERCH heading ── */}
          <h1
            style={{
              position: 'absolute',
              fontFamily: '"BBH Hegarty", sans-serif',
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
          </h1>

          <div
            style={{
              position: 'absolute',
              width: 605,
              height: 980,
              left: 'calc(50% - 302.5px)',
              top: 311,
              perspective: 1500,
            }}
          >
            <ShirtPreview
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(f => !f)}
            />
          </div>

          {/* ── Flip button ── */}
          <button
            type="button"
            onClick={() => setIsFlipped(f => !f)}
            aria-label={isFlipped ? 'Show front of T-shirt' : 'Show back of T-shirt'}
            style={{
              position: 'absolute',
              left: 'calc(50% - 110px)',
              top: 1085,
              width: 220,
              height: 52,
              zIndex: 5,
              background: '#fefae0',
              borderRadius: 50,
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"BBH Hegarty", sans-serif',
              fontSize: 22,
              color: '#1c1f2a',
              whiteSpace: 'nowrap',
            }}
          >
            {isFlipped ? 'VIEW FRONT' : 'VIEW BACK'}
          </button>

          {/* ── Left annotation ── */}
          <p
            style={{
              position: 'absolute',
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 400,
              fontSize: 40,
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

          {/* ── Right annotation ── */}
          <div
            style={{
              position: 'absolute',
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 0,
              color: '#000',
              right: 87,
              top: 559,
              width: 366,
              textAlign: 'right',
              whiteSpace: 'pre-wrap',
            }}
          >
            <p
              style={{
                lineHeight: 'normal',
                margin: 0,
              }}
            >
              {'Marketed by '}
            </p>

            <p
              style={{
                lineHeight: 'normal',
                margin: 0,
              }}
            >
              ks merchandise
            </p>
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
            <div
              style={{
                transform: 'rotate(-146.16deg)',
              }}
            >
              <div
                style={{
                  height: 0,
                  position: 'relative',
                  width: 109.554,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '-1.5px -1.37%',
                  }}
                >
                  <img
                    src={imgLine10}
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
            <div
              style={{
                transform: 'rotate(180deg)',
              }}
            >
              <div
                style={{
                  height: 0,
                  position: 'relative',
                  width: 127,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '-1.5px -1.18%',
                  }}
                >
                  <img
                    src={imgLine11}
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
            <div
              style={{
                transform: 'rotate(-15deg)',
              }}
            >
              <div
                style={{
                  overflow: 'hidden',
                  position: 'relative',
                  width: 107,
                  height: 107,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '0.05% 0 0.04% 0',
                  }}
                >
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
                  }}
                >
                  <div
                    style={{
                      transform: 'rotate(48.1deg)',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontWeight: 400,
                        fontSize: 30,
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

        </div>
      </div>
    </div>
  );
}
