import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, X, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { TicketType } from '../types';
import { TICKET_CATEGORIES, TicketOption } from '../data/ticketData';

export const ReportModal: React.FC = () => {
  const {
    isReportModalOpen,
    reportTarget,
    closeReportModal,
    submitTicketReport,
    setActiveChatId,
    setActiveTab,
    setChatTypeTab
  } = useApp();

  // Determine initial ticket category based on report target
  const getInitialType = (): TicketType => {
    if (!reportTarget) return 'TRP';
    if (reportTarget.initialTicketType) return reportTarget.initialTicketType;
    if (reportTarget.type === 'user') return 'TRU';
    if (reportTarget.type === 'post') return 'TRP';
    if (reportTarget.type === 'story') return 'TRH';
    if (reportTarget.type === 'message') return 'TRM';
    if (reportTarget.type === 'group') return 'TRG';
    if (reportTarget.type === 'support') return 'TS';
    return 'TRP';
  };

  const [activeType, setActiveType] = useState<TicketType>(getInitialType());
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketCode, setCreatedTicketCode] = useState<string | null>(null);

  // Sync state whenever reportTarget opens
  useEffect(() => {
    if (reportTarget) {
      const initial = getInitialType();
      setActiveType(initial);
      setSelectedOptionIndex(0);
      setAdditionalDetails('');
      setCreatedTicketCode(null);
    }
  }, [reportTarget]);

  if (!isReportModalOpen || !reportTarget) return null;

  const currentCategory = TICKET_CATEGORIES[activeType] || TICKET_CATEGORIES.TRP;
  const currentOptions: TicketOption[] = currentCategory.options;
  const selectedOption = currentOptions[selectedOptionIndex] || currentOptions[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;

    try {
      setIsSubmitting(true);
      const code = await submitTicketReport(
        activeType,
        selectedOption.title,
        selectedOption.text,
        additionalDetails.trim(),
        reportTarget
      );
      setCreatedTicketCode(code);
    } catch (err) {
      console.error('Error al generar ticket de reporte:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToChat = () => {
    closeReportModal();
    setChatTypeTab('messages');
    setActiveTab('chats');
  };

  return (
    <div
      id="report-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="report-modal-card"
        className="w-full max-w-lg bg-[#001428] border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#001c38]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>{currentCategory.fullTitle}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${currentCategory.badgeColor}`}>
                  {currentCategory.code}
                </span>
              </h3>
              <p className="text-[11px] text-white/60">
                {currentCategory.description}
              </p>
            </div>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdTicketCode ? (
          /* Success Screen */
          <div className="p-6 sm:p-8 text-center space-y-4 my-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                Ticket Creado Exitosamente
              </span>
              <h4 className="text-xl font-black text-white font-mono">
                {createdTicketCode}
              </h4>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Chat privado creado en tu bandeja</span>
              </div>
              <p className="text-white/70 text-[11px] leading-relaxed">
                Hemos añadido una conversación privada con la etiqueta <span className="font-mono font-bold text-amber-400">{createdTicketCode}</span> en tu sección de Mensajes.
              </p>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 leading-snug">
                🔒 <strong>Importante:</strong> No podrás enviar mensajes en el chat de este ticket hasta que un miembro del Staff (Admin o Soporte) tome tu caso para atenderte.
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={closeReportModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/20 text-white/80 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Entendido
              </button>
              <button
                type="button"
                onClick={handleGoToChat}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ver Chat del Ticket</span>
              </button>
            </div>
          </div>
        ) : (
          /* Ticket Form */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Target info preview */}
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">
                    {activeType === 'TS'
                      ? 'Solicitud de Soporte:'
                      : activeType === 'TRI'
                      ? 'Reporte de Fallo Técnico:'
                      : activeType === 'TRA'
                      ? 'Anuncio Reportado (Empleo / Alquiler / Clasificado):'
                      : 'Elemento Reportado:'}
                  </span>
                  <span className="font-bold text-white truncate block">
                    {reportTarget.title}
                  </span>
                  <span className="text-[10px] text-amber-400/80">
                    Tipo de Ticket: {currentCategory.fullTitle} ({currentCategory.code})
                  </span>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-mono font-bold shrink-0 ${currentCategory.badgeColor}`}>
                  {currentCategory.code}
                </span>
              </div>

              {/* Options list for selected ticket type */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
                  Selecciona el Motivo del Ticket
                </label>
                <div className="space-y-2">
                  {(currentOptions || []).map((opt, idx) => {
                    const isSelected = selectedOptionIndex === idx;
                    return (
                      <label
                        key={idx}
                        onClick={() => setSelectedOptionIndex(idx)}
                        className={`block p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400/70 text-white shadow-md'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] text-white/80'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="ticketOption"
                            checked={isSelected}
                            onChange={() => setSelectedOptionIndex(idx)}
                            className="mt-0.5 accent-amber-400 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-black block ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                              {opt.title}
                            </span>
                            <span className="text-[11px] text-white/65 block mt-0.5 leading-relaxed">
                              {opt.text}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Detalles adicionales (Opcional) - max 250 characters */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                    Detalles adicionales <span className="text-white/40 normal-case">(Opcional)</span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${
                    additionalDetails.length > 230 ? 'text-rose-400' : 'text-white/40'
                  }`}>
                    {additionalDetails.length} / 250
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={additionalDetails}
                  onChange={e => setAdditionalDetails(e.target.value)}
                  placeholder="Escribe una breve explicación de lo ocurrido (máximo 250 caracteres)..."
                  className="w-full bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] text-white placeholder-white/40 px-3.5 py-2.5 text-xs rounded-2xl border border-white/15 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all resize-none"
                />
              </div>
            </div>

            {/* Actions footer */}
            <div className="p-4 bg-[#001c38]/90 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={closeReportModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Generando ticket...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Enviar Ticket ({activeType})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
