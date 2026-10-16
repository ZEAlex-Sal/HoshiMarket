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
  keywords?: string[];
}

function normalizeSearchText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\-_/()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const HUANUCO_ZONES: HuanucoZone[] = [
  // ==========================================
  // JIRONES Y CALLES - HUÁNUCO CENTRO
  // ==========================================
  { id: 'hco-crespo-castillo', name: 'Jr. Crespo Castillo (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Donde se ubica Hoshi Market N° 614', keywords: ['crespo', 'castillo', 'hoshi'] },
  { id: 'hco-ayacucho', name: 'Jr. Ayacucho (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Desde San Cristóbal hasta la Alameda', keywords: ['ayacucho', 'jr ayacucho'] },
  { id: 'hco-pedro-puelles', name: 'Jr. Pedro Puelles (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Zona Parque Pedro Puelles', keywords: ['pedro', 'puelles', 'jr pedro puelles'] },
  { id: 'hco-tarapaca', name: 'Jr. Tarapacá (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Eje céntrico de Huánuco', keywords: ['tarapaca', 'jr tarapaca'] },
  { id: 'hco-alameda', name: 'Alameda de la República (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Avenida Alameda de la República', keywords: ['alameda', 'republica', 'alameda de la republica'] },
  { id: 'hco-dos-de-mayo', name: 'Jr. Dos de Mayo (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Plaza de Armas / Iglesia San Francisco', keywords: ['dos de mayo', '2 de mayo', 'jr dos de mayo'] },
  { id: 'hco-general-prado', name: 'Jr. General Prado (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Frente a Plaza de Armas y Catedral', keywords: ['general', 'prado', 'jr general prado'] },
  { id: 'hco-28-de-julio', name: 'Jr. 28 de Julio (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Eje comercial céntrico', keywords: ['28 de julio', 'veintiocho de julio', 'jr 28 de julio'] },
  { id: 'hco-damaso-beraun', name: 'Jr. Dámaso Beraún (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['damaso', 'beraun', 'jr damaso beraun'] },
  { id: 'hco-hermilio-valdizan', name: 'Jr. Hermilio Valdizán (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['hermilio', 'valdizan', 'jr hermilio valdizan'] },
  { id: 'hco-huallayco', name: 'Jr. Huallayco (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Zona Mercado Modelo', keywords: ['huallayco', 'mercado modelo', 'jr huallayco'] },
  { id: 'hco-abtao', name: 'Jr. Abtao (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['abtao', 'jr abtao'] },
  { id: 'hco-aguilar', name: 'Jr. Aguilar (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['aguilar', 'jr aguilar'] },
  { id: 'hco-san-martin', name: 'Jr. San Martín (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['san martin', 'jr san martin'] },
  { id: 'hco-independencia', name: 'Jr. Independencia (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['independencia', 'jr independencia'] },
  { id: 'hco-constitucion', name: 'Jr. Constitución (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['constitucion', 'jr constitucion'] },
  { id: 'hco-junin', name: 'Jr. Junín (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['junin', 'jr junin'] },
  { id: 'hco-mayro', name: 'Jr. Mayro (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['mayro', 'jr mayro'] },
  { id: 'hco-huanuco', name: 'Jr. Huánuco (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro de Huánuco', keywords: ['huanuco', 'calle huanuco', 'jr huanuco'] },
  { id: 'hco-progreso', name: 'Jr. Progreso (Huánuco)', district: 'Huánuco', reference: 'Zona Huánuco Cercado', keywords: ['progreso', 'jr progreso'] },
  { id: 'hco-morona', name: 'Jr. Morona (Huánuco)', district: 'Huánuco', reference: 'Zona Huánuco Cercado', keywords: ['morona', 'jr morona'] },
  { id: 'hco-malecon-alomia', name: 'Malecón Daniel Alomía Robles (Huánuco)', district: 'Huánuco', reference: 'Ribera del río Huallaga', keywords: ['malecon', 'daniel', 'alomia', 'robles'] },
  { id: 'hco-malecon-centenario', name: 'Malecón Centenario (Huánuco)', district: 'Huánuco', reference: 'Malecón Centenario Guillermo Rolando', keywords: ['malecon centenario', 'guillermo rolando'] },

  // ==========================================
  // PASAJES DE HUÁNUCO
  // ==========================================
  { id: 'hco-psje-cardenas', name: 'Psje. Cárdenas (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Pasaje Cárdenas', keywords: ['pasaje cardenas', 'psje cardenas', 'cardenas'] },
  { id: 'hco-psje-san-cristobal', name: 'Psje. San Cristóbal (Huánuco)', district: 'Huánuco', reference: 'Pasaje San Cristóbal', keywords: ['pasaje san cristobal', 'psje san cristobal'] },
  { id: 'hco-psje-villegas', name: 'Psje. Villegas (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Pasaje Villegas', keywords: ['pasaje villegas', 'psje villegas', 'villegas'] },
  { id: 'hco-psje-gomero', name: 'Psje. Gomero (Huánuco)', district: 'Huánuco', reference: 'Pasaje Gomero', keywords: ['pasaje gomero', 'psje gomero', 'gomero'] },
  { id: 'hco-psje-laureles', name: 'Psje. Los Laureles (Huánuco)', district: 'Huánuco', reference: 'Pasaje Los Laureles', keywords: ['pasaje los laureles', 'psje laureles', 'laureles'] },

  // ==========================================
  // BARRIOS Y ZONAS CLAVE - HUÁNUCO
  // ==========================================
  { id: 'hco-plaza-armas', name: 'Plaza de Armas (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Centro Cívico y Catedral', keywords: ['plaza de armas', 'catedral', 'parque central'] },
  { id: 'hco-mercado-modelo', name: 'Mercado Modelo (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Jr. Huallayco con Aguilar', keywords: ['mercado modelo', 'la parada'] },
  { id: 'hco-mercado-central', name: 'Mercado Central (Huánuco Centro)', district: 'Huánuco Centro', reference: 'Mercado Central', keywords: ['mercado central', 'antiguo mercado'] },
  { id: 'hco-san-cristobal', name: 'Barrio San Cristóbal (Huánuco)', district: 'Huánuco', reference: 'Zona Iglesia San Cristóbal', keywords: ['san cristobal', 'iglesia san cristobal'] },
  { id: 'hco-puente-calicanto', name: 'Puente Calicanto (Huánuco)', district: 'Huánuco', reference: 'Puente histórico sobre el río Huallaga', keywords: ['puente calicanto', 'calicanto'] },
  { id: 'hco-vina-del-rio', name: 'Laguna Viña del Río (Huánuco)', district: 'Huánuco', reference: 'Parque Viña del Río', keywords: ['laguna vina del rio', 'vina del rio'] },
  { id: 'hco-el-tingo', name: 'Parque El Tingo (Huánuco)', district: 'Huánuco', reference: 'Zona recreacional El Tingo', keywords: ['el tingo', 'parque el tingo', 'tingo'] },
  { id: 'hco-moras', name: 'Las Moras (Huánuco)', district: 'Huánuco', reference: 'Urb. Las Moras / San Luis Gonzaga', keywords: ['las moras', 'moras'] },
  { id: 'hco-aparicio-pomares', name: 'Aparicio Pomares (Huánuco)', district: 'Huánuco', reference: 'Zona alta Aparicio Pomares', keywords: ['aparicio pomares', 'pomares'] },
  { id: 'hco-san-pedro', name: 'San Pedro (Huánuco)', district: 'Huánuco', reference: 'Barrio San Pedro', keywords: ['san pedro'] },
  { id: 'hco-estadio-puelles', name: 'Parque Pedro Puelles / Estadio Heraclio Tapia', district: 'Huánuco', reference: 'Estadio Heraclio Tapia León', keywords: ['estadio heraclio tapia', 'heraclio tapia', 'parque puelles'] },
  { id: 'hco-colpa-baja', name: 'Colpa Baja (Huánuco)', district: 'Huánuco', reference: 'Cerca al Aeropuerto Alférez FAP David Figueroa', keywords: ['colpa baja', 'aeropuerto'] },

  // ==========================================
  // DISTRITO DE AMARILIS
  // ==========================================
  { id: 'ama-paucarbamba', name: 'Paucarbamba (Amarilis)', district: 'Amarilis', reference: 'Plaza Mayor de Amarilis', keywords: ['paucarbamba', 'plaza amarilis', 'plaza paucarbamba'] },
  { id: 'ama-av-tupac-amaru', name: 'Av. Túpac Amaru (Amarilis)', district: 'Amarilis', reference: 'Eje principal de Paucarbamba', keywords: ['av tupac amaru', 'tupac amaru'] },
  { id: 'ama-via-colectora', name: 'Vía Colectora (Amarilis)', district: 'Amarilis', reference: 'Av. Colectora / Residencial', keywords: ['via colectora', 'colectora'] },
  { id: 'ama-paucarbambilla', name: 'Paucarbambilla (Amarilis)', district: 'Amarilis', reference: 'Zona Paucarbambilla', keywords: ['paucarbambilla'] },
  { id: 'ama-fonavi-1-2', name: 'Fonavi 1 y 2 (Amarilis)', district: 'Amarilis', reference: 'Urb. Fonavi 1 y 2', keywords: ['fonavi 1', 'fonavi 2', 'fonavi uno', 'fonavi dos'] },
  { id: 'ama-fonavi-3-5', name: 'Fonavi 3, 4 y 5 (Amarilis)', district: 'Amarilis', reference: 'Urb. Fonavi 3, 4 y 5', keywords: ['fonavi 3', 'fonavi 4', 'fonavi 5'] },
  { id: 'ama-san-luis', name: 'San Luis (Amarilis)', district: 'Amarilis', reference: 'Sectores 1, 2, 3, 4 y 5', keywords: ['san luis amarilis', 'san luis'] },
  { id: 'ama-llicua-alta', name: 'Llicua Alta (Amarilis)', district: 'Amarilis', reference: 'Llicua Alta', keywords: ['llicua alta', 'llicua'] },
  { id: 'ama-llicua-baja', name: 'Llicua Baja (Amarilis)', district: 'Amarilis', reference: 'Llicua Baja', keywords: ['llicua baja', 'llicua'] },
  { id: 'ama-la-esperanza', name: 'La Esperanza (Amarilis)', district: 'Amarilis', reference: 'Zona norte de Amarilis', keywords: ['la esperanza', 'esperanza'] },
  { id: 'ama-huayopampa', name: 'Huayopampa (Amarilis)', district: 'Amarilis', reference: 'Zona Huayopampa', keywords: ['huayopampa'] },
  { id: 'ama-portada-sol', name: 'Portada del Sol (Amarilis)', district: 'Amarilis', reference: 'Urb. Portada del Sol', keywords: ['portada del sol'] },
  { id: 'ama-jr-huallaga', name: 'Jr. Huallaga (Amarilis)', district: 'Amarilis', reference: 'Paucarbamba', keywords: ['jr huallaga amarilis', 'huallaga'] },
  { id: 'ama-jr-cahuide', name: 'Jr. Cahuide (Amarilis)', district: 'Amarilis', reference: 'Paucarbamba', keywords: ['jr cahuide', 'cahuide'] },
  { id: 'ama-jr-los-pinos', name: 'Jr. Los Pinos (Amarilis)', district: 'Amarilis', reference: 'Paucarbamba', keywords: ['jr los pinos', 'los pinos'] },
  { id: 'ama-hospital-essalud', name: 'Hospital EsSalud II Huánuco (Amarilis)', district: 'Amarilis', reference: 'Cerca a Vía Colectora', keywords: ['hospital essalud', 'seguro essalud'] },
  { id: 'ama-malecon-huallaga', name: 'Malecón Huallaga (Amarilis)', district: 'Amarilis', reference: 'Ribera en Paucarbamba', keywords: ['malecon amarilis', 'malecon huallaga'] },

  // ==========================================
  // DISTRITO DE PILLCO MARCA
  // ==========================================
  { id: 'pil-cayhuayna-baja', name: 'Cayhuayna Baja (Pillco Marca)', district: 'Pillco Marca', reference: 'Zona baja de Cayhuayna', keywords: ['cayhuayna baja', 'cayhuayna'] },
  { id: 'pil-cayhuayna-alta', name: 'Cayhuayna Alta (Pillco Marca)', district: 'Pillco Marca', reference: 'Zona alta de Cayhuayna', keywords: ['cayhuayna alta'] },
  { id: 'pil-unheval', name: 'Campus Universitario UNHEVAL (Pillco Marca)', district: 'Pillco Marca', reference: 'Universidad Nacional Hermilio Valdizán', keywords: ['unheval', 'universidad valdizan', 'campus universitario'] },
  { id: 'pil-av-universitaria', name: 'Av. Universitaria (Pillco Marca)', district: 'Pillco Marca', reference: 'Avenida frente a la UNHEVAL', keywords: ['av universitaria', 'universitaria'] },
  { id: 'pil-av-velasco', name: 'Av. Juan Velasco Alvarado (Pillco Marca)', district: 'Pillco Marca', reference: 'Av. Juan Velasco', keywords: ['juan velasco alvarado', 'av velasco'] },
  { id: 'pil-potracancha', name: 'Potracancha (Pillco Marca)', district: 'Pillco Marca', reference: 'Zona Potracancha', keywords: ['potracancha'] },
  { id: 'pil-yanag', name: 'Yanag (Pillco Marca)', district: 'Pillco Marca', reference: 'Zona Yanag', keywords: ['yanag'] },
  { id: 'pil-marabamba', name: 'Marabamba (Pillco Marca)', district: 'Pillco Marca', reference: 'Zona Marabamba', keywords: ['marabamba'] },
  { id: 'pil-pitumama', name: 'Pitumama (Pillco Marca)', district: 'Pillco Marca', reference: 'Zona Pitumama', keywords: ['pitumama'] },
  { id: 'pil-otorongo', name: 'Otorongo (Pillco Marca)', district: 'Pillco Marca', reference: 'Zona Otorongo', keywords: ['otorongo'] },

  // ==========================================
  // ALREDEDORES Y PERSONALIZADO
  // ==========================================
  { id: 'valle-santa-maria', name: 'Santa María del Valle', district: 'Alrededores', reference: 'Valle de Huánuco', keywords: ['santa maria del valle', 'el valle'] },
  { id: 'valle-kotosh', name: 'Kotosh (Templo de las Manos Cruzadas)', district: 'Alrededores', reference: 'Zona arqueológica Kotosh', keywords: ['kotosh', 'manos cruzadas'] },
  { id: 'valle-la-florida', name: 'La Florida / Rancho', district: 'Alrededores', reference: 'Alrededores de Huánuco', keywords: ['la florida', 'rancho'] },
  { id: 'otra-zona', name: 'Otra dirección en Huánuco (especificar abajo)', district: 'Personalizado', reference: 'Escribe tu calle o pasaje exacto en la dirección', keywords: ['otra', 'otro', 'personalizado'] },
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
  const [selectedZone, setSelectedZone] = useState<string>('Jr. Crespo Castillo (Huánuco Centro)');
  const [zoneSearch, setZoneSearch] = useState<string>('');
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState<boolean>(false);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Yape' | 'Plin' | 'Efectivo' | 'Transferencia'>('Yape');
  const [notes, setNotes] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  // Filter Huánuco zones and streets in search with tokenized normalization
  const filteredZones = useMemo(() => {
    if (!zoneSearch.trim()) return HUANUCO_ZONES;
    const cleanQuery = normalizeSearchText(zoneSearch);
    const queryTokens = cleanQuery.split(' ').filter(Boolean);

    return HUANUCO_ZONES.filter(z => {
      const fullText = normalizeSearchText(
        `${z.name} ${z.district} ${z.reference || ''} ${(z.keywords || []).join(' ')}`
      );
      return queryTokens.every(token => fullText.includes(token));
    });
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
                                placeholder="Buscar calle, jirón o zona (ej. Jr. Ayacucho, Pedro Puelles, Psje. Cárdenas)..."
                                value={zoneSearch}
                                onChange={(e) => setZoneSearch(e.target.value)}
                                className="w-full bg-white pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#EADBEE] focus:ring-2 focus:ring-[#9368B7] focus:outline-none"
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* Filtered Zones List */}
                          <div className="max-h-56 overflow-y-auto divide-y divide-[#FAF8F5]">
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
                                      <span className="block truncate text-[11px] font-semibold">{z.name}</span>
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
                                <span>No encontramos esa calle exacta en la lista rápida.</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedZone('Otra dirección en Huánuco (especificar abajo)');
                                    setIsZoneDropdownOpen(false);
                                    setZoneSearch('');
                                  }}
                                  className="block mx-auto mt-1 text-[#9368B7] font-bold underline"
                                >
                                  Usar &quot;Otra dirección personalizada&quot;
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
