import Merch from "@/components/Merch";
import Navbar from "@/components/navbar";
import Opening from "@/components/opening";

export default function MerchPage() {
  return (
    <>
      {/* The opening plays over the merch page, which is mounted underneath
          it from the start and shows through its letters. */}
      <Opening>
        <Navbar />
        <Merch />
      </Opening>
    </>
  );
}