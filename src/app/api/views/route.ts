import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to get Supabase client on server
function getServerSupabase(req?: Request) {
  const customUrl = req?.headers.get('x-supabase-url');
  const customKey = req?.headers.get('x-supabase-key');

  const url = 
    customUrl ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_STORAGE_URL || 
    process.env.STORAGE_URL || 
    '';

  const key = 
    customKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_STORAGE_ANON_KEY || 
    process.env.STORAGE_ANON_KEY || 
    '';

  if (!url || !key || url.includes('placeholder') || url.includes('tu-proyecto')) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

const HOSHI_HERO_MARKER = '###HOSHI_HERO###';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
};

// GET: Return current view count
export async function GET(request: Request) {
  try {
    const supabase = getServerSupabase(request);
    if (!supabase) {
      return NextResponse.json({ views: 0 }, { headers: noCacheHeaders });
    }

    const { data, error } = await supabase
      .from('store_settings')
      .select('announcement_banner')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ views: 0 }, { headers: noCacheHeaders });
    }

    let views = 0;
    if (data.announcement_banner && data.announcement_banner.includes(HOSHI_HERO_MARKER)) {
      try {
        const parts = data.announcement_banner.split(HOSHI_HERO_MARKER);
        const meta = JSON.parse(parts[1].trim());
        views = Number(meta.page_views) || 0;
      } catch {}
    }

    return NextResponse.json({ views }, { headers: noCacheHeaders });
  } catch {
    return NextResponse.json({ views: 0 }, { headers: noCacheHeaders });
  }
}

// POST: Atomically increment view count
export async function POST(request: Request) {
  try {
    const supabase = getServerSupabase(request);
    if (!supabase) {
      return NextResponse.json({ success: true, views: 1, offline: true }, { headers: noCacheHeaders });
    }

    // 1. Get current row
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    let bannerText = '¡Bienvenidos a Hoshi Market! Envíos en Huánuco y recojo en Jr. Crespo Castillo 614.';
    let meta: any = { hero_title: '', hero_subtitle: '', page_views: 0 };

    if (data?.announcement_banner) {
      if (data.announcement_banner.includes(HOSHI_HERO_MARKER)) {
        const parts = data.announcement_banner.split(HOSHI_HERO_MARKER);
        bannerText = parts[0].trim();
        try {
          meta = JSON.parse(parts[1].trim());
        } catch {}
      } else {
        bannerText = data.announcement_banner;
      }
    }

    const newViews = (Number(meta.page_views) || 0) + 1;
    meta.page_views = newViews;

    const packedBanner = `${bannerText}\n${HOSHI_HERO_MARKER}\n${JSON.stringify(meta)}`;

    // 2. Update with new packed banner
    if (data) {
      await supabase
        .from('store_settings')
        .update({ 
          announcement_banner: packedBanner,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);
    } else {
      await supabase
        .from('store_settings')
        .insert({
          id: 1,
          store_name: 'Hoshi Market',
          address: 'Jr. Crespo Castillo 614, Huánuco, Perú',
          announcement_banner: packedBanner,
          updated_at: new Date().toISOString()
        });
    }

    return NextResponse.json({ success: true, views: newViews }, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error incrementing views' }, { status: 500, headers: noCacheHeaders });
  }
}
