const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export default function SizeChart() {
  return (
    <section className="w-full max-w-[1288px] mx-auto px-4 mt-12">
      {/* SIZE CHARTS banner */}
      <div className="bg-[#283618] rounded-[20px] h-[118px] flex items-center justify-center mb-0">
        <h2
          className="text-white text-[48px] leading-normal tracking-wide"
          style={{ fontFamily: '"BBH Hegarty:Regular"', fontWeight: 400 }}
        >
          SIZE CHARTS
        </h2>
      </div>

      {/* Size table */}
      <div className="bg-[#606c38] rounded-[20px] mt-0 p-8 min-h-[300px]">
        <div className="flex flex-col gap-2">
          {sizes.map(size => (
            <div key={size} className="flex items-center gap-4">
              <div className="bg-[#45582d] w-[73px] h-[43px] flex items-center justify-center rounded-sm flex-shrink-0">
                <span
                  className="text-white text-[28px] leading-normal"
                  style={{ fontFamily: '"BBH Hegarty:Regular"', fontWeight: 400 }}
                >
                  {size}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
