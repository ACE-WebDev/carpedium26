import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar';
import BodyScrollUnlock from '@/components/events/BodyScrollUnlock';
import EventsExplorer from '@/components/events/EventsExplorer';
import MazeBackground from '@/components/MazeBackground';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EventsPage() {
  // Server-side fetch — runs at request time, auto-updates as DB changes
  const { data: events, error } = await supabase
    .from('Events')
    .select('id, Name, Venue, Time, img_url')
    .order('id', { ascending: true });

  if (error) console.error('Supabase fetch error:', error.message);

  return (
    /*
     * bg-[#EDD4A3] matches the home page canvas colour.
     * The maze image uses mix-blend-mode: multiply, so its white areas
     * become transparent and the warm golden walls show through cleanly.
     */
    <main className="relative min-h-screen bg-[#EDD4A3] overflow-x-hidden">
      <BodyScrollUnlock />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Titan+One&display=swap"
      />

      <Navbar />

      {/* ── Viewport-Fixed Maze Background (multiply blend over cream canvas) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <MazeBackground />
      </div>

      {/* ── Transparent dark overlay for text/card readability ── */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{ backgroundColor: 'rgba(30, 20, 8, 0.80)' }}
      />

      {/* ── Events Content & Components Layer ── */}
      <div className="relative z-20">
        <EventsExplorer initialEvents={events || []} />
      </div>
    </main>
  );
}