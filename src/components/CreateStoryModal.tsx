import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Image, Camera } from 'lucide-react';

export const CreateStoryModal: React.FC = () => {
  const { isCreateStoryOpen, setIsCreateStoryOpen, addStory } = useApp();
  const [stage, setStage] = useState<'camera' | 'preview'>('camera');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Al abrir la modal de historia, abrir inmediatamente la cámara trasera del dispositivo
  useEffect(() => {
    if (isCreateStoryOpen && stage === 'camera') {
      const timer = setTimeout(() => {
        if (cameraInputRef.current) {
          cameraInputRef.current.click();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isCreateStoryOpen, stage]);

  if (!isCreateStoryOpen) return null;

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setMediaUrl(reader.result as string);
          setStage('preview');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGallerySelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setMediaUrl(reader.result as string);
          setStage('preview');
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
    setStage('camera');
    setMediaUrl('');
    setCaption('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col w-full h-full overflow-hidden animate-fade-in">
      {/* Hidden camera input triggered automatically */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />

      {/* Hidden gallery input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGallerySelected}
      />

      {stage === 'camera' ? (
        /* STAGE 1: CAMERA WAITING / RETRY SCREEN */
        <div className="relative flex-1 flex flex-col justify-between bg-neutral-900">
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <span className="text-xs font-bold text-amber-400">Nueva Historia</span>
            <button
              onClick={() => {
                setIsCreateStoryOpen(false);
                setStage('camera');
              }}
              className="p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-lg"
              title="Salir"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Tap to open camera or gallery */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center cursor-pointer hover:scale-105 transition-all shadow-2xl group animate-pulse"
            >
              <Camera className="w-12 h-12 text-amber-400 group-hover:scale-110 transition-transform" />
            </button>
            <div className="space-y-2">
              <p className="text-sm font-bold text-white">Abriendo cámara del dispositivo...</p>
              <p className="text-xs text-white/60 max-w-xs mx-auto">
                Si no se abrió automáticamente, toca el icono de la cámara o selecciona una imagen de la galería abajo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 mx-auto"
            >
              <Image className="w-4 h-4 text-amber-400" />
              <span>Elegir de la galería</span>
            </button>
          </div>

          {/* Bottom Bar */}
          <div className="p-6 pb-10 flex items-center justify-center bg-gradient-to-t from-black via-black/80 to-transparent">
            <button
              type="button"
              onClick={() => {
                setIsCreateStoryOpen(false);
                setStage('camera');
              }}
              className="text-xs text-white/60 hover:text-white font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        /* STAGE 2: PREVIEW & PUBLISH SCREEN */
        <div className="relative flex-1 flex flex-col justify-between bg-black">
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={() => {
                setStage('camera');
                setTimeout(() => cameraInputRef.current?.click(), 100);
              }}
              className="text-xs font-bold text-white/90 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md cursor-pointer"
            >
              Volver a cámara
            </button>
            <button
              onClick={() => {
                setIsCreateStoryOpen(false);
                setStage('camera');
              }}
              className="p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-lg"
              title="Salir"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Full Screen Photo Preview */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <img
              src={mediaUrl}
              alt="Story preview"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
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
