import Opening from "@/components/opening";
import HomePage from "@/components/HomePage";

export default function Home() {
  return (
    <main>
      {/* HomePage is mounted by the opening once its animation finishes. */}
      <Opening>
        <HomePage />
      </Opening>
    </main>
  );
}
