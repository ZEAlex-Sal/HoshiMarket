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

export async function GET(request: Request) {
  try {
    const supabase = getServerSupabase(request);
    if (!supabase) {
      return NextResponse.json({
        connected: false,
        message: 'Credenciales de Supabase no detectadas en el servidor.'
      });
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
      });
    }

    let products = prodsRes.data || [];
    let categories = catsRes.data || [];
    let promotions = promosRes.data || [];
    let settings = settingsRes.data ? { ...INITIAL_SETTINGS, ...settingsRes.data } : INITIAL_SETTINGS;

    // Auto-seed if database is freshly created and empty
    if (products.length === 0 && categories.length === 0) {
      try {
        await supabase.from('categories').upsert(INITIAL_CATEGORIES);
        await supabase.from('promotions').upsert(INITIAL_PROMOTIONS);
        await supabase.from('products').upsert(INITIAL_PRODUCTS);
        await supabase.from('store_settings').upsert({ id: 1, ...INITIAL_SETTINGS });
        products = INITIAL_PRODUCTS;
        categories = INITIAL_CATEGORIES;
        promotions = INITIAL_PROMOTIONS;
      } catch {}
    }

    return NextResponse.json({
      connected: true,
      tablesReady: true,
      products,
      categories,
      promotions,
      settings
    });
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error?.message || 'Error al conectar con la base de datos'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getServerSupabase(request);
    if (!supabase) {
      return NextResponse.json({
        connected: false,
        message: 'Supabase no configurado'
      }, { status: 400 });
    }

    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case 'sync_all': {
        const { products, categories, promotions, settings } = payload || {};
        if (categories && Array.isArray(categories) && categories.length > 0) {
          await supabase.from('categories').upsert(categories);
        }
        if (promotions && Array.isArray(promotions) && promotions.length > 0) {
          await supabase.from('promotions').upsert(promotions);
        }
        if (products && Array.isArray(products) && products.length > 0) {
          await supabase.from('products').upsert(products);
        }
        if (settings) {
          await supabase.from('store_settings').upsert({ id: 1, ...settings });
        }
        return NextResponse.json({ success: true, message: 'Sincronización en la nube completada' });
      }

      case 'add_product': {
        const { data, error } = await supabase.from('products').upsert(payload).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'update_product': {
        const { id, updates } = payload;
        const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
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
        const { data, error } = await supabase.from('categories').upsert(payload).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'update_category': {
        const { id, updates } = payload;
        const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
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
        const { data, error } = await supabase.from('promotions').upsert(payload).select().single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }

      case 'update_promotion': {
        const { id, updates } = payload;
        const { data, error } = await supabase.from('promotions').update(updates).eq('id', id).select().single();
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
        const { error } = await supabase.from('store_settings').upsert({ id: 1, ...payload });
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
