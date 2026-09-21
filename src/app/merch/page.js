import Merch from "@/components/Merch";
import Navbar from "@/components/navbar";
import Opening from "@/components/opening";

export default function MerchPage() {
  return (
    <>
      {/* HomePage is mounted by the opening once its animation finishes. */}
      <Opening>
        <Navbar />
        <Merch />
      </Opening>
    </>
  );
}