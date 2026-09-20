import Opening from "@/components/opening";
import HomePage from "@/components/HomePage";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      {/* HomePage is mounted by the opening once its animation finishes. */}
      <Opening>
        <HomePage />
        <Footer />
      </Opening>
    </main>
  );
}
