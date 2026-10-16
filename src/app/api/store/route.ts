import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_PROMOTIONS, INITIAL_SETTINGS } from '@/lib/initial-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// Marker to safely pack hero_title and hero_subtitle into PostgreSQL text column
const HOSHI_HERO_MARKER = '###HOSHI_HERO###';

function packSettingsForDb(s: any) {
  const heroTitle = s.hero_title || '';
  const heroSubtitle = s.hero_subtitle || '';
  
  let bannerText = s.announcement_banner || '¡Bienvenidos a Hoshi Market! Envíos en Huánuco y recojo en Jr. Crespo Castillo 614.';
  if (bannerText.includes(HOSHI_HERO_MARKER)) {
    bannerText = bannerText.split(HOSHI_HERO_MARKER)[0].trim();
  }

  const packedBanner = `${bannerText}\n${HOSHI_HERO_MARKER}\n${JSON.stringify({ hero_title: heroTitle, hero_subtitle: heroSubtitle })}`;

  return {
    id: 1,
    store_name: s.store_name || 'Hoshi Market',
    address: s.address || 'Jr. Crespo Castillo 614, Huánuco, Perú',
    whatsapp_number: s.whatsapp_number || '51969399589',
    phone_display: s.phone_display || '+51 969 399 589',
    instagram_handle: s.instagram_handle || '@hoshihco',
    currency_symbol: s.currency_symbol || 'S/.',
    delivery_available: s.delivery_available !== false,
    pickup_available: s.pickup_available !== false,
    active_campaign: s.active_campaign || 'general',
    announcement_banner: packedBanner,
    updated_at: new Date().toISOString()
  };
}

function unpackSettingsFromDb(dbSettings: any) {
  if (!dbSettings) return INITIAL_SETTINGS;
  const unpacked = { ...INITIAL_SETTINGS, ...dbSettings };
  
  if (typeof unpacked.announcement_banner === 'string' && unpacked.announcement_banner.includes(HOSHI_HERO_MARKER)) {
    try {
      const parts = unpacked.announcement_banner.split(HOSHI_HERO_MARKER);
      unpacked.announcement_banner = parts[0].trim();
      const meta = JSON.parse(parts[1].trim());
      if (meta.hero_title !== undefined) unpacked.hero_title = meta.hero_title;
      if (meta.hero_subtitle !== undefined) unpacked.hero_subtitle = meta.hero_subtitle;
    } catch {}
  }
  return unpacked;
}

// Sanitizer to guarantee PostgreSQL compatibility for products
function sanitizeProduct(p: any) {
  const clean: any = {
    id: String(p.id),
    name: String(p.name || ''),
    price: Number(p.price) || 0,
    image_url: String(p.image_url || ''),
    description: String(p.description || ''),
    unit: String(p.unit || 'und'),
    in_stock: p.in_stock !== false,
    stock_quantity: Number(p.stock_quantity) || 0,
    is_featured: Boolean(p.is_featured),
    created_at: p.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (p.code && String(p.code).trim()) clean.code = String(p.code).trim();
  if (p.korean_name && String(p.korean_name).trim()) clean.korean_name = String(p.korean_name).trim();
  
  // Foreign keys: NULL if empty or not present to prevent constraint violations
  if (p.category_id && String(p.category_id).trim()) {
    clean.category_id = String(p.category_id).trim();
  } else {
    clean.category_id = null;
  }

  if (p.promotion_id && String(p.promotion_id).trim()) {
    clean.promotion_id = String(p.promotion_id).trim();
  } else {
    clean.promotion_id = null;
  }

  if (p.original_price && !isNaN(Number(p.original_price)) && Number(p.original_price) > 0) {
    clean.original_price = Number(p.original_price);
  } else {
    clean.original_price = null;
  }

  clean.tags = Array.isArray(p.tags) ? p.tags : [];
  return clean;
}

// Sanitizer for promotions
function sanitizePromotion(p: any) {
  const allowedTags = ['todos', 'halloween', 'navidad', 'san_valentin', 'verano', 'aniversario', 'general'];
  const allowedTypes = ['2x1', '3x2', 'discount_percent', 'combo', 'fixed_price'];

  const clean: any = {
    id: String(p.id),
    name: String(p.name || ''),
    type: allowedTypes.includes(p.type) ? p.type : '2x1',
    badge_text: String(p.badge_text || '🔥 Promo'),
    badge_color: String(p.badge_color || '#9368B7'),
    discount_value: Number(p.discount_value) || 0,
    season_tag: allowedTags.includes(p.season_tag) ? p.season_tag : 'general',
    is_active: p.is_active !== false,
    product_ids: Array.isArray(p.product_ids) ? p.product_ids : [],
    created_at: p.created_at || new Date().toISOString()
  };

  if (p.description) clean.description = String(p.description);
  if (p.banner_message) clean.banner_message = String(p.banner_message);

  if (p.start_date && String(p.start_date).trim()) {
    clean.start_date = String(p.start_date).trim();
  } else {
    clean.start_date = null;
  }

  if (p.end_date && String(p.end_date).trim()) {
    clean.end_date = String(p.end_date).trim();
  } else {
    clean.end_date = null;
  }

  return clean;
}

// Sanitizer for categories
function sanitizeCategory(c: any) {
  return {
    id: String(c.id),
    name: String(c.name || ''),
    slug: String(c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cat'),
    icon: String(c.icon || '✨'),
    order: Number(c.order) || 1,
    description: String(c.description || ''),
    is_active: c.is_active !== false,
    created_at: c.created_at || new Date().toISOString()
  };
}

export async function GET(request: Request) {
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  try {
    const supabase = getServerSupabase(request);
    if (!supabase) {
      return NextResponse.json({
        connected: false,
        message: 'Credenciales de Supabase no detectadas en el servidor.'
      }, { headers: noCacheHeaders });
    }

    // Fetch from tables
    const [prodsRes, catsRes, promosRes, settingsRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('order', { ascending: true }),
      supabase.from('promotions').select('*'),
      supabase.from('store_settings').select('*').limit(1).maybeSingle()
    ]);

    // Check if tables are ready
    if (prodsRes.error) {
      return NextResponse.json({
        connected: true,
        tablesReady: false,
        error: prodsRes.error.message
      }, { headers: noCacheHeaders });
    }

    let products = prodsRes.data || [];
    let categories = catsRes.data || [];
    let promotions = promosRes.data || [];
    let settings = unpackSettingsFromDb(settingsRes.data);

    // Auto-seed if database is freshly created and empty
    if (products.length === 0 && categories.length === 0) {
      try {
        await supabase.from('categories').upsert(INITIAL_CATEGORIES.map(sanitizeCategory));
        await supabase.from('promotions').upsert(INITIAL_PROMOTIONS.map(sanitizePromotion));
        await supabase.from('products').upsert(INITIAL_PRODUCTS.map(sanitizeProduct));
        await supabase.from('store_settings').upsert(packSettingsForDb(INITIAL_SETTINGS));
        products = INITIAL_PRODUCTS.map(sanitizeProduct);
        categories = INITIAL_CATEGORIES.map(sanitizeCategory);
        promotions = INITIAL_PROMOTIONS.map(sanitizePromotion);
      } catch {}
    }

    // Attach category_name to products for fast UI lookup
    const catMap = new Map<string, string>();
    categories.forEach((c: any) => catMap.set(c.id, c.name));
    const enrichedProducts = products.map((p: any) => ({
      ...p,
      category_name: catMap.get(p.category_id) || 'General'
    }));

    return NextResponse.json({
      connected: true,
      tablesReady: true,
      products: enrichedProducts,
      categories,
      promotions,
      settings
    }, { headers: noCacheHeaders });
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error?.message || 'Error al conectar con la base de datos'
    }, { status: 500, headers: noCacheHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getServerSupabase(request);
    if (!supabase) {
      return NextResponse.json({
        connected: false,
        message: 'Supabase no configurado en el servidor'
      }, { status: 400 });
    }

    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case 'sync_all': {
        const { products, categories, promotions, settings } = payload || {};
        
        // 1. Categories first (products reference categories)
        if (categories && Array.isArray(categories) && categories.length > 0) {
          const cleanCats = categories.map(sanitizeCategory);
          const { error: cErr } = await supabase.from('categories').upsert(cleanCats);
          if (cErr) console.error('Error syncing categories:', cErr);
        }

        // 2. Promotions second (products reference promotions)
        if (promotions && Array.isArray(promotions) && promotions.length > 0) {
          const cleanPromos = promotions.map(sanitizePromotion);
          const { error: pErr } = await supabase.from('promotions').upsert(cleanPromos);
          if (pErr) console.error('Error syncing promotions:', pErr);
        }

        // 3. Products third
        if (products && Array.isArray(products) && products.length > 0) {
          const cleanProds = products.map(sanitizeProduct);
          const { error: prErr } = await supabase.from('products').upsert(cleanProds);
          if (prErr) {
            console.error('Error syncing products:', prErr);
            throw prErr;
          }
        }

        // 4. Settings
        if (settings) {
          const packed = packSettingsForDb(settings);
          const { error: sErr } = await supabase.from('store_settings').upsert(packed);
          if (sErr) console.error('Error syncing settings:', sErr);
        }

        return NextResponse.json({ success: true, message: '¡Catálogo completo sincronizado en la nube con éxito!' });
      }

      case 'add_product': {
        const clean = sanitizeProduct(payload);
        const { data, error } = await supabase.from('products').upsert(clean).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'update_product': {
        const { id, updates } = payload;
        const clean = sanitizeProduct({ ...updates, id });
        delete clean.created_at; // don't overwrite creation date
        const { data, error } = await supabase.from('products').update(clean).eq('id', id).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'delete_product': {
        const { id } = payload;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true, id });
      }

      case 'add_category': {
        const clean = sanitizeCategory(payload);
        const { data, error } = await supabase.from('categories').upsert(clean).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'update_category': {
        const { id, updates } = payload;
        const clean = sanitizeCategory({ ...updates, id });
        delete clean.created_at;
        const { data, error } = await supabase.from('categories').update(clean).eq('id', id).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'delete_category': {
        const { id } = payload;
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true, id });
      }

      case 'add_promotion': {
        const clean = sanitizePromotion(payload);
        const { data, error } = await supabase.from('promotions').upsert(clean).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'update_promotion': {
        const { id, updates } = payload;
        const clean = sanitizePromotion({ ...updates, id });
        delete clean.created_at;
        const { data, error } = await supabase.from('promotions').update(clean).eq('id', id).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'delete_promotion': {
        const { id } = payload;
        const { error } = await supabase.from('promotions').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true, id });
      }

      case 'update_settings': {
        const packed = packSettingsForDb(payload);
        const { error } = await supabase.from('store_settings').upsert(packed);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error en servidor' }, { status: 500 });
  }
}
