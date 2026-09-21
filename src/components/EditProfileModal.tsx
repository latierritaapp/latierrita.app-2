import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_SILHOUETTE_AVATAR } from '../context/AuthContext';
import { optimizeAvatarImage } from '../lib/imageOptimizer';
import {
  X,
  Camera,
  UploadCloud,
  Link as LinkIcon,
  MapPin,
  Calendar,
  AlertCircle,
  Instagram,
  Facebook,
  Music2,
  Twitter,
  User,
  AtSign,
  FileText,
  Lock,
  Image as ImageIcon,
  Loader2,
  Trash2
} from 'lucide-react';
import { SPANISH_CITIES } from '../data/citiesData';
import { SpanishCity } from '../types';
import { FlagColombia, FlagSpain } from './CountryFlag';

export const EditProfileModal: React.FC = () => {
  const { isEditProfileOpen, setIsEditProfileOpen, currentUser, updateProfile, triggerPlushNotification } = useApp();

  // Estados de los campos solicitados
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [age, setAge] = useState<number | string>(currentUser.age || 28);
  const [city, setCity] = useState<SpanishCity>(currentUser.city);
  const [avatar, setAvatar] = useState(currentUser.avatar);

  // Redes sociales (4 campos)
  const [instagram, setInstagram] = useState(currentUser.socialLinks?.instagram || '');
  const [facebook, setFacebook] = useState(currentUser.socialLinks?.facebook || '');
  const [tiktok, setTiktok] = useState(currentUser.socialLinks?.tiktok || '');
  const [xAccount, setXAccount] = useState(currentUser.socialLinks?.x || '');

  // UI state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setValidationError('La imagen no debe superar los 20MB.');
      return;
    }

    try {
      setIsOptimizingImage(true);
      setValidationError(null);
      const optimizedUrl = await optimizeAvatarImage(file, 400, 0.85);
      setAvatar(optimizedUrl);
    } catch (err: any) {
      console.error('Error procesando imagen:', err);
      setValidationError('No se pudo procesar la imagen seleccionada. Inténtalo con otra foto.');
    } finally {
      setIsOptimizingImage(false);
      // Reset input value so same file can be picked again if desired
      if (e.target) e.target.value = '';
    }
  };

  const triggerGalleryPicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    setAvatar(DEFAULT_SILHOUETTE_AVATAR);
    setValidationError(null);
  };

  const hasCustomAvatar = Boolean(
    avatar &&
    avatar.trim() !== '' &&
    avatar !== DEFAULT_SILHOUETTE_AVATAR &&
    !avatar.includes('data:image/svg+xml')
  );

  // Sincronizar el estado del formulario con el usuario actual al abrir el modal
  React.useEffect(() => {
    if (isEditProfileOpen && currentUser) {
      setName(currentUser.name);
      setUsername(currentUser.username);
      setBio(currentUser.bio || '');
      setWebsite(currentUser.website || '');
      setAge(currentUser.age || 28);
      setCity(currentUser.city);
      setAvatar(currentUser.avatar);
      setInstagram(currentUser.socialLinks?.instagram || '');
      setFacebook(currentUser.socialLinks?.facebook || '');
      setTiktok(currentUser.socialLinks?.tiktok || '');
      setXAccount(currentUser.socialLinks?.x || '');
    }
  }, [isEditProfileOpen, currentUser]);

  if (!isEditProfileOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setValidationError(null);

    // Validación de edad mínima 18 años
    const parsedAge = typeof age === 'number' ? age : parseInt(age as string, 10);
    if (isNaN(parsedAge) || parsedAge < 18) {
      setValidationError('La edad mínima requerida es de 18 años.');
      return;
    }

    if (parsedAge > 110) {
      setValidationError('Por favor ingresa una edad válida.');
      return;
    }

    if (!name.trim()) {
      setValidationError('El nombre no puede estar vacío.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
    if (!cleanUsername) {
      setValidationError('El nombre de usuario no es válido.');
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedData: Parameters<typeof updateProfile>[0] = {
      name: name.trim(),
      username: cleanUsername,
      bio: bio.trim(),
      website: website.trim(),
      age: parsedAge,
      city,
      originCity: currentUser.originCity || 'Colombia',
      avatar,
      socialLinks: {
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        tiktok: tiktok.trim(),
        x: xAccount.trim()
      }
    };

    if (name.trim() !== currentUser.name) {
      updatedData.lastNameChangeDate = nowIso;
    }
    if (cleanUsername !== currentUser.username) {
      updatedData.lastUsernameChangeDate = nowIso;
    }

    setIsSaving(true);
    try {
      await updateProfile(updatedData);

      triggerPlushNotification({
        type: 'system',
        title: 'Perfil actualizado',
        message: 'Tus datos, edad, ciudad y redes sociales se guardaron con éxito.'
      });

      setIsEditProfileOpen(false);
    } catch (err: any) {
      setValidationError('Error al guardar en el servidor. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="edit-profile-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="edit-profile-sheet"
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header estilo Instagram */}
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            id="btn-cancel-edit-profile"
            onClick={() => setIsEditProfileOpen(false)}
            className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Cancelar
          </button>
          <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white">
            Editar perfil
          </h2>
          <button
            type="button"
            id="btn-save-edit-profile"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-black text-amber-600 dark:text-amber-400 hover:text-amber-500 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Listo'}
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar">
          {/* Alerta de validación */}
          {validationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Foto de perfil (Abrir galería del dispositivo) */}
          <div className="flex flex-col items-center justify-center py-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              id="avatar-gallery-file-input"
              onChange={handleAvatarFileSelect}
            />
            <div
              className="relative group cursor-pointer"
              onClick={triggerGalleryPicker}
              title={hasCustomAvatar ? "Toca para cambiar foto" : "Toca para añadir foto"}
            >
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-rose-500 to-blue-600 shadow-md">
                <img
                  src={avatar || DEFAULT_SILHOUETTE_AVATAR}
                  alt={name}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-neutral-900"
                  referrerPolicy="no-referrer"
                />
              </div>
              {isOptimizingImage ? (
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-1" />
                  <span className="text-[10px] font-bold">Procesando</span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">{hasCustomAvatar ? "Cambiar" : "Añadir foto"}</span>
                </div>
              )}
            </div>

            {hasCustomAvatar ? (
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  id="btn-change-avatar-gallery"
                  disabled={isOptimizingImage}
                  onClick={triggerGalleryPicker}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 hover:underline px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isOptimizingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>{isOptimizingImage ? 'Optimizando foto...' : 'Cambiar foto'}</span>
                </button>

                <button
                  type="button"
                  id="btn-remove-avatar"
                  disabled={isOptimizingImage}
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-500 hover:underline px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Quitar foto</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-add-avatar-gallery"
                disabled={isOptimizingImage}
                onClick={triggerGalleryPicker}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 hover:underline mt-2.5 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 active:scale-95 transition-all disabled:opacity-50"
              >
                {isOptimizingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{isOptimizingImage ? 'Optimizando foto...' : 'Añadir foto de Perfil'}</span>
              </button>
            )}

            <span className="text-[11px] text-neutral-400 mt-1">
              Formatos JPG, PNG, WEBP (se optimiza automáticamente)
            </span>
          </div>

          {/* Campos Principales */}
          <div className="space-y-3.5 divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {/* 2. Nombre (Cada 3 días) */}
            <div className="pt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-amber-500" />
                  <span>Nombre completo</span>
                </label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  (Cada 3 días)
                </span>
              </div>
              <input
                id="edit-field-name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              />
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                Solo puedes cambiar tu nombre una vez cada 3 días para mantener la identidad comunitaria.
              </p>
            </div>

            {/* 3. Nombre de usuario (Cada 7 días) */}
            <div className="pt-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-blue-500" />
                  <span>Nombre de usuario</span>
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  (Cada 7 días)
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-neutral-400 text-xs font-semibold">@</span>
                <input
                  id="edit-field-username"
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="usuario"
                  className="w-full pl-7 pr-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                Solo puedes cambiar tu nombre de usuario una vez cada 7 días.
              </p>
            </div>

            {/* 4. Biografía */}
            <div className="pt-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-neutral-400" />
                  <span>Biografía</span>
                </label>
                <span className="text-[10px] text-neutral-400">
                  {bio.length}/150
                </span>
              </div>
              <textarea
                id="edit-field-bio"
                rows={3}
                maxLength={150}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Cuéntale a la comunidad quién eres, de dónde vienes y qué haces en España..."
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
              />
            </div>

            {/* 5. Sitio web */}
            <div className="pt-3 flex flex-col gap-1">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-blue-500" />
                <span>Sitio web</span>
              </label>
              <input
                id="edit-field-website"
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://tusitio.es o www.ejemplo.com"
                className="w-full px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* 6. Edad (Edad mínima 18 años) */}
            <div className="pt-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-rose-500" />
                  <span>Edad</span>
                </label>
                <span className="text-[10px] font-semibold text-rose-500">
                  (Mínimo 18 años)
                </span>
              </div>
              <input
                id="edit-field-age"
                type="number"
                min={18}
                max={110}
                required
                value={age}
                onChange={e => {
                  setAge(e.target.value);
                  if (parseInt(e.target.value, 10) < 18) {
                    setValidationError('La edad mínima requerida es de 18 años.');
                  } else {
                    setValidationError(null);
                  }
                }}
                placeholder="ej. 28"
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              />
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                Debes tener al menos 18 años cumplidos para participar en La Tierrita.
              </p>
            </div>

            {/* 7. Ciudad Origen (Colombia - Fija, no modificable) */}
            <div className="pt-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>Ciudad Origen (Colombia)</span>
                </label>
                <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-neutral-400" />
                  <span>No modificable</span>
                </span>
              </div>
              <div className="w-full bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700/60 font-semibold flex items-center justify-between cursor-not-allowed select-none">
                <span>{currentUser.originCity || 'Colombia'}</span>
                <FlagColombia size="sm" className="ml-1" />
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                La ciudad de origen se establece en el registro y no se puede modificar.
              </p>
            </div>

            {/* 8. Ciudad Actual (España) */}
            <div className="pt-3 flex flex-col gap-1">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>Ciudad Actual (España)</span>
                </span>
                <span className="text-[9px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <FlagSpain size="xs" />
                  <span>España</span>
                </span>
              </label>
              <select
                id="edit-field-city"
                value={city}
                onChange={e => setCity(e.target.value as SpanishCity)}
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              >
                {SPANISH_CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                Esta ciudad se mostrará en tu perfil y conectará tu chat de ciudad local.
              </p>
            </div>

            {/* 8. Redes Sociales (4 campos: Instagram - Facebook - TikTok - X) */}
            <div className="pt-4 space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block">
                Redes Sociales (Iconos en tu perfil)
              </span>

              {/* Instagram */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-500" />
                  <span>Instagram</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-neutral-400 text-xs font-semibold">@</span>
                  <input
                    id="edit-social-instagram"
                    type="text"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="usuario (ej. juancamilo_es)"
                    className="w-full pl-7 pr-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Facebook */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5 text-[#1877F2] fill-current" />
                  <span>Facebook</span>
                </label>
                <input
                  id="edit-social-facebook"
                  type="text"
                  value={facebook}
                  onChange={e => setFacebook(e.target.value)}
                  placeholder="usuario o enlace a tu perfil"
                  className="w-full px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* TikTok */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>TikTok</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-neutral-400 text-xs font-semibold">@</span>
                  <input
                    id="edit-social-tiktok"
                    type="text"
                    value={tiktok}
                    onChange={e => setTiktok(e.target.value)}
                    placeholder="usuario (ej. juancamilo_vids)"
                    className="w-full pl-7 pr-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* X */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Twitter className="w-3.5 h-3.5 text-neutral-900 dark:text-white fill-current" />
                  <span>X (Twitter)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-neutral-400 text-xs font-semibold">@</span>
                  <input
                    id="edit-social-x"
                    type="text"
                    value={xAccount}
                    onChange={e => setXAccount(e.target.value)}
                    placeholder="usuario (ej. juancamilo_co)"
                    className="w-full pl-7 pr-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 pb-2">
            <button
              type="submit"
              id="btn-submit-edit-profile"
              disabled={isSaving}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 text-center disabled:opacity-50"
            >
              {isSaving ? 'Guardando Cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
