export default function BuyButton({ onClick }) {
  return (
    <div className="flex justify-center mt-12 mb-16">
      <button
        onClick={onClick}
        className="bg-[#1c1f2a] text-[#fefae0] rounded-full px-12 py-4 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
        style={{
          fontFamily: '"BBH Hegarty:Regular"',
          fontWeight: 400,
          fontSize: "35px",
          lineHeight: "normal",
          textShadow: "0px 2px 4.5px rgba(0,0,0,0.25)",
          minWidth: "303px",
          height: "76px",
        }}
      >
        BUY NOW!
      </button>
    </div>
  );
}
