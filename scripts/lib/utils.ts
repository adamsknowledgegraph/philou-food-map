import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT_DIR = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const DATA_DIR = join(ROOT_DIR, "data");
export const RAW_WEB_DIR = join(DATA_DIR, "raw", "web");
export const PROCESSED_DIR = join(DATA_DIR, "processed");
export const CACHE_DIR = join(DATA_DIR, "cache");
export const REVIEW_DIR = join(DATA_DIR, "review");
export const INPUT_DIR = join(DATA_DIR, "input");
export const VIDEOS_DIR = join(DATA_DIR, "videos");
export const SCREENSHOTS_DIR = join(DATA_DIR, "screenshots");
export const CAPTIONS_DIR = join(DATA_DIR, "captions");
export const TRANSCRIPTS_DIR = join(DATA_DIR, "transcripts");
export const OCR_DIR = join(DATA_DIR, "ocr");

export async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

export async function ensureProjectDirs() {
  await Promise.all([
    ensureDir(DATA_DIR),
    ensureDir(RAW_WEB_DIR),
    ensureDir(PROCESSED_DIR),
    ensureDir(CACHE_DIR),
    ensureDir(REVIEW_DIR),
    ensureDir(INPUT_DIR),
    ensureDir(VIDEOS_DIR),
    ensureDir(SCREENSHOTS_DIR),
    ensureDir(CAPTIONS_DIR),
    ensureDir(TRANSCRIPTS_DIR),
    ensureDir(OCR_DIR),
  ]);
}

export async function writeJson(path: string, value: unknown) {
  await ensureDir(dirname(path));
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function serializeList(values: string[]) {
  return JSON.stringify(
    values
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index),
  );
}

export function uniqueList(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function buildGoogleMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function arrondissementFromText(value: string | null | undefined) {
  const text = value ?? "";
  const postalMatch = text.match(/\b(7500[1-9]|7501\d|75020|75116)\b/);

  if (postalMatch) {
    const postal = postalMatch[0] === "75116" ? 16 : Number(postalMatch[0].slice(-2));
    return postal === 1 ? "1er" : `${postal}e`;
  }

  const patterns = [
    [/premier arrondissement|1er arrondissement|1st arrondissement/i, "1er"],
    [/deuxi[eè]me arrondissement|2e arrondissement|second arrondissement/i, "2e"],
    [/troisi[eè]me arrondissement|3e arrondissement/i, "3e"],
    [/quatri[eè]me arrondissement|4e arrondissement/i, "4e"],
    [/cinqui[eè]me arrondissement|5e arrondissement/i, "5e"],
    [/sixi[eè]me arrondissement|6e arrondissement/i, "6e"],
    [/septi[eè]me arrondissement|7e arrondissement/i, "7e"],
    [/huiti[eè]me arrondissement|8e arrondissement/i, "8e"],
    [/neuvi[eè]me arrondissement|9e arrondissement/i, "9e"],
    [/dixi[eè]me arrondissement|10e arrondissement/i, "10e"],
    [/onzi[eè]me arrondissement|11e arrondissement|XIe arrondissement/i, "11e"],
    [/douzi[eè]me arrondissement|12e arrondissement/i, "12e"],
    [/treizi[eè]me arrondissement|13e arrondissement/i, "13e"],
    [/quatorzi[eè]me arrondissement|14e arrondissement/i, "14e"],
    [/quinzi[eè]me arrondissement|15e arrondissement/i, "15e"],
    [/seizi[eè]me arrondissement|16e arrondissement/i, "16e"],
    [/dix-septi[eè]me arrondissement|17e arrondissement/i, "17e"],
    [/dix-huiti[eè]me arrondissement|18e arrondissement/i, "18e"],
    [/dix-neuvi[eè]me arrondissement|19e arrondissement/i, "19e"],
    [/vingti[eè]me arrondissement|20e arrondissement/i, "20e"],
  ] as const;

  const match = patterns.find(([pattern]) => pattern.test(text));
  return match?.[1] ?? null;
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
