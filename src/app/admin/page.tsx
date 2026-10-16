"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/store-context';
import { Product, Promotion, Category, PromoType, SeasonCampaign } from '@/types';
import { translateToKorean } from '@/lib/korean-translator';
import * as XLSX from 'xlsx';
import { 
  Lock, 
  Package, 
  Tag, 
  Sparkles, 
  FileSpreadsheet, 
  Settings, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Check, 
  X, 
  ExternalLink,
  Flame,
  ArrowLeft,
  Upload,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Smile,
  RefreshCw,
  Copy,
  CheckCheck,
  Code,
  Database,
  Clock,
  Percent,
  Gift,
  Eye
} from 'lucide-react';
import { HOSHI_SUPABASE_SCHEMA } from '@/lib/supabase-schema-text';

const CATEGORY_EMOJI_GROUPS = [
  { group: '🍜 Ramens & Comida Coreana', emojis: ['🍜', '🥟', '🍲', '🥢', '🍱', '🍙', '🍘', '🍛', '🥩'] },
  { group: '🍦 Helados & Dulces', emojis: ['🍦', '🍧', '🍨', '🍫', '🍪', '🍡', '🍬', '🍭', '🧁', '🍰'] },
  { group: '🥤 Bebidas Asiáticas', emojis: ['🥤', '🧋', '🍵', '🧃', '🍶', '🥛', '☕', '🍹'] },
  { group: '🎤 K-Pop & Merch', emojis: ['🎤', '💖', '🌟', '💿', '📸', '🎀', '🎵', '⭐', '✨', '👑'] },
  { group: '📚 Mangas, Papelería & Skincare', emojis: ['📚', '📖', '✏️', '🎨', '🧸', '🧴', '💄', '🏷️', '🎒'] },
  { group: '🔥 Promos & Especiales', emojis: ['🔥', '🎃', '🎄', '🎁', '💝', '⚡', '🎉', '🧧'] },
];

export default function AdminPage() {
  const { 
    products, 
    categories, 
    promotions, 
    settings, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addPromotion,
    updatePromotion,
    deletePromotion,
    importProductsFromExcel,
    updateSettings,
    cloudSyncStatus,
    cloudErrorDetail,
    isSyncing,
    syncAllToCloud,
    reloadFromCloud
  } = useStore();

  // Authentication gate with session persistence across page refreshes
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showSqlCode, setShowSqlCode] = useState(false);

  // Check persisted session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('hoshi_admin_session');
      if (session === 'active') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Live page views counter
  const [viewsCount, setViewsCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/views');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.views === 'number') {
            setViewsCount(data.views);
          }
        }
      } catch {}
    };
    fetchViews();
    const interval = setInterval(fetchViews, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'promotions' | 'excel' | 'settings'>('products');

  // Search in admin
  const [adminSearch, setAdminSearch] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    type: 'product' | 'category' | 'promotion';
    id: string;
    name: string;
    subtitle: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmModal.type === 'product') {
        await deleteProduct(deleteConfirmModal.id);
      } else if (deleteConfirmModal.type === 'category') {
        await deleteCategory(deleteConfirmModal.id);
      } else if (deleteConfirmModal.type === 'promotion') {
        await deletePromotion(deleteConfirmModal.id);
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmModal(null);
    }
  };

  // Excel sync state
  const [excelPreview, setExcelPreview] = useState<any[]>([]);
  const [excelStats, setExcelStats] = useState<{ updated: number; created: number } | null>(null);
  const [excelError, setExcelError] = useState('');

  // Product Form state
  const [prodForm, setProdForm] = useState({
    name: '',
    korean_name: '',
    code: '',
    description: '',
    category_id: categories[0]?.id || '',
    price: 0,
    original_price: 0,
    unit: 'und',
    image_url: '',
    in_stock: true,
    stock_quantity: 20,
    is_featured: false,
    tags: [] as string[],
    promotion_id: ''
  });

  // Category Form state
  const [catForm, setCatForm] = useState({
    name: '',
    icon: '🍜',
    description: ''
  });

  // Promo Form state
  const [promoForm, setPromoForm] = useState({
    name: '',
    description: '',
    modality: 'multiplier' as 'multiplier' | 'discount_percent' | 'combo',
    buy_qty: 2,
    discount_value: 20,
    visual_style: 'promo' as 'promo' | 'liquidacion',
    badge_text: '🔥 PROMO 2x1',
    product_ids: [] as string[],
    combo_price: 0,
    combo_image_url: '',
    is_active: true
  });
  const [promoProductSearch, setPromoProductSearch] = useState('');

  // Store Settings Form state (for explicit Save button when edited)
  const [settingsForm, setSettingsForm] = useState(settings);
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isSettingsDirty) {
      setSettingsForm(settings);
    }
  }, [settings, isSettingsDirty]);

  const hasSettingsEdited = isSettingsDirty && (
    (settingsForm.store_name || '') !== (settings.store_name || '') ||
    (settingsForm.address || '') !== (settings.address || '') ||
    (settingsForm.whatsapp_number || '') !== (settings.whatsapp_number || '') ||
    (settingsForm.phone_display || '') !== (settings.phone_display || '') ||
    (settingsForm.announcement_banner || '') !== (settings.announcement_banner || '') ||
    (settingsForm.hero_title || '') !== (settings.hero_title || '') ||
    (settingsForm.hero_subtitle || '') !== (settings.hero_subtitle || '')
  );

  const handleSettingsChange = (updates: Partial<typeof settings>) => {
    setSettingsForm(prev => ({ ...prev, ...updates }));
    setIsSettingsDirty(true);
    setSettingsSavedSuccess(false);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    const ok = await updateSettings(settingsForm);
    setIsSavingSettings(false);
    if (ok) {
      setIsSettingsDirty(false);
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 3500);
    }
  };

  // Camera & Gallery Image Upload state (Products & Combo Packs)
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const comboCameraInputRef = useRef<HTMLInputElement | null>(null);
  const comboGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const [comboImageUploadMode, setComboImageUploadMode] = useState<'upload' | 'url'>('upload');
  const [isProcessingComboImage, setIsProcessingComboImage] = useState(false);

  const optimizeImageFile = (file: File, onDone: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/webp', 0.82) || canvas.toDataURL('image/jpeg', 0.85);
        onDone(optimizedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processImageFile = (file: File) => {
    setIsProcessingImage(true);
    optimizeImageFile(file, (optimizedDataUrl) => {
      setProdForm(prev => ({ ...prev, image_url: optimizedDataUrl }));
      setIsProcessingImage(false);
    });
  };

  const processComboImageFile = (file: File) => {
    setIsProcessingComboImage(true);
    optimizeImageFile(file, (optimizedDataUrl) => {
      setPromoForm(prev => ({ ...prev, combo_image_url: optimizedDataUrl }));
      setIsProcessingComboImage(false);
    });
  };

  // Handle PIN authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode === 'hoshi2026' || pinCode === '6140' || pinCode === 'admin') {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hoshi_admin_session', 'active');
      }
      setAuthError('');
    } else {
      setAuthError('Código de seguridad incorrecto.');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hoshi_admin_session');
    }
    setIsAuthenticated(false);
    setPinCode('');
  };

  // Open Product Modal
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      korean_name: '',
      code: `SKU-${Date.now().toString().slice(-4)}`,
      description: '',
      category_id: categories[0]?.id || '',
      price: 12.00,
      original_price: 0,
      unit: 'und',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
      in_stock: true,
      stock_quantity: 25,
      is_featured: false,
      tags: [],
      promotion_id: ''
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      korean_name: prod.korean_name || '',
      code: prod.code || '',
      description: prod.description,
      category_id: prod.category_id,
      price: prod.price,
      original_price: prod.original_price || 0,
      unit: prod.unit || 'und',
      image_url: prod.image_url,
      in_stock: prod.in_stock,
      stock_quantity: prod.stock_quantity || 0,
      is_featured: prod.is_featured || false,
      tags: prod.tags || [],
      promotion_id: prod.promotion_id || ''
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === prodForm.category_id);
    const category_name = cat ? cat.name : 'General';

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        ...prodForm,
        category_name,
        price: Number(prodForm.price),
        original_price: Number(prodForm.original_price) || undefined,
        stock_quantity: Number(prodForm.stock_quantity),
        tags: prodForm.tags,
        promotion_id: prodForm.promotion_id || undefined
      });
    } else {
      await addProduct({
        ...prodForm,
        category_name,
        price: Number(prodForm.price),
        original_price: Number(prodForm.original_price) || undefined,
        stock_quantity: Number(prodForm.stock_quantity),
        tags: prodForm.tags,
        promotion_id: prodForm.promotion_id || undefined
      });
    }
    setIsProductModalOpen(false);
  };

  // Category Modal
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatForm({ name: '', icon: '✨', description: '' });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: catForm.name,
        icon: catForm.icon,
        description: catForm.description
      });
    } else {
      await addCategory({
        name: catForm.name,
        icon: catForm.icon || '✨',
        description: catForm.description
      });
    }
    setIsCategoryModalOpen(false);
  };

  // Promotion Modal
  const openNewPromoModal = () => {
    setEditingPromo(null);
    setPromoProductSearch('');
    setPromoForm({
      name: '',
      description: '',
      modality: 'multiplier',
      buy_qty: 2,
      discount_value: 20,
      visual_style: 'promo',
      badge_text: '🔥 PROMO 2x1',
      product_ids: [],
      combo_price: 19.90,
      combo_image_url: '',
      is_active: true
    });
    setIsPromoModalOpen(true);
  };

  const openEditPromoModal = (pr: Promotion) => {
    setEditingPromo(pr);
    setPromoProductSearch('');
    const modality: 'multiplier' | 'discount_percent' | 'combo' =
      pr.type === 'combo'
        ? 'combo'
        : pr.type === 'discount_percent'
        ? 'discount_percent'
        : 'multiplier';
    const buyQty = pr.buy_qty
      ? Number(pr.buy_qty)
      : pr.type === '3x2'
      ? 3
      : 2;
    const visualStyle: 'promo' | 'liquidacion' =
      pr.visual_style === 'liquidacion' || pr.season_tag === 'vencimiento'
        ? 'liquidacion'
        : 'promo';

    // Also include products that have promotion_id === pr.id (excluding generated combo card)
    const linkedIds = Array.from(
      new Set([
        ...(pr.product_ids || []),
        ...products
          .filter(p => p.promotion_id === pr.id && !p.id.startsWith('combo-'))
          .map(p => p.id)
      ])
    );

    setPromoForm({
      name: pr.name,
      description: pr.description || '',
      modality,
      buy_qty: buyQty,
      discount_value: pr.discount_value || 20,
      visual_style: visualStyle,
      badge_text: pr.badge_text,
      product_ids: linkedIds,
      combo_price: Number(pr.combo_price || pr.discount_value || 19.90),
      combo_image_url: pr.combo_image_url || '',
      is_active: pr.is_active
    });
    setIsPromoModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const buyQty = Math.max(2, Number(promoForm.buy_qty) || 2);
    const selectedCatalogProducts = products.filter(
      p => !p.id.startsWith('combo-') && promoForm.product_ids.includes(p.id)
    );
    const normalComboSum = Number(
      selectedCatalogProducts.reduce((sum, p) => sum + p.price, 0).toFixed(2)
    );

    const resolvedType: PromoType =
      promoForm.modality === 'combo'
        ? 'combo'
        : promoForm.modality === 'discount_percent'
        ? 'discount_percent'
        : buyQty === 3
        ? '3x2'
        : '2x1';

    const resolvedSeasonTag: SeasonCampaign =
      promoForm.visual_style === 'liquidacion'
        ? 'vencimiento'
        : promoForm.modality === 'combo'
        ? 'combos'
        : 'general';

    const payload: Omit<Promotion, 'id'> = {
      name: promoForm.name.trim(),
      description: promoForm.description.trim(),
      type: resolvedType,
      buy_qty: promoForm.modality === 'multiplier' ? buyQty : undefined,
      discount_value:
        promoForm.modality === 'combo'
          ? Number(promoForm.combo_price) || 0
          : promoForm.modality === 'discount_percent'
          ? Number(promoForm.discount_value) || 0
          : 0,
      visual_style: promoForm.visual_style,
      season_tag: resolvedSeasonTag,
      badge_text: promoForm.badge_text.trim() || '🔥 PROMO',
      product_ids: promoForm.product_ids,
      combo_price:
        promoForm.modality === 'combo' ? Number(promoForm.combo_price) || 0 : undefined,
      combo_original_price:
        promoForm.modality === 'combo' ? normalComboSum : undefined,
      combo_image_url:
        promoForm.modality === 'combo' ? promoForm.combo_image_url : undefined,
      is_active: promoForm.is_active
    };

    if (editingPromo) {
      await updatePromotion(editingPromo.id, payload);
    } else {
      await addPromotion(payload);
    }
    setIsPromoModalOpen(false);
  };

  // Excel / CSV File parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelError('');
    setExcelStats(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setExcelError('El archivo no contiene filas de datos.');
          return;
        }

        // Normalize columns (looking for name/nombre/producto, price/precio, code/codigo/sku, stock)
        const parsedRows = data.map((row: any) => {
          const keys = Object.keys(row);
          const findVal = (terms: string[]) => {
            const key = keys.find(k => terms.some(t => k.toLowerCase().includes(t)));
            return key ? row[key] : undefined;
          };

          const name = findVal(['nombre', 'producto', 'descripcion', 'name', 'item']) || '';
          const price = findVal(['precio', 'price', 'pvp', 'venta', 'unitario']) || 0;
          const code = findVal(['codigo', 'code', 'sku', 'barras', 'id']) || '';
          const stock = findVal(['stock', 'cantidad', 'cant', 'qty']) || 10;
          const category = findVal(['categoria', 'category', 'familia', 'linea']) || '';

          return {
            name: String(name),
            price: Number(price),
            code: String(code),
            stock: Number(stock),
            category: String(category)
          };
        }).filter(r => r.name && r.price > 0);

        if (parsedRows.length === 0) {
          setExcelError('No pudimos detectar columnas de "Nombre" y "Precio" en el archivo. Asegúrate de que las cabeceras indiquen Producto y Precio.');
          return;
        }

        setExcelPreview(parsedRows);
      } catch (err: any) {
        setExcelError('Error al leer el archivo Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmExcelSync = () => {
    if (excelPreview.length === 0) return;
    const stats = importProductsFromExcel(excelPreview);
    setExcelStats(stats);
    setExcelPreview([]);
  };

  // If not authenticated, show PIN entry modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EADBEE] shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#FFF9F2] mx-auto p-2 border border-[#EADBEE] shadow-md flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Hoshi Market" className="w-full h-full object-contain" />
          </div>

          <div>
            <span className="text-xs font-bold text-[#9368B7] bg-[#EFE6F7] px-3 py-1 rounded-full uppercase tracking-wider">
              Panel de Acceso
            </span>
            <h2 className="text-2xl font-black text-[#261C30] mt-2">
              Hoshi Market • Huánuco
            </h2>
            <p className="text-xs text-[#6B5E78] mt-1">
              Ingresa el PIN de seguridad para acceder a la administración del catálogo e inventario.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="PIN de seguridad"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="w-full text-center text-lg tracking-widest bg-[#FAF8F5] border border-[#EADBEE] rounded-2xl py-3 px-4 text-[#261C30] focus:ring-2 focus:ring-[#9368B7] focus:outline-none shadow-xs"
              autoFocus
            />

            {authError && (
              <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded-xl">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#9368B7] hover:bg-[#7E52A3] text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-[#9368B7]/30 transition-all text-sm"
            >
              Ingresar al Panel
            </button>
          </form>

          <div className="pt-2">
            <Link href="/" className="text-xs text-[#867894] hover:text-[#9368B7] flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la tienda pública</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered products for admin table
  const adminFilteredProducts = products.filter(p => {
    if (!adminSearch) return true;
    const q = adminSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || 
           p.code?.toLowerCase().includes(q) || 
           p.category_name?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-white border-b border-[#EADBEE] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9F2] p-1 border border-[#EADBEE] flex-shrink-0 shadow-xs flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Hoshi Market" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-[#261C30] whitespace-nowrap">
                  Panel de Administración
                </h1>
                <span className="text-[10px] bg-[#9368B7] text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                  Hoshi Market
                </span>
              </div>
              <p className="text-xs text-[#867894] truncate">
                Jr. Crespo Castillo 614, Huánuco
              </p>
            </div>
          </div>

          {/* Right actions: Page Views, Live Web, Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap flex-shrink-0">
            {/* Contador discreto de visualizaciones */}
            <div 
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBEE] text-[#544660] text-xs shadow-xs select-none"
              title="Total de visualizaciones del catálogo público"
            >
              <Eye className="w-3.5 h-3.5 text-[#9368B7]" />
              <span className="text-[#867894] font-medium hidden sm:inline">Visitas:</span>
              <span className="font-bold text-[#261C30]">
                {(viewsCount ?? settings.page_views ?? 0).toLocaleString()}
              </span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="text-xs font-bold text-[#9368B7] hover:bg-[#EFE6F7] px-3.5 py-2 rounded-xl border border-[#D8C3E5] flex items-center gap-1.5 transition-colors whitespace-nowrap flex-shrink-0 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap font-bold">Ver Web en vivo</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200 transition-colors whitespace-nowrap flex-shrink-0 shadow-xs"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto border-t border-[#F3EDF8] pt-2 pb-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'products'
                ? 'bg-[#9368B7] text-white shadow-sm'
                : 'text-[#544660] hover:bg-[#EFE6F7]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Productos ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'categories'
                ? 'bg-[#9368B7] text-white shadow-sm'
                : 'text-[#544660] hover:bg-[#EFE6F7]'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Categorías ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'promotions'
                ? 'bg-[#9368B7] text-white shadow-sm'
                : 'text-[#544660] hover:bg-[#EFE6F7]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Promociones ({promotions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'excel'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sincronizar Facturación (Excel)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-[#9368B7] text-white shadow-sm'
                : 'text-[#544660] hover:bg-[#EFE6F7]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración Tienda</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {syncMessage && (
          <div className={`mb-4 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs transition-all ${
            syncMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{syncMessage.text}</span>
            </div>
            <button 
              onClick={() => setSyncMessage(null)} 
              className="text-xs ml-2 hover:opacity-70 px-2.5 py-1 rounded-xl bg-white/70 border border-emerald-200 text-emerald-800"
            >
              Cerrar aviso
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: PRODUCTOS */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EADBEE]">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o categoría..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full bg-[#FAF8F5] pl-9 pr-3 py-2 rounded-xl text-xs border border-[#EADBEE] focus:outline-none focus:ring-2 focus:ring-[#9368B7]"
                />
                <Search className="w-3.5 h-3.5 text-[#9D91A8] absolute left-3 top-3" />
              </div>

              <button
                onClick={openNewProductModal}
                className="w-full sm:w-auto bg-[#9368B7] hover:bg-[#7E52A3] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#9368B7]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-[#EADBEE] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#261C30]">
                  <thead className="bg-[#FAF8F5] text-[#867894] font-bold border-b border-[#EADBEE]">
                    <tr>
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Precio (PEN)</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Promoción Activa</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EDF8]">
                    {adminFilteredProducts.map((p) => {
                      const promo = promotions.find(
                        pr => pr.is_active && (pr.id === p.promotion_id || (pr.type !== 'combo' && pr.product_ids?.includes(p.id)))
                      );
                      const stockLevel: 'available' | 'low' | 'out' = !p.in_stock || p.stock_quantity === 0
                        ? 'out'
                        : p.stock_quantity !== undefined && p.stock_quantity <= 5
                        ? 'low'
                        : 'available';
                      const isOut = stockLevel === 'out';

                      const cycleStockLevel = () => {
                        if (stockLevel === 'available') {
                          updateProduct(p.id, { in_stock: true, stock_quantity: 3 });
                        } else if (stockLevel === 'low') {
                          updateProduct(p.id, { in_stock: false, stock_quantity: 0 });
                        } else {
                          updateProduct(p.id, { in_stock: true, stock_quantity: 25 });
                        }
                      };

                      return (
                        <tr key={p.id} className={`transition-colors ${isOut ? 'bg-gray-50/80 text-gray-400' : 'hover:bg-[#FAF8F5]/60'}`}>
                          <td className="py-3 px-4 flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={p.image_url} 
                              alt={p.name} 
                              className={`w-10 h-10 object-contain rounded-lg border p-1 flex-shrink-0 ${
                                isOut ? 'border-gray-200 bg-gray-100 grayscale opacity-60' : 'border-[#EADBEE] bg-[#FAF8F5]'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={`font-bold truncate max-w-xs ${isOut ? 'text-gray-500' : 'text-[#261C30]'}`}>{p.name}</p>
                                {p.id.startsWith('combo-') && (
                                  <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full uppercase">
                                    Pack Combo
                                  </span>
                                )}
                                {p.tags?.includes('novedad') && (
                                  <span className="text-[9px] font-black bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded-full">
                                    🆕 Novedad
                                  </span>
                                )}
                                {p.is_featured && !p.tags?.includes('novedad') && !p.id.startsWith('combo-') && (
                                  <span className="text-[9px] font-black bg-[#EFE6F7] text-[#9368B7] border border-[#D8C3E5] px-1.5 py-0.5 rounded-full">
                                    ✨ Favorito
                                  </span>
                                )}
                              </div>
                              {p.korean_name && (
                                <p className={`text-[10px] ${isOut ? 'text-gray-400' : 'text-[#9368B7]'}`}>{p.korean_name}</p>
                              )}
                              <p className="text-[10px] text-[#867894]">SKU: {p.code || 'S/N'}</p>
                            </div>
                          </td>
                          <td className={`py-3 px-4 font-medium ${isOut ? 'text-gray-400' : 'text-[#544660]'}`}>
                            {p.category_name}
                          </td>
                          <td className={`py-3 px-4 font-bold ${isOut ? 'text-gray-400' : 'text-[#261C30]'}`}>
                            {settings.currency_symbol} {p.price.toFixed(2)}
                            {p.unit && <span className="text-[10px] text-[#867894] block">/{p.unit}</span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-full border border-[#EADBEE]">
                              <button
                                type="button"
                                onClick={cycleStockLevel}
                                title="Haz clic para cambiar entre Disponible, Pocas unidades y Agotado"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                  stockLevel === 'available'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : stockLevel === 'low'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    stockLevel === 'available'
                                      ? 'bg-emerald-500'
                                      : stockLevel === 'low'
                                      ? 'bg-amber-500 animate-pulse'
                                      : 'bg-rose-500'
                                  }`}
                                />
                                <span className="whitespace-nowrap">
                                  {stockLevel === 'available'
                                    ? 'Disponible'
                                    : stockLevel === 'low'
                                    ? 'Pocas unidades'
                                    : 'Agotado'}
                                </span>
                              </button>

                              {/* Quick 3-dot selector */}
                              <div className="flex items-center gap-1 pr-1.5 pl-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateProduct(p.id, { in_stock: true, stock_quantity: 25 })}
                                  title="Marcar como Disponible"
                                  className={`w-2.5 h-2.5 rounded-full bg-emerald-500 transition-transform ${
                                    stockLevel === 'available' ? 'ring-2 ring-emerald-300 scale-110' : 'opacity-35 hover:opacity-100'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => updateProduct(p.id, { in_stock: true, stock_quantity: 3 })}
                                  title="Marcar como Pocas unidades"
                                  className={`w-2.5 h-2.5 rounded-full bg-amber-500 transition-transform ${
                                    stockLevel === 'low' ? 'ring-2 ring-amber-300 scale-110' : 'opacity-35 hover:opacity-100'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => updateProduct(p.id, { in_stock: false, stock_quantity: 0 })}
                                  title="Marcar como Agotado"
                                  className={`w-2.5 h-2.5 rounded-full bg-rose-500 transition-transform ${
                                    stockLevel === 'out' ? 'ring-2 ring-rose-300 scale-110' : 'opacity-35 hover:opacity-100'
                                  }`}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {promo ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                promo.visual_style === 'liquidacion' || promo.season_tag === 'vencimiento'
                                  ? 'bg-amber-50 text-rose-700 border border-amber-200'
                                  : 'bg-purple-50 text-[#9368B7] border border-purple-200'
                              }`}>
                                <Sparkles className="w-3 h-3" />
                                {promo.badge_text}
                              </span>
                            ) : (
                              <span className="text-[#9D91A8] text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="p-1.5 rounded-lg text-[#9368B7] hover:bg-[#EFE6F7] transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirmModal({
                                  type: 'product',
                                  id: p.id,
                                  name: p.name,
                                  subtitle: 'Este producto se eliminará permanentemente del catálogo y de la base de datos.'
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CATEGORÍAS */}
        {/* ======================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#EADBEE]">
              <div>
                <h3 className="text-sm font-black text-[#261C30]">
                  Categorías de la Tienda
                </h3>
                <p className="text-xs text-[#867894]">
                  Crea y organiza secciones (Ramens, Helados, K-pop, Mangas, etc.).
                </p>
              </div>

              <button
                onClick={openNewCategoryModal}
                className="bg-[#9368B7] hover:bg-[#7E52A3] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Categoría</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const count = products.filter(p => p.category_id === cat.id).length;
                return (
                  <div 
                    key={cat.id} 
                    className="bg-white p-4 rounded-2xl border border-[#EADBEE] shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#EADBEE] flex items-center justify-center text-2xl">
                        {cat.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#261C30]">{cat.name}</h4>
                        <p className="text-xs text-[#867894]">{count} {count === 1 ? 'producto' : 'productos'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCatForm({ name: cat.name, icon: cat.icon, description: cat.description || '' });
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 text-[#9368B7] hover:bg-[#EFE6F7] rounded-lg"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirmModal({
                            type: 'category',
                            id: cat.id,
                            name: cat.name,
                            subtitle: 'Se eliminará esta categoría del catálogo. Los productos asociados se mantendrán en la tienda.'
                          })
                        }
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PROMOCIONES, OFERTAS & PACKS COMBO */}
        {/* ======================================================== */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EADBEE]">
              <div>
                <h3 className="text-sm font-black text-[#261C30]">
                  Promociones, Ofertas Individuales y Packs Combo
                </h3>
                <p className="text-xs text-[#867894]">
                  Crea multiplicadores (2x1, 3x2, lleva X), descuentos por producto (% OFF) o arma Packs Combo de varios productos (ej. próximos a vencer) con su propia foto.
                </p>
              </div>

              <button
                onClick={openNewPromoModal}
                className="bg-[#9368B7] hover:bg-[#7E52A3] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Promoción / Pack</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions.map((pr) => {
                const linkedProducts = products.filter(
                  p => !p.id.startsWith('combo-') && (pr.product_ids?.includes(p.id) || p.promotion_id === pr.id)
                );
                const isLiquidacion = pr.visual_style === 'liquidacion' || pr.season_tag === 'vencimiento';
                const buyN = pr.buy_qty ? Number(pr.buy_qty) : pr.type === '3x2' ? 3 : 2;
                const modalityLabel =
                  pr.type === 'combo'
                    ? `🎁 Pack / Combo (${settings.currency_symbol} ${Number(pr.combo_price || pr.discount_value || 0).toFixed(2)})`
                    : pr.type === 'discount_percent'
                    ? `🏷️ Descuento Directo (-${pr.discount_value}%)`
                    : `🔥 Multiplicador ${buyN}x${buyN - 1} (Compra ${buyN}, lleva 1 gratis)`;

                return (
                  <div key={pr.id} className="bg-white rounded-2xl border border-[#EADBEE] shadow-xs overflow-hidden flex flex-col justify-between">
                    {/* Top Ribbon Preview matching ProductCard */}
                    <div
                      className={`px-4 py-2 text-[11px] font-black text-white flex items-center justify-between ${
                        isLiquidacion
                          ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500'
                          : 'bg-gradient-to-r from-[#9368B7] via-[#FF6B8B] to-[#9368B7]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isLiquidacion ? (
                          <Clock className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
                        )}
                        <span className="truncate">{pr.badge_text}</span>
                      </span>
                      <button
                        onClick={() => updatePromotion(pr.id, { is_active: !pr.is_active })}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors flex-shrink-0 ${
                          pr.is_active
                            ? 'bg-emerald-400/95 text-emerald-950'
                            : 'bg-black/30 text-white/80'
                        }`}
                      >
                        {pr.is_active ? '● Activa' : '○ Inactiva'}
                      </button>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-3">
                          {pr.type === 'combo' && pr.combo_image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pr.combo_image_url}
                              alt={pr.name}
                              className="w-14 h-14 rounded-xl object-contain bg-[#FAF8F5] border border-[#EADBEE] p-1 flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-[#261C30] leading-snug">{pr.name}</h4>
                            {pr.description && (
                              <p className="text-xs text-[#6B5E78] mt-1 line-clamp-2">{pr.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-[#867894] space-y-1 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#F3EDF8]">
                          <p>
                            • Modalidad: <strong className="text-[#261C30]">{modalityLabel}</strong>
                          </p>
                          <p>
                            • Cinta Superior:{' '}
                            <strong className={isLiquidacion ? 'text-rose-600' : 'text-[#9368B7]'}>
                              {isLiquidacion ? 'Liquidación / Fecha Próxima' : 'Promoción / Oferta'}
                            </strong>
                          </p>
                          <p>
                            • Productos vinculados: <strong className="text-[#261C30]">{linkedProducts.length}</strong>
                          </p>
                          {linkedProducts.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {linkedProducts.slice(0, 4).map(lp => (
                                <span
                                  key={lp.id}
                                  className="text-[10px] bg-white border border-[#EADBEE] text-[#544660] px-2 py-0.5 rounded-lg truncate max-w-[180px]"
                                >
                                  {lp.name}
                                </span>
                              ))}
                              {linkedProducts.length > 4 && (
                                <span className="text-[10px] text-[#9368B7] font-bold px-1">
                                  +{linkedProducts.length - 4} más
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#F3EDF8] flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEditPromoModal(pr)}
                          className="text-xs text-[#9368B7] font-bold hover:underline flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirmModal({
                              type: 'promotion',
                              id: pr.id,
                              name: pr.name,
                              subtitle:
                                pr.type === 'combo'
                                  ? 'Se eliminará este Pack Combo y su tarjeta del catálogo.'
                                  : 'Esta promoción dejará de aplicarse a los productos vinculados.'
                            })
                          }
                          className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SINCRONIZACIÓN EXCEL FACTURACIÓN */}
        {/* ======================================================== */}
        {activeTab === 'excel' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADBEE] shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#261C30]">
                Sincronización con Facturación de la Tienda
              </h3>
              <p className="text-xs text-[#6B5E78] max-w-lg mx-auto leading-relaxed">
                No necesitas pedir cambios a la agencia que hizo tu sistema de facturación. Solo <strong>exporta tu inventario a Excel o CSV</strong> desde tu punto de venta físico y súbelo aquí.
              </p>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-emerald-300 rounded-3xl p-8 text-center bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-950">
                Haz clic o arrastra tu archivo Excel / CSV aquí
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Acepta formatos .xlsx, .xls y .csv de cualquier sistema de facturación en Perú
              </p>
            </div>

            {excelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{excelError}</span>
              </div>
            )}

            {excelStats && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold text-sm">¡Sincronización exitosa!</p>
                <p>• {excelStats.updated} productos existentes actualizados (precios y stock).</p>
                <p>• {excelStats.created} nuevos productos agregados al catálogo.</p>
              </div>
            )}

            {/* Preview Table */}
            {excelPreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#261C30]">
                    Vista Previa: {excelPreview.length} filas detectadas
                  </h4>
                  <button
                    onClick={handleConfirmExcelSync}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md"
                  >
                    Confirmar e Importar Ahora
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-[#EADBEE] rounded-xl text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAF8F5] sticky top-0 text-[#867894] font-bold">
                      <tr>
                        <th className="p-2">Código</th>
                        <th className="p-2">Producto</th>
                        <th className="p-2">Precio</th>
                        <th className="p-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3EDF8]">
                      {excelPreview.slice(0, 15).map((row, i) => (
                        <tr key={i}>
                          <td className="p-2 font-mono text-[10px]">{row.code || '-'}</td>
                          <td className="p-2 font-medium">{row.name}</td>
                          <td className="p-2 font-bold">{settings.currency_symbol} {row.price}</td>
                          <td className="p-2">{row.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: CONFIGURACIÓN TIENDA */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADBEE] shadow-sm max-w-2xl mx-auto space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-[#261C30]">
                  Datos Generales de Hoshi Market
                </h3>
                <p className="text-[11px] text-[#867894] mt-0.5">
                  Personaliza la información de contacto y los textos principales de la tienda.
                </p>
              </div>

              {settingsSavedSuccess && !hasSettingsEdited && (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Cambios guardados!</span>
                </div>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#261C30] block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={settingsForm.store_name || ''}
                  onChange={(e) => handleSettingsChange({ store_name: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7]"
                />
              </div>

              <div>
                <label className="font-bold text-[#261C30] block mb-1">Dirección del Local Físico</label>
                <input
                  type="text"
                  value={settingsForm.address || ''}
                  onChange={(e) => handleSettingsChange({ address: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Número de WhatsApp (con código país)</label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp_number || ''}
                    onChange={(e) => handleSettingsChange({ whatsapp_number: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7]"
                    placeholder="51969399589"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Texto Visible del WhatsApp</label>
                  <input
                    type="text"
                    value={settingsForm.phone_display || ''}
                    onChange={(e) => handleSettingsChange({ phone_display: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7]"
                    placeholder="+51 969 399 589"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#261C30] block mb-1">Aviso Superior (Barra de Notificaciones)</label>
                <textarea
                  rows={2}
                  value={settingsForm.announcement_banner || ''}
                  onChange={(e) => handleSettingsChange({ announcement_banner: e.target.value })}
                  placeholder="¡Bienvenidos a Hoshi Market! Envíos en Huánuco..."
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] resize-none"
                />
                <span className="text-[10px] text-[#867894] mt-0.5 block">
                  Aparece en la cinta morada superior de la tienda junto al icono de estrella giratoria.
                </span>
              </div>

              <div>
                <label className="font-bold text-[#261C30] block mb-1">Título Principal del Banner</label>
                <input
                  type="text"
                  value={settingsForm.hero_title || ''}
                  onChange={(e) => handleSettingsChange({ hero_title: e.target.value })}
                  placeholder="Sabores, Ramens y K-Culture directamente a tu mesa"
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7]"
                />
              </div>

              <div>
                <label className="font-bold text-[#261C30] block mb-1">Subtítulo / Descripción del Banner</label>
                <textarea
                  rows={3}
                  value={settingsForm.hero_subtitle || ''}
                  onChange={(e) => handleSettingsChange({ hero_subtitle: e.target.value })}
                  placeholder="Revisa nuestro catálogo de más de 500 productos coreanos originales..."
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] resize-none"
                />
              </div>

              {hasSettingsEdited && (
                <div className="pt-4 border-t border-[#F3EDF8] flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#9368B7]">
                    Tienes cambios sin guardar
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsForm(settings);
                        setIsSettingsDirty(false);
                      }}
                      disabled={isSavingSettings}
                      className="px-4 py-2.5 rounded-xl border border-[#EADBEE] text-[#6B5E78] hover:bg-[#FAF8F5] font-bold text-xs transition-colors"
                    >
                      Descartar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="bg-[#9368B7] hover:bg-[#7E52A3] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: PRODUCTO (NUEVO O EDITAR) */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#261C30]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#EADBEE] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header Sticky */}
            <div className="px-5 sm:px-6 py-4 border-b border-[#F3EDF8] flex items-center justify-between bg-white flex-shrink-0">
              <div>
                <h3 className="font-black text-base sm:text-lg text-[#261C30]">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <p className="text-xs text-[#867894] mt-0.5">
                  {editingProduct ? 'Modifica los datos y guárdalos en el catálogo' : 'Agrega un nuevo ítem a la tienda'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-xl hover:bg-[#FAF8F5] text-[#9D91A8] hover:text-[#261C30] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1">Nombre en Español *</label>
                    <input
                      type="text"
                      required
                      value={prodForm.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProdForm({ 
                          ...prodForm, 
                          name: val,
                          korean_name: translateToKorean(val)
                        });
                      }}
                      className="w-full bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] text-sm focus:ring-2 focus:ring-[#9368B7] outline-hidden"
                      placeholder="Ej. Samyang Buldak Carbonara"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-xs sm:text-sm text-[#261C30] block">Nombre en Coreano</label>
                      <span className="text-[10px] text-[#9368B7] font-semibold bg-[#EFE6F7] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Auto
                      </span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={prodForm.korean_name}
                      className="w-full bg-[#FAF8F5]/80 p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] text-[#9368B7] font-bold text-sm cursor-not-allowed select-all outline-hidden"
                      placeholder="Traducción automática..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1">Código / SKU</label>
                    <input
                      type="text"
                      value={prodForm.code}
                      onChange={(e) => setProdForm({ ...prodForm, code: e.target.value })}
                      className="w-full bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] text-sm outline-hidden"
                      placeholder="RAM-001"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1">Categoría *</label>
                    <select
                      value={prodForm.category_id}
                      onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                      className="w-full bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] text-sm outline-hidden"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1">Unidad</label>
                    <input
                      type="text"
                      value={prodForm.unit}
                      onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                      className="w-full bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] text-sm outline-hidden"
                      placeholder="paquete 130g"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1">Precio Unitario (S/.) *</label>
                    <input
                      type="number"
                      step="0.10"
                      required
                      value={prodForm.price}
                      onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] font-bold text-sm outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1">Precio Regular (Tachado)</label>
                    <input
                      type="number"
                      step="0.10"
                      value={prodForm.original_price}
                      onChange={(e) => setProdForm({ ...prodForm, original_price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] text-sm outline-hidden"
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                {/* Selector de 3 Niveles de Stock */}
                <div>
                  <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1.5">Estado de Stock</label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {(() => {
                      const currentModalStock: 'available' | 'low' | 'out' =
                        !prodForm.in_stock || prodForm.stock_quantity === 0
                          ? 'out'
                          : prodForm.stock_quantity <= 5
                          ? 'low'
                          : 'available';

                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => setProdForm({ ...prodForm, in_stock: true, stock_quantity: 25 })}
                            className={`p-2.5 sm:p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                              currentModalStock === 'available'
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200 shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EADBEE] text-[#6B5E78] hover:bg-white'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span>Disponible</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setProdForm({ ...prodForm, in_stock: true, stock_quantity: 3 })}
                            className={`p-2.5 sm:p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                              currentModalStock === 'low'
                                ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-200 shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EADBEE] text-[#6B5E78] hover:bg-white'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                            <span>Pocas unid.</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setProdForm({ ...prodForm, in_stock: false, stock_quantity: 0 })}
                            className={`p-2.5 sm:p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                              currentModalStock === 'out'
                                ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200 shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EADBEE] text-[#6B5E78] hover:bg-white'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                            <span>Agotado</span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Selector de Destacado / Cinta Superior en la Tarjeta */}
                <div>
                  <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1.5">
                    Destacado / Cinta Superior del Producto
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {(() => {
                      const isNew = prodForm.tags.includes('novedad');
                      const isFav = prodForm.is_featured && !isNew;
                      const isNormal = !isNew && !isFav;

                      return (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setProdForm({
                                ...prodForm,
                                is_featured: false,
                                tags: prodForm.tags.filter(t => t !== 'novedad')
                              })
                            }
                            className={`p-2.5 sm:p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                              isNormal
                                ? 'bg-white border-[#9368B7] text-[#261C30] ring-2 ring-[#9368B7]/20 shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EADBEE] text-[#6B5E78] hover:bg-white'
                            }`}
                          >
                            <span>🏷️</span>
                            <span>Normal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setProdForm({
                                ...prodForm,
                                is_featured: true,
                                tags: prodForm.tags.filter(t => t !== 'novedad')
                              })
                            }
                            className={`p-2.5 sm:p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                              isFav
                                ? 'bg-[#EFE6F7] border-[#9368B7] text-[#9368B7] ring-2 ring-[#9368B7]/30 shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EADBEE] text-[#6B5E78] hover:bg-white'
                            }`}
                          >
                            <span>✨</span>
                            <span>Favorito</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setProdForm({
                                ...prodForm,
                                is_featured: false,
                                tags: Array.from(new Set([...prodForm.tags, 'novedad']))
                              })
                            }
                            className={`p-2.5 sm:p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                              isNew
                                ? 'bg-sky-50 border-sky-400 text-sky-800 ring-2 ring-sky-200 shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EADBEE] text-[#6B5E78] hover:bg-white'
                            }`}
                          >
                            <span>🆕</span>
                            <span>¡Novedad!</span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Subir Foto: Cámara, Galería o URL */}
                <div className="space-y-3 p-3.5 sm:p-4 bg-[#FAF8F5] rounded-2xl border border-[#EADBEE]">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs sm:text-sm text-[#261C30] block">
                      Foto del Producto *
                    </label>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode(imageUploadMode === 'upload' ? 'url' : 'upload')}
                      className="text-xs text-[#9368B7] hover:underline font-bold"
                    >
                      {imageUploadMode === 'upload' ? '🔗 Usar enlace URL' : '📁 Subir foto o cámara'}
                    </button>
                  </div>

                  {/* Hidden input for Camera capture (Mobile) */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])}
                  />

                  {/* Hidden input for Gallery / Files (Mobile & PC) */}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])}
                  />

                  {imageUploadMode === 'upload' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 p-2.5 sm:p-3 bg-white hover:bg-[#EFE6F7] text-[#9368B7] font-bold rounded-xl border border-[#D8C3E5] shadow-xs text-xs sm:text-sm transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Tomar Foto (Cámara)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 p-2.5 sm:p-3 bg-white hover:bg-[#EFE6F7] text-[#9368B7] font-bold rounded-xl border border-[#D8C3E5] shadow-xs text-xs sm:text-sm transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>Galería o Archivos</span>
                        </button>
                      </div>

                      {isProcessingImage && (
                        <p className="text-center text-xs text-[#9368B7] font-bold flex items-center justify-center gap-1.5 py-1">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Optimizando y preparando foto...
                        </p>
                      )}

                      {/* Image Preview thumbnail if available */}
                      {prodForm.image_url && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#EADBEE]">
                          <div className="w-14 h-14 bg-[#FAF8F5] rounded-lg p-1 border border-[#F3EDF8] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={prodForm.image_url}
                              alt="Previsualización"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-bold text-emerald-700 flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              Foto lista para el catálogo
                            </p>
                            <p className="text-[#867894] truncate text-[11px] sm:text-xs">
                              Optimizado para carga rápida en móviles
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProdForm({ ...prodForm, image_url: '' })}
                            className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors"
                            title="Quitar foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Manual URL fallback */
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        value={prodForm.image_url}
                        onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                        className="w-full bg-white p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] text-sm outline-hidden"
                        placeholder="https://ejemplo.com/foto-ramen.jpg"
                      />
                      <p className="text-xs text-[#867894]">
                        Pega el enlace directo a una imagen alojada en la web.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1">Promoción Asignada</label>
                  <select
                    value={prodForm.promotion_id}
                    onChange={(e) => setProdForm({ ...prodForm, promotion_id: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] text-sm outline-hidden"
                  >
                    <option value="">(Ninguna)</option>
                    {promotions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.badge_text} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-xs sm:text-sm text-[#261C30] block mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EADBEE] text-sm resize-none outline-hidden"
                  />
                </div>
              </div>

              {/* Footer Sticky */}
              <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-[#F3EDF8] flex items-center justify-end gap-3 bg-[#FAF8F5]/80 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 sm:px-5 py-2.5 rounded-xl border border-[#EADBEE] bg-white text-[#6B5E78] font-bold hover:bg-[#FAF8F5] text-xs sm:text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9368B7] hover:bg-[#7E52A3] text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold shadow-md shadow-[#9368B7]/20 flex items-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Producto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CATEGORÍA (NUEVA O EDITAR) */}
      {/* ======================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#261C30]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#EADBEE] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F3EDF8] pb-3">
              <h3 className="font-black text-base text-[#261C30]">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>
                <X className="w-5 h-5 text-[#9D91A8]" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#261C30] block mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                  placeholder="Ej. Congelados Coreanos"
                />
              </div>

              {/* Selector de Icono / Emoji enriquecido */}
              <div className="space-y-2 p-3 bg-[#FAF8F5] rounded-2xl border border-[#EADBEE]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#261C30] block">
                    Icono / Emoji de la Categoría *
                  </label>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-[#D8C3E5] shadow-xs">
                    <span className="text-[10px] text-[#867894] font-medium">Elegido:</span>
                    <span className="text-lg leading-none">{catForm.icon || '✨'}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {CATEGORY_EMOJI_GROUPS.map((grp) => (
                    <div key={grp.group} className="space-y-1">
                      <span className="text-[10px] font-bold text-[#6B5E78] block">
                        {grp.group}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {grp.emojis.map((emoji) => {
                          const isSelected = catForm.icon === emoji;
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setCatForm({ ...catForm, icon: emoji })}
                              className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-[#9368B7] text-white ring-2 ring-[#9368B7] ring-offset-1 scale-110 shadow-xs'
                                  : 'bg-white hover:bg-[#EFE6F7] border border-[#EADBEE]'
                              }`}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] text-[#867894]">O escribe uno personalizado:</span>
                  <input
                    type="text"
                    value={catForm.icon}
                    onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                    className="w-14 bg-white p-1 rounded-lg border border-[#EADBEE] text-center text-sm"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#261C30] block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EADBEE] text-[#6B5E78]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9368B7] text-white px-5 py-2 rounded-xl font-bold shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PROMOCIÓN / OFERTA / PACK COMBO (NUEVA O EDITAR) */}
      {/* ======================================================== */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#261C30]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 border border-[#EADBEE] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F3EDF8] pb-3 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-black text-base text-[#261C30]">
                  {editingPromo ? 'Editar Promoción o Pack' : 'Crear Promoción, Oferta o Pack Combo'}
                </h3>
                <p className="text-[11px] text-[#867894]">
                  Elige la modalidad, el color de la cinta superior y los productos participantes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#9D91A8] hover:text-[#261C30]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              {/* PASO 1: MODALIDAD DE PROMOCIÓN */}
              <div className="space-y-2">
                <label className="font-black text-[#261C30] block text-xs">
                  1. ¿Qué tipo de promoción deseas armar? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const buyN = promoForm.buy_qty || 2;
                      setPromoForm(prev => ({
                        ...prev,
                        modality: 'multiplier',
                        badge_text:
                          prev.visual_style === 'liquidacion'
                            ? `⏳ LIQUIDACIÓN ${buyN}x${buyN - 1}`
                            : `🔥 PROMO ${buyN}x${buyN - 1}`
                      }));
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      promoForm.modality === 'multiplier'
                        ? 'bg-[#EFE6F7] border-[#9368B7] ring-2 ring-[#9368B7]/30 shadow-xs'
                        : 'bg-[#FAF8F5] border-[#EADBEE] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#261C30] flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-500" />
                        <span>2x1 / 3x2 / Lleva X</span>
                      </span>
                      {promoForm.modality === 'multiplier' && (
                        <Check className="w-4 h-4 text-[#9368B7]" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B5E78] leading-snug">
                      Mismo producto: por la compra de X unidades, lleva 1 gratis.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const pct = promoForm.discount_value || 20;
                      setPromoForm(prev => ({
                        ...prev,
                        modality: 'discount_percent',
                        badge_text:
                          prev.visual_style === 'liquidacion'
                            ? `⏳ LIQUIDACIÓN -${pct}%`
                            : `🔥 OFERTA -${pct}%`
                      }));
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      promoForm.modality === 'discount_percent'
                        ? 'bg-[#EFE6F7] border-[#9368B7] ring-2 ring-[#9368B7]/30 shadow-xs'
                        : 'bg-[#FAF8F5] border-[#EADBEE] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#261C30] flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-[#9368B7]" />
                        <span>Oferta Individual (% OFF)</span>
                      </span>
                      {promoForm.modality === 'discount_percent' && (
                        <Check className="w-4 h-4 text-[#9368B7]" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B5E78] leading-snug">
                      Rebaja un porcentaje directo al producto con precio anterior tachado.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPromoForm(prev => ({
                        ...prev,
                        modality: 'combo',
                        badge_text:
                          prev.visual_style === 'liquidacion'
                            ? '⏳ PACK LIQUIDACIÓN'
                            : '🎁 PACK COMBO'
                      }));
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      promoForm.modality === 'combo'
                        ? 'bg-[#EFE6F7] border-[#9368B7] ring-2 ring-[#9368B7]/30 shadow-xs'
                        : 'bg-[#FAF8F5] border-[#EADBEE] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#261C30] flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-amber-600" />
                        <span>Pack / Combo</span>
                      </span>
                      {promoForm.modality === 'combo' && (
                        <Check className="w-4 h-4 text-[#9368B7]" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B5E78] leading-snug">
                      Une 2, 3 o más productos distintos en un Pack con foto y precio especial.
                    </span>
                  </button>
                </div>
              </div>

              {/* PASO 2: ESTILO DE LA CINTA SUPERIOR (CONSERVANDO LOS COLORES DE PROMO Y LIQUIDACIÓN) */}
              <div className="space-y-2">
                <label className="font-black text-[#261C30] block text-xs">
                  2. Color de la Cinta Superior en la Tarjeta *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextBadge =
                        promoForm.modality === 'combo'
                          ? '🎁 PACK COMBO'
                          : promoForm.modality === 'discount_percent'
                          ? `🔥 OFERTA -${promoForm.discount_value || 20}%`
                          : `🔥 PROMO ${promoForm.buy_qty}x${promoForm.buy_qty - 1}`;
                      setPromoForm(prev => ({
                        ...prev,
                        visual_style: 'promo',
                        badge_text: prev.badge_text.startsWith('⏳') ? nextBadge : prev.badge_text
                      }));
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all space-y-1.5 ${
                      promoForm.visual_style === 'promo'
                        ? 'border-[#9368B7] ring-2 ring-[#9368B7]/30 bg-[#FAF4FC]'
                        : 'border-[#EADBEE] bg-[#FAF8F5] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="rounded-xl px-3 py-1.5 text-[11px] font-black text-white bg-gradient-to-r from-[#9368B7] via-[#FF6B8B] to-[#9368B7] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{promoForm.badge_text || '🔥 PROMO'}</span>
                      </span>
                      <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">OFERTA</span>
                    </div>
                    <p className="text-[10px] text-[#544660] font-semibold px-1">
                      💜💗 Estilo Promoción / Oferta (Morado y Rosa)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextBadge =
                        promoForm.modality === 'combo'
                          ? '⏳ PACK LIQUIDACIÓN'
                          : promoForm.modality === 'discount_percent'
                          ? `⏳ LIQUIDACIÓN -${promoForm.discount_value || 20}%`
                          : `⏳ LIQUIDACIÓN ${promoForm.buy_qty}x${promoForm.buy_qty - 1}`;
                      setPromoForm(prev => ({
                        ...prev,
                        visual_style: 'liquidacion',
                        badge_text:
                          prev.badge_text.startsWith('🔥') || prev.badge_text.startsWith('🎁')
                            ? nextBadge
                            : prev.badge_text
                      }));
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all space-y-1.5 ${
                      promoForm.visual_style === 'liquidacion'
                        ? 'border-amber-500 ring-2 ring-amber-400/30 bg-amber-50/40'
                        : 'border-[#EADBEE] bg-[#FAF8F5] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="rounded-xl px-3 py-1.5 text-[11px] font-black text-white bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-200" />
                        <span>{promoForm.badge_text || '⏳ LIQUIDACIÓN'}</span>
                      </span>
                      <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">LIQUIDACIÓN</span>
                    </div>
                    <p className="text-[10px] text-[#544660] font-semibold px-1">
                      🟠🔴 Estilo Liquidación / Fecha Próxima (Ámbar y Rojo)
                    </p>
                  </button>
                </div>
              </div>

              {/* PASO 3: REGLA DINÁMICA SEGÚN LA MODALIDAD */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EADBEE] space-y-3">
                {promoForm.modality === 'multiplier' && (
                  <div className="space-y-2.5">
                    <label className="font-black text-[#261C30] block">
                      3. Regla de Cantidad (Mismo Producto) *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { qty: 2, label: '2x1 (Compra 2, paga 1)' },
                        { qty: 3, label: '3x2 (Compra 3, paga 2)' },
                        { qty: 4, label: '4x3 (Compra 4, paga 3)' }
                      ].map(opt => (
                        <button
                          key={opt.qty}
                          type="button"
                          onClick={() =>
                            setPromoForm(prev => ({
                              ...prev,
                              buy_qty: opt.qty,
                              badge_text:
                                prev.visual_style === 'liquidacion'
                                  ? `⏳ LIQUIDACIÓN ${opt.qty}x${opt.qty - 1}`
                                  : `🔥 PROMO ${opt.qty}x${opt.qty - 1}`
                            }))
                          }
                          className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all ${
                            promoForm.buy_qty === opt.qty
                              ? 'bg-[#9368B7] text-white border-[#9368B7] shadow-xs'
                              : 'bg-white text-[#544660] border-[#EADBEE] hover:bg-[#EFE6F7]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 bg-white p-2.5 rounded-xl border border-[#EADBEE]">
                      <span className="text-[#544660] font-semibold">
                        O personalizado: Por la compra de
                      </span>
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={promoForm.buy_qty}
                        onChange={(e) => {
                          const val = Math.max(2, parseInt(e.target.value, 10) || 2);
                          setPromoForm(prev => ({
                            ...prev,
                            buy_qty: val,
                            badge_text:
                              prev.visual_style === 'liquidacion'
                                ? `⏳ LIQUIDACIÓN ${val}x${val - 1}`
                                : `🔥 PROMO ${val}x${val - 1}`
                          }));
                        }}
                        className="w-16 text-center font-black text-sm bg-[#FAF8F5] border border-[#D8C3E5] rounded-lg py-1 text-[#9368B7]"
                      />
                      <span className="text-[#544660] font-semibold">
                        unidades, lleva <strong>1 GRATIS</strong> (paga {Math.max(1, promoForm.buy_qty - 1)}).
                      </span>
                    </div>
                  </div>
                )}

                {promoForm.modality === 'discount_percent' && (
                  <div className="space-y-2.5">
                    <label className="font-black text-[#261C30] block">
                      3. Porcentaje de Descuento Directo (% OFF) *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[10, 15, 20, 25, 30, 40, 50].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() =>
                            setPromoForm(prev => ({
                              ...prev,
                              discount_value: pct,
                              badge_text:
                                prev.visual_style === 'liquidacion'
                                  ? `⏳ LIQUIDACIÓN -${pct}%`
                                  : `🔥 OFERTA -${pct}%`
                            }))
                          }
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                            promoForm.discount_value === pct
                              ? 'bg-[#9368B7] text-white border-[#9368B7]'
                              : 'bg-white text-[#544660] border-[#EADBEE] hover:bg-[#EFE6F7]'
                          }`}
                        >
                          -{pct}% OFF
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[#544660] font-semibold">Otro porcentaje:</span>
                      <input
                        type="number"
                        min={1}
                        max={95}
                        value={promoForm.discount_value}
                        onChange={(e) => {
                          const val = Math.min(95, Math.max(1, parseFloat(e.target.value) || 0));
                          setPromoForm(prev => ({
                            ...prev,
                            discount_value: val,
                            badge_text:
                              prev.visual_style === 'liquidacion'
                                ? `⏳ LIQUIDACIÓN -${val}%`
                                : `🔥 OFERTA -${val}%`
                          }));
                        }}
                        className="w-24 bg-white p-2 rounded-xl border border-[#EADBEE] font-black text-center text-[#9368B7]"
                      />
                      <span className="text-[#867894]">% de descuento sobre el precio normal</span>
                    </div>
                  </div>
                )}

                {promoForm.modality === 'combo' && (
                  <div className="space-y-3">
                    <label className="font-black text-[#261C30] block">
                      3. Configuración del Pack / Combo (Precio y Foto del Pack) *
                    </label>

                    {/* Resumen de precios del Pack Combo */}
                    {(() => {
                      const selectedProds = products.filter(
                        p => !p.id.startsWith('combo-') && promoForm.product_ids.includes(p.id)
                      );
                      const normalTotal = selectedProds.reduce((sum, p) => sum + p.price, 0);
                      const savings = Math.max(0, normalTotal - (Number(promoForm.combo_price) || 0));

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-2xl border border-[#EADBEE]">
                          <div>
                            <span className="text-[10px] font-bold text-[#867894] uppercase block">
                              Suma Normal ({selectedProds.length} prod. seleccionados)
                            </span>
                            <span className="text-lg font-black text-[#6B5E78] line-through">
                              {settings.currency_symbol} {normalTotal.toFixed(2)}
                            </span>
                            {savings > 0 && (
                              <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">
                                ✨ El cliente ahorra {settings.currency_symbol} {savings.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div>
                            <label className="font-bold text-[#261C30] block mb-1">
                              Precio Especial del Pack Combo (S/.) *
                            </label>
                            <input
                              type="number"
                              step="0.10"
                              required
                              value={promoForm.combo_price}
                              onChange={(e) =>
                                setPromoForm(prev => ({
                                  ...prev,
                                  combo_price: parseFloat(e.target.value) || 0
                                }))
                              }
                              className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#9368B7] font-black text-sm text-[#261C30]"
                              placeholder="Ej. 19.90"
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Subir Foto del Pack Combo (Cámara o Galería) */}
                    <div className="space-y-2 bg-white p-3 rounded-2xl border border-[#EADBEE]">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#261C30] block">
                          📸 Foto del Pack / Combo (ej. los 3 productos juntos)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setComboImageUploadMode(comboImageUploadMode === 'upload' ? 'url' : 'upload')
                          }
                          className="text-[11px] text-[#9368B7] hover:underline font-bold"
                        >
                          {comboImageUploadMode === 'upload'
                            ? '🔗 Usar enlace URL'
                            : '📁 Subir foto o usar cámara'}
                        </button>
                      </div>

                      <input
                        ref={comboCameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] && processComboImageFile(e.target.files[0])
                        }
                      />
                      <input
                        ref={comboGalleryInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] && processComboImageFile(e.target.files[0])
                        }
                      />

                      {comboImageUploadMode === 'upload' ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => comboCameraInputRef.current?.click()}
                              className="flex items-center justify-center gap-1.5 p-2.5 bg-[#FAF8F5] hover:bg-[#EFE6F7] text-[#9368B7] font-bold rounded-xl border border-[#D8C3E5] transition-colors"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Tomar Foto (Cámara)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => comboGalleryInputRef.current?.click()}
                              className="flex items-center justify-center gap-1.5 p-2.5 bg-[#FAF8F5] hover:bg-[#EFE6F7] text-[#9368B7] font-bold rounded-xl border border-[#D8C3E5] transition-colors"
                            >
                              <ImageIcon className="w-4 h-4" />
                              <span>Galería o Archivos</span>
                            </button>
                          </div>

                          {isProcessingComboImage && (
                            <p className="text-center text-xs text-[#9368B7] font-bold flex items-center justify-center gap-1.5 py-1">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Optimizando foto del Pack Combo...
                            </p>
                          )}

                          {promoForm.combo_image_url && (
                            <div className="flex items-center gap-3 p-2 bg-[#FAF8F5] rounded-xl border border-[#EADBEE]">
                              <div className="w-14 h-14 bg-white rounded-lg p-1 border border-[#F3EDF8] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={promoForm.combo_image_url}
                                  alt="Foto del Pack Combo"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0 text-[11px]">
                                <p className="font-bold text-emerald-700 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  Foto del Pack lista para el catálogo
                                </p>
                                <p className="text-[#867894] truncate">
                                  Se mostrará como producto comprable en la tienda
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPromoForm(prev => ({ ...prev, combo_image_url: '' }))}
                                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"
                                title="Quitar foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="url"
                          value={promoForm.combo_image_url}
                          onChange={(e) =>
                            setPromoForm(prev => ({ ...prev, combo_image_url: e.target.value }))
                          }
                          className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                          placeholder="https://ejemplo.com/foto-combo.jpg"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PASO 4: NOMBRE, TEXTO DEL BADGE Y DESCRIPCIÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">
                    {promoForm.modality === 'combo'
                      ? 'Nombre del Pack / Combo *'
                      : 'Nombre de la Promoción *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={promoForm.name}
                    onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE]"
                    placeholder={
                      promoForm.modality === 'combo'
                        ? 'Ej. Pack K-Snack x3 Liquidación'
                        : 'Ej. Festival 2x1 Ramen Buldak'
                    }
                  />
                </div>

                <div>
                  <label className="font-bold text-[#261C30] block mb-1">
                    Texto corto en la Cinta Superior *
                  </label>
                  <input
                    type="text"
                    required
                    value={promoForm.badge_text}
                    onChange={(e) => setPromoForm({ ...promoForm, badge_text: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE] font-bold"
                    placeholder="Ej. 🔥 PROMO 2x1 o ⏳ LIQUIDACIÓN"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#261C30] block mb-1">
                  Descripción / Detalle para el cliente
                </label>
                <textarea
                  rows={2}
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EADBEE] resize-none"
                  placeholder={
                    promoForm.modality === 'combo'
                      ? 'Ej. Llévate estos 3 productos coreanos a un súper precio especial por fecha próxima...'
                      : 'Ej. Aplica agregando las unidades al carrito de compras...'
                  }
                />
              </div>

              {/* PASO 5: SELECCIONAR PRODUCTOS DEL CATÁLOGO */}
              <div className="space-y-2 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EADBEE]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="font-black text-[#261C30] block">
                      {promoForm.modality === 'combo'
                        ? '4. Selecciona los productos que integran este Pack Combo'
                        : '4. Selecciona los productos donde aplica esta promoción'}
                    </label>
                    <p className="text-[10px] text-[#867894]">
                      {promoForm.product_ids.length === 0
                        ? 'Ningún producto seleccionado aún.'
                        : `${promoForm.product_ids.length} ${
                            promoForm.product_ids.length === 1
                              ? 'producto seleccionado'
                              : 'productos seleccionados'
                          }`}
                    </p>
                  </div>

                  {promoForm.product_ids.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPromoForm(prev => ({ ...prev, product_ids: [] }))}
                      className="text-[10px] text-rose-500 font-bold hover:underline"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>

                {/* Buscador de productos dentro del modal */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre o SKU..."
                    value={promoProductSearch}
                    onChange={(e) => setPromoProductSearch(e.target.value)}
                    className="w-full bg-white pl-8 pr-3 py-2 rounded-xl border border-[#EADBEE] text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-[#9D91A8] absolute left-2.5 top-2.5" />
                </div>

                {/* Lista de productos seleccionables */}
                <div className="max-h-48 overflow-y-auto divide-y divide-[#F3EDF8] bg-white rounded-xl border border-[#EADBEE]">
                  {products
                    .filter(p => !p.id.startsWith('combo-'))
                    .filter(p => {
                      if (!promoProductSearch.trim()) return true;
                      const q = promoProductSearch.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.code && p.code.toLowerCase().includes(q)) ||
                        (p.category_name && p.category_name.toLowerCase().includes(q))
                      );
                    })
                    .map(prod => {
                      const isChecked = promoForm.product_ids.includes(prod.id);
                      return (
                        <label
                          key={prod.id}
                          className={`flex items-center justify-between gap-3 p-2.5 cursor-pointer transition-colors ${
                            isChecked ? 'bg-[#EFE6F7]/60' : 'hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setPromoForm(prev => {
                                  const nextIds = isChecked
                                    ? prev.product_ids.filter(id => id !== prod.id)
                                    : [...prev.product_ids, prod.id];
                                  return { ...prev, product_ids: nextIds };
                                });
                              }}
                              className="w-4 h-4 accent-[#9368B7] rounded cursor-pointer flex-shrink-0"
                            />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-8 h-8 rounded-lg object-contain bg-[#FAF8F5] border border-[#EADBEE] p-0.5 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[#261C30] truncate">
                                {prod.name}
                              </p>
                              <p className="text-[10px] text-[#867894]">
                                {prod.category_name} • {settings.currency_symbol} {prod.price.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {isChecked && (
                            <span className="text-[10px] font-bold text-[#9368B7] bg-white px-2 py-0.5 rounded-full border border-[#D8C3E5] flex-shrink-0">
                              Incluido
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 sticky bottom-0 bg-white py-2 border-t border-[#F3EDF8]">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EADBEE] text-[#6B5E78] font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9368B7] hover:bg-[#7E52A3] text-white px-6 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPromo ? 'Guardar Cambios' : 'Crear Promoción'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN */}
      {/* ======================================================== */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#261C30]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#EADBEE] shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-base text-[#261C30]">
                ¿Eliminar {deleteConfirmModal.type === 'product' ? 'producto' : deleteConfirmModal.type === 'category' ? 'categoría' : 'promoción'}?
              </h3>
              <p className="text-xs font-bold text-[#9368B7] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EADBEE] inline-block max-w-full truncate">
                &ldquo;{deleteConfirmModal.name}&rdquo;
              </p>
              <p className="text-xs text-[#6B5E78] leading-relaxed pt-1">
                {deleteConfirmModal.subtitle}
              </p>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmModal(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-[#EADBEE] bg-[#FAF8F5] hover:bg-[#F3EDF8] text-[#544660] font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
