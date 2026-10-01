import Merch from "@/components/Merch";
import Navbar from "@/components/navbar";

export default function MerchPage() {
  return (
    <main className="relative bg-[#efd4a3] overflow-x-hidden">
      <Navbar />
      <Merch />
    </main>
  );
}