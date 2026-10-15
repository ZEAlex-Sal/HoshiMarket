# ⭐ Hoshi Market (호시마켓) - Catálogo Digital & Sistema de Promociones

Sistema web moderno desarrollado para **Hoshi Market** (ubicado en **Jr. Crespo Castillo 614, Huánuco, Perú**), tienda especializada en productos coreanos, ramens virales, paletas Melona, bebidas asiáticas, artículos de K-pop y mangas.

---

## 🎨 Características Implementadas

1. **Identidad Visual & Estética Coreana:**
   - Paleta de color inspirada en la tienda: **Lila Mate** (`#9368B7`), **Lavanda Suave** (`#EFE6F7`) y **Blanco Leche / Crema Cálido** (`#FAF8F5`).
   - Tipografía limpia con soporte para nombres originales en coreano (Hangul).

2. **Catálogo Digital para más de 500 Productos:**
   - Visualización de foto en alta resolución, nombre en español y coreano, descripción detallada, precio por unidad en Soles (`S/.`) y stock en tiempo real.
   - **Aviso en la parte superior de cada tarjeta (Card):** Estrella y badge llamativo con efecto sutil (`⭐ ¡EN PROMOCIÓN!`, `🔥 2x1 BULDAK`, `🍦 3x2 MELONA`, etc.).
   - Filtro reactivo por categorías dinámicas (Ramens, Helados, Bebidas, Snacks, K-Pop, Mangas, Cuidado Facial).
   - Buscador predictivo en tiempo real por nombre, código SKU o categoría.

3. **Motor Dinámico de Promociones & Fechas Especiales:**
   - Soporte para reglas automáticas en el carrito:
     - **2x1** (Lleva 2 y paga 1).
     - **3x2** (Lleva 3 y paga 2).
     - **% de Descuento directo**.
     - **Combos y Packs**.
   - Variaciones estacionales por fechas: **Halloween 🎃**, **Navidad 🎄**, **San Valentín 💖**, **Verano ☀️** y **Aniversario**.
   - El carrito calcula el descuento automáticamente en tiempo real mostrando al cliente cuánto está ahorrando.

4. **Cierre de Pedidos por WhatsApp Oficial (`+51 969 399 589`):**
   - Sin comisiones bancarias ni pasarelas de pago complejas.
   - El cliente llena su canasta, elige entre *Recojo en tienda (Jr. Crespo Castillo 614)* o *Delivery en Huánuco*, selecciona su método de pago (Yape, Plin, Efectivo, Transferencia) y envía el pedido formateado directamente al WhatsApp de la tienda.

5. **Panel de Administración Oculto (`/admin`):**
   - **Ruta no indexada ni visible en la navegación pública.**
   - Acceso protegido por PIN de seguridad del dueño (PIN por defecto: `hoshi2026` o `6140`).
   - **Gestor de Productos:** Crear, editar precios, stock, fotos y asignar promociones.
   - **Gestor de Categorías:** Crear nuevas categorías en cualquier momento (ej. "Ediciones Limitadas").
   - **Gestor de Promociones:** Crear y alternar promociones 2x1 y campañas temáticas.
   - **Sincronizador con Facturación Física (Excel / CSV):** Permite subir el archivo exportado del sistema de punto de venta del local para actualizar precios y stock masivamente en 3 segundos sin depender de la agencia que creó el facturador.
   - **Configuración de Tienda:** Cambiar número de WhatsApp, banner de bienvenida y horarios.

6. **Base de Datos y Despliegue:**
   - **Supabase (PostgreSQL + Storage):** Esquema SQL completo en `supabase/schema.sql` con Row Level Security (RLS) y bucket para imágenes.
   - **Vercel:** Preparado para despliegue instantáneo con CI/CD conectado a GitHub.

---

## 🚀 Inicio Rápido en Entorno Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre tu navegador en:
- **Catálogo Público:** [http://localhost:3000](http://localhost:3000)
- **Panel Administrativo Oculto:** [http://localhost:3000/admin](http://localhost:3000/admin) *(PIN por defecto: `hoshi2026`)*

---

## 📦 Conexión a GitHub y Despliegue en Vercel

### 1. Subir a tu repositorio de GitHub:
```bash
git add .
git commit -m "feat: Hoshi Market catálogo, motor de promociones 2x1 y panel admin"

# Crear repo en GitHub y vincular:
git remote add origin https://github.com/TU_USUARIO/HoshiMarket.git
git branch -M main
git push -u origin main
```

### 2. Despliegue en Vercel:
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New Project"** e importa el repositorio `HoshiMarket`.
3. Vercel detectará automáticamente Next.js.
4. En **Environment Variables**, añade las variables de `.env.example` (de tu proyecto en Supabase).
5. Haz clic en **Deploy**. ¡Tu web estará en vivo en minutos bajo una URL como `hoshimarket.vercel.app`!
6. Cuando el dueño decida comprar un dominio (ej. `hoshimarket.pe` o `hoshimarket.com`), se agrega en Vercel en la pestaña *Settings -> Domains* en 1 clic.

---

## 🗄️ Configuración de Supabase (Opcional para Modo Nube)

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta el script ubicado en:
   `supabase/schema.sql`
3. Copia tu `Project URL` y `anon key` desde *Project Settings -> API* a tu archivo `.env.local`.

---

## 📍 Datos de la Tienda
- **Ubicación:** Jr. Crespo Castillo 614, Huánuco, Perú
- **WhatsApp:** +51 969 399 589
- **Instagram:** [@hoshihco](https://www.instagram.com/hoshihco/)
