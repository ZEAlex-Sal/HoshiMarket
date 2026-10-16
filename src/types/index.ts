export type PromoType = '2x1' | '3x2' | 'discount_percent' | 'combo' | 'fixed_price';

export type SeasonCampaign = 
  | 'todos'
  | 'general'
  | 'vencimiento'
  | 'liquidacion'
  | 'combos'
  | 'halloween'
  | 'navidad'
  | 'san_valentin'
  | 'verano'
  | 'aniversario';

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: PromoType;
  discount_value?: number; // e.g. 20 for 20% or combo price
  buy_qty?: number; // e.g. 2 for 2x1, 3 for 3x2, 4 for 4x3
  visual_style?: 'promo' | 'liquidacion'; // Top ribbon color style
  combo_price?: number; // Special pack price when type === 'combo'
  combo_original_price?: number; // Sum of individual product prices
  combo_image_url?: string; // Photo of the combo pack uploaded via camera/gallery
  season_tag: SeasonCampaign;
  badge_text: string; // e.g. "PROMO 2x1", "LIQUIDACIÓN", "PACK COMBO"
  badge_color?: string;
  product_ids: string[]; // specific products included
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  banner_message?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // emoji e.g. "🍜", "🍦", "🥤", "🍘", "🎤", "📚", "🧴"
  order: number;
  description?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  code?: string; // Barcode or SKU for local billing system synchronization
  name: string;
  korean_name?: string; // e.g. 신라면, 불닭볶음면, 메로나
  description: string;
  category_id: string;
  category_name?: string;
  price: number; // in Soles (PEN)
  original_price?: number; // for crossed-out display if on direct discount
  unit?: string; // e.g. "und", "paquete", "lata", "caja"
  image_url: string;
  in_stock: boolean;
  stock_quantity?: number;
  is_featured?: boolean;
  promotion_id?: string;
  promotion?: Promotion;
  tags?: string[];
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  applied_promotion?: Promotion;
  discount_amount: number;
  subtotal: number;
  final_subtotal: number;
}

export interface StoreSettings {
  store_name: string;
  address: string;
  whatsapp_number: string;
  phone_display: string;
  instagram_handle: string;
  currency_symbol: string;
  delivery_available: boolean;
  pickup_available: boolean;
  active_campaign: SeasonCampaign;
  announcement_banner: string;
  hero_title?: string;
  hero_subtitle?: string;
}
