import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Search,
  Star,
  Phone,
  Globe,
  Plus,
  Compass,
  CheckCircle2,
  X,
  ExternalLink,
  Utensils,
  Wine,
  Music,
  Hotel,
  ShoppingBag,
  Sparkles,
  Landmark,
  MoreHorizontal,
  Camera,
  Check,
  Share2,
  AtSign,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Upload,
  Flag
} from 'lucide-react';
import { PlaceCategory, PlaceItem, SpanishCity } from '../types';
import { SPANISH_CITIES } from '../data/mockData';
import { ClassifiedAdsSection } from './ClassifiedAdsSection';

const CATEGORIES: { label: PlaceCategory | 'Todos'; icon: React.FC<{ className?: string }> }[] = [
  { label: 'Todos', icon: Compass },
  { label: 'Restaurante/Cafe', icon: Utensils },
  { label: 'Bar/Pub', icon: Wine },
  { label: 'Discoteca', icon: Music },
  { label: 'Hotel', icon: Hotel },
  { label: 'Tienda', icon: ShoppingBag },
  { label: 'Spa/Belleza', icon: Sparkles },
  { label: 'Sitios de interes', icon: Landmark },
  { label: 'Otros', icon: MoreHorizontal }
];

export const PlacesView: React.FC = () => {
  const { places, addPlace, currentUser, placesSubTab, openReportModal } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<SpanishCity | 'Todas'>(currentUser.city || 'Todas');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'Todos'>('Todos');
  const [selectedPlace, setSelectedPlace] = useState<PlaceItem | null>(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  // Form state for suggesting a new place
  const [newPlaceImageUrl, setNewPlaceImageUrl] = useState('');
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceCategory, setNewPlaceCategory] = useState<PlaceCategory>('Restaurante/Cafe');
  const [newPlaceCity, setNewPlaceCity] = useState<SpanishCity>(currentUser.city || 'Madrid');
  const [newPlaceAddress, setNewPlaceAddress] = useState('');
  const [inGoogleMaps, setInGoogleMaps] = useState<'SI' | 'NO' | null>(null);
  const [newPlaceDescription, setNewPlaceDescription] = useState('');
  const [newPlacePhone, setNewPlacePhone] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Social networks state
  const [socialLaTierrita, setSocialLaTierrita] = useState('');
  const [socialWhatsApp, setSocialWhatsApp] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTikTok, setSocialTikTok] = useState('');
  const [socialX, setSocialX] = useState('');
  const [socialWeb, setSocialWeb] = useState('');

  // Filter places
  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      const matchesSearch =
        (place.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (place.specialty || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (place.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (place.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (place.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCity = selectedCity === 'Todas' || place.city === selectedCity;
      const matchesCategory = selectedCategory === 'Todos' || place.category === selectedCategory;

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [places, searchQuery, selectedCity, selectedCategory]);

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceName.trim() || !newPlaceAddress.trim()) return;

    addPlace({
      name: newPlaceName.trim(),
      category: newPlaceCategory,
      city: newPlaceCity,
      address: newPlaceAddress.trim(),
      imageUrl:
        newPlaceImageUrl.trim() ||
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      rating: 5.0,
      reviewsCount: 1,
      priceRange: '€€',
      specialty: newPlaceCategory === 'Restaurante/Cafe' ? 'Comida típica y café' : newPlaceCategory,
      description:
        newPlaceDescription.trim() || 'Lugar recomendado por la comunidad de parceros en España.',
      phone: newPlacePhone.trim() || undefined,
      website: socialWeb.trim() || undefined,
      inGoogleMaps: inGoogleMaps === 'SI',
      socialLinks: {
        latierrita: socialLaTierrita.trim() || undefined,
        whatsapp: socialWhatsApp.trim() || undefined,
        instagram: socialInstagram.trim() || undefined,
        facebook: socialFacebook.trim() || undefined,
        tiktok: socialTikTok.trim() || undefined,
        x: socialX.trim() || undefined,
        web: socialWeb.trim() || undefined
      },
      isVerified: false,
      tags: [newPlaceCategory, newPlaceCity, 'Recomendado por parceros']
    });

    // Reset Form
    setNewPlaceImageUrl('');
    setNewPlaceName('');
    setNewPlaceCategory('Restaurante/Cafe');
    setNewPlaceCity(currentUser.city || 'Madrid');
    setNewPlaceAddress('');
    setInGoogleMaps(null);
    setNewPlaceDescription('');
    setNewPlacePhone('');
    setSocialLaTierrita('');
    setSocialWhatsApp('');
    setSocialInstagram('');
    setSocialFacebook('');
    setSocialTikTok('');
    setSocialX('');
    setSocialWeb('');
    setIsSuggestModalOpen(false);
  };

  if (placesSubTab === 'ads') {
    return <ClassifiedAdsSection />;
  }

  return (
    <div id="places-container" className="w-full max-w-2xl mx-auto bg-transparent">
      {/* Header Bar */}
      <div className="sticky top-14 z-30 bg-[#003087]/80 backdrop-blur-md border-b border-white/10 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span>Lugares</span>
            </h1>
            <p className="text-[11px] text-white/70">
              Restaurantes, panaderías, rumba y trámites en España
            </p>
          </div>

          <button
            id="btn-suggest-place"
            onClick={() => setIsSuggestModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Sugerir Sitio</span>
          </button>
        </div>

        {/* Search Input and City Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-places-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por bandeja paisa, ajiaco, rumba, abogados..."
              className="w-full pl-9 pr-3.5 py-2 bg-white/10 text-xs rounded-xl border border-white/15 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* City Filter */}
          <div>
            <select
              id="select-places-city"
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#0c2454] text-xs rounded-xl border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
            >
              <option value="Todas" className="bg-[#0c2454] text-white">Toda España</option>
              {SPANISH_CITIES.map(c => (
                <option key={c} value={c} className="bg-[#0c2454] text-white">
                  {c} {currentUser.city === c ? '(Tu ciudad)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                id={`cat-btn-${cat.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedCategory(cat.label)}
                className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                  isSelected
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Places Feed / Minimized Cards */}
      <div className="p-4 space-y-3">
        {filteredPlaces.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3 bg-white/[0.04] backdrop-blur-sm rounded-3xl border border-white/10">
            <Compass className="w-12 h-12 text-white/40 mx-auto stroke-1" />
            <h3 className="text-sm font-bold text-white">
              No encontramos lugares con esos filtros
            </h3>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              ¿Conoces un restaurante, panadería o sitio colombiano que falte en {selectedCity === 'Todas' ? 'España' : selectedCity}?
            </p>
            <button
              onClick={() => setIsSuggestModalOpen(true)}
              className="px-4 py-2 bg-amber-400 text-neutral-950 font-black text-xs rounded-xl hover:bg-amber-300 shadow-sm"
            >
              Recomendar un Sitio Ahora
            </button>
          </div>
        ) : (
          filteredPlaces.map(place => (
            <div
              key={place.id}
              id={`place-card-${place.id}`}
              onClick={() => setSelectedPlace(place)}
              className="group bg-white/[0.04] backdrop-blur-sm border border-white/10 hover:border-amber-400/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-row items-stretch text-white"
            >
              {/* 1. Foto / Logo (1:1 Square on Left) */}
              <div className="w-28 sm:w-32 md:w-36 aspect-square shrink-0 relative bg-neutral-950 overflow-hidden self-stretch">
                <img
                  src={place.imageUrl || undefined}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 aspect-square"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Minimized Content: Categoría, Ciudad, Nombre, Dirección, Descripción, Calificación */}
              <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between min-w-0">
                <div>
                  {/* Categoría & Ciudad */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 truncate">
                      {place.category}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/80 shrink-0">
                      {place.city}
                    </span>
                  </div>

                  {/* Nombre & Calificación */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1 min-w-0 truncate">
                      <span className="truncate group-hover:text-amber-300 transition-colors">
                        {place.name}
                      </span>
                      {place.isVerified && (
                        <span title="Verificado por la comunidad" className="inline-flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        </span>
                      )}
                    </h3>

                    {/* Calificación */}
                    <div className="flex items-center gap-1 text-xs font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded-md shrink-0 border border-amber-400/30">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Dirección */}
                  <p className="text-[11px] text-white/60 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">{place.address}</span>
                  </p>

                  {/* Descripción */}
                  <p className="text-xs text-white/75 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                    {place.description || place.specialty}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Place Detail Modal (Tarjeta Abierta) */}
      {selectedPlace && (
        <div
          id="modal-place-detail"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedPlace(null)}
        >
          <div
            className="w-full max-w-md bg-[#0d224d] border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] text-white"
            onClick={e => e.stopPropagation()}
          >
            {/* 1. Foto / Logo */}
            <div className="relative h-32 sm:h-36 w-full bg-neutral-900 shrink-0">
              <img
                src={selectedPlace.imageUrl || undefined}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d224d] via-black/25 to-black/50" />

              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  id={`btn-report-place-${selectedPlace.id}`}
                  onClick={() => {
                    const currentPlace = selectedPlace;
                    setSelectedPlace(null);
                    openReportModal({
                      id: currentPlace.id,
                      type: 'support',
                      title: `Lugar: ${currentPlace.name} (${currentPlace.category} · ${currentPlace.city})`,
                      initialTicketType: 'TRA'
                    });
                  }}
                  className="p-1.5 rounded-full bg-black/60 text-white/70 hover:text-rose-400 hover:bg-black/90 transition-colors cursor-pointer"
                  title="Reportar este lugar o negocio (TRA)"
                >
                  <Flag className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedPlace(null)}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2. Categoría / Ciudad */}
              <div className="absolute top-2.5 left-2.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 shadow">
                  {selectedPlace.category} · {selectedPlace.city}
                </span>
              </div>
            </div>

            {/* Modal Body / Information in requested order */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2.5">
              {/* 3. Nombre & 4. Calificación */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 truncate">
                    <span className="truncate">{selectedPlace.name}</span>
                    {selectedPlace.isVerified && (
                      <span title="Verificado" className="inline-flex items-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      </span>
                    )}
                  </h2>
                </div>

                {/* 4. Calificación */}
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/20 border border-amber-400/40 rounded-lg text-amber-300 shrink-0 text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-black">{selectedPlace.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-white/50">({selectedPlace.reviewsCount})</span>
                </div>
              </div>

              {/* 5. Dirección */}
              <div className="flex items-start gap-1.5 py-1.5 px-2.5 bg-white/5 rounded-lg border border-white/10 text-[11px] text-neutral-200">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug truncate">{selectedPlace.address}</span>
              </div>

              {/* 6. Descripción */}
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
                  Descripción
                </span>
                <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/5 line-clamp-3">
                  {selectedPlace.description || selectedPlace.specialty}
                </p>
              </div>

              {/* 7. Redes Sociales (Solo botones con logo) */}
              {selectedPlace.socialLinks && Object.values(selectedPlace.socialLinks).some(Boolean) && (
                <div>
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1.5">
                    Redes Sociales
                  </span>
                  <div className="flex items-center gap-2">
                    {/* La Tierrita */}
                    {selectedPlace.socialLinks?.latierrita && (
                      <div
                        title={`La Tierrita: ${selectedPlace.socialLinks.latierrita}`}
                        className="w-8 h-8 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center justify-center text-sm transition-transform hover:scale-105 cursor-pointer shadow-sm shrink-0"
                      >
                        <span role="img" aria-label="La Tierrita">🇨🇴</span>
                      </div>
                    )}

                    {/* WhatsApp */}
                    {selectedPlace.socialLinks?.whatsapp && (
                      <a
                        href={`https://wa.me/${selectedPlace.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`WhatsApp: ${selectedPlace.socialLinks.whatsapp}`}
                        aria-label="WhatsApp"
                        className="w-8 h-8 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-all hover:scale-105 shadow-sm shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}

                    {/* Instagram */}
                    {selectedPlace.socialLinks?.instagram && (
                      <a
                        href={selectedPlace.socialLinks.instagram.startsWith('http') ? selectedPlace.socialLinks.instagram : `https://instagram.com/${selectedPlace.socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Instagram: ${selectedPlace.socialLinks.instagram}`}
                        aria-label="Instagram"
                        className="w-8 h-8 rounded-lg bg-pink-500/15 hover:bg-pink-500/30 border border-pink-500/30 flex items-center justify-center text-pink-400 hover:text-pink-300 transition-all hover:scale-105 shadow-sm shrink-0"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}

                    {/* Facebook */}
                    {selectedPlace.socialLinks?.facebook && (
                      <a
                        href={selectedPlace.socialLinks.facebook.startsWith('http') ? selectedPlace.socialLinks.facebook : (selectedPlace.socialLinks.facebook.includes('facebook.com') ? `https://${selectedPlace.socialLinks.facebook}` : `https://facebook.com/${selectedPlace.socialLinks.facebook}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Facebook"
                        aria-label="Facebook"
                        className="w-8 h-8 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-all hover:scale-105 shadow-sm shrink-0"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}

                    {/* TikTok */}
                    {selectedPlace.socialLinks?.tiktok && (
                      <a
                        href={selectedPlace.socialLinks.tiktok.startsWith('http') ? selectedPlace.socialLinks.tiktok : `https://tiktok.com/@${selectedPlace.socialLinks.tiktok.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`TikTok: ${selectedPlace.socialLinks.tiktok}`}
                        aria-label="TikTok"
                        className="w-8 h-8 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/30 flex items-center justify-center text-cyan-300 hover:text-cyan-200 transition-all hover:scale-105 shadow-sm shrink-0"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-.85-.05A6.34 6.34 0 0 0 3.1 15.69a6.34 6.34 0 0 0 10.79 4.49 6.3 6.3 0 0 0 1.89-4.49V8.52a8.27 8.27 0 0 0 4.81 1.54V6.69h-1z" />
                        </svg>
                      </a>
                    )}

                    {/* X (Twitter) */}
                    {selectedPlace.socialLinks?.x && (
                      <a
                        href={selectedPlace.socialLinks.x.startsWith('http') ? selectedPlace.socialLinks.x : `https://x.com/${selectedPlace.socialLinks.x.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`X: ${selectedPlace.socialLinks.x}`}
                        aria-label="X"
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105 shadow-sm shrink-0"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}

                    {/* Sitio Web */}
                    {(selectedPlace.socialLinks?.web || selectedPlace.website) && (
                      <a
                        href={(selectedPlace.socialLinks?.web || selectedPlace.website || '').startsWith('http') ? (selectedPlace.socialLinks?.web || selectedPlace.website || '') : `https://${selectedPlace.socialLinks?.web || selectedPlace.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Sitio Web"
                        aria-label="Sitio Web"
                        className="w-8 h-8 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-all hover:scale-105 shadow-sm shrink-0"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* 8. Teléfono & 9. Cómo llegar (Botones de acción principales) */}
              <div className="pt-1.5 grid grid-cols-2 gap-2 text-xs">
                {/* 8. Teléfono */}
                {selectedPlace.phone ? (
                  <a
                    href={`tel:${selectedPlace.phone}`}
                    className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedPlace.phone}</span>
                  </a>
                ) : (
                  <div className="py-2.5 px-3 bg-white/5 border border-white/10 text-white/50 rounded-xl flex items-center justify-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 opacity-40 shrink-0" />
                    <span className="text-[11px] truncate">Sin teléfono</span>
                  </div>
                )}

                {/* 9. Cómo llegar */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedPlace.name}, ${selectedPlace.address}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-600 fill-rose-600 shrink-0" />
                  <span className="truncate">Cómo llegar</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Place Modal */}
      {isSuggestModalOpen && (
        <div
          id="modal-suggest-place"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsSuggestModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0d224d] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-amber-400/10 shrink-0">
              <div className="flex items-center gap-2 text-amber-300">
                <MapPin className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black">Sugerir Sitio Colombiano</h3>
              </div>
              <button
                onClick={() => setIsSuggestModalOpen(false)}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSuggestSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
              {/* 1. Foto / Logo opcional (Subir archivo) */}
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
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/20 bg-neutral-950">
                    <img
                      src={newPlaceImageUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPlaceImageUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-white"
                      title="Eliminar foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-20 rounded-xl border border-dashed border-white/25 hover:border-amber-400/60 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-white/60 hover:text-white"
                  >
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span className="text-[11px] font-semibold">
                      Haz clic para subir una foto o logo desde tu dispositivo
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Nombre del lugar* */}
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
                  className="w-full bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* 3. Categoría* - Ciudad* */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-white/90 mb-1">
                    Categoría *
                  </label>
                  <select
                    required
                    value={newPlaceCategory}
                    onChange={e => setNewPlaceCategory(e.target.value as PlaceCategory)}
                    className="w-full bg-[#0c2454] px-3 py-2 rounded-xl border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
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
                    Ciudad *
                  </label>
                  <select
                    required
                    value={newPlaceCity}
                    onChange={e => setNewPlaceCity(e.target.value as SpanishCity)}
                    className="w-full bg-[#0c2454] px-3 py-2 rounded-xl border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                  >
                    {SPANISH_CITIES.map(c => (
                      <option key={c} value={c} className="bg-[#0c2454] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Dirección* */}
              <div>
                <label className="block text-[11px] font-bold text-white/90 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  required
                  value={newPlaceAddress}
                  onChange={e => setNewPlaceAddress(e.target.value)}
                  placeholder="ej. Calle de Bravo Murillo 120"
                  className="w-full bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* 5. ¿La ubicación está en Google Maps? Checking SI o NO (opcional) */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <span className="block text-[11px] font-bold text-white/80">
                  ¿La ubicación está en Google Maps? (opcional)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInGoogleMaps(inGoogleMaps === 'SI' ? null : 'SI')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs border ${
                      inGoogleMaps === 'SI'
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow'
                        : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${inGoogleMaps === 'SI' ? 'stroke-[3]' : 'opacity-50'}`} />
                    <span>SÍ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInGoogleMaps(inGoogleMaps === 'NO' ? null : 'NO')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs border ${
                      inGoogleMaps === 'NO'
                        ? 'bg-rose-500 text-white border-rose-400 shadow'
                        : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    <X className={`w-3.5 h-3.5 ${inGoogleMaps === 'NO' ? 'stroke-[3]' : 'opacity-50'}`} />
                    <span>NO</span>
                  </button>
                </div>
              </div>

              {/* 6. Descripción (Máximo 100 caracteres) opcional */}
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
                  placeholder="Describe brevemente este lugar colombiano (máx. 100 caracteres)..."
                  className="w-full bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* 7. Teléfono (opcional) */}
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
                  className="w-full bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* 8. Redes sociales (opcional) */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    Redes Sociales (opcional)
                  </span>
                </div>

                {/* Row 1: La Tierrita -- WhatsApp */}
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

                {/* Row 2: Instagram -- Facebook */}
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

                {/* Row 3: TikTok -- X */}
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
                      X
                    </label>
                    <div className="relative">
                      <AtSign className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={socialX}
                        onChange={e => setSocialX(e.target.value)}
                        placeholder="@usuario"
                        className="w-full bg-white/10 pl-7 pr-2 py-1.5 rounded-lg border border-white/15 text-[11px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Web */}
                <div>
                  <label className="block text-[10px] font-bold text-white/60 mb-0.5">
                    Sitio Web
                  </label>
                  <div className="relative">
                    <Globe className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={socialWeb}
                      onChange={e => setSocialWeb(e.target.value)}
                      placeholder="ejemplo.com"
                      className="w-full bg-white/10 pl-7 pr-2 py-1.5 rounded-lg border border-white/15 text-[11px] text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Publicar en Lugares de La Tierrita</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

