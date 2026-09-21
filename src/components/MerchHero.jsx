const assetPathPrefix = '/assets';
const imgBackside1 = `${assetPathPrefix}/ae0a9.png`;
const imgPriceTagGreen = `${assetPathPrefix}/24d53.svg`;
const imgGroup112 = `${assetPathPrefix}/96c34.svg`;
const imgGroup39574 = `${assetPathPrefix}/a1b56.svg`;
const imgGroup39575 = `${assetPathPrefix}/cb141.svg`;
const imgGroup39576 = `${assetPathPrefix}/d2e60.svg`;
const imgGroup39577 = `${assetPathPrefix}/7af6b.svg`;
const imgLine10 = `${assetPathPrefix}/25417.svg`;
const imgLine11 = `${assetPathPrefix}/89fe9.svg`;
const imgLine12 = `${assetPathPrefix}/9f3c3.svg`;
const imgLine13 = `${assetPathPrefix}/b9c88.svg`;

export default function MerchHero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#efd4a3] pb-0">
      {/* Background gradient band */}
      <div
        className="absolute inset-x-0 top-[100px] h-[600px] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(239,212,163,0.25) 0%, #dfc298 94.231%)',
          borderRadius: '20px',
        }}
      />

      {/* OUR MERCH heading */}
      <h1
        className="relative text-center text-[#283618] leading-none mt-8 mb-0 z-10"
        style={{
          fontFamily: '"BBH Hegarty:Regular"',
          fontWeight: 400,
          fontSize: 'clamp(72px, 12vw, 180px)',
        }}
      >
        OUR MERCH
      </h1>

      {/* Main content area: annotations + shirt */}
      <div className="relative w-full max-w-[900px] mx-auto mt-4">
        {/* Left annotation */}
        <div className="absolute left-0 top-[120px] z-10 max-w-[180px]">
          <p
            className="text-black text-[24px] leading-snug"
            style={{
              fontFamily: '"Bricolage Grotesque:Regular"',
              fontWeight: 400,
              fontVariationSettings: '"opsz" 14, "wdth" 100',
            }}
          >
            Designed by 300dpi
          </p>
          {/* Line from annotation to shirt */}
          <div className="mt-2 ml-[80px]">
            <img src={imgLine11} alt="" className="w-[127px]" style={{ width: 127 }} />
          </div>
        </div>

        {/* Right annotation */}
        <div className="absolute right-0 top-[200px] z-10 max-w-[180px]">
          <p
            className="text-black text-[24px] leading-snug"
            style={{
              fontFamily: '"Bricolage Grotesque:Regular"',
              fontWeight: 400,
              fontVariationSettings: '"opsz" 14, "wdth" 100',
            }}
          >
            Marketed by ks merchandise
          </p>

          {/* Line from annotation to shirt */}
          <div className="mt-2 mr-[80px] flex justify-end">
            <img
              src={imgLine13}
              alt=""
              style={{
                width: 70,
                display: 'block',
                transform: 'scaleX(-1)',
              }}
            />
          </div>
        </div>

        {/* T-shirt + flanking bushes as one unit */}
        <div className="flex justify-center">
          <div className="relative" style={{ width: 700, height: 400 }}>
            {/* Bush cluster — left, aligned to shirt bottom */}
            <div
              className="absolute pointer-events-none"
              style={{ left: 0, bottom: 0, width: 160 }}
            >
              <img src={imgGroup112} alt="" className="w-full" />
            </div>
            <div
              className="absolute pointer-events-none"
              style={{
                left: -20,
                bottom: 10,
                width: 180,
                transform: 'rotate(-19.06deg)',
                transformOrigin: 'bottom right',
              }}
            >
              <img src={imgGroup39574} alt="" className="w-full" />
            </div>
            <div
              className="absolute pointer-events-none"
              style={{
                left: 10,
                bottom: 0,
                width: 175,
                transform: 'rotate(3.45deg)',
                transformOrigin: 'bottom left',
              }}
            >
              <img src={imgGroup39575} alt="" className="w-full" />
            </div>

            {/* T-shirt centered within the wide wrapper */}
            <div
              className="absolute"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                width: 400,
                height: 560,
                top: 0,
              }}
            >
              <img
                src={imgBackside1}
                alt="Merch T-shirt"
                className="w-full h-full object-contain"
              />

              {/* Price tag */}
              <div
                className="absolute"
                style={{
                  right: -30,
                  bottom: 140,
                  width: 107,
                  height: 107,
                  transform: 'rotate(-15deg)',
                }}
              >
                <img src={imgPriceTagGreen} alt="Price tag" style={{ width: 107, height: 107 }} />
                <span
                  className="absolute text-black text-[22px] text-right"
                  style={{
                    fontFamily: '"Bricolage Grotesque:Regular"',
                    fontWeight: 400,
                    fontVariationSettings: '"opsz" 14, "wdth" 100',
                    bottom: 24,
                    right: 14,
                    transform: 'rotate(48deg)',
                    transformOrigin: 'center',
                  }}
                >
                  ₹300
                </span>
              </div>
            </div>

            {/* Bush cluster — right, aligned to shirt bottom */}
            <div
              className="absolute pointer-events-none"
              style={{ right: 0, bottom: 0, width: 160, transform: 'scaleX(-1)' }}
            >
              <img src={imgGroup112} alt="" className="w-full" />
            </div>
            <div
              className="absolute pointer-events-none"
              style={{
                right: -20,
                bottom: 10,
                width: 180,
                transform: 'scaleX(-1) rotate(-19.06deg)',
                transformOrigin: 'bottom left',
              }}
            >
              <img src={imgGroup39576} alt="" className="w-full" />
            </div>
            <div
              className="absolute pointer-events-none"
              style={{
                right: 10,
                bottom: 0,
                width: 175,
                transform: 'scaleX(-1) rotate(3.45deg)',
                transformOrigin: 'bottom right',
              }}
            >
              <img src={imgGroup39577} alt="" className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
