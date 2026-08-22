"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { CloudinaryPickerOptions } from "@/components/cloudinary/picker";
import type {
  ArtistEvent,
  ArtistEventType,
  ArtistProfile,
  Publication,
  PublicationType,
} from "@/domain/artist";
import type { Project, ProjectGalleryImage } from "@/domain/projects";
import { extractApiErrorMessage } from "@/lib/admin-api";
import type { LocaleText } from "@/lib/i18n";

type OpenCloudinaryPicker = (options: CloudinaryPickerOptions) => void;
type MutationStatus = "idle" | "saving" | "deleting";
type Feedback = { kind: "success" | "error"; message: string } | null;
type LocaleDraft = { es: string; en: string };
type LocalizedListItem = LocaleDraft & { id: string };
type ImageDraft = {
  src: string;
  alt: LocaleDraft;
  footnote: LocaleDraft;
};

const NEW_RECORD = "__new__";

const inputClassName =
  "w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-foreground/40 focus:border-foreground/45 focus:bg-background disabled:cursor-not-allowed disabled:opacity-55";
const labelClassName =
  "space-y-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60";
const panelClassName =
  "space-y-6 rounded-2xl border border-foreground/10 bg-background p-4 shadow-sm sm:p-6";
const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold text-foreground/75 transition hover:border-foreground/45 hover:text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45";
const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45";
const destructiveButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45";

const EVENT_TYPES: { value: ArtistEventType; label: string }[] = [
  { value: "exhibition", label: "Exposición" },
  { value: "talk", label: "Charla" },
  { value: "performance", label: "Performance" },
  { value: "residency", label: "Residencia" },
  { value: "workshop", label: "Taller" },
  { value: "other", label: "Otro" },
];

const PUBLICATION_TYPES: { value: PublicationType; label: string }[] = [
  { value: "artist-text", label: "Texto de artista" },
  { value: "catalogue", label: "Catálogo" },
  { value: "interview", label: "Entrevista" },
  { value: "press", label: "Prensa" },
  { value: "academic", label: "Publicación académica" },
  { value: "other", label: "Otra" },
];

const emptyLocale = (): LocaleDraft => ({ es: "", en: "" });

const toLocaleDraft = (value?: LocaleText): LocaleDraft => ({
  es: value?.es ?? "",
  en: value?.en ?? "",
});

const trimLocale = (value: LocaleDraft): LocaleText => ({
  es: value.es.trim(),
  en: value.en.trim(),
});

const requireLocale = (value: LocaleDraft, label: string): LocaleText => {
  const trimmed = trimLocale(value);

  if (!trimmed.es && !trimmed.en) {
    throw new Error(`Agrega ${label} en español o inglés`);
  }

  return {
    es: trimmed.es || trimmed.en,
    en: trimmed.en || trimmed.es,
  };
};

const optionalLocale = (value: LocaleDraft): LocaleText | undefined => {
  const trimmed = trimLocale(value);

  if (!trimmed.es && !trimmed.en) {
    return undefined;
  }

  return {
    es: trimmed.es || trimmed.en,
    en: trimmed.en || trimmed.es,
  };
};

const toImageDraft = (image?: ProjectGalleryImage): ImageDraft => ({
  src: image?.src ?? "",
  alt: toLocaleDraft(image?.alt),
  footnote: toLocaleDraft(image?.footnote),
});

const buildOptionalImage = (
  image: ImageDraft,
  altLabel: string,
): ProjectGalleryImage | undefined => {
  const src = image.src.trim();

  if (!src) {
    return undefined;
  }

  const footnote = optionalLocale(image.footnote);

  return {
    src,
    alt: requireLocale(image.alt, altLabel),
    ...(footnote ? { footnote } : {}),
  };
};

const createListItems = (values: LocaleText[], prefix: string): LocalizedListItem[] =>
  values.map((value, index) => ({
    id: `${prefix}-${index}`,
    ...toLocaleDraft(value),
  }));

const newListItem = (): LocalizedListItem => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  ...emptyLocale(),
});

const buildLocaleList = (items: LocalizedListItem[]): LocaleText[] =>
  items
    .map(({ es, en }) => trimLocale({ es, en }))
    .filter((item) => item.es.length > 0 || item.en.length > 0);

const requestJson = async <T,>(response: Response, fallback: string): Promise<T> => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(payload, fallback));
  }

  return payload as T;
};

const encodeSlug = (slug: string) => encodeURIComponent(slug);

function DatabaseNotice({ databaseReady }: { databaseReady: boolean }) {
  if (databaseReady) return null;

  return (
    <p
      role="status"
      className="rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900"
    >
      La base de datos no está configurada. Puedes revisar el formulario, pero guardar y eliminar
      están deshabilitados.
    </p>
  );
}

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;

  return (
    <p
      role={feedback.kind === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`rounded-2xl border px-4 py-3 text-sm ${
        feedback.kind === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-foreground/10 bg-foreground/5 text-foreground/75"
      }`}
    >
      {feedback.message}
    </p>
  );
}

function PlainLocaleField({
  label,
  value,
  onChange,
  multiline = false,
  help,
}: {
  label: string;
  value: LocaleDraft;
  onChange: (value: LocaleDraft) => void;
  multiline?: boolean;
  help?: string;
}) {
  const fieldId = useId();
  const Element = multiline ? "textarea" : "input";

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground/80">{label}</legend>
      {help ? <p className="text-xs leading-5 text-foreground/55">{help}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClassName} htmlFor={`${fieldId}-es`}>
          <span>ES</span>
          <Element
            id={`${fieldId}-es`}
            value={value.es}
            rows={multiline ? 4 : undefined}
            onChange={(event) => onChange({ ...value, es: event.target.value })}
            className={`${inputClassName} ${multiline ? "min-h-28 resize-y normal-case leading-6 tracking-normal" : ""}`}
          />
        </label>
        <label className={labelClassName} htmlFor={`${fieldId}-en`}>
          <span>EN</span>
          <Element
            id={`${fieldId}-en`}
            value={value.en}
            rows={multiline ? 4 : undefined}
            onChange={(event) => onChange({ ...value, en: event.target.value })}
            className={`${inputClassName} ${multiline ? "min-h-28 resize-y normal-case leading-6 tracking-normal" : ""}`}
          />
        </label>
      </div>
    </fieldset>
  );
}

function LocalizedListEditor({
  label,
  items,
  onChange,
  addLabel,
}: {
  label: string;
  items: LocalizedListItem[];
  onChange: (items: LocalizedListItem[]) => void;
  addLabel: string;
}) {
  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-foreground/80">{label}</legend>
      {items.length === 0 ? (
        <p className="border-l border-foreground/20 pl-4 text-sm text-foreground/55">
          No hay párrafos todavía.
        </p>
      ) : null}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/50">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  aria-label={`Subir párrafo ${index + 1}`}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 hover:border-foreground/30 hover:text-foreground disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Bajar párrafo ${index + 1}`}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 hover:border-foreground/30 hover:text-foreground disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
                  aria-label={`Eliminar párrafo ${index + 1}`}
                  className="min-h-9 rounded-lg border border-transparent px-2 text-xs font-semibold text-red-700 hover:border-red-200 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClassName}>
                <span>ES</span>
                <textarea
                  rows={5}
                  value={item.es}
                  onChange={(event) =>
                    onChange(
                      items.map((entry) =>
                        entry.id === item.id ? { ...entry, es: event.target.value } : entry,
                      ),
                    )
                  }
                  className={`${inputClassName} min-h-32 resize-y normal-case leading-6 tracking-normal`}
                />
              </label>
              <label className={labelClassName}>
                <span>EN</span>
                <textarea
                  rows={5}
                  value={item.en}
                  onChange={(event) =>
                    onChange(
                      items.map((entry) =>
                        entry.id === item.id ? { ...entry, en: event.target.value } : entry,
                      ),
                    )
                  }
                  className={`${inputClassName} min-h-32 resize-y normal-case leading-6 tracking-normal`}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, newListItem()])}
        className={secondaryButtonClassName}
      >
        + {addLabel}
      </button>
    </fieldset>
  );
}

function OptionalImageEditor({
  label,
  value,
  onChange,
  openCloudinaryPicker,
}: {
  label: string;
  value: ImageDraft;
  onChange: (value: ImageDraft) => void;
  openCloudinaryPicker?: OpenCloudinaryPicker;
}) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4">
      <legend className="px-1 text-sm font-semibold text-foreground/80">{label}</legend>
      <div className="flex flex-wrap justify-end gap-2">
        {openCloudinaryPicker ? (
          <button
            type="button"
            onClick={() =>
              openCloudinaryPicker({
                onSelect: (asset) => onChange({ ...value, src: asset.url }),
              })
            }
            className={secondaryButtonClassName}
          >
            Elegir en Cloudinary
          </button>
        ) : null}
        {value.src ? (
          <button
            type="button"
            onClick={() => onChange(toImageDraft())}
            className={destructiveButtonClassName}
          >
            Quitar imagen
          </button>
        ) : null}
      </div>

      <label className={labelClassName}>
        <span>URL de imagen</span>
        <input
          value={value.src}
          onChange={(event) => onChange({ ...value, src: event.target.value })}
          className={inputClassName}
          placeholder="https://res.cloudinary.com/… o /images/…"
        />
      </label>

      {value.src ? (
        <>
          <PlainLocaleField
            label="Texto alternativo"
            value={value.alt}
            onChange={(alt) => onChange({ ...value, alt })}
            help="Obligatorio cuando hay una imagen. Basta completar un idioma; se usará como respaldo del otro."
          />
          <PlainLocaleField
            label="Pie de imagen (opcional)"
            value={value.footnote}
            onChange={(footnote) => onChange({ ...value, footnote })}
          />
        </>
      ) : null}
    </fieldset>
  );
}

function ManagerHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="space-y-2">
      <h2 className="text-xl font-semibold text-foreground/90">{title}</h2>
      <p className="max-w-3xl text-sm leading-6 text-foreground/60">{description}</p>
    </header>
  );
}

function RecordSidebar({
  title,
  newLabel,
  selectedSlug,
  onSelect,
  records,
}: {
  title: string;
  newLabel: string;
  selectedSlug: string;
  onSelect: (slug: string) => void;
  records: { slug: string; label: string; meta?: string; isPrivate?: boolean }[];
}) {
  return (
    <aside
      aria-label={title}
      className="space-y-2 self-start rounded-2xl border border-foreground/10 bg-foreground/5 p-4 lg:sticky lg:top-24"
    >
      <button
        type="button"
        onClick={() => onSelect(NEW_RECORD)}
        aria-pressed={selectedSlug === NEW_RECORD}
        className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
          selectedSlug === NEW_RECORD
            ? "bg-foreground text-background"
            : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
        }`}
      >
        + {newLabel}
      </button>
      <div className="max-h-[32rem] space-y-1 overflow-y-auto pr-1">
        {records.map((record) => (
          <button
            key={record.slug}
            type="button"
            onClick={() => onSelect(record.slug)}
            aria-pressed={selectedSlug === record.slug}
            className={`w-full rounded-xl px-3 py-2 text-left transition ${
              selectedSlug === record.slug
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
            }`}
          >
            <span className="block truncate text-sm font-medium">{record.label || record.slug}</span>
            {record.meta || record.isPrivate ? (
              <span className="mt-1 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.12em] opacity-65">
                {record.meta ? <span>{record.meta}</span> : null}
                {record.isPrivate ? <span>Privado</span> : null}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </aside>
  );
}

type ArtistProfileDraft = {
  name: string;
  role: LocaleDraft;
  introduction: LocaleDraft;
  biography: LocalizedListItem[];
  statementTitle: LocaleDraft;
  statement: LocalizedListItem[];
  portrait: ImageDraft;
  cvUrl: string;
};

const toArtistProfileDraft = (profile: ArtistProfile): ArtistProfileDraft => ({
  name: profile.name,
  role: toLocaleDraft(profile.role),
  introduction: toLocaleDraft(profile.introduction),
  biography: createListItems(profile.biography, "biography"),
  statementTitle: toLocaleDraft(profile.statementTitle),
  statement: createListItems(profile.statement, "statement"),
  portrait: toImageDraft(profile.portrait),
  cvUrl: profile.cvUrl ?? "",
});

export function ArtistProfileManager({
  profile,
  databaseReady,
  openCloudinaryPicker,
}: {
  profile: ArtistProfile;
  databaseReady: boolean;
  openCloudinaryPicker?: OpenCloudinaryPicker;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ArtistProfileDraft>(() => toArtistProfileDraft(profile));
  const [status, setStatus] = useState<MutationStatus>("idle");
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setDraft(toArtistProfileDraft(profile));
  }, [profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!databaseReady || status !== "idle") return;

    setStatus("saving");
    setFeedback(null);

    try {
      const name = draft.name.trim();
      if (!name) throw new Error("Agrega el nombre de la artista");
      const portrait = buildOptionalImage(draft.portrait, "el texto alternativo del retrato");
      const cvUrl = draft.cvUrl.trim();
      const payload: ArtistProfile = {
        name,
        role: requireLocale(draft.role, "el rol"),
        introduction: trimLocale(draft.introduction),
        biography: buildLocaleList(draft.biography),
        statementTitle: requireLocale(draft.statementTitle, "el título del statement"),
        statement: buildLocaleList(draft.statement),
        ...(portrait ? { portrait } : {}),
        ...(cvUrl ? { cvUrl } : {}),
      };

      const saved = await requestJson<ArtistProfile>(
        await fetch("/api/artist/profile", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        "No fue posible guardar la biografía",
      );

      setDraft(toArtistProfileDraft(saved));
      setFeedback({ kind: "success", message: "Perfil artístico guardado correctamente." });
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar la biografía",
      });
    } finally {
      setStatus("idle");
    }
  };

  return (
    <section className="space-y-6">
      <ManagerHeading
        title="Bio"
        description="Edita la presentación pública, biografía, statement, retrato y enlace al CV."
      />
      <DatabaseNotice databaseReady={databaseReady} />
      <FeedbackMessage feedback={feedback} />

      <form onSubmit={handleSubmit} className={panelClassName} aria-busy={status === "saving"}>
        <label className={labelClassName}>
          <span>Nombre</span>
          <input
            required
            value={draft.name}
            onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
            className={inputClassName}
          />
        </label>

        <PlainLocaleField
          label="Rol"
          value={draft.role}
          onChange={(role) => setDraft((previous) => ({ ...previous, role }))}
          help="Basta completar un idioma; al guardar se usará como respaldo del otro."
        />
        <PlainLocaleField
          label="Introducción"
          value={draft.introduction}
          onChange={(introduction) => setDraft((previous) => ({ ...previous, introduction }))}
          multiline
        />
        <LocalizedListEditor
          label="Biografía"
          items={draft.biography}
          onChange={(biography) => setDraft((previous) => ({ ...previous, biography }))}
          addLabel="Agregar párrafo"
        />
        <PlainLocaleField
          label="Título del statement"
          value={draft.statementTitle}
          onChange={(statementTitle) => setDraft((previous) => ({ ...previous, statementTitle }))}
          help="Basta completar un idioma; al guardar se usará como respaldo del otro."
        />
        <LocalizedListEditor
          label="Statement"
          items={draft.statement}
          onChange={(statement) => setDraft((previous) => ({ ...previous, statement }))}
          addLabel="Agregar párrafo"
        />
        <OptionalImageEditor
          label="Retrato (opcional)"
          value={draft.portrait}
          onChange={(portrait) => setDraft((previous) => ({ ...previous, portrait }))}
          openCloudinaryPicker={openCloudinaryPicker}
        />
        <label className={labelClassName}>
          <span>URL del CV (opcional)</span>
          <input
            type="url"
            value={draft.cvUrl}
            onChange={(event) => setDraft((previous) => ({ ...previous, cvUrl: event.target.value }))}
            className={inputClassName}
            placeholder="https://…"
          />
        </label>

        <div className="sticky bottom-3 flex justify-end border-t border-foreground/10 bg-background/95 pt-4">
          <button
            type="submit"
            disabled={!databaseReady || status !== "idle"}
            className={primaryButtonClassName}
          >
            {status === "saving" ? "Guardando…" : "Guardar bio"}
          </button>
        </div>
      </form>
    </section>
  );
}

type ArtistEventDraft = {
  slug: string;
  title: LocaleDraft;
  type: ArtistEventType;
  startDate: string;
  endDate: string;
  venue: LocaleDraft;
  location: LocaleDraft;
  description: LocaleDraft;
  url: string;
  image: ImageDraft;
  projectSlug: string;
  isPrivate: boolean;
};

const emptyArtistEventDraft = (): ArtistEventDraft => ({
  slug: "",
  title: emptyLocale(),
  type: "exhibition",
  startDate: "",
  endDate: "",
  venue: emptyLocale(),
  location: emptyLocale(),
  description: emptyLocale(),
  url: "",
  image: toImageDraft(),
  projectSlug: "",
  isPrivate: false,
});

const toArtistEventDraft = (event: ArtistEvent): ArtistEventDraft => ({
  slug: event.slug,
  title: toLocaleDraft(event.title),
  type: event.type,
  startDate: event.startDate,
  endDate: event.endDate ?? "",
  venue: toLocaleDraft(event.venue),
  location: toLocaleDraft(event.location),
  description: toLocaleDraft(event.description),
  url: event.url ?? "",
  image: toImageDraft(event.image),
  projectSlug: event.projectSlug ?? "",
  isPrivate: Boolean(event.isPrivate),
});

export function ArtistEventsManager({
  events,
  projects,
  databaseReady,
  openCloudinaryPicker,
}: {
  events: ArtistEvent[];
  projects: Pick<Project, "slug" | "name" | "isPrivate">[];
  databaseReady: boolean;
  openCloudinaryPicker?: OpenCloudinaryPicker;
}) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState(NEW_RECORD);
  const [draft, setDraft] = useState<ArtistEventDraft>(() => emptyArtistEventDraft());
  const [status, setStatus] = useState<MutationStatus>("idle");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const orderedEvents = useMemo(
    () => [...events].sort((first, second) => second.startDate.localeCompare(first.startDate)),
    [events],
  );

  useEffect(() => {
    if (selectedSlug === NEW_RECORD) {
      setDraft(emptyArtistEventDraft());
      return;
    }

    const selected = events.find((event) => event.slug === selectedSlug);
    if (selected) setDraft(toArtistEventDraft(selected));
  }, [events, selectedSlug]);

  const handleSelect = (slug: string) => {
    if (status !== "idle") return;
    setFeedback(null);
    setSelectedSlug(slug);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!databaseReady || status !== "idle") return;
    setStatus("saving");
    setFeedback(null);

    try {
      const slug = draft.slug.trim();
      if (!slug) throw new Error("Agrega el slug del evento");
      if (!draft.startDate) throw new Error("Agrega la fecha de inicio");
      if (draft.endDate && draft.endDate < draft.startDate) {
        throw new Error("La fecha final no puede ser anterior a la fecha de inicio");
      }

      const description = optionalLocale(draft.description);
      const image = buildOptionalImage(draft.image, "el texto alternativo de la imagen del evento");
      const url = draft.url.trim();
      const projectSlug = draft.projectSlug.trim();
      const payload: ArtistEvent = {
        slug,
        title: requireLocale(draft.title, "el título del evento"),
        type: draft.type,
        startDate: draft.startDate,
        ...(draft.endDate ? { endDate: draft.endDate } : {}),
        venue: trimLocale(draft.venue),
        location: trimLocale(draft.location),
        ...(description ? { description } : {}),
        ...(url ? { url } : {}),
        ...(image ? { image } : {}),
        ...(projectSlug ? { projectSlug } : {}),
        isPrivate: draft.isPrivate,
      };
      const isNew = selectedSlug === NEW_RECORD;
      const endpoint = isNew ? "/api/events" : `/api/events/${encodeSlug(selectedSlug)}`;
      const saved = await requestJson<ArtistEvent>(
        await fetch(endpoint, {
          method: isNew ? "POST" : "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        "No fue posible guardar el evento",
      );

      setDraft(toArtistEventDraft(saved));
      setSelectedSlug(saved.slug);
      setFeedback({ kind: "success", message: "Evento guardado correctamente." });
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar el evento",
      });
    } finally {
      setStatus("idle");
    }
  };

  const handleDelete = async () => {
    if (selectedSlug === NEW_RECORD || !databaseReady || status !== "idle") return;
    const current = events.find((event) => event.slug === selectedSlug);
    const label = current?.title.es || current?.title.en || selectedSlug;

    if (!window.confirm(`¿Eliminar el evento “${label}”? Esta acción no se puede deshacer.`)) {
      return;
    }

    setStatus("deleting");
    setFeedback(null);

    try {
      await requestJson<{ success: boolean }>(
        await fetch(`/api/events/${encodeSlug(selectedSlug)}`, {
          method: "DELETE",
          credentials: "include",
        }),
        "No fue posible eliminar el evento",
      );
      setSelectedSlug(NEW_RECORD);
      setDraft(emptyArtistEventDraft());
      setFeedback({ kind: "success", message: "Evento eliminado." });
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "No fue posible eliminar el evento",
      });
    } finally {
      setStatus("idle");
    }
  };

  return (
    <section className="space-y-6">
      <ManagerHeading
        title="Eventos"
        description="Administra exposiciones, charlas, performances, residencias y otras actividades."
      />
      <DatabaseNotice databaseReady={databaseReady} />
      <FeedbackMessage feedback={feedback} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
        <RecordSidebar
          title="Eventos guardados"
          newLabel="Nuevo evento"
          selectedSlug={selectedSlug}
          onSelect={handleSelect}
          records={orderedEvents.map((event) => ({
            slug: event.slug,
            label: event.title.es || event.title.en,
            meta: event.startDate,
            isPrivate: event.isPrivate,
          }))}
        />

        <form onSubmit={handleSubmit} className={panelClassName} aria-busy={status !== "idle"}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClassName}>
              <span>Slug</span>
              <input
                required
                readOnly={selectedSlug !== NEW_RECORD}
                value={draft.slug}
                onChange={(event) => setDraft((previous) => ({ ...previous, slug: event.target.value }))}
                className={inputClassName}
                aria-describedby="event-slug-help"
              />
              <span id="event-slug-help" className="block normal-case leading-4 tracking-normal text-foreground/45">
                {selectedSlug === NEW_RECORD
                  ? "Identificador estable, por ejemplo: exposicion-2026."
                  : "El slug no puede modificarse después de guardar."}
              </span>
            </label>
            <label className={labelClassName}>
              <span>Tipo</span>
              <select
                value={draft.type}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    type: event.target.value as ArtistEventType,
                  }))
                }
                className={inputClassName}
              >
                {EVENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              <span>Fecha de inicio</span>
              <input
                required
                type="date"
                value={draft.startDate}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, startDate: event.target.value }))
                }
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              <span>Fecha de cierre (opcional)</span>
              <input
                type="date"
                min={draft.startDate || undefined}
                value={draft.endDate}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, endDate: event.target.value }))
                }
                className={inputClassName}
              />
            </label>
          </div>

          <PlainLocaleField
            label="Título"
            value={draft.title}
            onChange={(title) => setDraft((previous) => ({ ...previous, title }))}
            help="Basta completar un idioma; al guardar se usará como respaldo del otro."
          />
          <PlainLocaleField
            label="Sede"
            value={draft.venue}
            onChange={(venue) => setDraft((previous) => ({ ...previous, venue }))}
          />
          <PlainLocaleField
            label="Ubicación"
            value={draft.location}
            onChange={(location) => setDraft((previous) => ({ ...previous, location }))}
          />
          <PlainLocaleField
            label="Descripción (opcional)"
            value={draft.description}
            onChange={(description) => setDraft((previous) => ({ ...previous, description }))}
            multiline
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClassName}>
              <span>URL de información (opcional)</span>
              <input
                type="url"
                value={draft.url}
                onChange={(event) => setDraft((previous) => ({ ...previous, url: event.target.value }))}
                className={inputClassName}
                placeholder="https://…"
              />
            </label>
            <label className={labelClassName}>
              <span>Proyecto relacionado (opcional)</span>
              <select
                value={draft.projectSlug}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, projectSlug: event.target.value }))
                }
                className={inputClassName}
              >
                <option value="">Sin proyecto relacionado</option>
                {projects.map((project) => (
                  <option key={project.slug} value={project.slug}>
                    {project.name.es || project.name.en || project.slug}
                    {project.isPrivate ? " · Privado (sin enlace público)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <OptionalImageEditor
            label="Imagen (opcional)"
            value={draft.image}
            onChange={(image) => setDraft((previous) => ({ ...previous, image }))}
            openCloudinaryPicker={openCloudinaryPicker}
          />

          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground/75">
            <input
              type="checkbox"
              checked={draft.isPrivate}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, isPrivate: event.target.checked }))
              }
              className="size-4 rounded border-foreground/30"
            />
            Ocultar este evento en el sitio público
          </label>

          <div className="sticky bottom-3 flex flex-wrap justify-between gap-3 border-t border-foreground/10 bg-background/95 pt-4">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={
                selectedSlug === NEW_RECORD || !databaseReady || status !== "idle"
              }
              className={destructiveButtonClassName}
            >
              {status === "deleting" ? "Eliminando…" : "Eliminar"}
            </button>
            <button
              type="submit"
              disabled={!databaseReady || status !== "idle"}
              className={primaryButtonClassName}
            >
              {status === "saving" ? "Guardando…" : "Guardar evento"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

type PublicationDraft = {
  slug: string;
  title: LocaleDraft;
  type: PublicationType;
  publishedAt: string;
  publisher: LocaleDraft;
  summary: LocaleDraft;
  url: string;
  downloadUrl: string;
  cover: ImageDraft;
  isPrivate: boolean;
};

const emptyPublicationDraft = (): PublicationDraft => ({
  slug: "",
  title: emptyLocale(),
  type: "other",
  publishedAt: "",
  publisher: emptyLocale(),
  summary: emptyLocale(),
  url: "",
  downloadUrl: "",
  cover: toImageDraft(),
  isPrivate: false,
});

const toPublicationDraft = (publication: Publication): PublicationDraft => ({
  slug: publication.slug,
  title: toLocaleDraft(publication.title),
  type: publication.type,
  publishedAt: publication.publishedAt,
  publisher: toLocaleDraft(publication.publisher),
  summary: toLocaleDraft(publication.summary),
  url: publication.url ?? "",
  downloadUrl: publication.downloadUrl ?? "",
  cover: toImageDraft(publication.cover),
  isPrivate: Boolean(publication.isPrivate),
});

export function PublicationsManager({
  publications,
  databaseReady,
  openCloudinaryPicker,
}: {
  publications: Publication[];
  databaseReady: boolean;
  openCloudinaryPicker?: OpenCloudinaryPicker;
}) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState(NEW_RECORD);
  const [draft, setDraft] = useState<PublicationDraft>(() => emptyPublicationDraft());
  const [status, setStatus] = useState<MutationStatus>("idle");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const orderedPublications = useMemo(
    () =>
      [...publications].sort((first, second) =>
        second.publishedAt.localeCompare(first.publishedAt),
      ),
    [publications],
  );

  useEffect(() => {
    if (selectedSlug === NEW_RECORD) {
      setDraft(emptyPublicationDraft());
      return;
    }

    const selected = publications.find((publication) => publication.slug === selectedSlug);
    if (selected) setDraft(toPublicationDraft(selected));
  }, [publications, selectedSlug]);

  const handleSelect = (slug: string) => {
    if (status !== "idle") return;
    setFeedback(null);
    setSelectedSlug(slug);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!databaseReady || status !== "idle") return;
    setStatus("saving");
    setFeedback(null);

    try {
      const slug = draft.slug.trim();
      if (!slug) throw new Error("Agrega el slug de la publicación");
      if (!draft.publishedAt) throw new Error("Agrega la fecha de publicación");
      const summary = optionalLocale(draft.summary);
      const cover = buildOptionalImage(
        draft.cover,
        "el texto alternativo de la portada de la publicación",
      );
      const url = draft.url.trim();
      const downloadUrl = draft.downloadUrl.trim();
      const payload: Publication = {
        slug,
        title: requireLocale(draft.title, "el título de la publicación"),
        type: draft.type,
        publishedAt: draft.publishedAt,
        publisher: trimLocale(draft.publisher),
        ...(summary ? { summary } : {}),
        ...(url ? { url } : {}),
        ...(downloadUrl ? { downloadUrl } : {}),
        ...(cover ? { cover } : {}),
        isPrivate: draft.isPrivate,
      };
      const isNew = selectedSlug === NEW_RECORD;
      const endpoint = isNew
        ? "/api/publications"
        : `/api/publications/${encodeSlug(selectedSlug)}`;
      const saved = await requestJson<Publication>(
        await fetch(endpoint, {
          method: isNew ? "POST" : "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        "No fue posible guardar la publicación",
      );

      setDraft(toPublicationDraft(saved));
      setSelectedSlug(saved.slug);
      setFeedback({ kind: "success", message: "Publicación guardada correctamente." });
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "No fue posible guardar la publicación",
      });
    } finally {
      setStatus("idle");
    }
  };

  const handleDelete = async () => {
    if (selectedSlug === NEW_RECORD || !databaseReady || status !== "idle") return;
    const current = publications.find((publication) => publication.slug === selectedSlug);
    const label = current?.title.es || current?.title.en || selectedSlug;

    if (
      !window.confirm(
        `¿Eliminar la publicación “${label}”? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setStatus("deleting");
    setFeedback(null);

    try {
      await requestJson<{ success: boolean }>(
        await fetch(`/api/publications/${encodeSlug(selectedSlug)}`, {
          method: "DELETE",
          credentials: "include",
        }),
        "No fue posible eliminar la publicación",
      );
      setSelectedSlug(NEW_RECORD);
      setDraft(emptyPublicationDraft());
      setFeedback({ kind: "success", message: "Publicación eliminada." });
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "No fue posible eliminar la publicación",
      });
    } finally {
      setStatus("idle");
    }
  };

  return (
    <section className="space-y-6">
      <ManagerHeading
        title="Publicaciones"
        description="Administra textos, catálogos, entrevistas, prensa y publicaciones académicas."
      />
      <DatabaseNotice databaseReady={databaseReady} />
      <FeedbackMessage feedback={feedback} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
        <RecordSidebar
          title="Publicaciones guardadas"
          newLabel="Nueva publicación"
          selectedSlug={selectedSlug}
          onSelect={handleSelect}
          records={orderedPublications.map((publication) => ({
            slug: publication.slug,
            label: publication.title.es || publication.title.en,
            meta: publication.publishedAt,
            isPrivate: publication.isPrivate,
          }))}
        />

        <form onSubmit={handleSubmit} className={panelClassName} aria-busy={status !== "idle"}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClassName}>
              <span>Slug</span>
              <input
                required
                readOnly={selectedSlug !== NEW_RECORD}
                value={draft.slug}
                onChange={(event) => setDraft((previous) => ({ ...previous, slug: event.target.value }))}
                className={inputClassName}
                aria-describedby="publication-slug-help"
              />
              <span
                id="publication-slug-help"
                className="block normal-case leading-4 tracking-normal text-foreground/45"
              >
                {selectedSlug === NEW_RECORD
                  ? "Identificador estable, por ejemplo: catalogo-2026."
                  : "El slug no puede modificarse después de guardar."}
              </span>
            </label>
            <label className={labelClassName}>
              <span>Tipo</span>
              <select
                value={draft.type}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    type: event.target.value as PublicationType,
                  }))
                }
                className={inputClassName}
              >
                {PUBLICATION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              <span>Fecha de publicación</span>
              <input
                required
                type="date"
                value={draft.publishedAt}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, publishedAt: event.target.value }))
                }
                className={inputClassName}
              />
            </label>
          </div>

          <PlainLocaleField
            label="Título"
            value={draft.title}
            onChange={(title) => setDraft((previous) => ({ ...previous, title }))}
            help="Basta completar un idioma; al guardar se usará como respaldo del otro."
          />
          <PlainLocaleField
            label="Editorial o medio"
            value={draft.publisher}
            onChange={(publisher) => setDraft((previous) => ({ ...previous, publisher }))}
          />
          <PlainLocaleField
            label="Resumen (opcional)"
            value={draft.summary}
            onChange={(summary) => setDraft((previous) => ({ ...previous, summary }))}
            multiline
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClassName}>
              <span>URL externa (opcional)</span>
              <input
                type="url"
                value={draft.url}
                onChange={(event) => setDraft((previous) => ({ ...previous, url: event.target.value }))}
                className={inputClassName}
                placeholder="https://…"
              />
            </label>
            <label className={labelClassName}>
              <span>URL de descarga (opcional)</span>
              <input
                type="url"
                value={draft.downloadUrl}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, downloadUrl: event.target.value }))
                }
                className={inputClassName}
                placeholder="https://…"
              />
            </label>
          </div>

          <OptionalImageEditor
            label="Portada (opcional)"
            value={draft.cover}
            onChange={(cover) => setDraft((previous) => ({ ...previous, cover }))}
            openCloudinaryPicker={openCloudinaryPicker}
          />

          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground/75">
            <input
              type="checkbox"
              checked={draft.isPrivate}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, isPrivate: event.target.checked }))
              }
              className="size-4 rounded border-foreground/30"
            />
            Ocultar esta publicación en el sitio público
          </label>

          <div className="sticky bottom-3 flex flex-wrap justify-between gap-3 border-t border-foreground/10 bg-background/95 pt-4">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={
                selectedSlug === NEW_RECORD || !databaseReady || status !== "idle"
              }
              className={destructiveButtonClassName}
            >
              {status === "deleting" ? "Eliminando…" : "Eliminar"}
            </button>
            <button
              type="submit"
              disabled={!databaseReady || status !== "idle"}
              className={primaryButtonClassName}
            >
              {status === "saving" ? "Guardando…" : "Guardar publicación"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
