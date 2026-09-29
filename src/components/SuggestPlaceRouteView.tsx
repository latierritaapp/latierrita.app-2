import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Camera, Upload, Phone, Check, X, Share2, ChevronDown, AtSign, MessageCircle } from 'lucide-react';
import { PlaceCategory, SpanishCity } from '../types';
import { SPANISH_CITIES } from '../data/mockData';
import { LaTierritaLogo } from './LaTierritaLogo';

export const SuggestPlaceRouteView: React.FC = () => {
  const { suggestPlace, currentUser } = useApp();
  const [success, setSuccess] = useState(false);

  // Form state
  const [newPlaceImageUrl, setNewPlaceImageUrl] = useState('');
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceCategory, setNewPlaceCategory] = useState<PlaceCategory>('Restaurante/Cafe');
  const [newPlaceCity, setNewPlaceCity] = useState<SpanishCity>(currentUser?.city || 'Madrid');
  const [newPlaceAddress, setNewPlaceAddress] = useState('');
  const [inGoogleMaps, setInGoogleMaps] = useState<'SI' | 'NO' | null>(null);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [newPlaceDescription, setNewPlaceDescription] = useState('');
  const [newPlacePhone, setNewPlacePhone] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Socials state & accordion
  const [showSocials, setShowSocials] = useState(false);
  const [socialLaTierrita, setSocialLaTierrita] = useState('');
  const [socialWhatsApp, setSocialWhatsApp] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTikTok, setSocialTikTok] = useState('');
  const [socialX, setSocialX] = useState('');
  const [socialWeb, setSocialWeb] = useState('');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede pesar más de 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setNewPlaceImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceName.trim() || !newPlaceAddress.trim()) return;

    await suggestPlace({
      placeName: newPlaceName.trim(),
      category: newPlaceCategory,
      city: newPlaceCity,
      address: newPlaceAddress.trim(),
      imageUrl: newPlaceImageUrl.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      description: newPlaceDescription.trim() || 'Lugar recomendado por la comunidad de parceros en España.',
      phone: newPlacePhone.trim() || undefined,
      website: socialWeb.trim() || undefined,
      inGoogleMaps: inGoogleMaps === 'SI',
      isOwner: isOwner === true,
      isAnonymous: true,
      socialLinks: {
        latierrita: socialLaTierrita.trim() || undefined,
        whatsapp: socialWhatsApp.trim() || undefined,
        instagram: socialInstagram.trim() || undefined,
        facebook: socialFacebook.trim() || undefined,
        tiktok: socialTikTok.trim() || undefined,
        x: socialX.trim() || undefined,
        web: socialWeb.trim() || undefined
      }
    });

    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[#001428] text-white flex flex-col">
      {/* Header without return buttons */}
      <div className="h-16 px-4 sm:px-8 border-b border-white/10 flex items-center justify-center bg-[#001845]/95 backdrop-blur-md sticky top-0 z-20 shadow-lg">
        <div className="flex items-center justify-center">
          <LaTierritaLogo size="sm" className="h-7 w-auto" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h2 className="text-xl font-black text-white">¡Sugerencia Enviada con Éxito!</h2>
              <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                Gracias por aportar a la comunidad colombiana en España. Nuestro equipo de administración revisará el lugar y lo publicará pronto.
              </p>
              <div className="pt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setNewPlaceName('');
                    setNewPlaceAddress('');
                    setNewPlaceImageUrl('');
                    setNewPlaceDescription('');
                    setNewPlacePhone('');
                    setIsOwner(null);
                    setInGoogleMaps(null);
                    setSocialLaTierrita('');
                    setSocialWhatsApp('');
                    setSocialInstagram('');
                    setSocialFacebook('');
                    setSocialTikTok('');
                    setSocialX('');
                    setSocialWeb('');
                  }}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl transition-all shadow"
                >
                  Sugerir Otro Sitio
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="text-center pb-2">
                <h1 className="text-lg sm:text-xl font-black text-white mb-1">Recomienda un Rincón Colombiano 🇨🇴</h1>
                <p className="text-xs text-white/60">
                  ¿Conoces un restaurante, panadería, bar o negocio colombiano en España? Compártelo con la comunidad.
                </p>
              </div>

              {/* 1. Foto / Logo */}
              <div>
                <label className="block text-[11px] font-bold text-white/80 mb-1 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Foto / Logo (opcional)</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                {newPlaceImageUrl ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/20 bg-neutral-950">
                    <img
                      src={newPlaceImageUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPlaceImageUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 rounded-xl border border-dashed border-white/25 hover:border-amber-400/60 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-white/60 hover:text-white"
                  >
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span className="text-[11px] font-semibold">
                      Haz clic para subir una foto o logo
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Nombre del lugar */}
              <div>
                <label className="block text-[11px] font-bold text-white/90 mb-1">
                  Nombre del lugar *
                </label>
                <input
                  type="text"
                  required
                  value={newPlaceName}
                  onChange={e => setNewPlaceName(e.target.value)}
                  placeholder="ej. Restaurante El Paisita"
                  className="w-full bg-white/10 px-3 py-2.5 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                />
              </div>

              {/* 3. Descripción */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-white/70">
                    Descripción (opcional)
                  </label>
                  <span className={`text-[10px] font-mono ${newPlaceDescription.length >= 95 ? 'text-amber-300 font-bold' : 'text-white/50'}`}>
                    {newPlaceDescription.length}/100
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={100}
                  value={newPlaceDescription}
                  onChange={e => setNewPlaceDescription(e.target.value)}
                  placeholder="Describe brevemente este lugar (máx. 100 caracteres)..."
                  className="w-full bg-white/10 px-3 py-2.5 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none font-medium"
                />
              </div>

              {/* 4. Categoría - Ciudad */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-white/90 mb-1">
                    Categoría *
                  </label>
                  <select
                    required
                    value={newPlaceCategory}
                    onChange={e => setNewPlaceCategory(e.target.value as PlaceCategory)}
                    className="w-full bg-[#0c2454] px-3 py-2.5 rounded-xl border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                  >
                    <option value="Restaurante/Cafe" className="bg-[#0c2454] text-white">Restaurante/Cafe</option>
                    <option value="Bar/Pub" className="bg-[#0c2454] text-white">Bar/Pub</option>
                    <option value="Discoteca" className="bg-[#0c2454] text-white">Discoteca</option>
                    <option value="Hotel" className="bg-[#0c2454] text-white">Hotel</option>
                    <option value="Tienda" className="bg-[#0c2454] text-white">Tienda</option>
                    <option value="Spa/Belleza" className="bg-[#0c2454] text-white">Spa/Belleza</option>
                    <option value="Sitios de interes" className="bg-[#0c2454] text-white">Sitios de interes</option>
                    <option value="Otros" className="bg-[#0c2454] text-white">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/90 mb-1">
                    Ciudad en España *
                  </label>
                  <select
                    required
                    value={newPlaceCity}
                    onChange={e => setNewPlaceCity(e.target.value as SpanishCity)}
                    className="w-full bg-[#0c2454] px-3 py-2.5 rounded-xl border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                  >
                    {SPANISH_CITIES.map(c => (
                      <option key={c} value={c} className="bg-[#0c2454] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Dirección */}
              <div>
                <label className="block text-[11px] font-bold text-white/90 mb-1">
                  Dirección exacta *
                </label>
                <input
                  type="text"
                  required
                  value={newPlaceAddress}
                  onChange={e => setNewPlaceAddress(e.target.value)}
                  placeholder="ej. Calle de Bravo Murillo 120, Madrid"
                  className="w-full bg-white/10 px-3 py-2.5 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                />
              </div>

              {/* 6. Teléfono */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Teléfono (opcional)</span>
                </label>
                <input
                  type="tel"
                  value={newPlacePhone}
                  onChange={e => setNewPlacePhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="w-full bg-white/10 px-3 py-2.5 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                />
              </div>

              {/* 7. Google Maps - Propietario (Compacto con botones pequeños) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Google Maps Check */}
                <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5 flex flex-col justify-between">
                  <span className="block text-[11px] font-bold text-white/80 leading-tight">
                    ¿La ubicación está en Google Maps? (opcional)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInGoogleMaps(inGoogleMaps === 'SI' ? null : 'SI')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all text-[11px] border w-16 cursor-pointer ${
                        inGoogleMaps === 'SI'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow'
                          : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'
                      }`}
                    >
                      <Check className={`w-3 h-3 ${inGoogleMaps === 'SI' ? 'stroke-[3]' : 'opacity-50'}`} />
                      <span>SÍ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInGoogleMaps(inGoogleMaps === 'NO' ? null : 'NO')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all text-[11px] border w-16 cursor-pointer ${
                        inGoogleMaps === 'NO'
                          ? 'bg-rose-500 text-white border-rose-400 shadow'
                          : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'
                      }`}
                    >
                      <X className={`w-3 h-3 ${inGoogleMaps === 'NO' ? 'stroke-[3]' : 'opacity-50'}`} />
                      <span>NO</span>
                    </button>
                  </div>
                </div>

                {/* ¿Eres el propietario/a? Check */}
                <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5 flex flex-col justify-between">
                  <span className="block text-[11px] font-bold text-white/80 leading-tight">
                    ¿Eres el propietario/a?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOwner(isOwner === true ? null : true)}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all text-[11px] border w-16 cursor-pointer ${
                        isOwner === true
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow'
                          : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'
                      }`}
                    >
                      <Check className={`w-3 h-3 ${isOwner === true ? 'stroke-[3]' : 'opacity-50'}`} />
                      <span>SÍ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsOwner(isOwner === false ? null : false)}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all text-[11px] border w-16 cursor-pointer ${
                        isOwner === false
                          ? 'bg-rose-500 text-white border-rose-400 shadow'
                          : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'
                      }`}
                    >
                      <X className={`w-3 h-3 ${isOwner === false ? 'stroke-[3]' : 'opacity-50'}`} />
                      <span>NO</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 8. Redes sociales */}
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setShowSocials(!showSocials)}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Redes Sociales (opcional)
                      </span>
                      <span className="text-[10px] text-white/50">
                        WhatsApp, Instagram, Facebook, TikTok, X, Web...
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold text-amber-300">
                      {showSocials ? 'Ocultar' : 'Agregar'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
                        showSocials ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </div>
                </button>

                {showSocials && (
                  <div className="p-3.5 pt-2 border-t border-white/10 space-y-2.5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-white/60 mb-0.5">
                          La Tierrita
                        </label>
                        <div className="relative">
                          <AtSign className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={socialLaTierrita}
                            onChange={e => setSocialLaTierrita(e.target.value)}
                            placeholder="usuario"
                            className="w-full bg-white/10 pl-7 pr-2 py-1.5 rounded-lg border border-white/15 text-[11px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/60 mb-0.5">
                          WhatsApp
                        </label>
                        <div className="relative">
                          <MessageCircle className="w-3 h-3 text-emerald-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={socialWhatsApp}
                            onChange={e => setSocialWhatsApp(e.target.value)}
                            placeholder="+34 612 345 678"
                            className="w-full bg-white/10 pl-7 pr-2 py-1.5 rounded-lg border border-white/15 text-[11px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-white/60 mb-0.5">
                          Instagram
                        </label>
                        <div className="relative">
                          <AtSign className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={socialInstagram}
                            onChange={e => setSocialInstagram(e.target.value)}
                            placeholder="@usuario"
                            className="w-full bg-white/10 pl-7 pr-2 py-1.5 rounded-lg border border-white/15 text-[11px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/60 mb-0.5">
                          Facebook
                        </label>
                        <input
                          type="text"
                          value={socialFacebook}
                          onChange={e => setSocialFacebook(e.target.value)}
                          placeholder="facebook.com/..."
                          className="w-full bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15 text-[11px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-white/60 mb-0.5">
                          TikTok
                        </label>
                        <div className="relative">
                          <AtSign className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={socialTikTok}
                            onChange={e => setSocialTikTok(e.target.value)}
                            placeholder="@usuario"
                            className="w-full bg-white/10 pl-7 pr-2 py-1.5 rounded-lg border border-white/15 text-[11px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/60 mb-0.5">
                          X (Twitter)
                        </label>
                        <input
                          type="text"
                          value={socialX}
                          onChange={e => setSocialX(e.target.value)}
                          placeholder="@usuario"
                          className="w-full bg-[#1da1f2]/10 px-2.5 py-1.5 rounded-lg border border-white/15 text-[11px] text-white placeholder-white/30 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white/60 mb-0.5">
                        Sitio Web / Enlace
                      </label>
                      <input
                        type="url"
                        value={socialWeb}
                        onChange={e => setSocialWeb(e.target.value)}
                        placeholder="https://www.tuweb.com"
                        className="w-full bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15 text-[11px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-sm rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-rose-600 fill-rose-600" />
                  <span>Enviar Sugerencia de Sitio</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
