import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Image, MapPin, Sparkles, Megaphone, Check, ChevronRight, ArrowLeft, Users, EyeOff, MessageSquareOff, Camera, Search, ChevronDown, ChevronUp, Navigation, Plus } from 'lucide-react';

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
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=900&auto=format&fit=crop&q=80');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('Madrid, España');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

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
        position => {
          setLocation(`${currentUser.city || 'Mi ubicación actual'}, España`);
          setShowLocationSuggestions(false);
        },
        () => {
          alert('No se pudo obtener la ubicación automáticamente. Por favor escribe la ciudad.');
        }
      );
    } else {
      alert('Geolocalización no soportada en tu navegador.');
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
      <div
        id="create-post-card"
        className="w-full max-w-2xl mx-auto bg-[#001845] border-x border-white/10 flex flex-col h-full shadow-2xl"
      >
        {/* STEP 1: IMAGE SELECTOR (NO SCROLL) */}
        {step === 'selector' ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 z-20 px-4 py-3.5 bg-[#002466]/95 backdrop-blur-md border-b border-white/15 flex items-center justify-between text-white shadow-md">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs font-semibold text-white/70 hover:text-white"
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
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow transition-all disabled:opacity-40"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4 justify-center items-center">
              {/* Large Active Preview */}
              <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden bg-neutral-950 border border-white/15 shadow-2xl flex items-center justify-center">
                <img
                  src={mediaUrl || undefined}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <p className="text-xs text-white/70 text-center max-w-xs">
                Selecciona una foto con la cámara de tu dispositivo o desde tu galería para compartir en La Tierrita.
              </p>

              {/* Action buttons: Device Camera & Gallery picker */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <label className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-2xl shadow-lg transition-all active:scale-95 text-xs">
                  <Camera className="w-4 h-4" />
                  <span>Tomar foto con la cámara</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (reader.result) setMediaUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                <label className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-xs">
                  <Image className="w-4 h-4 text-sky-400" />
                  <span>Elegir de la galería</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (reader.result) setMediaUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: INSTAGRAM NEW POST FORM */
          <div className="flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 z-20 px-4 py-3.5 bg-[#002466]/95 backdrop-blur-md border-b border-white/15 flex items-center justify-between text-white shadow-md">
              <button
                type="button"
                onClick={() => setStep('selector')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white/90 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all"
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
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow transition-all disabled:opacity-40"
              >
                Compartir
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs pb-24">
              {/* Imagen arriba (Top image preview) */}
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl border border-white/15">
                <img
                  src={mediaUrl || undefined}
                  alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover shrink-0 shadow"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-white truncate">Foto seleccionada</p>
                  <p className="text-[11px] text-white/70">Lista para publicar en La Tierrita</p>
                  <button
                    type="button"
                    onClick={() => setStep('selector')}
                    className="text-[11px] font-bold text-amber-400 hover:underline mt-0.5 inline-block"
                  >
                    Cambiar foto
                  </button>
                </div>
              </div>

              {/* Pie de foto (Optional - NOT required) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-white">
                    Pie de foto (Opcional)
                  </label>
                  <span className={`text-[11px] font-bold ${caption.length > 300 ? 'text-rose-400' : 'text-white/60'}`}>
                    {caption.length}/300
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Escribe algo chévere... Ej. ¡Un saludo desde Madrid parceros! #ColombianosEnEspaña"
                  className="w-full bg-white/10 text-white placeholder-white/40 px-3.5 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* Etiquetar */}
              <div>
                <label className="font-bold text-white mb-1.5 block">
                  Etiquetar
                </label>
                
                {taggedUsernames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {taggedUsernames.map(username => {
                      return (
                        <span key={username} className="flex items-center gap-1 bg-amber-400 text-neutral-950 font-bold px-2.5 py-1 rounded-full text-xs">
                          <span>@{username}</span>
                          <button
                            type="button"
                            onClick={() => toggleTagUser(username)}
                            className="hover:text-rose-700 font-extrabold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl border border-white/20 text-white font-medium transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>{taggedUsernames.length > 0 ? `${taggedUsernames.length} personas etiquetadas` : 'Etiquetar personas...'}</span>
                  </div>
                  <Plus className="w-4 h-4 text-amber-400" />
                </button>
              </div>

              {/* Añadir ubicación (Any world place freely typed with autocomplete suggestions) */}
              <div className="relative">
                <label className="font-bold text-white mb-1.5 block">
                  Añadir ubicación (Cualquier lugar del mundo)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => {
                      setLocation(e.target.value);
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    placeholder="Escribe cualquier ciudad, país o lugar del mundo..."
                    className="w-full pl-9 pr-24 py-2.5 bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/20 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleGetGeolocation}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Mi GPS</span>
                  </button>
                </div>

                {/* Autocomplete Suggestions Dropdown (Including custom typed text option) */}
                {showLocationSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#002466] border border-white/20 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {location.trim() && !filteredLocations.includes(location.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowLocationSuggestions(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 bg-amber-400/20 hover:bg-amber-400/30 text-xs text-amber-300 font-bold flex items-center gap-2 border-b border-white/15"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Usar ubicación personalizada: "{location}"</span>
                      </button>
                    )}
                    {filteredLocations.map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setLocation(city);
                          setShowLocationSuggestions(false);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-white/15 text-xs text-white flex items-center gap-2 border-b border-white/10 last:border-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Más Opciones (Cerrado por defecto, al hacer clic se expande) */}
              <div className="pt-2 border-t border-white/15 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsMoreOptionsOpen(prev => !prev)}
                  className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 rounded-2xl transition-colors text-white font-black uppercase tracking-wider text-[11px]"
                >
                  <span>Más Opciones</span>
                  {isMoreOptionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isMoreOptionsOpen && (
                  <div className="pt-3 space-y-3 animate-fade-in">
                    {/* Desactivar comentarios */}
                    <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <MessageSquareOff className="w-4 h-4 text-white/60" />
                        <div>
                          <p className="font-bold text-white">Desactivar comentarios</p>
                          <p className="text-[10px] text-white/60">Nadie podrá comentar en esta publicación</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={disableComments}
                          onChange={e => setDisableComments(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-400"></div>
                      </label>
                    </div>

                    {/* Ocultar recuento de like */}
                    <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-white/60" />
                        <div>
                          <p className="font-bold text-white">Ocultar recuento de likes</p>
                          <p className="text-[10px] text-white/60">Nadie verá el número total de me gusta</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideLikes}
                          onChange={e => setHideLikes(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-400"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* STAFF Mode ad creator (if active) */}
              {isStaffMode && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1">
                      <Megaphone className="w-3.5 h-3.5" />
                      Publicar Anuncio STAFF
                    </span>
                    <input
                      type="checkbox"
                      checked={isStaffAd}
                      onChange={e => setIsStaffAd(e.target.checked)}
                    />
                  </div>
                  {isStaffAd && (
                    <div className="space-y-1.5 text-[11px]">
                      <input
                        type="text"
                        placeholder="Patrocinador (ej. Rincón Paisa)"
                        value={sponsorName}
                        onChange={e => setSponsorName(e.target.value)}
                        className="w-full bg-white/10 text-white px-2 py-1 rounded border border-white/20"
                      />
                      <input
                        type="text"
                        placeholder="Título de oferta"
                        value={adTitle}
                        onChange={e => setAdTitle(e.target.value)}
                        className="w-full bg-white/10 text-white px-2 py-1 rounded border border-white/20"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={!mediaUrl.trim()}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-40"
                >
                  Compartir en La Tierrita
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAGGING MODAL / OVERLAY */}
        {isTagModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#002466] border border-white/20 rounded-3xl p-5 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Etiquetar personas</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-full bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  placeholder="Buscar parcero..."
                  className="w-full pl-9 pr-3 py-2 bg-white/10 text-white placeholder-white/40 rounded-xl border border-white/20 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {filteredUsersForTagging.map(user => {
                  const isSelected = taggedUsernames.includes(user.username);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleTagUser(user.username)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                        isSelected ? 'bg-amber-400 text-neutral-950 font-bold' : 'bg-white/5 hover:bg-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={user.avatar || undefined} alt={user.username} className="w-7 h-7 rounded-full object-cover" />
                        <div className="text-left">
                          <p className="text-xs font-bold">@{user.username}</p>
                          <p className={`text-[10px] ${isSelected ? 'text-neutral-800' : 'text-white/60'}`}>{user.name}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isSelected ? 'bg-neutral-950 text-amber-400 font-bold' : 'border border-white/30'}`}>
                        {isSelected ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl text-xs"
              >
                Listo ({taggedUsernames.length} etiquetados)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
