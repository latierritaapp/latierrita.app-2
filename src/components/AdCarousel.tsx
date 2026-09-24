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
    b => b.active && (!type || b.carouselType === type || b.carouselType === 'ambos' || !b.carouselType)
  );

  // Auto-play carousel every 5.5 seconds if not hovered
  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [activeBanners.length, isHovered]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex];

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
        {/* Banner image with dark gradient overlay */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden">
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/70 via-transparent to-transparent"></div>
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
