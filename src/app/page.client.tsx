"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLocale } from "@/components/site/locale-context";
import {
  resolveProjectHomeColor,
  type ProjectGalleryImage,
} from "@/domain/projects";
import { translate, type LocaleText } from "@/lib/i18n";
import {
  createWordSearch,
  getWordSearchCellKey,
  MAX_WORD_SEARCH_WORD_LENGTH,
  normalizeWordSearchText,
} from "@/lib/word-search";

import styles from "./home.module.css";

export type HomeProjectItem = {
  slug: string;
  label: LocaleText;
  color?: string;
  timeline: string;
  cover: ProjectGalleryImage;
};

type HomePageClientProps = {
  artistName: string;
  projects: HomeProjectItem[];
  puzzleSeed: string;
};

type GridStyle = CSSProperties & {
  "--word-search-size": number;
  "--word-search-font-size": string;
};

type HighlightStyle = CSSProperties & {
  "--word-color": string;
};

const IDLE_REVEAL_DELAY = 3_000;

const UI_COPY = {
  countSingular: { es: "obra escondida", en: "hidden work" },
  countPlural: { es: "obras escondidas", en: "hidden works" },
  instructions: {
    es: "Encuentra en la cuadrícula las obras de la lista.",
    en: "Find the listed works in the grid.",
  },
  idleStatus: {
    es: "Pista: las obras se revelan después de unos segundos.",
    en: "Hint: the works reveal themselves after a few seconds.",
  },
  revealedStatus: { es: "Todas las obras están a la vista.", en: "All works are now visible." },
  openProject: { es: "Abrir obra", en: "Open work" },
  indexLabel: { es: "Obras", en: "Works" },
  projectListTitle: { es: "Listado de proyectos", en: "Project list" },
  bioLabel: { es: "Ir a Bio", en: "Go to Bio" },
  emptyTitle: { es: "El archivo está tomando forma", en: "The archive is taking shape" },
  emptyCopy: {
    es: "Aún no hay proyectos seleccionados para aparecer aquí.",
    en: "No projects have been selected to appear here yet.",
  },
} satisfies Record<string, LocaleText>;

export default function HomePageClient({
  artistName,
  projects,
  puzzleSeed,
}: HomePageClientProps) {
  const { locale } = useLocale();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<number | null>(null);

  const puzzleEntries = useMemo(
    () =>
      projects.map((project, index) => {
        const normalizedLabel = normalizeWordSearchText(translate(locale, project.label));
        const fallbackLabel =
          normalizeWordSearchText(project.slug) || `OBRA${String(index + 1).padStart(2, "0")}`;

        return {
          id: project.slug,
          label: (normalizedLabel || fallbackLabel).slice(0, MAX_WORD_SEARCH_WORD_LENGTH),
        };
      }),
    [locale, projects],
  );

  const puzzle = useMemo(
    () =>
      createWordSearch(puzzleEntries, {
        minSize: 25,
        placementStrategy: "random",
        seed: `${puzzleSeed}:lynnette-home:${locale}:${puzzleEntries
          .map(({ id, label }) => `${id}:${label}`)
          .join("|")}`,
      }),
    [locale, puzzleEntries, puzzleSeed],
  );

  const projectsBySlug = useMemo(
    () => new Map(projects.map((project) => [project.slug, project])),
    [projects],
  );
  const projectColors = useMemo(
    () =>
      new Map(
        projects.map((project, index) => [
          project.slug,
          resolveProjectHomeColor(project.color, index),
        ]),
      ),
    [projects],
  );
  const activeProject = activeSlug ? projectsBySlug.get(activeSlug) : undefined;
  const activeColor = activeSlug ? projectColors.get(activeSlug) : undefined;

  useEffect(() => {
    if (projects.length === 0) {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    const scheduleIdleReveal = () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = window.setTimeout(() => {
        setIsIdle(true);
      }, IDLE_REVEAL_DELAY);
    };

    const handleActivity = () => {
      setIsIdle(false);
      scheduleIdleReveal();
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      "pointermove",
      "pointerdown",
      "touchstart",
      "keydown",
      "scroll",
    ];

    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity));
    scheduleIdleReveal();

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [locale, projects.length]);

  if (projects.length === 0 || puzzle.size === 0) {
    return (
      <section className={styles.emptyHome} aria-labelledby="home-title">
        <h1 id="home-title" className={styles.emptyArtistName}>
          {artistName}
        </h1>
        <div className={styles.emptyMessage}>
          <p>{translate(locale, UI_COPY.emptyTitle)}</p>
          <p>{translate(locale, UI_COPY.emptyCopy)}</p>
        </div>
      </section>
    );
  }

  const gridStyle: GridStyle = {
    "--word-search-size": puzzle.size,
    "--word-search-font-size": `clamp(0.34rem, ${52 / puzzle.size}vmin, 1rem)`,
  };
  const countLabel = projects.length === 1 ? UI_COPY.countSingular : UI_COPY.countPlural;
  const idleRevealActive = isIdle && !activeSlug;

  return (
    <section className={styles.home} aria-labelledby="home-title">
      <header className={styles.intro}>
        <h1 id="home-title" className={styles.artistName}>
          {artistName}
        </h1>
        <aside
          className={styles.desktopWordIndex}
          aria-labelledby="desktop-word-list-title"
        >
          <p id="desktop-word-list-title" className={styles.workCount}>
            {translate(locale, UI_COPY.projectListTitle)}
          </p>
          <ol className={styles.searchWords}>
            {projects.map((project) => (
              <li key={project.slug}>{translate(locale, project.label)}</li>
            ))}
          </ol>
        </aside>

        <details className={styles.mobileProjectIndex}>
          <summary className={styles.workCount}>
            <span>{String(projects.length).padStart(2, "0")}</span>{" "}
            {translate(locale, countLabel)}
            <b aria-hidden="true">+</b>
          </summary>
          <nav
            className={styles.indexPanel}
            aria-label={translate(locale, UI_COPY.indexLabel)}
          >
            <ol>
              {projects.map((project, index) => {
                const color = projectColors.get(project.slug);
                return (
                  <li key={project.slug}>
                    <Link
                      href={`/proyectos/${project.slug}`}
                      style={color ? ({ "--word-color": color } as HighlightStyle) : undefined}
                      onPointerEnter={() => {
                        setIsIdle(false);
                        setActiveSlug(project.slug);
                      }}
                      onPointerLeave={(event) => {
                        if (document.activeElement !== event.currentTarget) {
                          setActiveSlug(null);
                        }
                      }}
                      onFocus={() => {
                        setIsIdle(false);
                        setActiveSlug(project.slug);
                      }}
                      onBlur={() => setActiveSlug(null)}
                    >
                      <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                      <span>{translate(locale, project.label)}</span>
                      <time>{project.timeline}</time>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        </details>
      </header>

      <p id="word-search-instructions" className="sr-only">
        {translate(locale, UI_COPY.instructions)}
      </p>

      <div className={styles.stage}>
        <div className={styles.puzzle} style={gridStyle}>
          <div className={styles.grid} aria-hidden="true">
            {puzzle.grid.map((row, rowIndex) =>
              row.map((letter, columnIndex) => {
                const owners =
                  puzzle.wordIdsByCell[getWordSearchCellKey(rowIndex, columnIndex)] ?? [];
                const highlightedOwner =
                  activeSlug && owners.includes(activeSlug)
                    ? activeSlug
                    : idleRevealActive
                      ? owners[0]
                      : undefined;
                const isIdleHighlight = Boolean(idleRevealActive && highlightedOwner);
                const color = highlightedOwner
                  ? projectColors.get(highlightedOwner)
                  : undefined;
                const highlightStyle: HighlightStyle | undefined = color
                  ? { "--word-color": color }
                  : undefined;

                return (
                  <span
                    key={`${rowIndex}:${columnIndex}`}
                    className={`${styles.cell}${
                      highlightedOwner ? ` ${styles.highlightedCell}` : ""
                    }${isIdleHighlight ? ` ${styles.idleHighlightedCell}` : ""}`}
                    style={highlightStyle}
                  >
                    {letter}
                  </span>
                );
              }),
            )}
          </div>

          <nav
            className={styles.wordLinks}
            aria-label={locale === "es" ? "Obras escondidas" : "Hidden works"}
            aria-describedby="word-search-instructions"
          >
            {puzzle.placements.map((placement) => {
              const project = projectsBySlug.get(placement.id);
              if (!project) {
                return null;
              }

              const deltaColumns = placement.end.column - placement.start.column;
              const deltaRows = placement.end.row - placement.start.row;
              const midpointColumn = (placement.start.column + placement.end.column + 1) / 2;
              const midpointRow = (placement.start.row + placement.end.row + 1) / 2;
              const linkStyle: CSSProperties = {
                left: `${(midpointColumn / puzzle.size) * 100}%`,
                top: `${(midpointRow / puzzle.size) * 100}%`,
                width: `${((Math.hypot(deltaColumns, deltaRows) + 0.92) / puzzle.size) * 100}%`,
                height: `${(0.88 / puzzle.size) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${placement.direction.angle}deg)`,
              };

              return (
                <Link
                  key={placement.id}
                  href={`/proyectos/${project.slug}`}
                  className={styles.wordLink}
                  style={linkStyle}
                  aria-label={`${translate(locale, project.label)}, ${project.timeline}. ${translate(
                    locale,
                    UI_COPY.openProject,
                  )}`}
                  onPointerEnter={() => {
                    setIsIdle(false);
                    setActiveSlug(project.slug);
                  }}
                  onPointerLeave={(event) => {
                    if (document.activeElement !== event.currentTarget) {
                      setActiveSlug(null);
                    }
                  }}
                  onFocus={() => {
                    setIsIdle(false);
                    setActiveSlug(project.slug);
                  }}
                  onBlur={() => setActiveSlug(null)}
                >
                  <span className="sr-only">{translate(locale, project.label)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {activeProject && activeColor ? (
          <aside
            className={styles.preview}
            style={{ "--word-color": activeColor } as HighlightStyle}
            aria-hidden="true"
          >
            <div className={styles.previewMedia}>
              <Image
                src={activeProject.cover.src}
                alt=""
                fill
                sizes="(max-width: 639px) 0px, 13rem"
                className={styles.previewImage}
              />
            </div>
            <div className={styles.previewCopy}>
              <p>{translate(locale, activeProject.label)}</p>
              <p>
                {activeProject.timeline} <span aria-hidden="true">↗</span>
              </p>
            </div>
          </aside>
        ) : null}
      </div>

      <footer className={styles.help}>
        <p>{translate(locale, UI_COPY.instructions)}</p>
        <p className={idleRevealActive ? styles.revealed : undefined}>
          {translate(locale, idleRevealActive ? UI_COPY.revealedStatus : UI_COPY.idleStatus)}
        </p>
      </footer>

      <Link
        href="/bio"
        className={styles.bioPortal}
        aria-label={translate(locale, UI_COPY.bioLabel)}
      >
        <span aria-hidden="true">✳</span>
      </Link>
    </section>
  );
}
