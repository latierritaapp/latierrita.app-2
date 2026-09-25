import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Megaphone,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Briefcase,
  Home,
  Package,
  FileCheck,
  ShoppingBag,
  Music,
  Upload,
  Image as ImageIcon,
  MessageCircle,
  MessageSquare,
  User,
  ExternalLink,
  Flag,
  ShieldAlert
} from 'lucide-react';
import { ClassifiedAdItem, ClassifiedCategory, SpanishCity, UserProfile } from '../types';
import { DEFAULT_SILHOUETTE_AVATAR } from '../context/AuthContext';
import { SPANISH_CITIES } from '../data/mockData';

const AD_CATEGORIES: { label: ClassifiedCategory | 'Todos'; icon: React.FC<{ className?: string }> }[] = [
  { label: 'Todos', icon: Megaphone },
  { label: 'Empleo & Trabajo', icon: Briefcase },
  { label: 'Vivienda & Habitaciones', icon: Home },
  { label: 'Compra & Venta', icon: ShoppingBag },
  { label: 'Eventos & Clases', icon: Music }
];

const INITIAL_ADS: ClassifiedAdItem[] = [];

export const ClassifiedAdsSection: React.FC = () => {
  const {
    currentUser,
    otherUsers,
    setSelectedUserProfile,
    setActiveTab,
    setChatTypeTab,
    startPrivateChat,
    triggerPlushNotification,
    openReportModal
  } = useApp();

  const [ads, setAds] = useState<ClassifiedAdItem[]>(() => {
    const saved = localStorage.getItem('latierrita_user_ads');
    return saved ? JSON.parse(saved) : INITIAL_ADS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<SpanishCity | 'Todas'>(currentUser.city || 'Todas');
  const [selectedCategory, setSelectedCategory] = useState<ClassifiedCategory | 'Todos'>('Todos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAdDetail, setSelectedAdDetail] = useState<ClassifiedAdItem | null>(null);

  // New Ad Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ClassifiedCategory>('Empleo & Trabajo');
  const [city, setCity] = useState<SpanishCity | 'Toda España'>(currentUser.city || 'Madrid');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch =
        (ad.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ad.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ad.contactName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ad.contactUsername && ad.contactUsername.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ad.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCity =
        selectedCity === 'Todas' || ad.city === 'Toda España' || ad.city === selectedCity;
      const matchesCategory =
        selectedCategory === 'Todos' || ad.category === selectedCategory;

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [ads, searchQuery, selectedCity, selectedCategory]);

  const getAuthorUsername = (ad: ClassifiedAdItem): string => {
    if (ad.contactUsername) {
      return ad.contactUsername.replace(/^@/, '');
    }
    return ad.contactName
      ? ad.contactName.toLowerCase().replace(/[^a-z0-9]/g, '_')
      : 'usuario';
  };

  const handleNavigateToAuthor = (ad: ClassifiedAdItem) => {
    const username = getAuthorUsername(ad);

    if (username === currentUser.username || ad.contactName === currentUser.name) {
      setSelectedUserProfile(null);
      setActiveTab('profile');
      return;
    }

    const found = otherUsers.find(
      u =>
        u.username.toLowerCase() === username.toLowerCase() ||
        u.name.toLowerCase() === ad.contactName.toLowerCase()
    );

    if (found) {
      setSelectedUserProfile(found);
      setActiveTab('profile');
    } else {
      const generatedProfile: UserProfile = {
        id: `user-${username}`,
        username: username,
        name: ad.contactName || username,
        avatar:
          ad.imageUrl ||
          DEFAULT_SILHOUETTE_AVATAR,
        bio: `Colombiano(a) en ${ad.city}. Usuario de La Tierrita España.`,
        website: '',
        city: (ad.city === 'Toda España' ? 'Madrid' : ad.city) as SpanishCity,
        originCity: 'Colombia',
        followersCount: 120,
        followingCount: 85,
        postsCount: 3,
        isVerified: false
      };
      setSelectedUserProfile(generatedProfile);
      setActiveTab('profile');
    }
  };

  const handleOpenPrivateChat = (ad: ClassifiedAdItem) => {
    const authorUsername = getAuthorUsername(ad);

    if (authorUsername === currentUser.username || ad.contactName === currentUser.name) {
      triggerPlushNotification({
        type: 'system',
        title: 'Tu propio anuncio',
        message: 'No puedes iniciar un chat privado contigo mismo.',
        avatar: currentUser.avatar
      });
      return;
    }

    const found = otherUsers.find(
      u =>
        u.username.toLowerCase() === authorUsername.toLowerCase() ||
        u.name.toLowerCase() === ad.contactName.toLowerCase()
    );

    const targetUserId = found ? found.id : `user-${authorUsername}`;
    startPrivateChat(targetUserId);
    setSelectedAdDetail(null);
    setChatTypeTab('messages');
    setActiveTab('chats');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isPriceAllowed =
    category === 'Vivienda & Habitaciones' || category === 'Compra & Venta';

  const handleCreateAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !isDisclaimerAccepted) return;

    const newAd: ClassifiedAdItem = {
      id: `ad-${Date.now()}`,
      title: title.trim(),
      category,
      city,
      description: description.trim().slice(0, 100),
      contactName: currentUser.name || 'Usuario La Tierrita',
      contactUsername: currentUser.username,
      contactPhone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      price: isPriceAllowed && price.trim() ? price.trim() : undefined,
      imageUrl: imageUrl.trim() || undefined,
      date: 'Reciente',
      isPromoted: false,
      tags: [category.split(' ')[0], city === 'Toda España' ? 'España' : city]
    };

    const updated = [newAd, ...ads];
    setAds(updated);
    localStorage.setItem('latierrita_user_ads', JSON.stringify(updated));

    triggerPlushNotification({
      type: 'system',
      title: 'Anuncio publicado',
      message: 'Tu anuncio ya está visible para la comunidad en la sección Anuncios.',
      avatar: currentUser.avatar
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setPhone('');
    setWhatsapp('');
    setPrice('');
    setImageUrl('');
    setIsDisclaimerAccepted(false);
    setIsCreateModalOpen(false);
  };

  return (
    <div id="classified-ads-section" className="w-full bg-transparent">
      {/* Subheader with filters */}
      <div className="sticky top-14 z-30 bg-[#003087]/80 backdrop-blur-md border-b border-white/10 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <Megaphone className="w-5 h-5 text-amber-400" />
              <span>Anuncios</span>
            </h1>
            <p className="text-[11px] text-white/70">
              Empleo, alquileres, encomiendas y servicios entre parceros
            </p>
          </div>

          <button
            id="btn-create-classified-ad"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Publicar Anuncio</span>
          </button>
        </div>

        {/* Search Input and City Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-ads-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, descripción, autor o ciudad..."
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
              id="select-ads-city"
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
          {AD_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                id={`cat-ad-btn-${cat.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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

      {/* Announcements List */}
      <div className="p-4 space-y-3">
        {filteredAds.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3 bg-white/[0.04] backdrop-blur-sm rounded-3xl border border-white/10">
            <Megaphone className="w-10 h-10 text-amber-400/60 mx-auto" />
            <h3 className="text-sm font-extrabold text-white">
              No hay anuncios que coincidan
            </h3>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              Sé el primero en publicar una oferta, alquiler o servicio para la comunidad.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 text-neutral-950 font-extrabold text-xs rounded-xl hover:bg-amber-300 transition-all shadow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Publicar Ahora</span>
            </button>
          </div>
        ) : (
          (filteredAds || []).map(ad => {
            const authorUsername = getAuthorUsername(ad);
            return (
              <div
                key={ad.id}
                id={`ad-card-${ad.id}`}
                onClick={() => setSelectedAdDetail(ad)}
                className="group bg-white/[0.04] backdrop-blur-sm border border-white/10 hover:border-amber-400/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-row items-stretch text-white"
              >
                {/* Left Side: 1:1 Square Image */}
                <div className="w-28 sm:w-32 md:w-36 aspect-square shrink-0 relative bg-neutral-950 overflow-hidden self-stretch">
                  {ad.imageUrl ? (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 aspect-square"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0d224d] to-neutral-950 p-2 text-center">
                      <Megaphone className="w-7 h-7 text-amber-400/60 mb-1" />
                      <span className="text-[9px] font-bold text-white/50 uppercase">
                        {ad.category.split(' ')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Side: Information */}
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    {/* Categoría & Ciudad */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 truncate">
                        {ad.category}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/80 shrink-0">
                        {ad.city}
                      </span>
                    </div>

                    {/* Título */}
                    <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {ad.title}
                    </h3>

                    {/* Descripción */}
                    <p className="text-xs text-white/75 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                      {ad.description}
                    </p>
                  </div>

                  {/* Footer details: Autor Clickable & Fecha */}
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-white/60">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span>Por</span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleNavigateToAuthor(ad);
                        }}
                        className="text-amber-300 hover:text-amber-200 hover:underline font-bold transition-colors cursor-pointer truncate max-w-[130px] sm:max-w-[170px]"
                        title={`Ver perfil de @${authorUsername}`}
                      >
                        @{authorUsername}
                      </button>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {ad.date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ad Detail Modal (Tarjeta Abierta) */}
      {selectedAdDetail && (
        <div
          id="modal-ad-detail"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedAdDetail(null)}
        >
          <div
            className="w-full max-w-md bg-[#0d224d] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Foto / Logo Header */}
            {selectedAdDetail.imageUrl ? (
              <div className="relative h-48 w-full bg-neutral-900 shrink-0">
                <img
                  src={selectedAdDetail.imageUrl}
                  alt={selectedAdDetail.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d224d] via-transparent to-black/50" />
                <button
                  type="button"
                  onClick={() => setSelectedAdDetail(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all active:scale-90"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-amber-300">
                  <Megaphone className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider">Detalle del Anuncio</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAdDetail(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content body */}
            <div className="p-5 overflow-y-auto space-y-3.5">
              {/* Categoria - Ciudad */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-400 text-neutral-950 font-black text-[11px] uppercase tracking-wide shadow-sm">
                  {selectedAdDetail.category} — {selectedAdDetail.city}
                </span>
                <span className="text-[11px] text-white/50 flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3" />
                  {selectedAdDetail.date}
                </span>
              </div>

              {/* Titulo del Anuncio */}
              <div>
                <h2 className="text-base font-extrabold text-white leading-snug">
                  {selectedAdDetail.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/65 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-rose-300 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedAdDetail.city}
                  </span>
                  <span>•</span>
                  <span>Publicado por</span>
                  <button
                    type="button"
                    onClick={() => {
                      const adToNav = selectedAdDetail;
                      setSelectedAdDetail(null);
                      handleNavigateToAuthor(adToNav);
                    }}
                    className="text-amber-300 hover:text-amber-200 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    @{getAuthorUsername(selectedAdDetail)}
                  </button>
                </div>
              </div>

              {/* Precio (si es Vivienda & Habitaciones o Compra & Venta) */}
              {(selectedAdDetail.category === 'Vivienda & Habitaciones' || selectedAdDetail.category === 'Compra & Venta') && selectedAdDetail.price && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <span className="text-xs text-white/70 font-semibold">Precio / Tarifa:</span>
                  <span className="text-sm font-black text-amber-300">{selectedAdDetail.price}</span>
                </div>
              )}

              {/* Descripcion */}
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                  Descripción
                </span>
                <p className="text-xs text-white/85 leading-relaxed whitespace-pre-line bg-white/[0.03] p-3 rounded-2xl border border-white/10">
                  {selectedAdDetail.description}
                </p>
              </div>

              {/* Botones de Accion */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                {/* Boton para abrir chat privado con el autor (solo icono) */}
                <button
                  type="button"
                  onClick={() => handleOpenPrivateChat(selectedAdDetail)}
                  title="Chat privado con el autor"
                  aria-label="Chat Privado"
                  className="w-10 h-10 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center transition-all active:scale-95 shadow shrink-0"
                >
                  <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Boton de WhatsApp (solo logo) */}
                {selectedAdDetail.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedAdDetail.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Contactar por WhatsApp (${selectedAdDetail.whatsapp})`}
                    aria-label="WhatsApp"
                    className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition-all active:scale-95 shadow shrink-0"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}

                {/* Boton de llamar */}
                {selectedAdDetail.contactPhone && (
                  <a
                    href={`tel:${selectedAdDetail.contactPhone}`}
                    title={`Llamar a ${selectedAdDetail.contactPhone}`}
                    className="flex-1 py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Llamar</span>
                  </a>
                )}

                {/* Boton de reportar anuncio (TRA) */}
                <button
                  type="button"
                  id="btn-report-modal-ad"
                  onClick={() => {
                    const currentDetail = selectedAdDetail;
                    setSelectedAdDetail(null);
                    openReportModal({
                      id: currentDetail.id,
                      type: 'support',
                      title: `Anuncio: ${currentDetail.title} (${currentDetail.category} · ${currentDetail.city})`,
                      reportedUserId: `user-${getAuthorUsername(currentDetail)}`,
                      reportedUserName: currentDetail.contactName || getAuthorUsername(currentDetail),
                      initialTicketType: 'TRA'
                    });
                  }}
                  title="Reportar este anuncio (TRA)"
                  aria-label="Reportar Anuncio"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-white/70 border border-white/10 flex items-center justify-center transition-all active:scale-95 shadow shrink-0 cursor-pointer"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ad Modal (Formulario de Publicar Anuncio) */}
      {isCreateModalOpen && (
        <div
          id="modal-create-ad"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0d224d] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-amber-400/10">
              <div className="flex items-center gap-2 text-amber-300">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold">Publicar Anuncio</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAdSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {/* 1. Foto / Logo (opcional) */}
              <div>
                <label className="block text-[11px] font-bold text-white/80 mb-1">
                  Foto / Logo (opcional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                {imageUrl ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-white/20 bg-neutral-950">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-white"
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
                      Haz clic para subir una foto o logo
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Título del Anuncio * */}
              <div>
                <label className="block text-[11px] font-bold text-white/80 mb-1">
                  Título del Anuncio *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="ej. Se busca mesero(a) en Madrid / Alquiler habitación..."
                  className="w-full bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* 3. Categoría * - Ciudad */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-white/80 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ClassifiedCategory)}
                    className="w-full bg-[#0c2454] px-3 py-2 rounded-xl border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                  >
                    <option value="Empleo & Trabajo" className="bg-[#0c2454] text-white">Empleo & Trabajo</option>
                    <option value="Vivienda & Habitaciones" className="bg-[#0c2454] text-white">Vivienda & Habitaciones</option>
                    <option value="Compra & Venta" className="bg-[#0c2454] text-white">Compra & Venta</option>
                    <option value="Eventos & Clases" className="bg-[#0c2454] text-white">Eventos & Clases</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/80 mb-1">
                    Ciudad
                  </label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value as any)}
                    className="w-full bg-[#0c2454] px-3 py-2 rounded-xl border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                  >
                    <option value="Toda España" className="bg-[#0c2454] text-white">Toda España</option>
                    {SPANISH_CITIES.map(c => (
                      <option key={c} value={c} className="bg-[#0c2454] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Descripción (máximo 100 caracteres) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-white/80">
                    Descripción (máximo 100 caracteres) *
                  </label>
                  <span className={`text-[10px] font-mono ${description.length >= 100 ? 'text-rose-400 font-bold' : 'text-white/50'}`}>
                    {description.length}/100
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={100}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detalles breves, requisitos o características del anuncio..."
                  className="w-full bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* 5. Precio (Esta opción solo es para Vivienda & Habitaciones y Compra & Venta) */}
              {isPriceAllowed && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">
                    Precio (€) (opcional)
                  </label>
                  <input
                    type="text"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder={category === 'Vivienda & Habitaciones' ? 'ej. 380 €/mes o 450 €' : 'ej. 50 € o A convenir'}
                    className="w-full bg-white/10 px-3 py-2 rounded-xl border border-amber-400/30 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              )}

              {/* 6. Teléfono - WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-white/80 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/80 mb-1">
                    WhatsApp (opcional)
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* 7. Declaración de Responsabilidad (Checking) */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    required
                    checked={isDisclaimerAccepted}
                    onChange={e => setIsDisclaimerAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-400 bg-white/10 border-white/20 focus:ring-amber-400 focus:ring-offset-0 shrink-0 cursor-pointer accent-amber-400"
                  />
                  <span className="text-[11px] leading-snug text-white/80 select-none">
                    Soy responsable de la información compartida en este anuncio y la App La Tierrita no tiene ninguna vinculación con este anuncio.
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isDisclaimerAccepted}
                  className={`w-full py-2.5 text-neutral-950 font-black text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 ${
                    isDisclaimerAccepted
                      ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 cursor-pointer'
                      : 'bg-amber-400/40 text-neutral-950/60 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Publicar Anuncio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
