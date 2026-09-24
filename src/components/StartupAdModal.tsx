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

  if (!startupAdOpen || !startupAdConfig || !startupAdConfig.active) return null;

  return (
    <div
      id="startup-ad-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Publicidad destacada"
    >
      <div
        id="startup-ad-container"
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-3xl overflow-hidden shadow-2xl transform transition-all animate-scaleUp"
      >
        {/* Quick Close Button - Prominent top-right quick dismiss */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            id="btn-quick-close-ad"
            onClick={dismissStartupAd}
            className="flex items-center gap-1.5 bg-black/70 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-105"
            title="Cierre rápido"
          >
            <span>Cerrar</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className="inline-flex items-center gap-1 bg-amber-500/90 text-neutral-950 text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            {startupAdConfig.badgeText || 'Publicidad Oficial STAFF'}
          </span>
        </div>

        {/* Ad Image */}
        <div className="relative h-72 w-full bg-neutral-950 overflow-hidden">
          <img
            src={startupAdConfig.imageUrl}
            alt={startupAdConfig.title}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent"></div>
          
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              {startupAdConfig.subtitle && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-600 text-white">
                  {startupAdConfig.subtitle}
                </span>
              )}
              {startupAdConfig.discountBadge && (
                <span className="text-xs font-medium text-amber-300">{startupAdConfig.discountBadge}</span>
              )}
            </div>
            <h3 className="text-xl font-bold leading-tight drop-shadow-md">
              {startupAdConfig.title}
            </h3>
          </div>
        </div>

        {/* Ad Body Content */}
        <div className="p-5 text-neutral-200">
          <p className="text-sm text-neutral-300 leading-relaxed mb-4">
            {startupAdConfig.description}
          </p>

          {(startupAdConfig.discountCode || startupAdConfig.discountValidity) && (
            <div className="bg-neutral-800/80 rounded-xl p-3 border border-neutral-700/60 mb-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 uppercase font-semibold block">Código de descuento app:</span>
                <span className="text-base font-extrabold text-amber-400 tracking-wider">
                  {startupAdConfig.discountCode || 'SIN CÓDIGO'}
                </span>
              </div>
              {startupAdConfig.discountValidity && (
                <span className="text-xs text-neutral-400 bg-neutral-700/60 px-2.5 py-1 rounded-md">
                  {startupAdConfig.discountValidity}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <a
              id="btn-ad-cta"
              href={startupAdConfig.ctaUrl}
              target="_blank"
              rel="noreferrer"
              onClick={dismissStartupAd}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-all"
            >
              <span>{startupAdConfig.ctaText}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              id="btn-bottom-close-ad"
              onClick={dismissStartupAd}
              className="w-full text-center py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Continuar a La Tierrita {countdown > 0 ? `(${countdown}s)` : ''}
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Publicidad verificada STAFF</span>
            </div>
            <button
              id="btn-report-startup-ad"
              type="button"
              onClick={() => {
                dismissStartupAd();
                openReportModal({
                  id: startupAdConfig.id || 'startup-ad',
                  type: 'support',
                  title: `Anuncio de inicio: ${startupAdConfig.title}`,
                  initialTicketType: 'TRA'
                });
              }}
              className="flex items-center gap-1 text-neutral-400 hover:text-rose-400 transition-colors font-medium cursor-pointer"
              title="Reportar este anuncio (TRA)"
            >
              <Flag className="w-3 h-3 text-rose-400" />
              <span>Reportar anuncio (TRA)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
