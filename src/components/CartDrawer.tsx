"use client";

import React, { useState } from 'react';
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
  CreditCard 
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Yape');
  const [notes, setNotes] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

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

    const whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodedMessage}`;
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
                    placeholder="Ej. Camila Morales"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white px-3 py-2 text-xs rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] focus:outline-none"
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
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col gap-1 transition-all ${
                        deliveryType === 'pickup'
                          ? 'border-[#9368B7] bg-[#EFE6F7] text-[#9368B7]'
                          : 'border-[#EADBEE] bg-white text-[#6B5E78]'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Recojo en Tienda</span>
                      <span className="text-[10px] font-normal opacity-80">Jr. Crespo Castillo 614</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col gap-1 transition-all ${
                        deliveryType === 'delivery'
                          ? 'border-[#9368B7] bg-[#EFE6F7] text-[#9368B7]'
                          : 'border-[#EADBEE] bg-white text-[#6B5E78]'
                      }`}
                    >
                      <Bike className="w-4 h-4" />
                      <span>Delivery en Huánuco</span>
                      <span className="text-[10px] font-normal opacity-80">A tu domicilio / oficina</span>
                    </button>
                  </div>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#261C30] block">
                      Dirección de Entrega / Referencia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Jr. Dos de Mayo 450, frente al parque"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white px-3 py-2 text-xs rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] focus:outline-none"
                    />
                  </div>
                )}

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#261C30] block">
                    Método de Pago Preferido
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white px-3 py-2 text-xs rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] focus:outline-none"
                  >
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Efectivo en Tienda o Contraentrega">Efectivo</option>
                    <option value="Transferencia BCP / Interbank">Transferencia Bancaria</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#261C30] block">
                    Notas o comentarios (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Si tienen Melona de fresa agregar uno, gracias!"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white px-3 py-2 text-xs rounded-xl border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] focus:outline-none resize-none"
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
