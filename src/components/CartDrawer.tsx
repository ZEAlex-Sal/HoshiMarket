"use client";

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatWhatsAppMessage } from '@/lib/promotions-engine';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Sparkles, 
  Send, 
  MapPin, 
  Store, 
  Bike, 
  CreditCard,
  Banknote,
  Building2,
  Search,
  ChevronDown,
  Check,
  Zap,
  Navigation
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HuanucoZone {
  id: string;
  name: string;
  district: string;
  reference?: string;
}

const HUANUCO_ZONES: HuanucoZone[] = [
  // Huánuco Cercado / Centro
  { id: 'hco-centro', name: 'Huánuco - Centro / Jr. Crespo Castillo / Plaza de Armas', district: 'Huánuco Centro', reference: 'Cerca a Jr. Crespo Castillo 614' },
  { id: 'hco-dos-de-mayo', name: 'Huánuco - Jr. Dos de Mayo / Jr. General Prado', district: 'Huánuco Centro' },
  { id: 'hco-alameda', name: 'Huánuco - Alameda de la República / Tarapacá', district: 'Huánuco Centro' },
  { id: 'hco-mercados', name: 'Huánuco - Mercado Modelo / Mercado Central', district: 'Huánuco Centro' },
  { id: 'hco-san-cristobal', name: 'Huánuco - San Cristóbal / Calicanto', district: 'Huánuco' },
  { id: 'hco-vina-del-rio', name: 'Huánuco - Laguna Viña del Río / El Tingo', district: 'Huánuco' },
  { id: 'hco-moras', name: 'Huánuco - Las Moras / San Luis Gonzaga', district: 'Huánuco' },
  { id: 'hco-aparicio', name: 'Huánuco - Aparicio Pomares / Puelles', district: 'Huánuco' },

  // Amarilis
  { id: 'ama-paucarbamba', name: 'Amarilis - Paucarbamba (Plaza Mayor / Jr. Huallaga)', district: 'Amarilis' },
  { id: 'ama-paucarbambilla', name: 'Amarilis - Paucarbambilla / Vía Colectora', district: 'Amarilis' },
  { id: 'ama-fonavi-1-2', name: 'Amarilis - Fonavi 1 y 2', district: 'Amarilis' },
  { id: 'ama-fonavi-3-5', name: 'Amarilis - Fonavi 3, 4 y 5', district: 'Amarilis' },
  { id: 'ama-san-luis', name: 'Amarilis - San Luis / Llicua / La Esperanza', district: 'Amarilis' },
  { id: 'ama-huayopampa', name: 'Amarilis - Huayopampa / Portada del Sol', district: 'Amarilis' },

  // Pillco Marca
  { id: 'pil-cayhuayna-baja', name: 'Pillco Marca - Cayhuayna Baja / Campus UNHEVAL', district: 'Pillco Marca' },
  { id: 'pil-cayhuayna-alta', name: 'Pillco Marca - Cayhuayna Alta / Av. Universitaria', district: 'Pillco Marca' },
  { id: 'pil-potracancha', name: 'Pillco Marca - Potracancha / Juan Velasco', district: 'Pillco Marca' },
  { id: 'pil-yanag', name: 'Pillco Marca - Yanag / Marabamba', district: 'Pillco Marca' },

  // Alrededores
  { id: 'valle-santa-maria', name: 'Santa María del Valle / Alrededores de Huánuco', district: 'Alrededores' },
  { id: 'otra-zona', name: 'Otra zona de Huánuco (especificar en dirección)', district: 'Personalizado' },
];

export default function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    cartTotal, 
    cartTotalSavings,
    settings 
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryService, setDeliveryService] = useState<'llamafood' | 'direct'>('llamafood');
  const [selectedZone, setSelectedZone] = useState<string>('Huánuco - Centro / Jr. Crespo Castillo / Plaza de Armas');
  const [zoneSearch, setZoneSearch] = useState<string>('');
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState<boolean>(false);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Yape' | 'Plin' | 'Efectivo' | 'Transferencia'>('Yape');
  const [notes, setNotes] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  // Filter Huánuco zones in search
  const filteredZones = useMemo(() => {
    if (!zoneSearch.trim()) return HUANUCO_ZONES;
    const q = zoneSearch.toLowerCase().trim();
    return HUANUCO_ZONES.filter(z => 
      z.name.toLowerCase().includes(q) || 
      z.district.toLowerCase().includes(q) ||
      (z.reference && z.reference.toLowerCase().includes(q))
    );
  }, [zoneSearch]);

  if (!isCartOpen) return null;

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Por favor, ingresa tu nombre para el pedido.');
      return;
    }

    if (deliveryType === 'delivery' && !address.trim()) {
      alert('Por favor, ingresa tu dirección para el delivery.');
      return;
    }

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9368B7', '#FF6B8B', '#10B981', '#F59E0B']
      });
    } catch {}

    const encodedMessage = formatWhatsAppMessage(
      cart,
      {
        name: customerName,
        deliveryType,
        deliveryService: deliveryType === 'delivery' ? deliveryService : undefined,
        deliveryZone: deliveryType === 'delivery' ? selectedZone : undefined,
        address,
        paymentMethod,
        notes
      },
      {
        currency_symbol: settings.currency_symbol,
        store_name: settings.store_name,
        address: settings.address
      }
    );

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${settings.whatsapp_number}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-[#261C30]/50 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-[#EADBEE]">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#EADBEE] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#EFE6F7] flex items-center justify-center text-[#9368B7]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#261C30]">
                  Tu Canasta de Pedido
                </h2>
                <p className="text-xs text-[#867894]">
                  {cart.length} {cart.length === 1 ? 'producto distinto' : 'productos distintos'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B5E78] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#EFE6F7] flex items-center justify-center text-3xl">
                  🛒
                </div>
                <h3 className="font-bold text-base text-[#261C30]">
                  Tu canasta está vacía
                </h3>
                <p className="text-xs text-[#867894] max-w-xs">
                  Explora nuestros ramens coreanos, paletas Melona, bebidas y merch K-pop para agregar a tu pedido.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 bg-[#9368B7] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#7E52A3]"
                >
                  Ver Catálogo
                </button>
              </div>
            ) : !showCheckoutForm ? (
              <>
                {/* List of Cart Items */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div 
                      key={item.product.id}
                      className="bg-white p-3 rounded-2xl border border-[#EADBEE] shadow-xs flex gap-3 items-center"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 bg-[#FAF8F5] rounded-xl flex-shrink-0 p-1 flex items-center justify-center border border-[#F3EDF8]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Info & Quantity */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-[#261C30] truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[#9D91A8] hover:text-rose-500 p-0.5 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Promotion tag if applied */}
                        {item.applied_promotion && (
                          <span className="inline-block text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded mt-0.5">
                            {item.applied_promotion.badge_text}
                          </span>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          {/* Stepper Buttons */}
                          <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#EADBEE] rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-[#544660] hover:bg-white transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-[#261C30]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-[#544660] hover:bg-white transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Price breakdown */}
                          <div className="text-right">
                            {item.discount_amount > 0 && (
                              <span className="text-[10px] text-[#9D91A8] line-through block">
                                {settings.currency_symbol} {item.subtotal.toFixed(2)}
                              </span>
                            )}
                            <span className="text-xs font-black text-[#261C30]">
                              {settings.currency_symbol} {item.final_subtotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Savings Banner */}
                {cartTotalSavings > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-800">
                        ¡Estás ahorrando {settings.currency_symbol} {cartTotalSavings.toFixed(2)}!
                      </p>
                      <p className="text-emerald-700 text-[11px]">
                        Tus promociones se aplicaron automáticamente al total.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Checkout Form */
              <form onSubmit={handleSendWhatsApp} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowCheckoutForm(false)}
                  className="text-xs text-[#9368B7] hover:underline font-bold flex items-center gap-1"
                >
                  ← Volver a revisar la lista de productos
                </button>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#261C30] block">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre y apellido"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white px-3 py-2.5 text-xs rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] focus:outline-none shadow-xs"
                  />
                </div>

                {/* Delivery or Pickup */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#261C30] block">
                    Modalidad de Entrega
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-3 rounded-2xl border text-left text-xs font-bold flex flex-col gap-1 transition-all ${
                        deliveryType === 'pickup'
                          ? 'border-[#9368B7] bg-[#EFE6F7] text-[#9368B7] shadow-sm ring-1 ring-[#9368B7]'
                          : 'border-[#EADBEE] bg-white text-[#6B5E78] hover:border-[#9368B7]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Store className="w-4 h-4 text-[#9368B7]" />
                        {deliveryType === 'pickup' && <Check className="w-3.5 h-3.5 text-[#9368B7]" />}
                      </div>
                      <span className="font-black text-[#261C30]">Recojo en Tienda</span>
                      <span className="text-[10px] font-normal text-[#867894]">Jr. Crespo Castillo 614</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-3 rounded-2xl border text-left text-xs font-bold flex flex-col gap-1 transition-all ${
                        deliveryType === 'delivery'
                          ? 'border-[#9368B7] bg-[#EFE6F7] text-[#9368B7] shadow-sm ring-1 ring-[#9368B7]'
                          : 'border-[#EADBEE] bg-white text-[#6B5E78] hover:border-[#9368B7]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Bike className="w-4 h-4 text-[#9368B7]" />
                        {deliveryType === 'delivery' && <Check className="w-3.5 h-3.5 text-[#9368B7]" />}
                      </div>
                      <span className="font-black text-[#261C30]">Delivery en Huánuco</span>
                      <span className="text-[10px] font-normal text-[#867894]">A tu domicilio u oficina</span>
                    </button>
                  </div>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="space-y-3 p-3 bg-white rounded-2xl border border-[#EADBEE]">
                    {/* Delivery Provider (Llamafood vs Direct) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#261C30] flex items-center justify-between">
                        <span>Servicio de Delivery (Huánuco) *</span>
                        <span className="text-[10px] text-[#9368B7] font-semibold">Cobertura local</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Llamafood Button */}
                        <button
                          type="button"
                          onClick={() => setDeliveryService('llamafood')}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all relative ${
                            deliveryService === 'llamafood'
                              ? 'border-[#E65100] bg-orange-50/70 ring-1 ring-[#E65100] shadow-xs'
                              : 'border-[#EADBEE] bg-[#FAF8F5] text-[#6B5E78] hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base" role="img" aria-label="llama">🦙</span>
                            {deliveryService === 'llamafood' && (
                              <span className="bg-[#E65100] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                                OFICIAL
                              </span>
                            )}
                          </div>
                          <span className="font-black text-xs block text-[#261C30]">Llamafood</span>
                          <span className="text-[10px] text-[#867894] block leading-tight">Delivery Express</span>
                        </button>

                        {/* Direct Local Delivery Button */}
                        <button
                          type="button"
                          onClick={() => setDeliveryService('direct')}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            deliveryService === 'direct'
                              ? 'border-[#9368B7] bg-[#EFE6F7] ring-1 ring-[#9368B7] shadow-xs'
                              : 'border-[#EADBEE] bg-[#FAF8F5] text-[#6B5E78] hover:border-[#9368B7]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Bike className="w-4 h-4 text-[#9368B7]" />
                            {deliveryService === 'direct' && (
                              <span className="bg-[#9368B7] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                                LOCAL
                              </span>
                            )}
                          </div>
                          <span className="font-black text-xs block text-[#261C30]">Delivery Local</span>
                          <span className="text-[10px] text-[#867894] block leading-tight">Coordinado Tienda</span>
                        </button>
                      </div>
                    </div>

                    {/* Searchable Huánuco Zone Dropdown */}
                    <div className="space-y-1 relative">
                      <label className="text-[11px] font-bold text-[#261C30] block">
                        Zona o Distrito en Huánuco *
                      </label>

                      {/* Backdrop to close dropdown */}
                      {isZoneDropdownOpen && (
                        <div 
                          className="fixed inset-0 z-20" 
                          onClick={() => setIsZoneDropdownOpen(false)} 
                        />
                      )}

                      {/* Dropdown Button */}
                      <button
                        type="button"
                        onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
                        className="w-full bg-[#FAF8F5] px-3 py-2 text-xs rounded-xl border border-[#EADBEE] text-left flex items-center justify-between gap-2 hover:border-[#9368B7] focus:ring-2 focus:ring-[#9368B7] transition-all"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#9368B7] flex-shrink-0" />
                          <span className="font-medium text-[#261C30] truncate text-[11px]">
                            {selectedZone}
                          </span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-[#867894] transition-transform duration-200 flex-shrink-0 ${isZoneDropdownOpen ? 'rotate-180 text-[#9368B7]' : ''}`} />
                      </button>

                      {/* Searchable Dropdown Popover */}
                      {isZoneDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white rounded-2xl border border-[#EADBEE] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                          {/* Search Input */}
                          <div className="p-2 border-b border-[#F3EDF8] bg-[#FAF8F5]">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-[#867894] absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Buscar zona (ej. Paucarbamba, Cayhuayna, Fonavi)..."
                                value={zoneSearch}
                                onChange={(e) => setZoneSearch(e.target.value)}
                                className="w-full bg-white pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] focus:outline-none"
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* Filtered Zones List */}
                          <div className="max-h-48 overflow-y-auto divide-y divide-[#FAF8F5]">
                            {filteredZones.length > 0 ? (
                              filteredZones.map((z) => {
                                const isSelected = selectedZone === z.name;
                                return (
                                  <button
                                    key={z.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedZone(z.name);
                                      setIsZoneDropdownOpen(false);
                                      setZoneSearch('');
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                                      isSelected 
                                        ? 'bg-[#EFE6F7] text-[#9368B7] font-bold' 
                                        : 'hover:bg-[#FAF8F5] text-[#261C30]'
                                    }`}
                                  >
                                    <div className="truncate">
                                      <span className="block truncate text-[11px]">{z.name}</span>
                                      <span className="text-[10px] text-[#867894] block font-normal">
                                        {z.district} {z.reference ? `• ${z.reference}` : ''}
                                      </span>
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#9368B7] flex-shrink-0" />}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-3 text-center text-xs text-[#867894]">
                                <span>No encontramos esa zona exacta.</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedZone('Otra zona de Huánuco (especificar en dirección)');
                                    setIsZoneDropdownOpen(false);
                                    setZoneSearch('');
                                  }}
                                  className="block mx-auto mt-1 text-[#9368B7] font-bold underline"
                                >
                                  Usar &quot;Otra zona en Huánuco&quot;
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Exact Address Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#261C30] block">
                        Dirección y Referencia de Entrega *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Dirección y referencia de entrega"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-[#FAF8F5] px-3 py-2 text-xs rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] focus:outline-none"
                      />
                    </div>

                    {/* Llamafood Notice */}
                    {deliveryService === 'llamafood' && (
                      <div className="p-2.5 bg-orange-50/80 border border-orange-200/80 rounded-xl flex items-start gap-2 text-[11px] text-orange-950">
                        <span className="text-sm flex-shrink-0" role="img" aria-label="llama">🦙</span>
                        <div className="leading-tight">
                          <span className="font-bold block text-orange-900">Despacho con Llamafood:</span>
                          <span className="text-orange-900/80 text-[10px]">
                            Tu pedido se enviará mediante un motorizado de Llamafood en Huánuco tras confirmar tu compra.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Branded Payment Method Selection Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#261C30] block">
                    Método de Pago Preferido *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Yape Button (Purple) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Yape')}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'Yape'
                          ? 'border-[#742284] bg-[#742284]/10 shadow-sm ring-1 ring-[#742284]'
                          : 'border-[#EADBEE] bg-white hover:border-[#742284]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="bg-[#742284] text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide">
                          YAPE
                        </span>
                        {paymentMethod === 'Yape' && <Check className="w-3.5 h-3.5 text-[#742284]" />}
                      </div>
                      <span className="font-black text-xs text-[#261C30] block">Yape</span>
                      <span className="text-[10px] text-[#867894] block leading-tight">Transferencia móvil BCP</span>
                    </button>

                    {/* Plin Button (Teal/Green) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Plin')}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'Plin'
                          ? 'border-[#00A896] bg-[#00A896]/10 shadow-sm ring-1 ring-[#00A896]'
                          : 'border-[#EADBEE] bg-white hover:border-[#00A896]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="bg-[#00A896] text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide">
                          PLIN
                        </span>
                        {paymentMethod === 'Plin' && <Check className="w-3.5 h-3.5 text-[#00A896]" />}
                      </div>
                      <span className="font-black text-xs text-[#261C30] block">Plin</span>
                      <span className="text-[10px] text-[#867894] block leading-tight">Interbank, BBVA, Scotiabank</span>
                    </button>

                    {/* Efectivo Button (Emerald Green) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Efectivo')}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'Efectivo'
                          ? 'border-emerald-600 bg-emerald-50 shadow-sm ring-1 ring-emerald-600'
                          : 'border-[#EADBEE] bg-white hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                          <Banknote className="w-3.5 h-3.5" />
                        </div>
                        {paymentMethod === 'Efectivo' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <span className="font-black text-xs text-[#261C30] block">Efectivo</span>
                      <span className="text-[10px] text-[#867894] block leading-tight">En tienda o contraentrega</span>
                    </button>

                    {/* Transferencia Bancaria Button (Blue) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Transferencia')}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'Transferencia'
                          ? 'border-[#0056B3] bg-blue-50 shadow-sm ring-1 ring-[#0056B3]'
                          : 'border-[#EADBEE] bg-white hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-[#0056B3]">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        {paymentMethod === 'Transferencia' && <Check className="w-3.5 h-3.5 text-[#0056B3]" />}
                      </div>
                      <span className="font-black text-xs text-[#261C30] block">Transferencia</span>
                      <span className="text-[10px] text-[#867894] block leading-tight">BCP, BBVA, Interbank</span>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#261C30] block">
                    Notas o comentarios (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instrucciones adicionales para tu pedido (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white px-3 py-2 text-xs rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] focus:outline-none resize-none shadow-xs"
                  />
                </div>
              </form>
            )}
          </div>

          {/* Drawer Footer with Totals and Action */}
          {cart.length > 0 && (
            <div className="p-4 bg-white border-t border-[#EADBEE] space-y-3">
              <div className="space-y-1.5 text-xs">
                {cartTotalSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Ahorro en Promociones:</span>
                    <span>-{settings.currency_symbol} {cartTotalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-sm font-black text-[#261C30]">
                  <span>Total a Pagar:</span>
                  <span className="text-xl text-[#9368B7]">
                    {settings.currency_symbol} {cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {!showCheckoutForm ? (
                <button
                  onClick={() => setShowCheckoutForm(true)}
                  className="w-full bg-[#9368B7] hover:bg-[#7E52A3] text-white py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#9368B7]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Continuar con el Pedido</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20BA5C] text-white py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Pedido a WhatsApp</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
