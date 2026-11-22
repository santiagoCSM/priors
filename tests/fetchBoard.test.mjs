import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBoardTable } from "../src/lib/fetchBoard.ts";

const board = [
  "# Tablero de decisión",
  "",
  "Generado automáticamente.",
  "",
  "| Hipótesis | Estado | Nivel | Evidencia clave | Próximo paso |",
  "|---|---|---|---|---|",
  "| 001_survival | Evidencia débil / no se confirma como hipótesis única | 1 | Comparación A | Revisar |",
  "| 001E · trayectoria interna | **Confirmada localmente** (Nivel 2, con reservas) | 2 | Comparación B | Validar |",
  "| 002_shape | Pendiente | — | — | Semanas 6-7 |",
  "| 003_microstructure | Pendiente | — | — | Semanas 9-10 |",
  "| 004_orderflow | Pendiente | — | — | Semanas 11-12 |",
  "| 005_entropy | Pendiente | — | — | Semana 13 |",
  "",
  "## Estados posibles",
].join("\n");

test("interpreta las seis filas del tablero y distingue confirmaciones locales", () => {
  const rows = parseBoardTable(board);
  assert.equal(rows.length, 6);
  assert.deepEqual(rows.map((row) => row.kind), [
    "weak",
    "confirmed-local",
    "pending",
    "pending",
    "pending",
    "pending",
  ]);
  assert.equal(rows[1].shortLabel, "Confirmada localmente");
  assert.match(rows[1].estado, /con reservas/);
});

test("no confunde datos insuficientes con evidencia débil", () => {
  const rows = parseBoardTable(board.replace(
    "| 002_shape | Pendiente |",
    "| 002_shape | Requiere más datos |",
  ));
  assert.equal(rows[2].kind, "moredata");
  assert.equal(rows[2].shortLabel, "Requiere más datos");
});

test("conserva un estado desconocido sin inventar una clasificación", () => {
  const rows = parseBoardTable(board.replace(
    "| 005_entropy | Pendiente |",
    "| 005_entropy | En revisión metodológica |",
  ));
  assert.equal(rows[5].kind, "unknown");
  assert.equal(rows[5].estado, "En revisión metodológica");
  assert.equal(rows[5].shortLabel, "Sin clasificar");
});

test("reconoce columnas por nombre y conserva separadores escapados", () => {
  const reordered = [
    "| Estado | Hipótesis | Próximo paso | Nivel | Evidencia clave |",
    "|---|---|---|---|---|",
    "| Confirmada | Prueba A | Auditar \\| verificar | 3 | Efecto estable |",
  ].join("\n");
  const rows = parseBoardTable(reordered);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].kind, "confirmed");
  assert.equal(rows[0].proximoPaso, "Auditar | verificar");
});

test("ignora tablas no relacionadas", () => {
  assert.deepEqual(parseBoardTable("| Nombre | Valor |\n|---|---|\n| A | 1 |"), []);
});
