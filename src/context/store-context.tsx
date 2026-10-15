"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, Promotion, StoreSettings, CartItem, SeasonCampaign } from '@/types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CATEGORIES, 
  INITIAL_PROMOTIONS, 
  INITIAL_SETTINGS 
} from '@/lib/initial-data';
import { calculateCartItemTotals } from '@/lib/promotions-engine';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  promotions: Promotion[];
  settings: StoreSettings;
  cart: CartItem[];
  selectedCategory: string;
  selectedSeason: SeasonCampaign;
  searchQuery: string;
  isCartOpen: boolean;
  totalCartItems: number;
  cartTotal: number;
  cartTotalSavings: number;
  
  // Filtering
  setSelectedCategory: (catId: string) => void;
  setSelectedSeason: (season: SeasonCampaign) => void;
  setSearchQuery: (query: string) => void;
  setIsCartOpen: (open: boolean) => void;

  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Admin CRUD Products
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Admin CRUD Categories
  addCategory: (category: { name: string; icon: string; description?: string }) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Admin CRUD Promotions
  addPromotion: (promo: Omit<Promotion, 'id'>) => Promise<void>;
  updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;

  // Excel / Billing System Sync
  importProductsFromExcel: (items: Array<{ code?: string; name: string; price: number; stock?: number; category?: string }>) => { updated: number; created: number };

  // Store Settings
  updateSettings: (updates: Partial<StoreSettings>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'hoshi_products_v1',
  CATEGORIES: 'hoshi_categories_v1',
  PROMOTIONS: 'hoshi_promotions_v1',
  SETTINGS: 'hoshi_settings_v1',
  CART: 'hoshi_cart_v1',
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedSeason, setSelectedSeason] = useState<SeasonCampaign>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Initialize from LocalStorage if available
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (savedCategories) setCategories(JSON.parse(savedCategories));

      const savedPromotions = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
      if (savedPromotions) setPromotions(JSON.parse(savedPromotions));

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {
      // Local storage unavailable or SSR fallback
    }
  }, []);

  // Sync state changes to localStorage
  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    } catch {}
  };

  const saveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
    } catch {}
  };

  const savePromotions = (newPromos: Promotion[]) => {
    setPromotions(newPromos);
    try {
      localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(newPromos));
    } catch {}
  };

  const saveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch {}
  };

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(newCart));
    } catch {}
  };

  // Helper to find promotion for product
  const getProductPromotion = (product: Product): Promotion | undefined => {
    if (!product.promotion_id) return undefined;
    const promo = promotions.find(p => p.id === product.promotion_id && p.is_active);
    return promo;
  };

  // Cart calculations
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    const promo = getProductPromotion(product);
    const existingIndex = cart.findIndex(item => item.product.id === product.id);

    let updatedCart: CartItem[];
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      const newQty = existing.quantity + quantityToAdd;
      const { subtotal, discount_amount, final_subtotal } = calculateCartItemTotals(product, newQty, promo);
      
      updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existing,
        quantity: newQty,
        applied_promotion: promo,
        subtotal,
        discount_amount,
        final_subtotal
      };
    } else {
      const { subtotal, discount_amount, final_subtotal } = calculateCartItemTotals(product, quantityToAdd, promo);
      const newItem: CartItem = {
        product,
        quantity: quantityToAdd,
        applied_promotion: promo,
        subtotal,
        discount_amount,
        final_subtotal
      };
      updatedCart = [...cart, newItem];
    }

    saveCart(updatedCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map(item => {
      if (item.product.id === productId) {
        const promo = getProductPromotion(item.product);
        const { subtotal, discount_amount, final_subtotal } = calculateCartItemTotals(item.product, quantity, promo);
        return {
          ...item,
          quantity,
          applied_promotion: promo,
          subtotal,
          discount_amount,
          final_subtotal
        };
      }
      return item;
    });

    saveCart(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    saveCart(updatedCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Admin: Products CRUD
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    saveProducts([newProduct, ...products]);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    saveProducts(updated);

    // Also update cart if product price or promo changed
    const updatedCart = cart.map(item => {
      if (item.product.id === id) {
        const updatedProd = { ...item.product, ...updates };
        const promo = getProductPromotion(updatedProd);
        const { subtotal, discount_amount, final_subtotal } = calculateCartItemTotals(updatedProd, item.quantity, promo);
        return {
          ...item,
          product: updatedProd,
          applied_promotion: promo,
          subtotal,
          discount_amount,
          final_subtotal
        };
      }
      return item;
    });
    saveCart(updatedCart);
  };

  const deleteProduct = async (id: string) => {
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);
    removeFromCart(id);
  };

  // Admin: Categories CRUD
  const addCategory = async (categoryData: { name: string; icon: string; description?: string }) => {
    const slug = categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: categoryData.name,
      slug,
      icon: categoryData.icon || '✨',
      order: categories.length + 1,
      description: categoryData.description || '',
      is_active: true
    };
    saveCategories([...categories, newCategory]);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    saveCategories(updated);
  };

  const deleteCategory = async (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    saveCategories(updated);
  };

  // Admin: Promotions CRUD
  const addPromotion = async (promoData: Omit<Promotion, 'id'>) => {
    const newPromo: Promotion = {
      ...promoData,
      id: `promo-${Date.now()}`
    };
    const updatedPromos = [...promotions, newPromo];
    savePromotions(updatedPromos);

    // Assign promotion to products if product_ids specified
    if (newPromo.product_ids && newPromo.product_ids.length > 0) {
      const updatedProducts = products.map(p => {
        if (newPromo.product_ids.includes(p.id)) {
          return { ...p, promotion_id: newPromo.id };
        }
        return p;
      });
      saveProducts(updatedProducts);
    }
  };

  const updatePromotion = async (id: string, updates: Partial<Promotion>) => {
    const updatedPromos = promotions.map(p => p.id === id ? { ...p, ...updates } : p);
    savePromotions(updatedPromos);

    // If active state changed or product assignment changed
    if (updates.product_ids) {
      const updatedProducts = products.map(p => {
        if (updates.product_ids?.includes(p.id)) {
          return { ...p, promotion_id: id };
        } else if (p.promotion_id === id) {
          return { ...p, promotion_id: undefined };
        }
        return p;
      });
      saveProducts(updatedProducts);
    }
  };

  const deletePromotion = async (id: string) => {
    const updatedPromos = promotions.filter(p => p.id !== id);
    savePromotions(updatedPromos);
    const updatedProducts = products.map(p => p.promotion_id === id ? { ...p, promotion_id: undefined } : p);
    saveProducts(updatedProducts);
  };

  // Sync from Billing Excel / CSV
  const importProductsFromExcel = (items: Array<{ code?: string; name: string; price: number; stock?: number; category?: string }>) => {
    let updatedCount = 0;
    let createdCount = 0;
    const currentProducts = [...products];

    items.forEach(item => {
      if (!item.name || !item.price) return;

      // Match by code or normalized name
      const existingIndex = currentProducts.findIndex(p => 
        (item.code && p.code && p.code.trim().toLowerCase() === item.code.trim().toLowerCase()) ||
        p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
      );

      if (existingIndex > -1) {
        // Update price and stock
        currentProducts[existingIndex] = {
          ...currentProducts[existingIndex],
          price: Number(item.price),
          stock_quantity: item.stock !== undefined ? Number(item.stock) : currentProducts[existingIndex].stock_quantity,
          in_stock: item.stock !== undefined ? Number(item.stock) > 0 : currentProducts[existingIndex].in_stock,
          code: item.code || currentProducts[existingIndex].code
        };
        updatedCount++;
      } else {
        // Create new
        const matchedCat = categories.find(c => 
          item.category && c.name.toLowerCase().includes(item.category.toLowerCase())
        );

        const newProd: Product = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          code: item.code || `SKU-${Date.now().toString().slice(-4)}`,
          name: item.name,
          description: "Producto importado desde sistema de facturación Hoshi Market.",
          category_id: matchedCat ? matchedCat.id : (categories[0]?.id || "cat-ramen"),
          category_name: matchedCat ? matchedCat.name : (categories[0]?.name || "General"),
          price: Number(item.price),
          unit: "und",
          image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80",
          in_stock: item.stock !== undefined ? Number(item.stock) > 0 : true,
          stock_quantity: item.stock !== undefined ? Number(item.stock) : 10,
          is_featured: false
        };
        currentProducts.push(newProd);
        createdCount++;
      }
    });

    saveProducts(currentProducts);
    return { updated: updatedCount, created: createdCount };
  };

  const updateSettings = (updates: Partial<StoreSettings>) => {
    saveSettings({ ...settings, ...updates });
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.final_subtotal, 0);
  const cartTotalSavings = cart.reduce((sum, item) => sum + item.discount_amount, 0);

  return (
    <StoreContext.Provider value={{
      products,
      categories,
      promotions,
      settings,
      cart,
      selectedCategory,
      selectedSeason,
      searchQuery,
      isCartOpen,
      totalCartItems,
      cartTotal,
      cartTotalSavings,
      setSelectedCategory,
      setSelectedSeason,
      setSearchQuery,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
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
      updateSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
