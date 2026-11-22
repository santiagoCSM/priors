import type { Project } from "../data/projects";

export type BoardKind = "confirmed" | "confirmed-local" | "weak" | "pending" | "rejected" | "moredata" | "unknown";

export interface BoardRow {
  hipotesis: string;
  estado: string;
  nivel: string;
  evidencia: string;
  proximoPaso: string;
  kind: BoardKind;
  shortLabel: string;
}

const SHORT_LABELS: Record<BoardKind, string> = {
  confirmed: "Confirmada",
  "confirmed-local": "Confirmada localmente",
  weak: "Evidencia débil",
  pending: "Pendiente",
  rejected: "Rechazada",
  moredata: "Requiere más datos",
  unknown: "Sin clasificar",
};

export interface BoardResult {
  project: Project;
  rows: BoardRow[];
  error: string | null;
}

function stripMd(value: string): string {
  return value.replace(/\*\*/g, "").replace(/\\\|/g, "|").trim();
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function classify(estado: string): BoardKind {
  const value = normalize(estado);
  if (/^confirmad[ao]s?\s+localmente\b/.test(value)) return "confirmed-local";
  if (/^confirmad[ao]s?\b/.test(value)) return "confirmed";
  if (/^rechazad[ao]s?\b/.test(value)) return "rejected";
  if (/^requiere(?:n)? mas datos\b/.test(value) || /^datos insuficientes\b/.test(value)) return "moredata";
  if (/^evidencia debil\b/.test(value)) return "weak";
  if (/^pendiente\b/.test(value)) return "pending";
  return "unknown";
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(stripMd);
}

export function parseBoardTable(markdown: string): BoardRow[] {
  const lines = markdown.split(/\r?\n/);
  const expected = ["hipotesis", "estado", "nivel", "evidencia clave", "proximo paso"];

  for (let i = 0; i < lines.length - 2; i++) {
    if (!lines[i].trim().startsWith("|")) continue;

    const header = splitTableRow(lines[i]).map(normalize);
    const positions = expected.map((column) => header.indexOf(column));
    if (positions.some((position) => position < 0)) continue;

    const separator = splitTableRow(lines[i + 1]);
    if (separator.length !== header.length ||
        !separator.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))) continue;

    const rows: BoardRow[] = [];
    for (let lineIndex = i + 2; lineIndex < lines.length; lineIndex++) {
      if (!lines[lineIndex].trim().startsWith("|")) break;

      const cells = splitTableRow(lines[lineIndex]);
      const [hipotesis, estado, nivel, evidencia, proximoPaso] =
        positions.map((position) => cells[position] ?? "");

      if (!hipotesis || !estado) continue;
      const kind = classify(estado);
      rows.push({
        hipotesis,
        estado,
        nivel,
        evidencia,
        proximoPaso,
        kind,
        shortLabel: SHORT_LABELS[kind],
      });
    }
    return rows;
  }
  return [];
}

export async function fetchBoard(project: Project): Promise<BoardResult> {
  const url = "https://raw.githubusercontent.com/" + project.repo + "/" +
    project.branch + "/" + project.boardPath;

  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      return { project, rows: [], error: "HTTP " + response.status + " al leer " + url };
    }

    const rows = parseBoardTable(await response.text());
    return {
      project,
      rows,
      error: rows.length ? null : "No se encontró una tabla válida de hipótesis en board.md",
    };
  } catch (error) {
    return {
      project,
      rows: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function fetchAllBoards(projects: Project[]): Promise<BoardResult[]> {
  return Promise.all(projects.map(fetchBoard));
}
