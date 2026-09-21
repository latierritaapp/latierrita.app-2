import React from 'react';

interface FlagProps {
  className?: string;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  xs: 'w-3.5 h-2.5',
  sm: 'w-4 h-3',
  md: 'w-5 h-3.5',
  lg: 'w-6 h-4',
  xl: 'w-8 h-5.5'
};

export const FlagColombia: React.FC<FlagProps> = ({ className, title = 'Colombia', size = 'sm' }) => {
  const sizeClass = sizeMap[size] || sizeMap.sm;
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${className || ''}`}
      title={title}
      aria-label="Bandera de Colombia"
    >
      <svg
        viewBox="0 0 900 600"
        className={`${sizeClass} rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.25)] overflow-hidden border border-black/10`}
      >
        <rect width="900" height="600" fill="#CE1126" />
        <rect width="900" height="450" fill="#003893" />
        <rect width="900" height="300" fill="#FCD116" />
      </svg>
    </span>
  );
};

export const FlagSpain: React.FC<FlagProps> = ({ className, title = 'España', size = 'sm' }) => {
  const sizeClass = sizeMap[size] || sizeMap.sm;
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${className || ''}`}
      title={title}
      aria-label="Bandera de España"
    >
      <svg
        viewBox="0 0 750 500"
        className={`${sizeClass} rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.25)] overflow-hidden border border-black/10`}
      >
        <rect width="750" height="500" fill="#AA151B" />
        <rect width="750" height="250" y="125" fill="#F1BF00" />
        {/* Simplified heraldic shield element */}
        <g transform="translate(180, 190) scale(0.65)">
          <path
            d="M0,0 h60 v60 a30,30 0 0,1 -60,0 z"
            fill="#AA151B"
            stroke="#900"
            strokeWidth="2"
          />
          <path
            d="M6,6 h48 v48 a24,24 0 0,1 -48,0 z"
            fill="#F1BF00"
          />
          <circle cx="30" cy="30" r="10" fill="#003893" />
          <path
            d="M10,-10 L50,-10 L45,-2 L15,-2 Z"
            fill="#AA151B"
            stroke="#F1BF00"
            strokeWidth="2"
          />
        </g>
      </svg>
    </span>
  );
};

export interface CountryFlagProps extends FlagProps {
  code: 'CO' | 'ES' | 'colombia' | 'spain' | 'espana' | string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ code, className, title, size }) => {
  const normalized = (code || '').toUpperCase();
  if (normalized === 'CO' || normalized === 'COLOMBIA') {
    return <FlagColombia className={className} title={title || 'Colombia'} size={size} />;
  }
  if (normalized === 'ES' || normalized === 'SPAIN' || normalized === 'ESPANA' || normalized === 'ESPAÑA') {
    return <FlagSpain className={className} title={title || 'España'} size={size} />;
  }
  return <FlagColombia className={className} title={title} size={size} />;
};

export const renderTextWithFlags = (text: string, flagSize: 'xs' | 'sm' | 'md' = 'xs'): React.ReactNode => {
  if (!text) return null;
  const regex = /(\uD83C\uDDE8\uD83C\uDDF4|\uD83C\uDDEA\uD83C\uDDF8|🇨🇴|🇪🇸|:co:|:es:|:colombia:|:espana:|:españa:)/gi;
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    const p = part.toLowerCase();
    if (part === '🇨🇴' || part === '\uD83C\uDDE8\uD83C\uDDF4' || p === ':co:' || p === ':colombia:') {
      return <FlagColombia key={index} size={flagSize} className="inline-block mx-0.5 align-baseline" />;
    }
    if (part === '🇪🇸' || part === '\uD83C\uDDEA\uD83C\uDDF8' || p === ':es:' || p === ':espana:' || p === ':españa:') {
      return <FlagSpain key={index} size={flagSize} className="inline-block mx-0.5 align-baseline" />;
    }
    return part;
  });
};

export const RichTextWithFlags: React.FC<{
  text: string;
  className?: string;
  flagSize?: 'xs' | 'sm' | 'md';
}> = ({ text, className, flagSize = 'xs' }) => {
  return <span className={className}>{renderTextWithFlags(text, flagSize)}</span>;
};

