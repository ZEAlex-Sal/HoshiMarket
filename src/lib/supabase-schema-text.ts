// Script SQL oficial para inicializar Supabase para Hoshi Market
export const HOSHI_SUPABASE_SCHEMA = `-- ========================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA HOSHI MARKET (SUPABASE)
-- Jr. Crespo Castillo 614, Huánuco, Perú
-- ========================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Categorías Dinámicas
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT '✨',
    "order" INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Promociones (2x1, 3x2, Campañas Estacionales: Halloween, Navidad, San Valentín, etc.)
CREATE TABLE IF NOT EXISTS public.promotions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('2x1', '3x2', 'discount_percent', 'combo', 'fixed_price')),
    discount_value NUMERIC(10,2) DEFAULT 0,
    season_tag TEXT DEFAULT 'general' CHECK (season_tag IN ('todos', 'halloween', 'navidad', 'san_valentin', 'verano', 'aniversario', 'general')),
    badge_text TEXT NOT NULL,
    badge_color TEXT DEFAULT '#9368B7',
    product_ids TEXT[] DEFAULT '{}',
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    banner_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Productos (~500 SKUs con foto, precio, sincronización con facturación)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    code TEXT, -- Código de barras o SKU para vincular con el sistema de facturación local
    name TEXT NOT NULL,
    korean_name TEXT,
    description TEXT DEFAULT '',
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2),
    unit TEXT DEFAULT 'und',
    image_url TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    promotion_id TEXT REFERENCES public.promotions(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Configuración de la Tienda
CREATE TABLE IF NOT EXISTS public.store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    store_name TEXT DEFAULT 'Hoshi Market',
    address TEXT DEFAULT 'Jr. Crespo Castillo 614, Huánuco, Perú',
    whatsapp_number TEXT DEFAULT '51969399589',
    phone_display TEXT DEFAULT '+51 969 399 589',
    instagram_handle TEXT DEFAULT '@hoshihco',
    currency_symbol TEXT DEFAULT 'S/.',
    delivery_available BOOLEAN DEFAULT TRUE,
    pickup_available BOOLEAN DEFAULT TRUE,
    active_campaign TEXT DEFAULT 'general',
    announcement_banner TEXT DEFAULT '¡Bienvenidos a Hoshi Market! Envíos en Huánuco y recojo en Jr. Crespo Castillo 614.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- 6. Configuración de Seguridad y Políticas (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Limpieza preventiva de políticas anteriores
DROP POLICY IF EXISTS "Acceso total categorías" ON public.categories;
DROP POLICY IF EXISTS "Acceso total promociones" ON public.promotions;
DROP POLICY IF EXISTS "Acceso total productos" ON public.products;
DROP POLICY IF EXISTS "Acceso total configuración" ON public.store_settings;
DROP POLICY IF EXISTS "Lectura pública de categorías" ON public.categories;
DROP POLICY IF EXISTS "Lectura pública de promociones" ON public.promotions;
DROP POLICY IF EXISTS "Lectura pública de productos" ON public.products;
DROP POLICY IF EXISTS "Lectura pública de configuración" ON public.store_settings;
DROP POLICY IF EXISTS "Admin modificación categorías" ON public.categories;
DROP POLICY IF EXISTS "Admin modificación promociones" ON public.promotions;
DROP POLICY IF EXISTS "Admin modificación productos" ON public.products;
DROP POLICY IF EXISTS "Admin modificación configuración" ON public.store_settings;

-- Políticas universales para la API de Hoshi Market (Lectura y Escritura)
CREATE POLICY "Acceso total categorías" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total promociones" ON public.promotions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total productos" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total configuración" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

-- 7. Bucket de Storage en Supabase para imágenes de productos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imágenes públicas" ON storage.objects;
DROP POLICY IF EXISTS "Imágenes subida pública" ON storage.objects;
DROP POLICY IF EXISTS "Imágenes modificación pública" ON storage.objects;
DROP POLICY IF EXISTS "Imágenes eliminación pública" ON storage.objects;

CREATE POLICY "Imágenes públicas" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Imágenes subida pública" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Imágenes modificación pública" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "Imágenes eliminación pública" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
`;
