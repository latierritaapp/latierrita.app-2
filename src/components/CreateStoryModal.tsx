import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Image, Camera, RotateCw } from 'lucide-react';

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
  const [stage, setStage] = useState<'camera' | 'preview'>('camera');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [activeFilter, setActiveFilter] = useState('normal');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Open live camera immediately upon modal opening
  useEffect(() => {
    if (isCreateStoryOpen && stage === 'camera') {
      startLiveCamera();
    } else {
      stopLiveCamera();
    }
    return () => {
      stopLiveCamera();
    };
  }, [isCreateStoryOpen, stage, facingMode]);

  const startLiveCamera = async () => {
    setCameraError(false);
    try {
      stopLiveCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Instagram-style camera error:', err);
      setCameraError(true);
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleCaptureSnapshot = () => {
    if (videoRef.current && canvasRef.current && !cameraError) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (facingMode === 'user') {
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setMediaUrl(dataUrl);
        stopLiveCamera();
        setStage('preview');
      }
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setMediaUrl(reader.result as string);
          stopLiveCamera();
          setStage('preview');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
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
    setActiveFilter('normal');
  };

  const handleClose = () => {
    stopLiveCamera();
    setIsCreateStoryOpen(false);
    setStage('camera');
    setMediaUrl('');
    setCaption('');
  };

  if (!isCreateStoryOpen) return null;

  const currentFilterCss = FILTERS.find(f => f.id === activeFilter)?.css || '';

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col w-full h-full overflow-hidden animate-fade-in">
      {/* Hidden inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />
      <canvas ref={canvasRef} className="hidden" />

      {stage === 'camera' ? (
        /* INSTAGRAM-STYLE LIVE CAMERA FEED */
        <div className="relative flex-1 flex flex-col justify-between bg-black overflow-hidden">
          {!cameraError ? (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`absolute inset-0 w-full h-full object-cover ${currentFilterCss} ${
                facingMode === 'user' ? '-scale-x-100' : ''
              }`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-900 space-y-4 z-10">
              <div className="w-20 h-20 bg-amber-400/20 border-2 border-amber-400 rounded-full flex items-center justify-center text-amber-400 mb-2 shadow-xl">
                <Camera className="w-10 h-10" />
              </div>
              <h3 className="text-base font-bold text-white">Permiso de cámara requerido</h3>
              <p className="text-xs text-white/70 max-w-xs leading-relaxed">
                Por favor permite el acceso a la cámara en tu navegador o usa la cámara nativa de tu dispositivo.
              </p>
              <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Abrir cámara nativa
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-white/20"
                >
                  Seleccionar de la galería
                </button>
              </div>
            </div>
          )}

          {/* Top Bar: Close, Flip Camera */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <button
              onClick={handleClose}
              className="p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-lg backdrop-blur-md"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            {!cameraError && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleCamera}
                  className="p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-lg backdrop-blur-md"
                  title="Voltear cámara"
                >
                  <RotateCw className="w-5 h-5 text-amber-400" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Overlays: Filter Carousel & Action Buttons */}
          <div className="absolute bottom-0 inset-x-0 z-20 pb-8 pt-16 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col gap-4">
            {/* Filter Carousel */}
            {!cameraError && (
              <div className="w-full overflow-x-auto px-4 no-scrollbar">
                <div className="flex items-center justify-center gap-3 min-w-max">
                  {FILTERS.map(filter => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md transition-all cursor-pointer ${
                        activeFilter === filter.id
                          ? 'bg-amber-400 text-neutral-950 shadow-lg scale-105 ring-2 ring-white/50'
                          : 'bg-black/50 text-white/80 hover:bg-black/70 border border-white/20'
                      }`}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Controls Bar: Gallery left, Shutter center */}
            <div className="px-6 flex items-center justify-between relative">
              {/* Lado izquierdo inferior: galería */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 border-2 border-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xl backdrop-blur-md"
                title="Abrir Galería"
              >
                <Image className="w-6 h-6 text-white" />
              </button>

              {/* Lado centro inferior: botón obturador */}
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="absolute left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white p-1 flex items-center justify-center cursor-pointer shadow-2xl active:scale-95 transition-all group"
                title="Tomar Foto"
              >
                <div className="w-16 h-16 rounded-full bg-amber-400 border-4 border-white flex items-center justify-center group-hover:bg-amber-300 transition-colors">
                  <Camera className="w-7 h-7 text-neutral-950" />
                </div>
              </button>

              <div className="w-14" />
            </div>
          </div>
        </div>
      ) : (
        /* PREVIEW & PUBLISH SCREEN */
        <div className="relative flex-1 flex flex-col justify-between bg-black">
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={() => {
                setStage('camera');
                startLiveCamera();
              }}
              className="text-xs font-bold text-white/90 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl backdrop-blur-md cursor-pointer"
            >
              Volver a cámara
            </button>
            <button
              onClick={handleClose}
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
              className={`w-full h-full object-contain ${currentFilterCss}`}
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
