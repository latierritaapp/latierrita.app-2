import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ExternalLink,
  Plus,
  Settings,
  X,
  Upload,
  Trash2,
  Check
} from 'lucide-react';
import { optimizeBannerImage } from '../lib/imageOptimizer';
import { AdCategory, AD_CAROUSEL_CATEGORIES } from '../types';

interface AdCarouselProps {
  type?: 'inicio' | 'explorar';
}

export const AdCarousel: React.FC<AdCarouselProps> = ({ type = 'inicio' }) => {
  const {
    adBanners,
    addAdBanner,
    deleteAdBanner,
    isStaffMode,
    openStaffAdminWithTab,
    openReportModal,
    currentUser
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Quick Inline Upload State for direct management on Inicio
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState(false);
  const [quickImage, setQuickImage] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSubtitle, setQuickSubtitle] = useState('');
  const [quickSponsor, setQuickSponsor] = useState('');
  const [quickCtaText, setQuickCtaText] = useState('Ver detalles');
  const [quickCtaUrl, setQuickCtaUrl] = useState('');
  const [quickCategory, setQuickCategory] = useState<AdCategory>('Restaurante');
  const [quickTargetType, setQuickTargetType] = useState<'inicio' | 'explorar' | 'ambos'>(type || 'inicio');

  const isAdmin =
    isStaffMode ||
    currentUser?.staffRole === 'ADMIN' ||
    currentUser?.username === 'latierrita_app' ||
    currentUser?.id === 'user-staff';

  const targetTab = type === 'explorar' ? 'carrusel_02' : 'carrusel_01';

  const activeBanners = (adBanners || []).filter(
    b =>
      b &&
      (type === 'explorar'
        ? b.carouselType === 'explorar' || b.carouselType === 'ambos'
        : b.carouselType === 'inicio' || b.carouselType === 'ambos' || !b.carouselType)
  );

  // Auto-play carousel every 3 seconds if not hovered
  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeBanners.length, isHovered]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeBannerImage(file);
        setQuickImage(optimized);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setQuickImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleQuickSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickImage.trim()) return;

    let formattedUrl = quickCtaUrl.trim();
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    addAdBanner({
      title: quickTitle.trim() || '',
      subtitle: quickSubtitle.trim().slice(0, 100) || '',
      imageUrl: quickImage.trim(),
      sponsorName: quickSponsor.trim() || 'Staff',
      sponsorCity: 'Toda España',
      ctaText: quickCtaText.trim() || (formattedUrl ? 'Ver detalles' : ''),
      ctaLink: formattedUrl,
      category: quickCategory || 'Evento',
      carouselType: quickTargetType || type || 'inicio'
    });

    // Reset inputs and close modal
    setQuickImage('');
    setQuickTitle('');
    setQuickSubtitle('');
    setQuickSponsor('');
    setQuickCtaText('Ver detalles');
    setQuickCtaUrl('');
    setIsQuickUploadOpen(false);
    setCurrentIndex(0);
  };

  // Inline modal component rendering
  const renderQuickUploadModal = () => (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={() => setIsQuickUploadOpen(false)}
    >
      <div
        className="relative max-w-lg w-full rounded-2xl border border-white/20 bg-[#001c38] text-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center font-black">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <h3 className="text-sm font-black text-white">
              Subir Imagen al Carrusel {type === 'explorar' ? 'de Explorar' : 'de Inicio'}
            </h3>
          </div>
          <button
            onClick={() => setIsQuickUploadOpen(false)}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleQuickSubmit} className="space-y-3 text-xs">
          {/* File upload from device */}
          <div>
            <label className="block text-[11px] font-bold text-amber-300 mb-1">
              Seleccionar Imagen desde la Galería o pegar URL *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={quickImage}
                onChange={e => setQuickImage(e.target.value)}
                placeholder="Pega la URL de la imagen o presiona Galería..."
                className="flex-1 bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
              />
              <label className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md transition-all active:scale-95 text-xs">
                <Upload className="w-4 h-4 stroke-[2.5]" />
                <span>Galería</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          {/* Image Preview */}
          {quickImage && (
            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-amber-400/40 group shadow-lg">
              <img src={quickImage} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[10px] text-amber-300 font-bold border border-amber-400/30">
                Vista Previa
              </div>
              <button
                type="button"
                onClick={() => setQuickImage('')}
                className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer shadow"
                title="Quitar esta imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Target Location */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 mb-1">
              Ubicación del Carrusel
            </label>
            <select
              value={quickTargetType}
              onChange={e => setQuickTargetType(e.target.value as any)}
              className="w-full bg-[#002855] text-white px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="inicio">Solo en Inicio (Debajo de Historias)</option>
              <option value="explorar">Solo en Explorar</option>
              <option value="ambos">En Ambos Carruseles (Inicio y Explorar)</option>
            </select>
          </div>

          {/* Optional Title */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 mb-1">
              Título (Opcional)
            </label>
            <input
              type="text"
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              placeholder="ej. Gran Evento Tricolor en Madrid"
              className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Optional Subtitle */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 mb-1">
              Subtítulo / Descripción corta (Opcional)
            </label>
            <input
              type="text"
              maxLength={100}
              value={quickSubtitle}
              onChange={e => setQuickSubtitle(e.target.value)}
              placeholder="ej. Muestra este flyer para recibir 10% de descuento."
              className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Sponsor & Category */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-white/70 mb-1">
                Patrocinador
              </label>
              <input
                type="text"
                value={quickSponsor}
                onChange={e => setQuickSponsor(e.target.value)}
                placeholder="ej. La Tierrita Oficial"
                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/70 mb-1">
                Categoría
              </label>
              <select
                value={quickCategory}
                onChange={e => setQuickCategory(e.target.value as AdCategory)}
                className="w-full bg-[#002855] text-white px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                {AD_CAROUSEL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CTA Button and URL */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-white/70 mb-1">
                Texto del Botón CTA
              </label>
              <input
                type="text"
                value={quickCtaText}
                onChange={e => setQuickCtaText(e.target.value)}
                placeholder="ej. Ver detalles"
                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/70 mb-1">
                URL de Destino
              </label>
              <input
                type="text"
                value={quickCtaUrl}
                onChange={e => setQuickCtaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsQuickUploadOpen(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!quickImage.trim()}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Publicar en {quickTargetType === 'explorar' ? 'Explorar' : 'Inicio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Empty state
  if (activeBanners.length === 0) {
    return (
      <>
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
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setQuickTargetType(type || 'inicio');
                  setIsQuickUploadOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
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

        {/* Quick Upload Modal */}
        {isQuickUploadOpen && renderQuickUploadModal()}
      </>
    );
  }

  const safeIndex = currentIndex < activeBanners.length && currentIndex >= 0 ? currentIndex : 0;
  const currentBanner = activeBanners[safeIndex];
  if (!currentBanner) return null;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  const hasBottomDetails = Boolean(
    (currentBanner.title && currentBanner.title.trim().length > 0) ||
      (currentBanner.subtitle && currentBanner.subtitle.trim().length > 0) ||
      (currentBanner.ctaText && currentBanner.ctaText.trim().length > 0 && currentBanner.ctaLink && currentBanner.ctaLink.trim().length > 0)
  );

  return (
    <>
      <section
        aria-label="Carrusel de anuncios destacados"
        className="w-full max-w-2xl mx-auto px-0 sm:px-4 py-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative rounded-none sm:rounded-2xl overflow-hidden shadow-xl border-y sm:border border-white/15 bg-neutral-950 group">
          {/* Main Banner Image Container */}
          <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden bg-neutral-900">
            <div
              className="flex w-full h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${safeIndex * 100}%)` }}
            >
              {activeBanners.map((banner, idx) => (
                <div
                  key={banner.id || idx}
                  className="w-full h-full shrink-0 relative flex items-center justify-center"
                >
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Anuncio oficial'}
                      loading="eager"
                      decoding="sync"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02] block select-none pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white/40 text-xs">
                      Sin imagen
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top Controls: Badges, Direct Quick Add & Delete */}
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
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickTargetType(type || 'inicio');
                      setIsQuickUploadOpen(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-neutral-950 px-2.5 py-1 rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer active:scale-95"
                    title="Añadir nueva imagen directamente a este carrusel"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Añadir Imagen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Eliminar la imagen "${currentBanner.title || 'seleccionada'}" de este carrusel?`
                        )
                      ) {
                        deleteAdBanner(currentBanner.id);
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold bg-rose-600/90 hover:bg-rose-600 text-white px-2 py-1 rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer active:scale-95"
                    title="Eliminar esta imagen del carrusel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openStaffAdminWithTab(targetTab)}
                    className="p-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer"
                    title="Abrir panel avanzado STAFF"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Details & CTA outside image container */}
        {hasBottomDetails && (
          <div className="mt-2.5 mx-3 sm:mx-0 px-3.5 py-3 bg-neutral-900/90 rounded-2xl border border-white/10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="max-w-md">
              {currentBanner.title && (
                <h4 className="text-sm sm:text-base font-black leading-tight text-white">
                  {currentBanner.title}
                </h4>
              )}
              {currentBanner.subtitle && (
                <p className="text-xs text-neutral-300 line-clamp-2 mt-0.5">
                  {currentBanner.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
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

        {/* Thumbnail Preview Strip if multiple images */}
        {activeBanners.length > 1 && (
          <div className="flex items-center gap-2 mt-2 px-3 sm:px-0 overflow-x-auto pb-1 scrollbar-none">
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

      {/* Quick Upload Modal */}
      {isQuickUploadOpen && renderQuickUploadModal()}

    </>
  );
};
