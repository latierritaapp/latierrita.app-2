import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Image, MapPin, ChevronRight, ArrowLeft, EyeOff, MessageSquareOff, Camera, Search, ChevronDown, ChevronUp, Navigation, Check, RotateCw } from 'lucide-react';

const COMMON_WORLD_CITIES = [
  'Madrid, España',
  'Barcelona, España',
  'Valencia, España',
  'Sevilla, España',
  'Bogotá, Colombia',
  'Medellín, Colombia',
  'Cali, Colombia',
  'Barranquilla, Colombia',
  'Cartagena, Colombia',
  'Buenos Aires, Argentina',
  'Ciudad de México, México',
  'Miami, Estados Unidos',
  'Nueva York, Estados Unidos',
  'Santiago, Chile',
  'Lima, Perú',
  'Londres, Reino Unido',
  'París, Francia',
  'Roma, Italia',
  'Tokio, Japón',
  'Berlin, Alemania',
  'Sydney, Australia',
  'Toronto, Canadá'
];

export const CreatePostModal: React.FC = () => {
  const {
    isCreatePostOpen,
    setIsCreatePostOpen,
    createPost,
    currentUser,
    otherUsers,
    followingIds,
    isStaffMode
  } = useApp();

  const [step, setStep] = useState<'selector' | 'camera' | 'form'>('selector');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('Madrid, España');
  const [showLocation, setShowLocation] = useState(true);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Dragging / Pan framing state for 1:1 photo
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Camera state for 1:1 post capture
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Gallery Permission & Device Photos
  const [galleryPermission, setGalleryPermission] = useState<'prompt' | 'granted' | 'denied'>(() => {
    return (localStorage.getItem('latierrita_gallery_permission') as any) || 'prompt';
  });
  const [devicePhotos, setDevicePhotos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('latierrita_device_photos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('latierrita_gallery_permission', galleryPermission);
  }, [galleryPermission]);

  useEffect(() => {
    localStorage.setItem('latierrita_device_photos', JSON.stringify(devicePhotos));
  }, [devicePhotos]);

  useEffect(() => {
    if (!mediaUrl && devicePhotos.length > 0) {
      setMediaUrl(devicePhotos[0]);
    }
  }, [devicePhotos, mediaUrl]);

  // Live Camera effect when in 'camera' step
  useEffect(() => {
    if (isCreatePostOpen && step === 'camera') {
      startLiveCamera();
    } else {
      stopLiveCamera();
    }
    return () => {
      stopLiveCamera();
    };
  }, [isCreatePostOpen, step, facingMode]);

  const startLiveCamera = async () => {
    setCameraError(false);
    try {
      stopLiveCamera();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API mediaDevices no soportada o contexto no seguro (se requiere HTTPS)');
      }
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
      // Cámara en vivo no disponible, activando alternativas de galería y cámara nativa de forma limpia
      setCameraError(true);
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleCaptureSquareSnapshot = () => {
    if (videoRef.current && canvasRef.current && !cameraError) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth || 1080, video.videoHeight || 1080);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        if (facingMode === 'user') {
          ctx.scale(-1, 1);
          ctx.drawImage(video, startX, startY, size, size, -size, 0, size, size);
        } else {
          ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        }
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setDevicePhotos(prev => [dataUrl, ...prev]);
        setMediaUrl(dataUrl);
        stopLiveCamera();
        setStep('selector');
      }
    }
  };

  const handleGrantPermissionAndOpen = () => {
    setGalleryPermission('granted');
    setTimeout(() => {
      if (galleryInputRef.current) {
        galleryInputRef.current.click();
      }
    }, 100);
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newUrls: string[] = [];
      let loadedCount = 0;
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            newUrls.push(reader.result as string);
            loadedCount++;
            if (loadedCount === files.length) {
              setDevicePhotos(prev => [...newUrls, ...prev]);
              setMediaUrl(newUrls[0]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleNativeCameraSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const imgUrl = reader.result as string;
          setDevicePhotos(prev => [imgUrl, ...prev]);
          setMediaUrl(imgUrl);
          setPanOffset({ x: 0, y: 0 });
          stopLiveCamera();
          setStep('selector');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    stopLiveCamera();
    setIsCreatePostOpen(false);
    setStep('selector');
    setCaption('');
    setTaggedUsernames([]);
    setUserSearchQuery('');
    setIsMoreOptionsOpen(false);
    setIsTagModalOpen(false);
    setShowLocationSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) return;

    createPost({
      mediaUrl: mediaUrl.trim(),
      caption: caption.trim() || '🇨🇴✨',
      location: showLocation ? (location.trim() || 'Global') : '',
      hideLocation: !showLocation,
      disableComments,
      hideLikes,
      taggedUsernames,
      isStaffAd: isStaffMode && isStaffAd,
      sponsorName: isStaffAd ? sponsorName : undefined,
      adTitle: isStaffAd ? adTitle : undefined,
      adDescription: isStaffAd ? adDescription : undefined,
      adCtaText: isStaffAd ? adCtaText : undefined,
      adCtaUrl: isStaffAd ? adCtaUrl : undefined
    });

    handleClose();
  };

  // Tagging state
  const [taggedUsernames, setTaggedUsernames] = useState<string[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [disableComments, setDisableComments] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);

  // Staff ad extra fields
  const [isStaffAd, setIsStaffAd] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adCtaText, setAdCtaText] = useState('Más información');
  const [adCtaUrl, setAdCtaUrl] = useState('https://latierrita.es/anuncios');

  const toggleTagUser = (username: string) => {
    setTaggedUsernames(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  // Real-time Geolocation like Instagram
  const handleGetGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simulate reverse geocoding to current city/neighborhood
          const city = currentUser.city || 'Madrid';
          setLocation(`${city}, España (GPS en vivo)`);
          setShowLocationSuggestions(false);
        },
        () => {
          alert('No se pudo obtener la ubicación GPS en tiempo real.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Filter users who follow current user or general community
  const followedUsersForTagging = otherUsers.filter(u =>
    followingIds.includes(u.id) || u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredLocations = COMMON_WORLD_CITIES.filter(c =>
    c.toLowerCase().includes(location.toLowerCase())
  );

  // Dragging / pan handlers for photo framing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isCreatePostOpen) return null;

  return (
    <div
      id="create-post-backdrop"
      className="fixed inset-0 z-50 bg-[#001845] text-white flex flex-col w-full h-full overflow-hidden animate-fade-in"
    >
      {/* Gallery Permission Dialog */}
      {galleryPermission !== 'granted' && step === 'selector' && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#002466] border border-white/20 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-amber-400/20 border-2 border-amber-400 rounded-2xl mx-auto flex items-center justify-center text-amber-400">
              <Image className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">
                "La Tierrita" quiere acceder a tus fotos
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Permite el acceso a tu galería para seleccionar tus imágenes personales del dispositivo y publicarlas en 1:1.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleGrantPermissionAndOpen}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
              >
                Permitir acceso a la galería
              </button>
              <button
                type="button"
                onClick={() => setGalleryPermission('denied')}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                No permitir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden gallery file input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeCameraSelected}
      />
      <canvas ref={canvasRef} className="hidden" />

      <div
        id="create-post-card"
        className="w-full max-w-2xl mx-auto bg-[#001845] border-x border-white/10 flex flex-col h-full shadow-2xl relative"
      >
        {step === 'camera' ? (
          /* 1:1 INSTAGRAM-STYLE LIVE CAMERA CAPTURE */
          <div className="relative flex-1 flex flex-col justify-between bg-black overflow-hidden">
            {!cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="w-full aspect-square relative overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${
                      facingMode === 'user' ? '-scale-x-100' : ''
                    }`}
                  />
                  {/* 1:1 Square Frame Guides */}
                  <div className="absolute inset-0 border-2 border-amber-400/40 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-900 space-y-4 z-10">
                <div className="w-16 h-16 bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-400 mb-2 shadow-xl animate-bounce">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white">Permiso de cámara denegado</h3>
                <p className="text-xs text-white/70 max-w-xs leading-relaxed">
                  No se pudo acceder a la cámara en vivo. Pero no te preocupes, puedes usar la cámara nativa de tu celular o elegir de tu galería.
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    Usar cámara nativa de mi celular
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setStep('selector');
                      setTimeout(() => {
                        galleryInputRef.current?.click();
                      }, 100);
                    }}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white/90 font-bold text-xs rounded-xl transition-all cursor-pointer border border-white/20"
                  >
                    Seleccionar de la galería
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setStep('selector');
                    }}
                    className="w-full py-2 bg-transparent hover:text-white text-white/60 font-bold text-xs transition-all cursor-pointer"
                  >
                    Volver atrás
                  </button>
                </div>
              </div>
            )}

            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <button
                onClick={() => setStep('selector')}
                className="p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
              {!cameraError && (
                <button
                  onClick={() => setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))}
                  className="p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-lg"
                >
                  <RotateCw className="w-5 h-5 text-amber-400" />
                </button>
              )}
            </div>

            {/* Bottom Shutter Bar */}
            {!cameraError && (
              <div className="p-8 pb-12 flex items-center justify-center bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                <button
                  type="button"
                  onClick={handleCaptureSquareSnapshot}
                  className="w-20 h-20 rounded-full bg-white p-1 flex items-center justify-center cursor-pointer shadow-2xl active:scale-95 transition-all"
                  title="Capturar foto 1:1"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-400 border-4 border-white flex items-center justify-center">
                    <Camera className="w-7 h-7 text-neutral-950" />
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : step === 'selector' ? (
          /* STEP 1: SELECTOR & 1:1 DRAGGABLE FRAMING PREVIEW */
          <div className="flex flex-col h-full overflow-hidden bg-neutral-950">
            <div className="sticky top-0 z-20 px-4 py-3.5 bg-[#002466]/95 backdrop-blur-md border-b border-white/15 flex items-center justify-between text-white shadow-md">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <h2 className="text-sm font-black text-white">
                Nueva publicación (1:1)
              </h2>
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={!mediaUrl.trim()}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow transition-all disabled:opacity-40 cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Upper Section: Draggable 1:1 Framing Preview */}
            <div
              className="w-full aspect-square max-h-[45vh] bg-neutral-900 relative flex items-center justify-center overflow-hidden border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {mediaUrl ? (
                <div
                  className="w-full h-full relative transition-transform duration-75"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(1.15)`
                  }}
                >
                  <img
                    src={mediaUrl}
                    alt="Draggable preview"
                    className="w-full h-full object-cover pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="text-center p-6 text-white/60 text-xs space-y-2">
                  <p>Selecciona una foto para encuadrar en tamaño 1:1</p>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Abrir Galería
                  </button>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-bold flex items-center gap-1">
                <span>Arrastra para encuadrar (1:1)</span>
              </div>
            </div>

            {/* Lower Section: Grid with Camera shortcut & device photos */}
            <div className="flex-1 p-2 overflow-y-auto bg-[#001845]">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <p className="text-[10px] uppercase font-bold text-white/60">
                  Galería del dispositivo ({devicePhotos.length})
                </p>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-[10px] font-bold text-amber-300 hover:underline cursor-pointer"
                >
                  + Agregar fotos
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {/* 1st casilla: Camera 1:1 shortcut */}
                <button
                  type="button"
                  onClick={() => setStep('camera')}
                  className="aspect-square bg-white/10 hover:bg-amber-400/20 border-2 border-dashed border-amber-400/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group shadow"
                >
                  <Camera className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-amber-300 mt-1">Cámara 1:1</span>
                </button>

                {/* Device Photos */}
                {devicePhotos.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMediaUrl(imgUrl);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className={`aspect-square rounded-xl overflow-hidden relative border-2 transition-all cursor-pointer ${
                      mediaUrl === imgUrl ? 'border-amber-400 ring-2 ring-amber-400/40 scale-95' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="Device photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>

              {devicePhotos.length === 0 && (
                <div className="text-center py-8 px-4 text-white/50 text-xs space-y-2">
                  <p>No hay fotos en tu galería todavía.</p>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-400 text-neutral-950 font-black rounded-xl text-xs shadow cursor-pointer"
                  >
                    Seleccionar fotos del dispositivo
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STEP 2: FORM WITH FULL 1:1 IMAGE DISPLAY & LOCATION & TAGGING */
          <div className="flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 z-20 px-4 py-3.5 bg-[#002466]/95 backdrop-blur-md border-b border-white/15 flex items-center justify-between text-white shadow-md">
              <button
                type="button"
                onClick={() => setStep('selector')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white/90 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
              <h2 className="text-sm font-black text-white">
                Nueva publicación
              </h2>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!mediaUrl.trim()}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow transition-all disabled:opacity-40 cursor-pointer"
              >
                Compartir
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs pb-24">
              {/* Full 1:1 Image Preview (Not minimized) */}
              <div className="w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-neutral-900 border border-white/20 shadow-2xl relative">
                <img src={mediaUrl} alt="Selected 1:1" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-amber-300 font-bold">
                  Tamaño 1:1 Original
                </span>
              </div>

              {/* Caption */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-white/90">
                  Escribe un pie de foto...
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={3}
                  placeholder="¿Qué estás pensando parcero? Usa hashtags y emojis..."
                  className="w-full bg-white/10 text-white placeholder-white/40 p-3 rounded-2xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none text-xs"
                />
              </div>

              {/* Location Toggle & Input */}
              <div className="space-y-2 bg-white/5 border border-white/15 p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-bold text-xs text-white">Compartir mi ubicación</p>
                      <p className="text-[10px] text-white/60">Permite a otros ver dónde se tomó la foto.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLocation}
                      onChange={e => setShowLocation(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                  </label>
                </div>

                {showLocation ? (
                  <div className="space-y-1 relative pt-1">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                        <input
                          type="text"
                          value={location}
                          onChange={e => {
                            setLocation(e.target.value);
                            setShowLocationSuggestions(true);
                          }}
                          onFocus={() => setShowLocationSuggestions(true)}
                          placeholder="Ej. Madrid, España"
                          className="w-full bg-white/10 text-white placeholder-white/40 pl-9 pr-3 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleGetGeolocation}
                        className="px-3 py-2.5 bg-amber-400/25 hover:bg-amber-400/40 border border-amber-400/50 text-amber-300 font-bold rounded-xl flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow"
                        title="Obtener ubicación GPS en tiempo real"
                      >
                        <Navigation className="w-3.5 h-3.5 animate-pulse" />
                        <span>GPS Real-Time</span>
                      </button>
                    </div>

                    {showLocationSuggestions && filteredLocations.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#001f52] border border-white/20 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {filteredLocations.map(city => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setLocation(city);
                              setShowLocationSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-white/10 text-xs text-white flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span>{city}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2 text-center text-[11px] text-white/50 flex items-center justify-center gap-2 bg-black/20 rounded-xl border border-white/5">
                    <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>Ubicación oculta. No se mostrará ninguna ubicación en tu publicación.</span>
                  </div>
                )}
              </div>

              {/* Tagging Followers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white/90">
                    Etiquetar parceros seguidores ({taggedUsernames.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTagModalOpen(!isTagModalOpen)}
                    className="text-[10px] font-bold text-amber-300 hover:underline cursor-pointer"
                  >
                    {isTagModalOpen ? 'Cerrar' : '+ Etiquetar personas'}
                  </button>
                </div>

                {taggedUsernames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {taggedUsernames.map(username => (
                      <span key={username} className="inline-flex items-center gap-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        <span>@{username}</span>
                        <button type="button" onClick={() => toggleTagUser(username)} className="hover:text-white cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {isTagModalOpen && (
                  <div className="p-3 bg-white/5 border border-white/15 rounded-2xl space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        placeholder="Buscar entre tus seguidores..."
                        className="w-full bg-white/10 text-white placeholder-white/40 pl-8 pr-3 py-1.5 rounded-xl border border-white/20 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {followedUsersForTagging.map(u => {
                        const isSelected = taggedUsernames.includes(u.username);
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleTagUser(u.username)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                              isSelected ? 'bg-amber-400/20 border border-amber-400/40' : 'hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                              <div>
                                <p className="font-bold text-white text-[11px]">{u.name}</p>
                                <p className="text-[9px] text-white/60">@{u.username} · Seguidor</p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* More advanced options toggle */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <button
                  type="button"
                  onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                  className="w-full flex items-center justify-between py-2 text-xs font-bold text-white/80 hover:text-white cursor-pointer"
                >
                  <span>Configuración avanzada</span>
                  {isMoreOptionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isMoreOptionsOpen && (
                  <div className="space-y-3 p-3 bg-white/5 border border-white/15 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquareOff className="w-4 h-4 text-white/60" />
                        <span>Desactivar comentarios en esta publicación</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={disableComments}
                          onChange={e => setDisableComments(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-white/60" />
                        <span>Ocultar recuento de Me gusta</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideLikes}
                          onChange={e => setHideLikes(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
