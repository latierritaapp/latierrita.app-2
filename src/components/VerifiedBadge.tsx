import React from 'react';

interface VerifiedBadgeProps {
  className?: string;
  size?: string;
  title?: string;
}

/**
 * VerifiedBadge - Insignia oficial de cuenta o entidad verificada.
 * Diseño estándar de alto contraste: Fondo azul cielo (#0284c7) con check blanco (#ffffff).
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className = '',
  size = 'w-4 h-4',
  title = 'Cuenta verificada'
}) => {
  const combinedClass = className ? className : size;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${combinedClass}`}
      title={title}
      aria-label={title}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full shrink-0 drop-shadow-xs"
        aria-hidden="true"
      >
        <path
          fill="#0284c7"
          d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.05 1.273 2.42 2.148 4 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-1.05 2.148-2.42 2.148-4z"
        />
        <path
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.8 12.4l3.2 3.2 5.8-5.8"
        />
      </svg>
    </span>
  );
};

export default VerifiedBadge;
