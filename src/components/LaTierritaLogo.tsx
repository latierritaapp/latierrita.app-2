import React from 'react';

interface LaTierritaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
}

export const LaTierritaLogo: React.FC<LaTierritaLogoProps> = ({
  className = '',
  size = 'md',
  title = 'La Tierrita',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 sm:h-11 w-auto',
    lg: 'h-14 sm:h-16 w-auto',
    xl: 'h-20 sm:h-24 w-auto',
  };

  const finalClass = className || sizeClasses[size];

  return (
    <img
      id="img-la-tierrita-logo"
      src="/logo.png"
      alt={title}
      title={title}
      className={`select-none shrink-0 object-contain ${finalClass}`}
      loading="eager"
      decoding="async"
    />
  );
};

export default LaTierritaLogo;

