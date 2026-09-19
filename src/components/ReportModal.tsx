import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { ReportReason } from '../types';

const REPORT_REASONS: { id: ReportReason; label: string; desc: string }[] = [
  {
    id: 'spam',
    label: 'Spam o Publicidad No Autorizada',
    desc: 'Mensajes masivos, enlaces sospechosos o promociones no verificadas por STAFF.'
  },
  {
    id: 'inappropriate',
    label: 'Contenido Inapropiado o Sensible',
    desc: 'Imágenes, textos o comportamientos contrarios a las normas comunitarias.'
  },
  {
    id: 'harassment',
    label: 'Acoso u Ofensas a Miembros',
    desc: 'Insultos, discriminación, burlas o amenazas a compatriotas.'
  },
  {
    id: 'scam',
    label: 'Estafa, Fraude o Engaño con Trámites',
    desc: 'Ofertas dudosas de empadronamiento, NIE falso, o venta ilícita.'
  },
  {
    id: 'other',
    label: 'Otro Motivo',
    desc: 'Cualquier otra vulneración a la convivencia.'
  }
];

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, reportTarget, closeReportModal, submitReport } = useApp();

  const [selectedReason, setSelectedReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isReportModalOpen || !reportTarget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(selectedReason, details);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      closeReportModal();
    }, 1800);
  };

  return (
    <div
      id="report-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="report-modal-card"
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
              Reportar Contenido a Moderación
            </h3>
          </div>
          <button
            onClick={closeReportModal}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-neutral-900 dark:text-white">
              Reporte Recibido
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
              El equipo de moderación de La Tierrita revisará este contenido en menos de 24 horas. Gracias por cuidar a nuestra comunidad.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="bg-neutral-100 dark:bg-neutral-800/70 p-3 rounded-2xl text-xs text-neutral-600 dark:text-neutral-300">
              <span className="font-bold text-neutral-800 dark:text-white block mb-0.5">
                Elemento reportado:
              </span>
              <span className="text-neutral-500 dark:text-neutral-400 truncate block">
                {reportTarget.title} ({reportTarget.type})
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                ¿Por qué quieres reportar esto?
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map(r => (
                  <label
                    key={r.id}
                    className={`block p-2.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedReason === r.id
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={selectedReason === r.id}
                        onChange={() => setSelectedReason(r.id)}
                        className="mt-0.5 accent-rose-600"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                          {r.label}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                          {r.desc}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Detalles adicionales (opcional)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Explica qué ocurrió para ayudar al equipo de moderación..."
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeReportModal}
                className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                Enviar Reporte a Moderación
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
