import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Image, MapPin, ChevronRight, ArrowLeft, EyeOff, MessageSquareOff, Camera, Search, ChevronDown, ChevronUp, Navigation, Check, RotateCw, Crop, Sliders } from 'lucide-react';

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

type AspectRatioType = '1:1' | '4:5' | 'original';

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
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('1:1');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('Madrid, España');
  const [showLocation, setShowLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Framing / Pan offset
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Camera state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState(false);

  // Gallery Permission & Device Photos
  const [galleryPermission, setGalleryPermission] = useState<'prompt' | 'granted' | 'denied'>(() => {
    return (localStorage.getItem('latierrita_gallery_permission') as any) || 'prompt';
  });
  const [devicePhotos, setDevicePhotos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('latierrita_device_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      'https://images.unsplash.com/photo-1589556264807-a72628e06346?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1599813956719-7120e36742d1?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=1000'
    ];
  });

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

  // Refs
  const dragStartRef = useRef({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

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

  // Live Camera effect
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
        throw new Error('API mediaDevices no soportada');
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
      const w = video.videoWidth || 1080;
      const h = video.videoHeight || 1080;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (facingMode === 'user') {
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, -w, h);
        } else {
          ctx.drawImage(video, 0, 0, w, h);
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
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const imgUrl = reader.result as string;
          setMediaUrl(imgUrl);
          setPanOffset({ x: 0, y: 0 });
          setStep('selector');
        }
      };
      reader.readAsDataURL(file);
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
    setMediaUrl('');
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

  const toggleTagUser = (username: string) => {
    setTaggedUsernames(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  const handleGetGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const city = currentUser?.city || 'Madrid';
          setLocation(`${city}, España (GPS)`);
          setShowLocationSuggestions(false);
        },
        () => {
          alert('No se pudo obtener la ubicación GPS.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const followedUsersForTagging = (otherUsers || []).filter(u =>
    (followingIds || []).includes(u.id) || u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredLocations = COMMON_WORLD_CITIES.filter(c =>
    c.toLowerCase().includes(location.toLowerCase())
  );

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
                Permite el acceso a tu galería para seleccionar tus imágenes en tamaño real o 1:1 sin recortes forzados.
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

      {/* Hidden inputs */}
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
          <div className="relative flex-1 flex flex-col justify-between bg-black overflow-hidden">
            {!cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className={`w-full relative overflow-hidden bg-black ${aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '4:5' ? 'aspect-[4/5]' : 'h-full'}`}>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${
                      facingMode === 'user' ? '-scale-x-100' : ''
                    }`}
                  />
                  <div className="absolute inset-0 border-2 border-amber-400/40 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-900 space-y-4 z-10">
                <div className="w-16 h-16 bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-400 mb-2 shadow-xl animate-bounce">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white">Cámara no disponible</h3>
                <p className="text-xs text-white/70 max-w-xs leading-relaxed">
                  Puedes usar la cámara nativa de tu dispositivo o seleccionar una imagen de tu galería.
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    Cámara nativa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setStep('selector');
                      setTimeout(() => galleryInputRef.current?.click(), 100);
                    }}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white/90 font-bold text-xs rounded-xl transition-all cursor-pointer border border-white/20"
                  >
                    Galería
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setStep('selector');
                    }}
                    className="w-full py-2 bg-transparent hover:text-white text-white/60 font-bold text-xs transition-all cursor-pointer"
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}

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

            {!cameraError && (
              <div className="p-8 pb-12 flex items-center justify-center bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="w-20 h-20 rounded-full bg-white p-1 flex items-center justify-center cursor-pointer shadow-2xl active:scale-95 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-400 border-4 border-white flex items-center justify-center">
                    <Camera className="w-7 h-7 text-neutral-950" />
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : step === 'selector' ? (
          <div className="flex flex-col h-full overflow-hidden bg-[#001845] text-white">
            {/* Header with La Tierrita Colors */}
            <div className="sticky top-0 z-20 px-4 py-3.5 bg-[#002466]/95 backdrop-blur-md border-b border-white/15 flex items-center justify-between shadow-md">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <h2 className="text-sm font-black text-white tracking-tight">
                Crear nueva publicación
              </h2>
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={!mediaUrl.trim()}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 disabled:opacity-40 cursor-pointer"
              >
                Siguiente
              </button>
            </div>

            {/* Preview Area (Instagram Cropper style with La Tierrita theme) */}
            <div
              className={`w-full relative bg-[#001845] flex items-center justify-center overflow-hidden border-b border-white/15 select-none ${
                aspectRatio === '1:1'
                  ? 'aspect-square max-h-[44vh]'
                  : aspectRatio === '4:5'
                  ? 'aspect-[4/5] max-h-[48vh]'
                  : 'h-[42vh]'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {mediaUrl ? (
                <div
                  className="w-full h-full relative transition-transform duration-75 flex items-center justify-center"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
                  }}
                >
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className={`w-full h-full ${aspectRatio === 'original' ? 'object-contain' : 'object-cover'} pointer-events-none`}
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="text-center p-6 text-white/60 text-xs space-y-2">
                  <p>Selecciona una foto de tu galería</p>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs cursor-pointer shadow"
                  >
                    Abrir archivo
                  </button>
                </div>
              )}

              {/* Floating Aspect Ratio / Zoom Controls */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={() => {
                    if (aspectRatio === '1:1') setAspectRatio('4:5');
                    else if (aspectRatio === '4:5') setAspectRatio('original');
                    else setAspectRatio('1:1');
                  }}
                  className="w-8 h-8 rounded-full bg-[#002466]/90 hover:bg-[#002466] text-amber-300 flex items-center justify-center shadow-lg border border-white/20 backdrop-blur cursor-pointer text-[10px] font-bold"
                  title="Cambiar formato"
                >
                  {aspectRatio === '1:1' ? '1:1' : aspectRatio === '4:5' ? '4:5' : '↔'}
                </button>
              </div>

              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#002466]/90 backdrop-blur px-2.5 py-1 rounded-full border border-white/20 text-[10px] text-amber-300 font-bold z-10">
                <span>{aspectRatio === 'original' ? 'Tamaño real' : 'Arrastra para encuadrar'}</span>
              </div>
            </div>

            {/* Gallery Picker Drawer with La Tierrita Colors */}
            <div className="flex-1 p-2.5 overflow-y-auto bg-[#001845]">
              {/* Header bar with album dropdown */}
              <div className="flex items-center justify-between px-3 py-2 mb-2 bg-[#002466]/80 rounded-xl border border-white/10 shadow">
                <div className="flex items-center gap-1 text-xs font-semibold text-white cursor-pointer">
                  <select 
                    className="bg-transparent text-amber-300 font-bold text-xs outline-none cursor-pointer"
                    defaultValue="recientes"
                  >
                    <option value="recientes" className="bg-[#001845] text-white">Recientes (Dispositivo)</option>
                    <option value="camara" className="bg-[#001845] text-white">Fotos de Cámara</option>
                    <option value="favoritos" className="bg-[#001845] text-white">La Tierrita Galerías</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  {devicePhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDevicePhotos([]);
                        setMediaUrl('');
                        localStorage.removeItem('latierrita_device_photos');
                      }}
                      className="text-[11px] font-bold text-rose-400 hover:underline cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-lg cursor-pointer shadow"
                  >
                    + Seleccionar
                  </button>
                </div>
              </div>

              {/* Grid of photos */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStep('camera')}
                  className="aspect-square bg-[#002466]/60 hover:bg-[#002466] border border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group"
                >
                  <Camera className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-amber-300 font-bold mt-1">Cámara</span>
                </button>

                {(devicePhotos || []).map((imgUrl, idx) => {
                  const isSelected = mediaUrl === imgUrl;
                  return (
                    <div
                      key={idx}
                      className="aspect-square relative overflow-hidden rounded-xl bg-[#002466]/40 border border-white/10 cursor-pointer group"
                      onClick={() => {
                        setMediaUrl(imgUrl);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                    >
                      <img 
                        src={imgUrl} 
                        alt="Gallery item" 
                        className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-60' : 'opacity-90 hover:opacity-100'}`} 
                        referrerPolicy="no-referrer" 
                      />
                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-amber-400 bg-amber-400/20 flex items-start justify-end p-1">
                          <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-neutral-950 text-[10px] font-black shadow">
                            ✓
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDevicePhotos(prev => prev.filter((_, i) => i !== idx));
                          if (mediaUrl === imgUrl) setMediaUrl('');
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {devicePhotos.length === 0 && (
                <div className="text-center py-12 px-4 text-white/50 text-xs space-y-3">
                  <p>No hay fotos disponibles.</p>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs"
                  >
                    Seleccionar fotos de tu dispositivo
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden bg-[#001845]">
            {/* Form Header */}
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
                Nuevos detalles
              </h2>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!mediaUrl.trim()}
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow transition-all disabled:opacity-40 cursor-pointer"
              >
                Compartir
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs pb-24">
              {/* Preview Box */}
              <div className={`w-full max-w-xs mx-auto rounded-2xl overflow-hidden bg-neutral-900 border border-white/20 shadow-2xl relative ${
                aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-auto max-h-[350px]'
              }`}>
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  className={`w-full h-full ${aspectRatio === 'original' ? 'object-contain' : 'object-cover'}`}
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-amber-300 font-bold">
                  {aspectRatio === 'original' ? 'Tamaño real' : aspectRatio === '4:5' ? 'Vertical 4:5' : 'Cuadrado 1:1'}
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
                  placeholder="¿Qué estás pensando parcero? Usa hashtags (#) y emojis (🇨🇴)..."
                  className="w-full bg-white/10 text-white placeholder-white/40 p-3 rounded-2xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none text-xs"
                />
              </div>

              {/* Location Card */}
              <div className="space-y-2 bg-white/5 border border-white/15 p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-bold text-xs text-white">Añadir ubicación</p>
                      <p className="text-[10px] text-white/60">Comparte dónde se tomó esta foto.</p>
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
                        title="Obtener GPS"
                      >
                        <Navigation className="w-3.5 h-3.5 animate-pulse" />
                        <span>GPS</span>
                      </button>
                    </div>

                    {showLocationSuggestions && (filteredLocations || []).length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#001f52] border border-white/20 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {(filteredLocations || []).map(city => (
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
                    <span>Ubicación oculta en esta publicación.</span>
                  </div>
                )}
              </div>

              {/* Tagging */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white/90">
                    Etiquetar parceros ({(taggedUsernames || []).length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTagModalOpen(!isTagModalOpen)}
                    className="text-[10px] font-bold text-amber-300 hover:underline cursor-pointer"
                  >
                    {isTagModalOpen ? 'Cerrar' : '+ Etiquetar personas'}
                  </button>
                </div>

                {(taggedUsernames || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(taggedUsernames || []).map(username => (
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
                        placeholder="Buscar seguidores..."
                        className="w-full bg-white/10 text-white placeholder-white/40 pl-8 pr-3 py-1.5 rounded-xl border border-white/20 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {(followedUsersForTagging || []).map(u => {
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
                                <p className="text-[9px] text-white/60">@{u.username}</p>
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

              {/* Advanced options */}
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
                        <span>Desactivar comentarios</span>
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
