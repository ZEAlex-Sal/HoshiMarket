import { Product, Promotion, CartItem } from '@/types';

export function calculateCartItemTotals(product: Product, quantity: number, promotion?: Promotion): {
  subtotal: number;
  discount_amount: number;
  final_subtotal: number;
  promoDescription?: string;
} {
  const unitPrice = product.price;
  const subtotal = unitPrice * quantity;

  if (!promotion || !promotion.is_active) {
    return {
      subtotal,
      discount_amount: 0,
      final_subtotal: subtotal
    };
  }

  let discount_amount = 0;
  let promoDescription = '';

  switch (promotion.type) {
    case '2x1': {
      // Lleva 2 y paga 1 (cada par bonifica 1 unidad)
      const freeUnits = Math.floor(quantity / 2);
      if (freeUnits > 0) {
        discount_amount = freeUnits * unitPrice;
        promoDescription = `¡Promo 2x1 aplicada! ${freeUnits} ${freeUnits === 1 ? 'unidad gratis' : 'unidades gratis'}`;
      }
      break;
    }

    case '3x2': {
      // Lleva 3 y paga 2 (cada trío bonifica 1 unidad)
      const freeUnits = Math.floor(quantity / 3);
      if (freeUnits > 0) {
        discount_amount = freeUnits * unitPrice;
        promoDescription = `¡Promo 3x2 aplicada! ${freeUnits} ${freeUnits === 1 ? 'unidad gratis' : 'unidades gratis'}`;
      }
      break;
    }

    case 'discount_percent': {
      const percent = promotion.discount_value || 0;
      if (percent > 0) {
        discount_amount = subtotal * (percent / 100);
        promoDescription = `¡${percent}% de descuento aplicado!`;
      }
      break;
    }

    case 'combo':
    case 'fixed_price': {
      if (promotion.discount_value && promotion.discount_value > 0) {
        discount_amount = Math.min(subtotal, promotion.discount_value * quantity);
        promoDescription = `¡Precio especial de combo aplicado!`;
      }
      break;
    }
  }

  const final_subtotal = Math.max(0, subtotal - discount_amount);

  return {
    subtotal,
    discount_amount,
    final_subtotal,
    promoDescription
  };
}

export function formatWhatsAppMessage(
  cartItems: CartItem[], 
  customerData: {
    name: string;
    phone?: string;
    deliveryType: 'delivery' | 'pickup';
    address?: string;
    paymentMethod: string;
    notes?: string;
  },
  settings: {
    currency_symbol: string;
    store_name: string;
    address: string;
  }
): string {
  const totalOriginal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const totalSavings = cartItems.reduce((acc, item) => acc + item.discount_amount, 0);
  const totalFinal = cartItems.reduce((acc, item) => acc + item.final_subtotal, 0);

  const lines: string[] = [];
  lines.push(`✨ *¡Hola ${settings.store_name}!* 🥢 Deseo realizar el siguiente pedido:`);
  lines.push('');
  lines.push('🛒 *DETALLE DEL PEDIDO:*');

  cartItems.forEach((item, index) => {
    const promoNote = item.applied_promotion ? ` [${item.applied_promotion.badge_text}]` : '';
    lines.push(
      `${index + 1}. *${item.quantity}x* ${item.product.name}${promoNote}`
    );
    if (item.discount_amount > 0) {
      lines.push(
        `   ↳ Subtotal: ~${settings.currency_symbol} ${item.subtotal.toFixed(2)}~ → *${settings.currency_symbol} ${item.final_subtotal.toFixed(2)}* (Ahorro: -${settings.currency_symbol} ${item.discount_amount.toFixed(2)})`
      );
    } else {
      lines.push(
        `   ↳ Subtotal: *${settings.currency_symbol} ${item.final_subtotal.toFixed(2)}*`
      );
    }
  });

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  if (totalSavings > 0) {
    lines.push(`💰 *Total Bruto:* ${settings.currency_symbol} ${totalOriginal.toFixed(2)}`);
    lines.push(`🎉 *Total Ahorro (Promociones):* -${settings.currency_symbol} ${totalSavings.toFixed(2)}`);
  }
  lines.push(`✨ *TOTAL A PAGAR: ${settings.currency_symbol} ${totalFinal.toFixed(2)}*`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  lines.push('📍 *DATOS DE ENTREGA:*');
  lines.push(`• *Cliente:* ${customerData.name.trim() || 'Cliente'}`);
  lines.push(
    `• *Modalidad:* ${
      customerData.deliveryType === 'delivery' 
        ? `🛵 Delivery a domicilio (${customerData.address || 'Dirección por coordinar'})` 
        : `🏪 Recojo en tienda (${settings.address})`
    }`
  );
  lines.push(`• *Método de Pago:* ${customerData.paymentMethod}`);
  if (customerData.notes && customerData.notes.trim()) {
    lines.push(`• *Nota adicional:* ${customerData.notes.trim()}`);
  }
  lines.push('');
  lines.push('¿Me confirman la disponibilidad para proceder con el pago? ¡Muchas gracias! 💖');

  return encodeURIComponent(lines.join('\n'));
}
