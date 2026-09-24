import Opening from "@/components/opening";
import HomePage from "@/components/HomePage";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      {/* The opening plays over HomePage, which is mounted underneath it
          from the start and shows through its letters. */}
      <Opening>
        <HomePage />
        <Footer />
      </Opening>
    </main>
  );
}
