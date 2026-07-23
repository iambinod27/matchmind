export interface Match {
  id: number;
  homeTeam: { id: number; name: string; crest: string };
  awayTeam: { id: number; name: string; crest: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
  utcDate: string;
  matchday: number | null;
  stage: string; // "GROUP_STAGE" | "LAST_16" | "QUARTER_FINALS" | "SEMI_FINALS" | "FINAL" | etc.
  status: string;
  competition: { name: string };
}
export interface PredictionResponse {
  team_a: string;
  team_b: string;
  home_form: string;
  away_form: string;
  prediction: string;
}

export interface StandingEntry {
  position: number;
  team: { id: number; name: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingsGroup {
  stage: string;
  type: string;
  group: string | null;
  table: StandingEntry[];
}

export async function getStandings(
  competitionCode: string,
): Promise<StandingsGroup[]> {
  const res = await fetch(`http://localhost:8000/standings/${competitionCode}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return data.standings;
}

export async function getMatches(competitionCode: string): Promise<Match[]> {
  const res = await fetch(`http://localhost:8000/matches/${competitionCode}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return data.matches;
}

export async function predictMatch(
  competitionCode: string,
  matchId: number,
): Promise<PredictionResponse> {
  const res = await fetch(
    `http://localhost:8000/predict/${competitionCode}/${matchId}`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export interface League {
  code: string;
  name: string;
  emblem: string;
}

export async function getCompetitions(): Promise<League[]> {
  const res = await fetch("http://localhost:8000/competitions");
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
