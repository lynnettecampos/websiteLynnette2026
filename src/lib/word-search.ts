export type WordSearchEntry = {
  id: string;
  label: string;
};

export type WordSearchCoordinate = {
  row: number;
  column: number;
};

export type WordSearchPosition = WordSearchCoordinate & {
  /** Zero-based character index within the normalized word. */
  index: number;
};

export const WORD_SEARCH_DIRECTIONS = [
  { name: "east", rowDelta: 0, columnDelta: 1, angle: 0 },
  { name: "south-east", rowDelta: 1, columnDelta: 1, angle: 45 },
  { name: "south", rowDelta: 1, columnDelta: 0, angle: 90 },
  { name: "south-west", rowDelta: 1, columnDelta: -1, angle: 135 },
  { name: "west", rowDelta: 0, columnDelta: -1, angle: 180 },
  { name: "north-west", rowDelta: -1, columnDelta: -1, angle: -135 },
  { name: "north", rowDelta: -1, columnDelta: 0, angle: -90 },
  { name: "north-east", rowDelta: -1, columnDelta: 1, angle: -45 },
] as const;

export type WordSearchDirection = (typeof WORD_SEARCH_DIRECTIONS)[number];
export type WordSearchDirectionName = WordSearchDirection["name"];

export type WordSearchPlacement = {
  id: string;
  /** Original, human-readable label. */
  label: string;
  /** Label normalized to the characters that are present in the grid. */
  word: string;
  start: WordSearchCoordinate;
  end: WordSearchCoordinate;
  direction: WordSearchDirection;
  positions: readonly WordSearchPosition[];
};

export type WordSearchResult = {
  size: number;
  seed: number;
  grid: ReadonlyArray<ReadonlyArray<string>>;
  /** Placements in the same order as the supplied entries. */
  placements: readonly WordSearchPlacement[];
  placementsById: Readonly<Record<string, WordSearchPlacement>>;
  /** Entry ids associated with a cell, keyed as `row:column`. */
  wordIdsByCell: Readonly<Record<string, readonly string[]>>;
};

export type WordSearchOptions = {
  /** A stable seed makes the same content generate the same layout. */
  seed?: string | number;
  minSize?: number;
  /** `random` mirrors a hand-placed puzzle by choosing among all valid positions. */
  placementStrategy?: "balanced" | "random";
  /** Normalized to A-Z/0-9 before it is used. */
  fillCharacters?: string;
  attemptsPerSize?: number;
};

type PreparedEntry = WordSearchEntry & {
  inputIndex: number;
  word: string;
};

type MutableGrid = Array<Array<string | null>>;

type PlacementCandidate = {
  row: number;
  column: number;
  direction: WordSearchDirection;
  overlaps: number;
  centerDistance: number;
  tieBreaker: number;
};

const DEFAULT_FILL_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_ATTEMPTS_PER_SIZE = 12;
const TARGET_CHARACTER_DENSITY = 0.62;

/** Editorial limit used to keep the public puzzle legible and bounded. */
export const MAX_WORD_SEARCH_WORD_LENGTH = 40;

/**
 * Converts display text into the exact characters used by the puzzle.
 * Diacritics, whitespace and punctuation are removed; digits are retained.
 */
export const normalizeWordSearchText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export function getWordSearchCellKey(position: WordSearchCoordinate): string;
export function getWordSearchCellKey(row: number, column: number): string;
export function getWordSearchCellKey(
  positionOrRow: WordSearchCoordinate | number,
  column?: number,
): string {
  if (typeof positionOrRow === "number") {
    return `${positionOrRow}:${column ?? 0}`;
  }

  return `${positionOrRow.row}:${positionOrRow.column}`;
}

const hashString = (value: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createSeededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const createEmptyGrid = (size: number): MutableGrid =>
  Array.from({ length: size }, () => Array<string | null>(size).fill(null));

const resolvePositiveInteger = (value: number | undefined, fallback: number): number => {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
};

const resolveSeed = (entries: readonly PreparedEntry[], seed?: string | number): number => {
  const contentSeed = entries.map(({ id, word }) => `${id}:${word}`).join("|");
  return hashString(seed === undefined ? contentSeed : `${seed}`);
};

const prepareEntries = (entries: readonly WordSearchEntry[]): PreparedEntry[] => {
  const ids = new Set<string>();

  return entries.map((entry, inputIndex) => {
    if (!entry.id.trim()) {
      throw new Error(`Word-search entry at index ${inputIndex} has an empty id.`);
    }

    if (ids.has(entry.id)) {
      throw new Error(`Word-search entry id "${entry.id}" is duplicated.`);
    }

    ids.add(entry.id);

    const word = normalizeWordSearchText(entry.label);
    if (!word) {
      throw new Error(
        `Word-search entry "${entry.id}" has no A-Z or 0-9 characters after normalization.`,
      );
    }

    return { ...entry, inputIndex, word };
  });
};

const inspectCandidate = (
  grid: MutableGrid,
  word: string,
  row: number,
  column: number,
  direction: WordSearchDirection,
): number | null => {
  const endRow = row + direction.rowDelta * (word.length - 1);
  const endColumn = column + direction.columnDelta * (word.length - 1);
  const size = grid.length;

  if (
    endRow < 0 ||
    endRow >= size ||
    endColumn < 0 ||
    endColumn >= size
  ) {
    return null;
  }

  let overlaps = 0;

  for (let index = 0; index < word.length; index += 1) {
    const currentRow = row + direction.rowDelta * index;
    const currentColumn = column + direction.columnDelta * index;
    const existingCharacter = grid[currentRow][currentColumn];

    if (existingCharacter !== null && existingCharacter !== word[index]) {
      return null;
    }

    if (existingCharacter === word[index]) {
      overlaps += 1;
    }
  }

  // Fully superimposed words make independent pointer targets ambiguous.
  return overlaps === word.length ? null : overlaps;
};

const getCandidates = (
  grid: MutableGrid,
  word: string,
  random: () => number,
  placementStrategy: "balanced" | "random",
): PlacementCandidate[] => {
  const candidates: PlacementCandidate[] = [];
  const size = grid.length;
  const center = (size - 1) / 2;

  for (const direction of WORD_SEARCH_DIRECTIONS) {
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        const overlaps = inspectCandidate(grid, word, row, column, direction);

        if (overlaps === null) {
          continue;
        }

        const endRow = row + direction.rowDelta * (word.length - 1);
        const endColumn = column + direction.columnDelta * (word.length - 1);
        const middleRow = (row + endRow) / 2;
        const middleColumn = (column + endColumn) / 2;

        candidates.push({
          row,
          column,
          direction,
          overlaps,
          centerDistance: Math.abs(middleRow - center) + Math.abs(middleColumn - center),
          tieBreaker: random(),
        });
      }
    }
  }

  candidates.sort((left, right) => {
    if (placementStrategy === "random") {
      return left.tieBreaker - right.tieBreaker;
    }

    const overlapDifference = right.overlaps - left.overlaps;
    if (overlapDifference !== 0) {
      return overlapDifference;
    }

    const distanceDifference = left.centerDistance - right.centerDistance;
    if (distanceDifference !== 0) {
      return distanceDifference;
    }

    return left.tieBreaker - right.tieBreaker;
  });

  return candidates;
};

const writePlacement = (
  grid: MutableGrid,
  entry: PreparedEntry,
  candidate: Pick<PlacementCandidate, "row" | "column" | "direction">,
): WordSearchPlacement => {
  const positions: WordSearchPosition[] = [];

  for (let index = 0; index < entry.word.length; index += 1) {
    const row = candidate.row + candidate.direction.rowDelta * index;
    const column = candidate.column + candidate.direction.columnDelta * index;
    grid[row][column] = entry.word[index];
    positions.push({ row, column, index });
  }

  const end = positions[positions.length - 1];

  return {
    id: entry.id,
    label: entry.label,
    word: entry.word,
    start: { row: candidate.row, column: candidate.column },
    end: { row: end.row, column: end.column },
    direction: candidate.direction,
    positions,
  };
};

const tryLayout = (
  entries: readonly PreparedEntry[],
  size: number,
  seed: number,
  placementStrategy: "balanced" | "random",
): { grid: MutableGrid; placements: WordSearchPlacement[] } | null => {
  const grid = createEmptyGrid(size);
  const placements: WordSearchPlacement[] = [];
  const random = createSeededRandom(seed);

  for (const entry of entries) {
    const candidate = getCandidates(grid, entry.word, random, placementStrategy)[0];

    if (!candidate) {
      return null;
    }

    placements.push(writePlacement(grid, entry, candidate));
  }

  return { grid, placements };
};

/**
 * At max(longest word, word count), placing one word per row is always valid.
 * This deterministic fallback makes a failed generation explicit and impossible
 * to turn into a silently omitted project.
 */
const createGuaranteedLayout = (
  entries: readonly PreparedEntry[],
  size: number,
  seed: number,
): { grid: MutableGrid; placements: WordSearchPlacement[] } => {
  const grid = createEmptyGrid(size);
  const placements: WordSearchPlacement[] = [];
  const random = createSeededRandom(hashString(`${seed}|fallback|${size}`));

  entries.forEach((entry, row) => {
    const availableOffset = size - entry.word.length;
    const offset = Math.floor(random() * (availableOffset + 1));
    const direction = random() < 0.5 ? WORD_SEARCH_DIRECTIONS[0] : WORD_SEARCH_DIRECTIONS[4];
    const column = direction.name === "east" ? offset : offset + entry.word.length - 1;

    placements.push(writePlacement(grid, entry, { row, column, direction }));
  });

  return { grid, placements };
};

const fillGrid = (
  grid: MutableGrid,
  fillCharacters: string,
  seed: number,
): string[][] => {
  const random = createSeededRandom(seed);

  return grid.map((row) =>
    row.map(
      (character) =>
        character ?? fillCharacters[Math.floor(random() * fillCharacters.length)],
    ),
  );
};

const indexPlacements = (
  placements: readonly WordSearchPlacement[],
): {
  placementsById: Record<string, WordSearchPlacement>;
  wordIdsByCell: Record<string, string[]>;
} => {
  const placementsById: Record<string, WordSearchPlacement> = Object.create(null) as Record<
    string,
    WordSearchPlacement
  >;
  const wordIdsByCell: Record<string, string[]> = Object.create(null) as Record<string, string[]>;

  for (const placement of placements) {
    placementsById[placement.id] = placement;

    for (const position of placement.positions) {
      const key = getWordSearchCellKey(position);
      (wordIdsByCell[key] ??= []).push(placement.id);
    }
  }

  return { placementsById, wordIdsByCell };
};

/**
 * Builds a deterministic square word-search puzzle for ordered project labels.
 * The algorithm retries compact layouts, grows the square when needed, and has
 * a guaranteed final layout so that no valid entry can be silently dropped.
 */
export const generateWordSearch = (
  entries: readonly WordSearchEntry[],
  options: WordSearchOptions = {},
): WordSearchResult => {
  const preparedEntries = prepareEntries(entries);
  const minSize = resolvePositiveInteger(options.minSize, 1);
  const seed = resolveSeed(preparedEntries, options.seed);

  if (preparedEntries.length === 0) {
    return {
      size: 0,
      seed,
      grid: [],
      placements: [],
      placementsById: {},
      wordIdsByCell: {},
    };
  }

  const fillCharacters =
    normalizeWordSearchText(options.fillCharacters ?? DEFAULT_FILL_CHARACTERS) ||
    DEFAULT_FILL_CHARACTERS;
  const attemptsPerSize = resolvePositiveInteger(
    options.attemptsPerSize,
    DEFAULT_ATTEMPTS_PER_SIZE,
  );
  const placementStrategy = options.placementStrategy ?? "balanced";
  const entriesByPlacementPriority = [...preparedEntries].sort(
    (left, right) => right.word.length - left.word.length || left.inputIndex - right.inputIndex,
  );
  const longestWord = entriesByPlacementPriority[0].word.length;
  const totalCharacters = preparedEntries.reduce((total, entry) => total + entry.word.length, 0);
  const compactSize = Math.ceil(Math.sqrt(totalCharacters / TARGET_CHARACTER_DENSITY));
  const initialSize = Math.max(minSize, longestWord, compactSize);
  const guaranteedSize = Math.max(initialSize, longestWord, preparedEntries.length);

  let layout: { grid: MutableGrid; placements: WordSearchPlacement[] } | null = null;

  for (let size = initialSize; size <= guaranteedSize && !layout; size += 1) {
    for (let attempt = 0; attempt < attemptsPerSize; attempt += 1) {
      const attemptSeed = hashString(`${seed}|layout|${size}|${attempt}`);
      layout = tryLayout(
        entriesByPlacementPriority,
        size,
        attemptSeed,
        placementStrategy,
      );

      if (layout) {
        break;
      }
    }
  }

  if (!layout) {
    layout = createGuaranteedLayout(preparedEntries, guaranteedSize, seed);
  }

  const placements = [...layout.placements].sort((left, right) => {
    const leftIndex = preparedEntries.find((entry) => entry.id === left.id)?.inputIndex ?? 0;
    const rightIndex = preparedEntries.find((entry) => entry.id === right.id)?.inputIndex ?? 0;
    return leftIndex - rightIndex;
  });
  const { placementsById, wordIdsByCell } = indexPlacements(placements);
  const grid = fillGrid(
    layout.grid,
    fillCharacters,
    hashString(`${seed}|fill|${layout.grid.length}`),
  );

  return {
    size: layout.grid.length,
    seed,
    grid,
    placements,
    placementsById,
    wordIdsByCell,
  };
};

export const createWordSearch = generateWordSearch;
