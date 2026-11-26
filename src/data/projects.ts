export interface Project {
  slug: string;
  name: string;
  displayTitle?: string;
  description: string;
  repo: string; // "owner/repo"
  siteUrl: string;
  branch: string;
  boardPath: string;
}

export const projects: Project[] = [
  {
    slug: "btc-candles",
    name: "btc_candles_research",
    displayTitle: "Velas de 5 minutos en BTC/USDT",
    description:
      "¿Existe un edge estadístico en la dirección de la vela de 5 minutos de BTC/USDT? Pre-registro, benchmarks Monte Carlo emparejados por volatilidad, corrección FDR.",
    repo: "santiagoCSM/btc_candles_research",
    siteUrl: "https://santiagocsm.github.io/btc_candles_research/",
    branch: "main",
    boardPath: "board.md",
  },
];
