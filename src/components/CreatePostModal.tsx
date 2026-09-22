import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Image, MapPin, ChevronRight, ArrowLeft, EyeOff, MessageSquareOff, Camera, Search, ChevronDown, ChevronUp, Navigation, Check } from 'lucide-react';

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
    isStaffMode
  } = useApp();

  const [step, setStep] = useState<'selector' | 'form'>('selector');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('Madrid, España');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);

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

  if (!isCreatePostOpen) return null;

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

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const res = reader.result as string;
          setDevicePhotos(prev => [res, ...prev]);
          setMediaUrl(res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
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
      location: location.trim() || 'Global',
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
        () => {
          setLocation(`${currentUser.city || 'Mi ubicación actual'}, España`);
          setShowLocationSuggestions(false);
        },
        () => {
          alert('No se pudo obtener la ubicación automáticamente.');
        }
      );
    }
  };

  const filteredUsersForTagging = otherUsers.filter(u =>
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredLocations = COMMON_WORLD_CITIES.filter(c =>
    c.toLowerCase().includes(location.toLowerCase())
  );

  return (
    <div
      id="create-post-backdrop"
      className="fixed inset-0 z-50 bg-[#001845] text-white flex flex-col w-full h-full overflow-hidden animate-fade-in"
    >
      {/* Instagram-style permission dialog if not granted */}
      {galleryPermission !== 'granted' && (
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
                Permite el acceso a tu galería para seleccionar tus imágenes personales del dispositivo y publicarlas en tu perfil instantáneamente.
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

      <div
        id="create-post-card"
        className="w-full max-w-2xl mx-auto bg-[#001845] border-x border-white/10 flex flex-col h-full shadow-2xl relative"
      >
        {/* STEP 1: IMAGE SELECTOR (INSTAGRAM STYLE) */}
        {step === 'selector' ? (
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
                Nueva publicación
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

            {/* Upper Section: Active Preview */}
            <div className="w-full aspect-square max-h-[42vh] bg-neutral-900 relative flex items-center justify-center overflow-hidden border-b border-white/10">
              {mediaUrl ? (
                <img
                  src={mediaUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-6 text-white/60 text-xs space-y-2">
                  <p>Selecciona una foto de tu galería o usa la cámara para comenzar</p>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-4 py-2 bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Abrir Galería
                  </button>
                </div>
              )}
              <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-bold">
                Foto seleccionada
              </span>
            </div>

            {/* Lower Section: Grid where 1st casilla has camera icon and rest are device photos */}
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
                  + Agregar más fotos
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {/* 1st casilla: Camera icon (opens camera) */}
                <label className="aspect-square bg-white/10 hover:bg-amber-400/20 border-2 border-dashed border-amber-400/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group shadow">
                  <Camera className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-amber-300 mt-1">Cámara</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />
                </label>

                {/* Rest: User Device Photos */}
                {devicePhotos.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMediaUrl(imgUrl)}
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
          /* STEP 2: INSTAGRAM NEW POST FORM */
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
                Crear nueva publicación
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
              {/* Imagen arriba */}
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl border border-white/15">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/20">
                  <img src={mediaUrl} alt="Selected" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-white">Foto lista para publicar</p>
                  <p className="text-[10px] text-white/60">Añade un pie de foto, ubicación y etiquetas para tu comunidad.</p>
                </div>
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

              {/* Location */}
              <div className="space-y-1 relative">
                <label className="block text-xs font-bold text-white/90">
                  Agregar ubicación
                </label>
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
                    className="px-3 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold rounded-xl flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                    title="Usar GPS actual"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                    <span>GPS</span>
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

              {/* Tagging */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white/90">
                    Etiquetar personas ({taggedUsernames.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTagModalOpen(!isTagModalOpen)}
                    className="text-[10px] font-bold text-amber-300 hover:underline cursor-pointer"
                  >
                    {isTagModalOpen ? 'Cerrar' : '+ Añadir etiqueta'}
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
                        placeholder="Buscar parceros por nombre o usuario..."
                        className="w-full bg-white/10 text-white placeholder-white/40 pl-8 pr-3 py-1.5 rounded-xl border border-white/20 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {filteredUsersForTagging.map(u => {
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
                        <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-white/60" />
                        <span>Ocultar recuento de Me gusta y Reproducciones</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideLikes}
                          onChange={e => setHideLikes(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                      </label>
                    </div>

                    {isStaffMode && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300">Marcar como Anuncio Oficial STAFF</span>
                          <input
                            type="checkbox"
                            checked={isStaffAd}
                            onChange={e => setIsStaffAd(e.target.checked)}
                            className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                          />
                        </div>
                        {isStaffAd && (
                          <div className="space-y-2 pt-1">
                            <input
                              type="text"
                              value={sponsorName}
                              onChange={e => setSponsorName(e.target.value)}
                              placeholder="Nombre del patrocinador (ej. Embajada de Colombia)"
                              className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl text-xs border border-white/20"
                            />
                            <input
                              type="text"
                              value={adTitle}
                              onChange={e => setAdTitle(e.target.value)}
                              placeholder="Título del anuncio"
                              className="w-full bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl text-xs border border-white/20"
                            />
                          </div>
                        )}
                      </div>
                    )}
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
