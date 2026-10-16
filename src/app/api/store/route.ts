import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_PROMOTIONS, INITIAL_SETTINGS } from '@/lib/initial-data';


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
  const pageViews = typeof s.page_views === 'number' ? s.page_views : (Number(s.page_views) || 0);
  
  let bannerText = s.announcement_banner || '¡Bienvenidos a Hoshi Market! Envíos en Huánuco y recojo en Jr. Crespo Castillo 614.';
  if (bannerText.includes(HOSHI_HERO_MARKER)) {
    bannerText = bannerText.split(HOSHI_HERO_MARKER)[0].trim();
  }

  const packedBanner = `${bannerText}\n${HOSHI_HERO_MARKER}\n${JSON.stringify({ 
    hero_title: heroTitle, 
    hero_subtitle: heroSubtitle,
    page_views: pageViews
  })}`;

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
      if (meta.page_views !== undefined) unpacked.page_views = Number(meta.page_views) || 0;
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

const HOSHI_PROMO_MARKER = '###HOSHI_PROMO_META###';

function packPromotionMeta(p: any): string {
  const meta = {
    visual_style: p.visual_style || (p.season_tag === 'vencimiento' || p.season_tag === 'liquidacion' ? 'liquidacion' : 'promo'),
    buy_qty: p.buy_qty ? Number(p.buy_qty) : undefined,
    combo_price: p.combo_price ? Number(p.combo_price) : undefined,
    combo_original_price: p.combo_original_price ? Number(p.combo_original_price) : undefined,
    combo_image_url: p.combo_image_url || undefined,
    original_season_tag: p.season_tag || 'general'
  };
  let baseMsg = p.banner_message || '';
  if (typeof baseMsg === 'string' && baseMsg.includes(HOSHI_PROMO_MARKER)) {
    baseMsg = baseMsg.split(HOSHI_PROMO_MARKER)[0].trim();
  }
  return `${baseMsg}\n${HOSHI_PROMO_MARKER}\n${JSON.stringify(meta)}`;
}

function unpackPromotionFromDb(dbPromo: any) {
  if (!dbPromo) return dbPromo;
  const unpacked = { ...dbPromo };
  if (typeof unpacked.banner_message === 'string' && unpacked.banner_message.includes(HOSHI_PROMO_MARKER)) {
    try {
      const parts = unpacked.banner_message.split(HOSHI_PROMO_MARKER);
      unpacked.banner_message = parts[0].trim();
      const meta = JSON.parse(parts[1].trim());
      if (meta.visual_style) unpacked.visual_style = meta.visual_style;
      if (meta.buy_qty !== undefined) unpacked.buy_qty = meta.buy_qty;
      if (meta.combo_price !== undefined) unpacked.combo_price = meta.combo_price;
      if (meta.combo_original_price !== undefined) unpacked.combo_original_price = meta.combo_original_price;
      if (meta.combo_image_url !== undefined) unpacked.combo_image_url = meta.combo_image_url;
      if (meta.original_season_tag) unpacked.season_tag = meta.original_season_tag;
    } catch {}
  }
  if (!unpacked.visual_style) {
    unpacked.visual_style = (unpacked.season_tag === 'vencimiento' || unpacked.season_tag === 'liquidacion') ? 'liquidacion' : 'promo';
  }
  return unpacked;
}

// Sanitizer for promotions
function sanitizePromotion(p: any) {
  const allowedTags = ['todos', 'halloween', 'navidad', 'san_valentin', 'verano', 'aniversario', 'general'];
  const allowedTypes = ['2x1', '3x2', 'discount_percent', 'combo', 'fixed_price'];

  const clean: any = {
    id: String(p.id),
    name: String(p.name || ''),
    type: allowedTypes.includes(p.type) ? p.type : '2x1',
    badge_text: String(p.badge_text || 'PROMO'),
    badge_color: String(p.badge_color || '#9368B7'),
    discount_value: Number(p.discount_value) || 0,
    season_tag: allowedTags.includes(p.season_tag) ? p.season_tag : 'general',
    is_active: p.is_active !== false,
    product_ids: Array.isArray(p.product_ids) ? p.product_ids : [],
    banner_message: packPromotionMeta(p),
    created_at: p.created_at || new Date().toISOString()
  };

  if (p.description !== undefined) clean.description = String(p.description || '');

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

// Partial update sanitizers that preserve existing fields
function sanitizeProductUpdates(updates: any) {
  const clean: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) clean.name = String(updates.name);
  if (updates.korean_name !== undefined) clean.korean_name = String(updates.korean_name || '').trim() || null;
  if (updates.code !== undefined) clean.code = String(updates.code || '').trim() || null;
  if (updates.description !== undefined) clean.description = String(updates.description || '');
  if (updates.price !== undefined) clean.price = Number(updates.price) || 0;
  if (updates.original_price !== undefined) {
    clean.original_price = updates.original_price && !isNaN(Number(updates.original_price)) ? Number(updates.original_price) : null;
  }
  if (updates.unit !== undefined) clean.unit = String(updates.unit || 'und');
  if (updates.image_url !== undefined) clean.image_url = String(updates.image_url || '');
  if (updates.in_stock !== undefined) clean.in_stock = Boolean(updates.in_stock);
  if (updates.stock_quantity !== undefined) clean.stock_quantity = Number(updates.stock_quantity) || 0;
  if (updates.is_featured !== undefined) clean.is_featured = Boolean(updates.is_featured);
  if (updates.category_id !== undefined) {
    clean.category_id = String(updates.category_id || '').trim() || null;
  }
  if (updates.promotion_id !== undefined) {
    clean.promotion_id = String(updates.promotion_id || '').trim() || null;
  }
  if (updates.tags !== undefined) {
    clean.tags = Array.isArray(updates.tags) ? updates.tags : [];
  }
  return clean;
}

function sanitizeCategoryUpdates(updates: any) {
  const clean: any = {};
  if (updates.name !== undefined) clean.name = String(updates.name);
  if (updates.slug !== undefined) clean.slug = String(updates.slug);
  if (updates.icon !== undefined) clean.icon = String(updates.icon || '✨');
  if (updates.order !== undefined) clean.order = Number(updates.order) || 1;
  if (updates.description !== undefined) clean.description = String(updates.description || '');
  if (updates.is_active !== undefined) clean.is_active = Boolean(updates.is_active);
  return clean;
}

function sanitizePromotionUpdates(updates: any) {
  const allowedTags = ['todos', 'halloween', 'navidad', 'san_valentin', 'verano', 'aniversario', 'general'];
  const allowedTypes = ['2x1', '3x2', 'discount_percent', 'combo', 'fixed_price'];
  const clean: any = {};
  if (updates.name !== undefined) clean.name = String(updates.name);
  if (updates.type !== undefined) clean.type = allowedTypes.includes(updates.type) ? updates.type : '2x1';
  if (updates.badge_text !== undefined) clean.badge_text = String(updates.badge_text);
  if (updates.badge_color !== undefined) clean.badge_color = String(updates.badge_color);
  if (updates.discount_value !== undefined) clean.discount_value = Number(updates.discount_value) || 0;
  if (updates.season_tag !== undefined) clean.season_tag = allowedTags.includes(updates.season_tag) ? updates.season_tag : 'general';
  if (updates.is_active !== undefined) clean.is_active = Boolean(updates.is_active);
  if (updates.product_ids !== undefined) clean.product_ids = Array.isArray(updates.product_ids) ? updates.product_ids : [];
  if (updates.description !== undefined) clean.description = String(updates.description || '');
  if (
    updates.banner_message !== undefined ||
    updates.visual_style !== undefined ||
    updates.buy_qty !== undefined ||
    updates.combo_price !== undefined ||
    updates.combo_original_price !== undefined ||
    updates.combo_image_url !== undefined ||
    updates.season_tag !== undefined
  ) {
    clean.banner_message = packPromotionMeta(updates);
  }
  if (updates.start_date !== undefined) clean.start_date = String(updates.start_date || '').trim() || null;
  if (updates.end_date !== undefined) clean.end_date = String(updates.end_date || '').trim() || null;
  return clean;
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
    let promotions = (promosRes.data || []).map(unpackPromotionFromDb);
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
        promotions = INITIAL_PROMOTIONS.map(sanitizePromotion).map(unpackPromotionFromDb);
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
        const clean = sanitizeProductUpdates(updates);
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
        const clean = sanitizeCategoryUpdates(updates);
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
        const clean = sanitizePromotionUpdates(updates);
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
        let currentViews = Number(payload.page_views) || 0;
        try {
          const { data: cur } = await supabase.from('store_settings').select('announcement_banner').eq('id', 1).maybeSingle();
          if (cur?.announcement_banner && cur.announcement_banner.includes(HOSHI_HERO_MARKER)) {
            const meta = JSON.parse(cur.announcement_banner.split(HOSHI_HERO_MARKER)[1].trim());
            if (meta?.page_views) {
              currentViews = Math.max(currentViews, Number(meta.page_views));
            }
          }
        } catch {}

        const packed = packSettingsForDb({ ...payload, page_views: currentViews });
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
