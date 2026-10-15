import React from 'react';

interface HoshiCatWatermarkProps {
  className?: string;
}

export default function HoshiCatWatermark({ className = "w-80 h-80 text-white/20" }: HoshiCatWatermarkProps) {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-hidden="true"
    >
      {/* Círculo exterior representativo del sello Hoshi */}
      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="5.5" />
      
      {/* Estrella superior en la frente (Hoshi = Estrella) */}
      <polygon 
        points="100,16 106,32 123,32 109,42 114,58 100,48 86,58 91,42 77,32 94,32" 
        fill="currentColor" 
      />

      {/* Línea de la frente conectando hacia las orejas */}
      <path 
        d="M 66 62 Q 100 70 134 62" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round" 
      />

      {/* Oreja izquierda puntiaguda */}
      <path 
        d="M 66 62 L 36 38 C 30 52 24 66 22 80" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Oreja derecha puntiaguda */}
      <path 
        d="M 134 62 L 164 38 C 170 52 176 66 178 80" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Mechones de la mejilla izquierda estilo anime/kawaii */}
      <path 
        d="M 22 80 L 42 94 L 20 114 L 44 126 C 60 148 78 160 100 164" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Mechones de la mejilla derecha */}
      <path 
        d="M 178 80 L 158 94 L 180 114 L 156 126 C 140 148 122 160 100 164" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Ojos sonrientes curvos (estilo feliz coreano) */}
      <path 
        d="M 52 104 C 58 92 74 92 82 104" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      <path 
        d="M 118 104 C 126 92 142 92 148 104" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />

      {/* Nariz redondeada en forma de corazón invertido */}
      <path 
        d="M 91 116 C 91 110 109 110 109 116 C 109 125 91 125 91 116 Z" 
        fill="currentColor" 
      />

      {/* Línea vertical del hocico al mentón */}
      <path 
        d="M 100 123 L 100 164" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round" 
      />

      {/* Mofletes / hocico sonriente */}
      <path 
        d="M 78 138 C 88 144 100 144 100 144 C 100 144 112 144 122 138" 
        stroke="currentColor" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
      />
    </svg>
  );
}
