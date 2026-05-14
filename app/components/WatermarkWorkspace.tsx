'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import JSZip from 'jszip';

type WatermarkPosition = { x: number; y: number };

type ImageItem = {
  id: string;
  file: File;
  previewUrl: string;
  watermarkPosition: WatermarkPosition;
  logoOpacity: number;
  logoScale: number;
};

type LogoItem = {
  file: File;
  previewUrl: string;
  naturalWidth?: number;
  naturalHeight?: number;
};

type ImageMeta = {
  naturalWidth: number;
  naturalHeight: number;
};

const DEFAULT_OPACITY = 80;
const DEFAULT_LOGO_SCALE = 100;
const MAX_IMAGES = 8;

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });

const toCanvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to encode image'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });

const Dropzone = ({
  title,
  subtitle,
  accept,
  multiple = false,
  onFiles,
  dragActiveLabel,
  children,
}: {
  title: string;
  subtitle: string;
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  dragActiveLabel?: string;
  children?: React.ReactNode;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFiles(Array.from(files));
  };

  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white/80 p-4 transition ${
        isDragging
          ? 'border-[#CBFE01] bg-[#FBFFE6]'
          : 'hover:border-neutral-300'
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!isDragging) setIsDragging(true);
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        dragCounter.current += 1;
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setIsDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="flex flex-col gap-3">
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
        <div className="text-xs text-neutral-600">{subtitle}</div>
        {isDragging && dragActiveLabel ? (
          <div className="rounded-lg border border-[#CBFE01]/40 bg-[#CBFE01]/10 px-3 py-2 text-xs font-semibold text-[#CBFE01]">
            {dragActiveLabel}
          </div>
        ) : null}
        <button
          type="button"
          className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold transition ${
            isDragging
              ? 'border-[#CBFE01] text-[#1b1b1b]'
              : 'border-neutral-300 text-neutral-700 hover:border-[#CBFE01] hover:text-[#1b1b1b]'
          }`}
          onClick={() => inputRef.current?.click()}
        >
          Selecionar arquivos
        </button>
        {children}
      </div>
    </div>
  );
};

const ThumbnailStrip = ({
  images,
  activeImageId,
  onSelect,
  onRemove,
}: {
  images: ImageItem[];
  activeImageId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) => {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {images.map((image) => (
        <div key={image.id} className="group relative">
          <button
            type="button"
            className={`block w-full overflow-hidden rounded-xl border p-1 transition ${
              activeImageId === image.id
                ? 'border-[#CBFE01]'
                : 'border-neutral-200 hover:border-neutral-400'
            }`}
            onClick={() => onSelect(image.id)}
          >
            <img
              src={image.previewUrl}
              alt={image.file.name}
              className="h-20 w-full rounded-lg object-cover"
            />
            <div className="absolute inset-0 rounded-xl bg-black/0 transition group-hover:bg-black/5" />
          </button>
          <button
            type="button"
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(image.id);
            }}
            title="Remover imagem"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default function WatermarkWorkspace() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [logo, setLogo] = useState<LogoItem | null>(null);
  const [imageMeta, setImageMeta] = useState<Record<string, ImageMeta>>({});
  const [activeRenderSize, setActiveRenderSize] = useState({
    width: 0,
    height: 0,
  });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const draggableNodeRef = useRef<HTMLDivElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  const activeImage = useMemo(
    () => images.find((image) => image.id === activeImageId) || null,
    [images, activeImageId],
  );

  const updateActiveRenderSize = useCallback(() => {
    if (!imageRef.current) return;
    setActiveRenderSize({
      width: imageRef.current.clientWidth,
      height: imageRef.current.clientHeight,
    });
  }, []);

  useEffect(() => {
    updateActiveRenderSize();
    const element = imageRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => updateActiveRenderSize());
    observer.observe(element);
    return () => observer.disconnect();
  }, [activeImageId, updateActiveRenderSize]);

  const handleRemoveImage = (idToRemove: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== idToRemove);
      if (activeImageId === idToRemove) {
        setActiveImageId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleAddImages = (files: File[]) => {
    const remainingSlots = Math.max(0, MAX_IMAGES - images.length);
    if (remainingSlots === 0) return;
    const limitedFiles = files.slice(0, remainingSlots);
    const nextImages = limitedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(previewUrl);
      return {
        id: generateId(),
        file,
        previewUrl,
        watermarkPosition: { x: 0, y: 0 },
        logoOpacity: DEFAULT_OPACITY,
        logoScale: DEFAULT_LOGO_SCALE,
      } as ImageItem;
    });

    setImages((prev) => {
      const merged = [...prev, ...nextImages];
      if (!activeImageId && merged.length > 0) {
        setActiveImageId(merged[0].id);
      }
      return merged;
    });
  };

  const handleAddLogo = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (logo?.previewUrl) {
      URL.revokeObjectURL(logo.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(previewUrl);
    setLogo({ file, previewUrl });
  };

  const handleRemoveLogo = () => {
    if (logo?.previewUrl) {
      URL.revokeObjectURL(logo.previewUrl);
    }
    setLogo(null);
  };

  const handleActivePositionChange = (
    event: DraggableEvent,
    data: DraggableData,
  ) => {
    if (!activeImage) return;
    const meta = imageMeta[activeImage.id];
    if (!meta || activeRenderSize.width === 0 || activeRenderSize.height === 0)
      return;
    const naturalX = (data.x / activeRenderSize.width) * meta.naturalWidth;
    const naturalY = (data.y / activeRenderSize.height) * meta.naturalHeight;

    setImages((prev) =>
      prev.map((image) =>
        image.id === activeImage.id
          ? {
              ...image,
              watermarkPosition: {
                x: Math.max(0, naturalX),
                y: Math.max(0, naturalY),
              },
            }
          : image,
      ),
    );
  };

  const getDisplayPosition = () => {
    if (!activeImage) return { x: 0, y: 0 };
    const meta = imageMeta[activeImage.id];
    if (
      !meta ||
      activeRenderSize.width === 0 ||
      activeRenderSize.height === 0
    ) {
      return { x: 0, y: 0 };
    }
    return {
      x:
        (activeImage.watermarkPosition.x / meta.naturalWidth) *
        activeRenderSize.width,
      y:
        (activeImage.watermarkPosition.y / meta.naturalHeight) *
        activeRenderSize.height,
    };
  };

  const handleDownloadAll = async () => {
    if (!logo || images.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder('getWATERMARK');
    const logoImage = await loadImage(logo.previewUrl);
    const processed = await Promise.all(
      images.map(async (image) => {
        const baseImage = await loadImage(image.previewUrl);
        const canvas = document.createElement('canvas');
        canvas.width = baseImage.naturalWidth || baseImage.width;
        canvas.height = baseImage.naturalHeight || baseImage.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(baseImage, 0, 0);
        ctx.globalAlpha = image.logoOpacity / 100;

        const targetLogoWidth = logoImage.width * (image.logoScale / 100);
        const targetLogoHeight = logoImage.height * (image.logoScale / 100);

        ctx.drawImage(
          logoImage,
          image.watermarkPosition.x,
          image.watermarkPosition.y,
          targetLogoWidth,
          targetLogoHeight,
        );
        ctx.globalAlpha = 1;

        const blob = await toCanvasBlob(canvas);
        const fileName = image.file.name.replace(/\.[^/.]+$/, '');
        return { blob, name: `${fileName}-watermarked.png` };
      }),
    );

    processed.forEach((item) => {
      if (!item) return;
      folder?.file(item.name, item.blob);
    });

    const archive = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(archive);
    link.download = 'getWATERMARK.zip';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const activeMeta = activeImage ? imageMeta[activeImage.id] : null;
  const activeLogoOpacity = activeImage?.logoOpacity ?? DEFAULT_OPACITY;
  const activeLogoScale = activeImage?.logoScale ?? DEFAULT_LOGO_SCALE;
  const previewScale =
    activeMeta && activeRenderSize.width
      ? activeRenderSize.width / activeMeta.naturalWidth
      : 1;
  const logoPreviewScale = previewScale * (activeLogoScale / 100);

  return (
    <main className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr_280px]">
      <section className="flex flex-col gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Galeria
          </div>
          <Dropzone
            title="Envie suas imagens"
            subtitle={`Arraste ou selecione ate ${MAX_IMAGES} imagens para processar.`}
            dragActiveLabel="Solte as imagens aqui"
            accept="image/*"
            multiple
            onFiles={handleAddImages}
          />
          {images.length > 0 ? (
            <div className="mt-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Fotos carregadas ({images.length} foto
                {images.length === 1 ? '' : 's'})
              </div>
              <ThumbnailStrip
                images={images}
                activeImageId={activeImageId}
                onSelect={setActiveImageId}
                onRemove={handleRemoveImage}
              />
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
          <div className="flex flex-col gap-2">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Marca D'Agua
            </div>
            <Dropzone
              title="Envie sua Logo"
              subtitle="Arraste ou selecione ate 1 logo para processar."
              dragActiveLabel="Solte a Logo aqui"
              accept="image/*"
              multiple
              onFiles={handleAddLogo}
            >
              {logo ? (
                <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                  <div className="flex items-center gap-3 p-3">
                    <img
                      src={logo.previewUrl}
                      alt={logo.file.name}
                      className="h-12 w-12 rounded-lg border border-neutral-200 bg-white object-contain"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-neutral-900">
                        {logo.file.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Logo anexada
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-neutral-600 shadow transition hover:bg-red-500 hover:text-white"
                    onClick={handleRemoveLogo}
                    title="Remover logo"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
            </Dropzone>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white/90 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-neutral-900">
            Preview principal
          </div>
          {activeImage ? (
            <span className="text-xs text-neutral-500">
              {activeImage.file.name}
            </span>
          ) : null}
        </div>

        <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
          {activeImage ? (
            <div className="relative flex max-h-full max-w-full items-center justify-center">
              <img
                ref={imageRef}
                src={activeImage.previewUrl}
                alt="Imagem ativa"
                className="max-h-[60vh] max-w-full rounded-xl object-contain"
                onLoad={(event) => {
                  const target = event.currentTarget;
                  setImageMeta((prev) => ({
                    ...prev,
                    [activeImage.id]: {
                      naturalWidth: target.naturalWidth,
                      naturalHeight: target.naturalHeight,
                    },
                  }));
                  updateActiveRenderSize();
                }}
              />
              {logo ? (
                <Draggable
                  nodeRef={draggableNodeRef}
                  bounds="parent"
                  position={getDisplayPosition()}
                  onStop={handleActivePositionChange}
                >
                  <div
                    ref={draggableNodeRef}
                    className="absolute left-0 top-0 cursor-move"
                    style={{ opacity: activeLogoOpacity / 100 }}
                  >
                    <img
                      src={logo.previewUrl}
                      alt="Logo"
                      className="max-w-none"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onLoad={(e) => {
                        const target = e.currentTarget;
                        setLogo((prev) =>
                          prev
                            ? {
                                ...prev,
                                naturalWidth: target.naturalWidth,
                                naturalHeight: target.naturalHeight,
                              }
                            : prev,
                        );
                      }}
                      style={{
                        width: logo.naturalWidth
                          ? logo.naturalWidth * logoPreviewScale
                          : undefined,
                        height: logo.naturalHeight
                          ? logo.naturalHeight * logoPreviewScale
                          : undefined,
                      }}
                    />
                  </div>
                </Draggable>
              ) : null}
            </div>
          ) : (
            <div className="text-center text-sm text-neutral-500">
              Carregue imagens para iniciar o preview.
            </div>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Controles
          </div>
          <label className="flex flex-col gap-2 text-xs text-neutral-600">
            Opacidade da logo (%)
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={activeLogoOpacity}
                onChange={(event) => {
                  if (!activeImage) return;
                  const nextValue = Number(event.target.value);
                  setImages((prev) =>
                    prev.map((image) =>
                      image.id === activeImage.id
                        ? { ...image, logoOpacity: nextValue }
                        : image,
                    ),
                  );
                }}
                disabled={!activeImage}
                className="h-2 flex-1 appearance-none rounded-full bg-neutral-200 accent-[#CBFE01]"
              />
              <div className="flex w-16 items-center rounded-lg border border-neutral-300 bg-white px-2 py-1 transition-all focus-within:border-[#CBFE01] focus-within:ring-1 focus-within:ring-[#CBFE01]">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={activeLogoOpacity === 0 ? '' : activeLogoOpacity}
                  onChange={(event) => {
                    if (!activeImage) return;
                    let val = Number(event.target.value);
                    if (val > 100) val = 100;
                    setImages((prev) =>
                      prev.map((image) =>
                        image.id === activeImage.id
                          ? { ...image, logoOpacity: val }
                          : image,
                      ),
                    );
                  }}
                  disabled={!activeImage}
                  className="w-full appearance-none bg-transparent text-center text-sm font-semibold text-neutral-900 outline-none"
                />
              </div>
            </div>
          </label>
          <label className="mt-4 flex flex-col gap-2 text-xs text-neutral-600">
            Tamanho da logo (%)
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={10}
                max={200}
                step={1}
                value={activeLogoScale}
                onChange={(event) => {
                  if (!activeImage) return;
                  const nextValue = Number(event.target.value);
                  setImages((prev) =>
                    prev.map((image) =>
                      image.id === activeImage.id
                        ? { ...image, logoScale: nextValue }
                        : image,
                    ),
                  );
                }}
                disabled={!activeImage}
                className="h-2 flex-1 appearance-none rounded-full bg-neutral-200 accent-[#CBFE01]"
              />
              <div className="flex w-16 items-center rounded-lg border border-neutral-300 bg-white px-2 py-1 transition-all focus-within:border-[#CBFE01] focus-within:ring-1 focus-within:ring-[#CBFE01]">
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={activeLogoScale === 0 ? '' : activeLogoScale}
                  onChange={(event) => {
                    if (!activeImage) return;
                    let val = Number(event.target.value);
                    if (val > 200) val = 200;
                    setImages((prev) =>
                      prev.map((image) =>
                        image.id === activeImage.id
                          ? { ...image, logoScale: val }
                          : image,
                      ),
                    );
                  }}
                  disabled={!activeImage}
                  className="w-full appearance-none bg-transparent text-center text-sm font-semibold text-neutral-900 outline-none"
                />
              </div>
            </div>
          </label>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Exportacao
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-[#CBFE01] px-4 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleDownloadAll}
            disabled={!logo || images.length === 0}
          >
            Baixar imagens
          </button>
          <p className="mt-3 text-xs text-neutral-500">
            O processamento acontece no navegador. Nenhuma imagem e enviada para
            servidores.
          </p>
        </div>
      </aside>
    </main>
  );
}
