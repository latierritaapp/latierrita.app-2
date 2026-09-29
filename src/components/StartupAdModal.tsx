import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles, ExternalLink, ShieldCheck, Flag } from 'lucide-react';

export const StartupAdModal: React.FC = () => {
  const { startupAdOpen, dismissStartupAd, startupAdConfig, openReportModal } = useApp();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!startupAdOpen) return;
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [startupAdOpen]);

  if (!startupAdOpen || !startupAdConfig || startupAdConfig.active === false) return null;

  return (
    <div
      id="startup-ad-backdrop"
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Publicidad destacada"
    >
      <div
        id="startup-ad-container"
        className="relative w-full max-w-sm sm:max-w-md bg-neutral-900 border border-neutral-700/80 rounded-2xl overflow-hidden shadow-2xl transform transition-all animate-scaleUp max-h-[95vh] flex flex-col"
      >
        {/* Quick Close Button - Icon only */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <button
            id="btn-quick-close-ad"
            onClick={dismissStartupAd}
            className="p-2 bg-black/75 hover:bg-black text-white rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-110 cursor-pointer flex items-center justify-center"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top badge */}
        {(startupAdConfig.showBadgeText ?? true) && (
          <div className="absolute top-3 left-3 z-30">
            <span className="inline-flex items-center gap-1 bg-amber-500/95 text-neutral-950 text-xs font-black px-3 py-1 rounded-full shadow-md backdrop-blur-md border border-amber-400/40">
              <Sparkles className="w-3.5 h-3.5" />
              {startupAdConfig.badgeText || 'Publicidad Oficial STAFF'}
            </span>
          </div>
        )}

        {/* Scrollable Container for 9:16 format with auto-fit content */}
        <div className="overflow-y-auto no-scrollbar flex-1 flex flex-col">
          {/* Ad Image filling ~70-75% of screen height in 9:16 aspect ratio - Straight edges (no rounded borders, no bottom border line) */}
          <div className="relative w-full h-[68vh] sm:h-[72vh] bg-neutral-950 overflow-hidden shrink-0 rounded-none">
            <img
              src={startupAdConfig.imageUrl}
              alt={startupAdConfig.title || 'Publicidad'}
              className="w-full h-full object-cover rounded-none transform hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            
            {(startupAdConfig.showTitle ?? true) && (startupAdConfig.title || startupAdConfig.subtitle) && (
              <div className="absolute bottom-2 left-3 right-3 text-white bg-black/70 p-2 sm:p-2.5 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  {startupAdConfig.subtitle && (
                    <span className="text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded bg-rose-600 text-white shadow-sm">
                      {startupAdConfig.subtitle}
                    </span>
                  )}
                  {startupAdConfig.discountBadge && (
                    <span className="text-[10px] sm:text-xs font-bold text-amber-300 drop-shadow">{startupAdConfig.discountBadge}</span>
                  )}
                </div>
                {startupAdConfig.title && (
                  <h3 className="text-sm sm:text-base font-black leading-tight drop-shadow-md">
                    {startupAdConfig.title}
                  </h3>
                )}
              </div>
            )}
          </div>

          {/* Ad Body Content - Compact size without separator lines */}
          <div className="p-2.5 sm:p-3 text-neutral-200 space-y-2">
            {(startupAdConfig.showDescription ?? true) && startupAdConfig.description && (
              <p className="text-xs text-neutral-300 leading-snug">
                {startupAdConfig.description}
              </p>
            )}

            {(startupAdConfig.showDiscount ?? true) && (startupAdConfig.discountCode || startupAdConfig.discountValidity) && (
              <div className="bg-neutral-800/80 rounded-xl p-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Código de descuento app:</span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-400 tracking-wider">
                    {startupAdConfig.discountCode || 'SIN CÓDIGO'}
                  </span>
                </div>
                {startupAdConfig.discountValidity && (
                  <span className="text-[10px] text-neutral-400 bg-neutral-700/60 px-2 py-0.5 rounded-md">
                    {startupAdConfig.discountValidity}
                  </span>
                )}
              </div>
            )}

            {/* Action buttons & Footer */}
            <div className="space-y-1.5 pt-0.5">
              {(startupAdConfig.showCta ?? true) && (startupAdConfig.ctaUrl || startupAdConfig.ctaText) && (
                <div>
                  <a
                    id="btn-ad-cta"
                    href={startupAdConfig.ctaUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    onClick={dismissStartupAd}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-2 px-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
                  >
                    <span>{startupAdConfig.ctaText || 'Ver Más Información'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Centered Staff Badge & Optional Report Button - Clean without top border line */}
              <div className="pt-1 flex flex-col items-center justify-center gap-0.5 text-[10px] text-neutral-400 text-center">
                <div className="flex items-center justify-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Publicidad verificada STAFF</span>
                </div>

                {(startupAdConfig.showReportButton ?? true) && (
                  <button
                    id="btn-report-startup-ad"
                    type="button"
                    onClick={() => {
                      dismissStartupAd();
                      openReportModal({
                        id: startupAdConfig.id || 'startup-ad',
                        type: 'support',
                        title: `Anuncio de inicio: ${startupAdConfig.title || 'Anuncio'}`,
                        initialTicketType: 'TRA'
                      });
                    }}
                    className="flex items-center gap-1 text-neutral-500 hover:text-rose-400 transition-colors font-medium cursor-pointer text-[9px]"
                    title="Reportar este anuncio (TRA)"
                  >
                    <Flag className="w-3 h-3 text-rose-400" />
                    <span>Reportar anuncio (TRA)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
