import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, ExternalLink, Plus, Settings, Flag, Maximize2, X } from 'lucide-react';

interface AdCarouselProps {
  type?: 'inicio' | 'explorar';
}

export const AdCarousel: React.FC<AdCarouselProps> = ({ type }) => {
  const { adBanners, isStaffMode, setIsStaffAdminOpen, openReportModal } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);

  const activeBanners = adBanners.filter(
    b => b && (type === 'explorar' 
      ? (b.carouselType === 'explorar' || b.carouselType === 'ambos') 
      : (b.carouselType === 'inicio' || b.carouselType === 'ambos' || !b.carouselType))
  );

  // Auto-play carousel every 6 seconds if not hovered
  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 6000);
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
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
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

  const hasBottomDetails = Boolean(
    currentBanner.title || 
    currentBanner.subtitle || 
    currentBanner.sponsorName || 
    (currentBanner.ctaText && currentBanner.ctaLink)
  );

  return (
    <>
      <section
        aria-label="Carrusel de anuncios destacados"
        className="w-full max-w-2xl mx-auto px-4 py-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-white/15 bg-neutral-950 group">
          {/* Main Banner Image Container with Explicit Fixed Height */}
          <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden bg-neutral-900 flex items-center justify-center">
            {currentBanner.imageUrl ? (
              <img
                src={currentBanner.imageUrl}
                alt={currentBanner.title || 'Anuncio oficial'}
                loading="eager"
                decoding="sync"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02] cursor-pointer block"
                onClick={() => setSelectedZoomImage(currentBanner.imageUrl)}
              />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white/40 text-xs">
                Sin imagen
              </div>
            )}

            {/* Subtle Gradient only if bottom text details exist */}
            {hasBottomDetails && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none"></div>
            )}
          </div>

          {/* Top Controls: Badges, Zoom and Staff Manage */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              {currentBanner.category && (
                <span className="text-[11px] font-bold bg-black/70 text-white backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 shadow-md">
                  {currentBanner.category}
                </span>
              )}
              {currentBanner.discountBadge && (
                <span className="text-[11px] font-extrabold bg-rose-600 text-white px-2.5 py-1 rounded-lg shadow-md">
                  {currentBanner.discountBadge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {currentBanner.imageUrl && (
                <button
                  type="button"
                  onClick={() => setSelectedZoomImage(currentBanner.imageUrl)}
                  className="p-1.5 bg-black/60 hover:bg-black/90 text-white/90 hover:text-white rounded-lg border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-md"
                  title="Ver imagen completa"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              {isStaffMode && (
                <button
                  id="btn-staff-quick-edit-banner"
                  onClick={() => setIsStaffAdminOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-bold bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer"
                  title="Administrar publicidad como STAFF"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Gestionar</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Details & CTA */}
          {hasBottomDetails && (
            <div className="absolute bottom-3 left-3 right-3 z-20 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3 pointer-events-auto">
              <div className="max-w-md drop-shadow-md">
                {currentBanner.sponsorName && (
                  <span className="text-xs text-amber-300 font-semibold block mb-0.5">
                    {currentBanner.sponsorName} {currentBanner.sponsorCity ? `· ${currentBanner.sponsorCity}` : ''}
                  </span>
                )}
                {currentBanner.title && (
                  <h4 className="text-base sm:text-lg font-black leading-tight drop-shadow">
                    {currentBanner.title}
                  </h4>
                )}
                {currentBanner.subtitle && (
                  <p className="text-xs text-neutral-200 line-clamp-1 mt-0.5">
                    {currentBanner.subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id={`btn-report-banner-${currentBanner.id}`}
                  type="button"
                  onClick={() => {
                    openReportModal({
                      id: currentBanner.id,
                      type: 'support',
                      title: `Anuncio: ${currentBanner.title || 'Publicidad'} (${currentBanner.sponsorName || 'Staff'})`,
                      initialTicketType: 'TRA'
                    });
                  }}
                  className="p-2 text-white/70 hover:text-rose-400 bg-black/60 hover:bg-black/90 rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold backdrop-blur-md"
                  title="Reportar este anuncio (TRA)"
                >
                  <Flag className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Reportar</span>
                </button>
                {currentBanner.ctaLink && currentBanner.ctaText && (
                  <a
                    id={`btn-carousel-cta-${currentBanner.id}`}
                    href={currentBanner.ctaLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    <span>{currentBanner.ctaText}</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Carousel Navigation Arrows */}
          {activeBanners.length > 1 && (
            <>
              <button
                id="btn-carousel-prev"
                onClick={handlePrev}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 shadow-lg cursor-pointer"
                title="Anuncio anterior"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                id="btn-carousel-next"
                onClick={handleNext}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 shadow-lg cursor-pointer"
                title="Siguiente anuncio"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </>
          )}

          {/* Pagination Indicators */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              {activeBanners.map((banner, i) => (
                <button
                  key={banner.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === currentIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Ir a imagen ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Preview Strip if multiple images */}
        {activeBanners.length > 1 && (
          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
            {activeBanners.map((b, idx) => (
              <button
                key={`thumb-${b.id}`}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-12 w-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                    : 'border-white/15 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={b.imageUrl}
                  alt={b.title || `Anuncio ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Full-Screen Zoom Modal for Flyers & Posters */}
      {selectedZoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedZoomImage(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] w-full rounded-2xl overflow-hidden border border-white/20 bg-neutral-950 flex items-center justify-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedZoomImage(null)}
              className="absolute top-3 right-3 z-30 p-2 bg-black/70 hover:bg-black text-white rounded-full border border-white/20 transition-all cursor-pointer"
              title="Cerrar vista completa"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedZoomImage}
              alt="Anuncio en pantalla completa"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

