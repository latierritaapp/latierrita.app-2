import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, ExternalLink, Plus, Settings, Flag } from 'lucide-react';

interface AdCarouselProps {
  type?: 'inicio' | 'explorar';
}

export const AdCarousel: React.FC<AdCarouselProps> = ({ type }) => {
  const { adBanners, isStaffMode, setIsStaffAdminOpen, openReportModal } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const activeBanners = adBanners.filter(
    b => b && b.active !== false && (!type || (b.carouselType || 'inicio') === type || (b.carouselType as string) === 'ambos')
  );

  // Auto-play carousel every 5.5 seconds if not hovered
  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [activeBanners.length, isHovered]);

  if (activeBanners.length === 0) {
    return (
      <section
        aria-label="Carrusel de anuncios destacados"
        className="w-full max-w-2xl mx-auto px-4 py-3"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-950 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              {type === 'explorar' ? 'Carrusel 02 · Explorar' : 'Carrusel 01 · Inicio'}
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              🇨🇴 Espacio Publicitario y Oficial
            </h4>
            <p className="text-xs text-white/70 max-w-sm">
              Anuncios oficiales, eventos y promociones de la comunidad colombiana en España.
            </p>
          </div>
          {isStaffMode ? (
            <button
              onClick={() => setIsStaffAdminOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Subir Imagen al Carrusel</span>
            </button>
          ) : (
            <a
              href="https://latierrita.es"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Conoce Más</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </section>
    );
  }

  const safeIndex = (currentIndex < activeBanners.length && currentIndex >= 0) ? currentIndex : 0;
  const currentBanner = activeBanners[safeIndex];
  if (!currentBanner) return null;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  return (
    <section
      aria-label="Carrusel de anuncios destacados"
      className="w-full max-w-2xl mx-auto px-4 py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-neutral-900 group">
        {/* Banner image */}
        <div className="relative h-48 sm:h-60 w-full overflow-hidden bg-neutral-950 flex items-center justify-center">
          {currentBanner.imageUrl ? (
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title || 'Anuncio publicitario'}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white/40 text-xs">
              Sin imagen
            </div>
          )}
          {/* Subtle bottom gradient to keep text readable without darkening the whole picture */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none"></div>
        </div>

        {/* Top Badges & Staff Admin Controls */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/20">
              {currentBanner.category}
            </span>
            {currentBanner.discountBadge && (
              <span className="text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-sm">
                {currentBanner.discountBadge}
              </span>
            )}
          </div>

          {isStaffMode && (
            <button
              id="btn-staff-quick-edit-banner"
              onClick={() => setIsStaffAdminOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg backdrop-blur-md transition-all"
              title="Administrar publicidad como STAFF"
            >
              <Settings className="w-3 h-3" />
              <span>Gestionar</span>
            </button>
          )}
        </div>

        {/* Banner Details & CTA */}
        <div className="absolute bottom-3 left-3 right-3 z-20 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="max-w-md">
            <span className="text-xs text-amber-400 font-medium block">
              {currentBanner.sponsorName} · {currentBanner.sponsorCity}
            </span>
            <h4 className="text-base sm:text-lg font-extrabold leading-tight drop-shadow-md">
              {currentBanner.title}
            </h4>
            <p className="text-xs text-neutral-300 line-clamp-1 mt-0.5">
              {currentBanner.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id={`btn-report-banner-${currentBanner.id}`}
              type="button"
              onClick={() => {
                openReportModal({
                  id: currentBanner.id,
                  type: 'support',
                  title: `Anuncio: ${currentBanner.title} (${currentBanner.sponsorName})`,
                  initialTicketType: 'TRA'
                });
              }}
              className="p-2 text-white/70 hover:text-rose-400 bg-black/50 hover:bg-black/80 rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold backdrop-blur-md"
              title="Reportar este anuncio (TRA)"
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Reportar</span>
            </button>
            <a
              id={`btn-carousel-cta-${currentBanner.id}`}
              href={currentBanner.ctaLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
            >
              <span>{currentBanner.ctaText}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              id="btn-carousel-prev"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
              title="Anuncio anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="btn-carousel-next"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
              title="Siguiente anuncio"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {activeBanners.map((banner, i) => (
              <button
                key={banner.id}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40'
                }`}
                title={`Ir a anuncio ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
