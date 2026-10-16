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
  Database
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
    type: '2x1' as PromoType,
    discount_value: 0,
    season_tag: 'general' as SeasonCampaign,
    badge_text: '🔥 2x1',
    product_ids: [] as string[],
    is_active: true
  });

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

  // Camera & Gallery Image Upload state
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const processImageFile = (file: File) => {
    setIsProcessingImage(true);
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
        setProdForm(prev => ({ ...prev, image_url: optimizedDataUrl }));
        setIsProcessingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
        promotion_id: prodForm.promotion_id || undefined
      });
    } else {
      await addProduct({
        ...prodForm,
        category_name,
        price: Number(prodForm.price),
        original_price: Number(prodForm.original_price) || undefined,
        stock_quantity: Number(prodForm.stock_quantity),
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
    setPromoForm({
      name: '',
      description: '',
      type: '2x1',
      discount_value: 0,
      season_tag: 'general',
      badge_text: '🔥 2x1',
      product_ids: [],
      is_active: true
    });
    setIsPromoModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPromo) {
      await updatePromotion(editingPromo.id, {
        ...promoForm,
        discount_value: Number(promoForm.discount_value)
      });
    } else {
      await addPromotion({
        ...promoForm,
        discount_value: Number(promoForm.discount_value)
      });
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

          {/* Right actions: Live Web, Logout */}
          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
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
            <span>Promociones (2x1, 3x2, Fechas)</span>
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
                      const promo = promotions.find(pr => pr.id === p.promotion_id && pr.is_active);
                      return (
                        <tr key={p.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={p.image_url} 
                              alt={p.name} 
                              className="w-10 h-10 object-contain rounded-lg border border-[#EADBEE] bg-[#FAF8F5] p-1 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-[#261C30] truncate max-w-xs">{p.name}</p>
                              {p.korean_name && (
                                <p className="text-[10px] text-[#9368B7]">{p.korean_name}</p>
                              )}
                              <p className="text-[10px] text-[#867894]">SKU: {p.code || 'S/N'}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#544660] font-medium">
                            {p.category_name}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#261C30]">
                            {settings.currency_symbol} {p.price.toFixed(2)}
                            {p.unit && <span className="text-[10px] text-[#867894] block">/{p.unit}</span>}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => updateProduct(p.id, { in_stock: !p.in_stock })}
                              className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                p.in_stock 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {p.in_stock ? `En Stock (${p.stock_quantity ?? 0})` : 'Agotado'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            {promo ? (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-[#9368B7] border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
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
                              onClick={() => {
                                if (confirm(`¿Eliminar producto "${p.name}"?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
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
                        onClick={() => {
                          if (confirm(`¿Eliminar la categoría "${cat.name}"? Los productos pasarán a otra categoría.`)) {
                            deleteCategory(cat.id);
                          }
                        }}
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
        {/* TAB 3: PROMOCIONES & FECHAS */}
        {/* ======================================================== */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#EADBEE]">
              <div>
                <h3 className="text-sm font-black text-[#261C30]">
                  Motor de Promociones & Campañas
                </h3>
                <p className="text-xs text-[#867894]">
                  Configura ofertas 2x1, 3x2, y promociones temáticas por fechas (Halloween, Navidad, San Valentín).
                </p>
              </div>

              <button
                onClick={openNewPromoModal}
                className="bg-[#9368B7] hover:bg-[#7E52A3] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Promoción</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {promotions.map((pr) => {
                const linkedProducts = products.filter(p => pr.product_ids?.includes(p.id) || p.promotion_id === pr.id);
                return (
                  <div key={pr.id} className="bg-white p-5 rounded-2xl border border-[#EADBEE] shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-[#9368B7] to-[#FF6B8B] text-white">
                        {pr.badge_text}
                      </span>
                      <button
                        onClick={() => updatePromotion(pr.id, { is_active: !pr.is_active })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pr.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {pr.is_active ? 'Activa' : 'Inactiva'}
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#261C30]">{pr.name}</h4>
                      <p className="text-xs text-[#6B5E78] mt-1">{pr.description}</p>
                    </div>

                    <div className="text-[11px] text-[#867894] space-y-1 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#F3EDF8]">
                      <p>• Tipo: <strong className="text-[#261C30]">{pr.type.toUpperCase()}</strong></p>
                      <p>• Temporada: <strong className="text-[#261C30]">{pr.season_tag}</strong></p>
                      <p>• Productos asignados: <strong className="text-[#261C30]">{linkedProducts.length}</strong></p>
                    </div>

                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingPromo(pr);
                          setPromoForm({
                            name: pr.name,
                            description: pr.description || '',
                            type: pr.type,
                            discount_value: pr.discount_value || 0,
                            season_tag: pr.season_tag,
                            badge_text: pr.badge_text,
                            product_ids: pr.product_ids || [],
                            is_active: pr.is_active
                          });
                          setIsPromoModalOpen(true);
                        }}
                        className="text-xs text-[#9368B7] font-bold hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar promoción "${pr.name}"?`)) {
                            deletePromotion(pr.id);
                          }
                        }}
                        className="text-xs text-rose-500 font-bold hover:underline"
                      >
                        Eliminar
                      </button>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#261C30]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#EADBEE] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F3EDF8] pb-3">
              <h3 className="font-black text-base text-[#261C30]">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="text-[#9D91A8] hover:text-[#261C30]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Nombre en Español *</label>
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
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7]"
                    placeholder="Ej. Samyang Buldak Carbonara"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#261C30] block">Nombre en Coreano</label>
                    <span className="text-[10px] text-[#9368B7] font-semibold bg-[#EFE6F7] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Automático
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={prodForm.korean_name}
                    className="w-full bg-[#FAF8F5]/80 p-2 rounded-xl border border-[#EADBEE] text-[#9368B7] font-bold cursor-not-allowed select-all"
                    placeholder="Se traduce automáticamente al escribir..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Código / SKU</label>
                  <input
                    type="text"
                    value={prodForm.code}
                    onChange={(e) => setProdForm({ ...prodForm, code: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                    placeholder="RAM-001"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Categoría *</label>
                  <select
                    value={prodForm.category_id}
                    onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Unidad</label>
                  <input
                    type="text"
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                    placeholder="paquete 130g"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Precio Unitario (S/.) *</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE] font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Precio Regular (Tachado)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={prodForm.original_price}
                    onChange={(e) => setProdForm({ ...prodForm, original_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Stock</label>
                  <input
                    type="number"
                    value={prodForm.stock_quantity}
                    onChange={(e) => setProdForm({ ...prodForm, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                  />
                </div>
              </div>

              {/* Subir Foto: Cámara, Galería o URL */}
              <div className="space-y-2 p-3 bg-[#FAF8F5] rounded-2xl border border-[#EADBEE]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#261C30] block">
                    Foto del Producto *
                  </label>
                  <button
                    type="button"
                    onClick={() => setImageUploadMode(imageUploadMode === 'upload' ? 'url' : 'upload')}
                    className="text-[11px] text-[#9368B7] hover:underline font-bold"
                  >
                    {imageUploadMode === 'upload' ? '🔗 Usar enlace URL' : '📁 Subir foto o usar cámara'}
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
                  <div className="space-y-2.5">
                    {/* Action buttons: Camera vs Gallery */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 p-2.5 bg-white hover:bg-[#EFE6F7] text-[#9368B7] font-bold rounded-xl border border-[#D8C3E5] shadow-xs transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Tomar Foto (Cámara)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 p-2.5 bg-white hover:bg-[#EFE6F7] text-[#9368B7] font-bold rounded-xl border border-[#D8C3E5] shadow-xs transition-colors"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Galería o Archivos</span>
                      </button>
                    </div>

                    {isProcessingImage && (
                      <p className="text-center text-xs text-[#9368B7] font-bold flex items-center justify-center gap-1.5 py-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Optimizando y preparando foto...
                      </p>
                    )}

                    {/* Image Preview thumbnail if available */}
                    {prodForm.image_url && (
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-[#EADBEE]">
                        <div className="w-14 h-14 bg-[#FAF8F5] rounded-lg p-1 border border-[#F3EDF8] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={prodForm.image_url}
                            alt="Previsualización"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-[11px]">
                          <p className="font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Foto lista para el catálogo
                          </p>
                          <p className="text-[#867894] truncate">
                            Optimizado para carga rápida en móviles
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProdForm({ ...prodForm, image_url: '' })}
                          className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"
                          title="Quitar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Manual URL fallback */
                  <div className="space-y-1">
                    <input
                      type="url"
                      value={prodForm.image_url}
                      onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                      className="w-full bg-white p-2 rounded-xl border border-[#EADBEE]"
                      placeholder="https://ejemplo.com/foto-ramen.jpg"
                    />
                    <p className="text-[10px] text-[#867894]">
                      Pega el enlace directo a una imagen alojada en la web.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-[#261C30] block mb-1">Promoción Asignada</label>
                <select
                  value={prodForm.promotion_id}
                  onChange={(e) => setProdForm({ ...prodForm, promotion_id: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
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
                <label className="font-bold text-[#261C30] block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EADBEE] text-[#6B5E78]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9368B7] hover:bg-[#7E52A3] text-white px-5 py-2 rounded-xl font-bold shadow-md"
                >
                  Guardar Producto
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
      {/* MODAL: PROMOCIÓN (NUEVA O EDITAR) */}
      {/* ======================================================== */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#261C30]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#EADBEE] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F3EDF8] pb-3">
              <h3 className="font-black text-base text-[#261C30]">
                {editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}
              </h3>
              <button onClick={() => setIsPromoModalOpen(false)}>
                <X className="w-5 h-5 text-[#9D91A8]" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#261C30] block mb-1">Nombre de la Promoción *</label>
                <input
                  type="text"
                  required
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                  placeholder="Ej. Festival 2x1 Buldak"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Tipo de Regla *</label>
                  <select
                    value={promoForm.type}
                    onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value as PromoType })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                  >
                    <option value="2x1">2x1 (Lleva 2 paga 1)</option>
                    <option value="3x2">3x2 (Lleva 3 paga 2)</option>
                    <option value="discount_percent">% Descuento Directo</option>
                    <option value="combo">Combo Pack</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#261C30] block mb-1">Temporada / Fecha</label>
                  <select
                    value={promoForm.season_tag}
                    onChange={(e) => setPromoForm({ ...promoForm, season_tag: e.target.value as SeasonCampaign })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                  >
                    <option value="general">General / Regular</option>
                    <option value="vencimiento">Liquidación por Fecha Próxima</option>
                    <option value="halloween">Especial Halloween</option>
                    <option value="navidad">Especial Navidad</option>
                    <option value="san_valentin">San Valentín</option>
                    <option value="verano">Temporada Verano</option>
                    <option value="aniversario">Aniversario Hoshi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#261C30] block mb-1">Texto del Badge en la Foto *</label>
                <input
                  type="text"
                  required
                  value={promoForm.badge_text}
                  onChange={(e) => setPromoForm({ ...promoForm, badge_text: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                  placeholder="Ej. PROMO 2x1 o LIQUIDACIÓN"
                />
              </div>

              {promoForm.type === 'discount_percent' && (
                <div>
                  <label className="font-bold text-[#261C30] block mb-1">% de Descuento</label>
                  <input
                    type="number"
                    value={promoForm.discount_value}
                    onChange={(e) => setPromoForm({ ...promoForm, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE]"
                    placeholder="20"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-[#261C30] block mb-1">Descripción / Regla para el cliente</label>
                <textarea
                  rows={2}
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#EADBEE] resize-none"
                  placeholder="Ej. Aplica en todas las variedades seleccionadas..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EADBEE] text-[#6B5E78]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9368B7] text-white px-5 py-2 rounded-xl font-bold shadow-md"
                >
                  Guardar Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
