"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { extractApiErrorMessage } from "@/lib/admin-api";

export type CloudinaryAsset = {
  id: string;
  publicId: string;
  folder: string;
  url: string;
  thumbnailUrl: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  createdAt: string;
};

export type CloudinaryPickerOptions = {
  folder?: string;
  onSelect?: (asset: CloudinaryAsset) => void;
};

export type CloudinaryPickerState = {
  open: boolean;
  folder?: string;
  onSelect?: (asset: CloudinaryAsset) => void;
};

const formatFileSize = (bytes: number): string => {
  if (!bytes || Number.isNaN(bytes)) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

export const useCloudinaryPicker = () => {
  const [picker, setPicker] = useState<CloudinaryPickerState>({ open: false });

  const openPicker = useCallback((options: CloudinaryPickerOptions = {}) => {
    setPicker({
      open: true,
      folder: options.folder,
      onSelect: options.onSelect,
    });
  }, []);

  const closePicker = useCallback(() => {
    setPicker((previous) => ({ ...previous, open: false }));
  }, []);

  return { picker, openPicker, closePicker } as const;
};

const useCloudinaryAssets = (state: CloudinaryPickerState) => {
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchAssets = useCallback(
    async (cursor?: string, replace = false) => {
      if (!state.open) {
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("maxResults", "30");

        if (state.folder?.trim()) {
          params.set("folder", state.folder.trim());
        }

        if (cursor) {
          params.set("nextCursor", cursor);
        }

        const endpoint = `/api/cloudinary/library?${params.toString()}`;
        const response = await fetch(endpoint, { credentials: "include" });
        const text = await response.text();
        let payload: { assets?: CloudinaryAsset[]; nextCursor?: string | null; error?: unknown } = {};

        if (text.length > 0) {
          try {
            payload = JSON.parse(text) as typeof payload;
          } catch {
            payload = {};
          }
        }

        if (!response.ok) {
          throw new Error(
            extractApiErrorMessage(payload, "No fue posible cargar las imágenes de Cloudinary"),
          );
        }

        setAssets((previous) => (replace ? payload.assets ?? [] : [...previous, ...(payload.assets ?? [])]));
        setNextCursor(payload.nextCursor ?? null);
        setStatus("idle");
      } catch (fetchError) {
        console.error(fetchError);
        setStatus("idle");
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "No fue posible cargar las imágenes de Cloudinary",
        );
      }
    },
    [state.folder, state.open],
  );

  useEffect(() => {
    if (!state.open) {
      setAssets([]);
      setError(null);
      setNextCursor(null);
      setStatus("idle");
      return;
    }

    void fetchAssets(undefined, true);
  }, [fetchAssets, state.open]);

  return useMemo(
    () => ({ assets, status, error, nextCursor, fetchAssets }),
    [assets, status, error, nextCursor, fetchAssets],
  );
};

export const CloudinaryLibraryDialog = ({
  state,
  onClose,
}: {
  state: CloudinaryPickerState;
  onClose: () => void;
}) => {
  const { assets, status, error, nextCursor, fetchAssets } = useCloudinaryAssets(state);

  if (!state.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col space-y-5 overflow-y-auto rounded-3xl bg-background p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Biblioteca de Cloudinary</h3>
            <p className="text-sm text-foreground/60">
              Selecciona una imagen existente{state.folder ? ` en “${state.folder}”` : ""} o carga un nuevo archivo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-foreground/15 px-4 py-1 text-sm font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
          >
            Cerrar
          </button>
        </div>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => {
                state.onSelect?.(asset);
                onClose();
              }}
              className="group rounded-2xl border border-foreground/10 text-left transition hover:border-foreground/50"
            >
              <div className="overflow-hidden rounded-t-2xl bg-foreground/5">
                <Image
                  src={asset.thumbnailUrl || asset.url}
                  alt={asset.publicId}
                  width={640}
                  height={360}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="space-y-1 px-4 py-3 text-xs text-foreground/70">
                <p className="truncate text-sm font-semibold text-foreground" title={asset.publicId}>
                  {asset.publicId}
                </p>
                <p className="truncate" title={asset.folder}>
                  {asset.folder || "(raíz)"}
                </p>
                <p>
                  {asset.format.toUpperCase()} · {asset.width}×{asset.height} · {formatFileSize(asset.bytes)}
                </p>
              </div>
            </button>
          ))}
        </div>

        {assets.length === 0 && status === "idle" && !error && (
          <p className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground/60">
            No se encontraron imágenes en esta carpeta.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/60">
          <span>
            {status === "loading"
              ? "Cargando imágenes…"
              : assets.length > 0
                ? `${assets.length} archivo${assets.length === 1 ? "" : "s"}`
                : "Sin resultados"}
          </span>

          <div className="flex gap-3">
            {nextCursor && (
              <button
                type="button"
                onClick={() => void fetchAssets(nextCursor)}
                className="rounded-full border border-foreground/15 px-4 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
              >
                Cargar más
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-foreground/15 px-4 py-1 text-xs font-semibold text-foreground/70 transition hover:border-foreground/40 hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
