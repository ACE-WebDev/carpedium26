import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar';
import BodyScrollUnlock from '@/components/events/BodyScrollUnlock';
import EventsExplorer from '@/components/events/EventsExplorer';

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
    <main style={{ minHeight: '100vh', backgroundColor: '#18130d' }}>

      <BodyScrollUnlock />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Titan+One&display=swap"
      />

      <Navbar />

      {/* ── Interactive search filter, heading, and dynamic cards ── */}
      <EventsExplorer initialEvents={events || []} />

    </main>
  );
}