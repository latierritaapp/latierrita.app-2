import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Image, Camera } from 'lucide-react';

const FILTERS = [
  { id: 'normal', name: 'Normal', css: '' },
  { id: 'colombia', name: 'Tierrita', css: 'sepia-[0.25] saturate-[1.6] contrast-[1.05]' },
  { id: 'vintage', name: 'Vintage', css: 'sepia-[0.6] contrast-[1.2] brightness-[0.9]' },
  { id: 'bw', name: 'B&N', css: 'grayscale(100%) contrast-[1.3]' },
  { id: 'neon', name: 'Neón', css: 'hue-rotate-[90deg] saturate-[2]' },
  { id: 'dorado', name: 'Dorado', css: 'sepia-[0.8] hue-rotate-[-30deg] saturate-[2.2]' },
];

export const CreateStoryModal: React.FC = () => {
  const { isCreateStoryOpen, setIsCreateStoryOpen, addStory } = useApp();
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [activeFilter, setActiveFilter] = useState('normal');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isCreateStoryOpen) return null;

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setMediaUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return;
    addStory({
      mediaUrl,
      caption: caption.trim() || '🇨🇴 Historia'
    });
    setIsCreateStoryOpen(false);
    setMediaUrl('');
    setCaption('');
    setActiveFilter('normal');
  };

  const handleClose = () => {
    setIsCreateStoryOpen(false);
    setMediaUrl('');
    setCaption('');
  };

  const currentFilterCss = FILTERS.find(f => f.id === activeFilter)?.css || '';

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col w-full h-full overflow-hidden animate-fade-in">
      {/* Native hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {!mediaUrl ? (
        /* STAGE 1: CAMERA UI WITH INSTAGRAM BOTTOM CONTROLS */
        <div className="relative flex-1 flex flex-col justify-between bg-neutral-950 overflow-hidden">
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <span className="text-xs font-bold text-amber-400">Nueva Historia</span>
            <button
              onClick={handleClose}
              className="p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-lg"
              title="Salir"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Viewfinder Prompt */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center cursor-pointer hover:scale-105 transition-all shadow-2xl group animate-pulse"
            >
              <Camera className="w-12 h-12 text-amber-400 group-hover:scale-110 transition-transform" />
            </button>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Toca para abrir la cámara nativa</p>
              <p className="text-xs text-white/60 max-w-xs mx-auto">
                Usa el botón inferior izquierdo para la galería o el botón central para tomar tu foto con el tamaño original de tu dispositivo.
              </p>
            </div>
          </div>

          {/* Bottom Bar: Gallery left, Shutter center */}
          <div className="p-8 pb-12 flex items-center justify-between bg-gradient-to-t from-black via-black/80 to-transparent relative">
            {/* Lado izquierdo inferior: galería */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 border-2 border-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg"
              title="Abrir Galería"
            >
              <Image className="w-6 h-6 text-white" />
            </button>

            {/* Lado centro inferior: botón obturador */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="absolute left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white p-1 flex items-center justify-center cursor-pointer shadow-2xl active:scale-95 transition-all"
              title="Tomar Foto"
            >
              <div className="w-16 h-16 rounded-full bg-amber-400 border-4 border-white flex items-center justify-center">
                <Camera className="w-7 h-7 text-neutral-950" />
              </div>
            </button>

            <div className="w-14" />
          </div>
        </div>
      ) : (
        /* STAGE 2: PREVIEW WITH FILTERS & PUBLISH SCREEN */
        <div className="relative flex-1 flex flex-col justify-between bg-black">
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={() => setMediaUrl('')}
              className="text-xs font-bold text-white/90 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl backdrop-blur-md cursor-pointer"
            >
              Volver a tomar
            </button>
            <button
              onClick={handleClose}
              className="p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-lg"
              title="Salir"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Full Screen Photo Preview with Filters */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <img
              src={mediaUrl}
              alt="Story preview"
              className={`w-full h-full object-contain ${currentFilterCss}`}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Filter Bar */}
          <div className="absolute bottom-16 inset-x-0 z-20 px-4 py-2 bg-black/80 backdrop-blur-md flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
            {FILTERS.map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  activeFilter === filter.id
                    ? 'bg-amber-400 text-neutral-950 shadow-md scale-105'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>

          {/* Bottom Bar: Caption input and Subir button */}
          <form onSubmit={handlePublish} className="p-4 bg-black/95 backdrop-blur-md border-t border-white/10 flex items-center gap-3">
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Escribe un pie de foto..."
              maxLength={100}
              className="flex-1 bg-white/10 text-white placeholder-white/50 px-4 py-3 rounded-2xl border border-white/20 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-2xl shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              Subir
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
