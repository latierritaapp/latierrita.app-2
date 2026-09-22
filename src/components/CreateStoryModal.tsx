import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Image, Camera } from 'lucide-react';

export const CreateStoryModal: React.FC = () => {
  const { isCreateStoryOpen, setIsCreateStoryOpen, addStory } = useApp();
  const [stage, setStage] = useState<'camera' | 'preview'>('camera');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');

  // Instagram-style gallery permission & device photos state
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

  if (!isCreateStoryOpen) return null;

  const handleRequestPermissionAndSelect = () => {
    setGalleryPermission('granted');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e: any) => {
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
                setStage('preview');
              }
            }
          };
          reader.readAsDataURL(file);
        });
      }
    };
    input.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              setStage('preview');
            }
          }
        };
        reader.readAsDataURL(file);
      });
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
                Permite el acceso a tu galería para seleccionar tus fotos personales del dispositivo y compartirlas en tus historias.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleRequestPermissionAndSelect}
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

      {stage === 'camera' ? (
        /* STAGE 1: CAMERA SCREEN */
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

          {/* Viewfinder Center */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mb-4 animate-pulse">
              <Camera className="w-10 h-10 text-amber-400" />
            </div>
            <p className="text-sm font-bold text-white">Cámara de La Tierrita</p>
            <p className="text-xs text-white/60 max-w-xs mt-1">
              Toma una foto o selecciona una imagen de tu galería personal.
            </p>

            {devicePhotos.length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] text-white/70 mb-2 font-bold uppercase tracking-wider">Tus fotos recientes del dispositivo</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-xs max-h-32 overflow-y-auto p-1">
                  {devicePhotos.slice(0, 6).map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setMediaUrl(url);
                        setStage('preview');
                      }}
                      className="w-12 h-12 rounded-xl overflow-hidden border border-white/30 hover:border-amber-400 transition-all shadow cursor-pointer"
                    >
                      <img src={url} alt="device photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Gallery circle left, Shutter center */}
          <div className="p-8 pb-12 flex items-center justify-between bg-gradient-to-t from-black via-black/80 to-transparent relative">
            {/* Lado izquierdo inferior circulo con icono de galería */}
            <label className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 border-2 border-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg">
              <Image className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Lado centro inferior botón para tomar foto */}
            <label className="absolute left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white p-1 flex items-center justify-center cursor-pointer shadow-2xl active:scale-95 transition-all">
              <div className="w-16 h-16 rounded-full bg-amber-400 border-4 border-white flex items-center justify-center">
                <Camera className="w-7 h-7 text-neutral-950" />
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <div className="w-14" />
          </div>
        </div>
      ) : (
        /* STAGE 2: PREVIEW & PUBLISH SCREEN */
        <div className="relative flex-1 flex flex-col justify-between bg-black">
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={() => setStage('camera')}
              className="text-xs font-bold text-white/90 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md cursor-pointer"
            >
              Volver
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

          {/* Bottom Bar: Barra para escribir pie de foto y botón Subir */}
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
