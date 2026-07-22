export interface League {
  code: string;
  name: string;
  flag: string;
}

export const LEAGUES: League[] = [
  { code: "PL", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "PD", name: "La Liga", flag: "🇪🇸" },
  { code: "BL1", name: "Bundesliga", flag: "🇩🇪" },
  { code: "SA", name: "Serie A", flag: "🇮🇹" },
  { code: "FL1", name: "Ligue 1", flag: "🇫🇷" },
  { code: "CL", name: "Champions League", flag: "⭐" },
  { code: "WC", name: "World Cup", flag: "🌍" },
  { code: "ELC", name: "Championship", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "DED", name: "Eredivisie", flag: "🇳🇱" },
  { code: "PPL", name: "Primeira Liga", flag: "🇵🇹" },
  { code: "BSA", name: "Brasileirão", flag: "🇧🇷" },
  { code: "EC", name: "European Championship", flag: "🇪🇺" },
];
