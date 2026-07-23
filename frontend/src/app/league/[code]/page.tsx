"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getMatches,
  getCompetitions,
  Match,
  League,
  StandingsGroup,
  getStandings,
} from "@/lib/api";
import StandingsTable from "@/components/StandingTable";

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  LEAGUE_STAGE: "League Stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-Finals",
  SEMI_FINALS: "Semi-Finals",
  THIRD_PLACE: "Third Place Playoff",
  FINAL: "Final",
};

const STAGE_ORDER = [
  "GROUP_STAGE",
  "LEAGUE_STAGE",
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

function subGroup(
  stageMatches: Match[],
  stage: string,
): Record<string, Match[]> {
  const isGroupPhase = stage === "GROUP_STAGE" || stage === "LEAGUE_STAGE";
  return stageMatches.reduce<Record<string, Match[]>>((acc, match) => {
    const key = isGroupPhase
      ? `Matchday ${match.matchday}`
      : [match.homeTeam.id, match.awayTeam.id].sort().join("-");
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});
}

export default function LeaguePage() {
  const params = useParams();
  const code = params.code as string;

  const [league, setLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState<StandingsGroup[]>([]);
  const [tab, setTab] = useState<"fixtures" | "table">("fixtures");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMatches(code),
      getCompetitions().then(
        (leagues) => leagues.find((l) => l.code === code) ?? null,
      ),
    ])
      .then(([matchData, leagueData]) => {
        setMatches(matchData);
        setLeague(leagueData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    getStandings(code)
      .then((data) => {
        console.log("standings:", data); // temp debug
        setStandings(data);
      })
      .catch((err) => {
        console.error("standings error:", err); // temp debug
        setStandings([]);
      });
  }, [code]);
  const groupedByStage = matches.reduce<Record<string, Match[]>>(
    (acc, match) => {
      const stage = match.stage;
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(match);
      return acc;
    },
    {},
  );

  const stages = Object.keys(groupedByStage).sort((a, b) => {
    const aIndex = STAGE_ORDER.indexOf(a);
    const bIndex = STAGE_ORDER.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  const upcomingMatches = matches
    .filter((m) => m.status !== "FINISHED")
    .sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
    )
    .slice(0, 5); // next 5 matches

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#14201A] border border-[#E4E0D4] bg-white rounded-md px-3 py-1.5 hover:border-[#C4791F] hover:text-[#C4791F] transition-colors"
      >
        ← All competitions
      </Link>

      <h1 className="font-display text-4xl font-semibold mt-4 mb-10 flex items-center gap-3 text-[#14201A]">
        {league?.emblem && (
          <img src={league.emblem} alt="" className="w-9 h-9 object-contain" />
        )}
        <span>{league?.name ?? code}</span>
      </h1>

      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab("fixtures")}
          className={`font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-md border transition-colors ${
            tab === "fixtures"
              ? "bg-[#14201A] text-white border-[#14201A]"
              : "bg-white text-[#6B7A70] border-[#E4E0D4] hover:border-[#C4791F]"
          }`}
        >
          Fixtures
        </button>
        {standings.length > 0 && (
          <button
            onClick={() => setTab("table")}
            className={`font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-md border transition-colors ${
              tab === "table"
                ? "bg-[#14201A] text-white border-[#14201A]"
                : "bg-white text-[#6B7A70] border-[#E4E0D4] hover:border-[#C4791F]"
            }`}
          >
            Table
          </button>
        )}
      </div>
      {tab === "fixtures" && upcomingMatches.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-[#C4791F] tracking-widest uppercase">
              Upcoming
            </span>
            <span className="flex-1 h-px bg-[#E4E0D4]" />
          </div>
          <div className="space-y-2">
            {upcomingMatches.map((match) => {
              const isLive =
                match.status === "IN_PLAY" || match.status === "PAUSED";
              const hasScore =
                match.score.fullTime.home !== null &&
                match.score.fullTime.away !== null;

              return (
                <Link
                  key={match.id}
                  href={`/match/${code}/${match.id}`}
                  className="group flex items-center justify-between border border-[#E4E0D4] bg-white rounded-md px-4 py-3 shadow-sm hover:shadow-md hover:border-[#C4791F] transition-all"
                >
                  <div className="flex items-center gap-2 w-2/5">
                    <img
                      src={match.homeTeam.crest}
                      alt=""
                      className="w-5 h-5 shrink-0"
                    />
                    <span className="text-sm truncate text-[#14201A]">
                      {match.homeTeam.name}
                    </span>
                  </div>

                  {isLive || hasScore ? (
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <span className="font-mono text-[10px] text-[#D64545] uppercase tracking-wider animate-pulse">
                          Live
                        </span>
                      )}
                      <span className="font-mono text-sm font-medium text-[#14201A]">
                        {match.score.fullTime.home ?? 0} –{" "}
                        {match.score.fullTime.away ?? 0}
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-[#6B7A70]">
                      {new Date(match.utcDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}

                  <div className="flex items-center gap-2 w-2/5 justify-end">
                    <span className="text-sm truncate text-right text-[#14201A]">
                      {match.awayTeam.name}
                    </span>
                    <img
                      src={match.awayTeam.crest}
                      alt=""
                      className="w-5 h-5 shrink-0"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {tab === "table" ? (
        <StandingsTable groups={standings} />
      ) : loading ? (
        <p className="font-mono text-sm text-[#6B7A70]">Loading fixtures…</p>
      ) : stages.length === 0 ? (
        <p className="font-mono text-sm text-[#6B7A70]">No matches found.</p>
      ) : (
        <div className="space-y-10">
          {stages.map((stage) => {
            const subGroups = subGroup(groupedByStage[stage], stage);
            const isGroupPhase =
              stage === "GROUP_STAGE" || stage === "LEAGUE_STAGE";

            return (
              <section key={stage}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs text-[#C4791F] tracking-widest uppercase">
                    {STAGE_LABELS[stage] ?? stage}
                  </span>
                  <span className="flex-1 h-px bg-[#E4E0D4]" />
                </div>

                <div className="space-y-6">
                  {Object.entries(subGroups).map(([key, tieMatches]) => (
                    <div key={key}>
                      {!isGroupPhase && tieMatches.length > 1 && (
                        <p className="font-mono text-[10px] text-[#6B7A70] uppercase tracking-wider mb-2">
                          {tieMatches[0].homeTeam.name} vs{" "}
                          {tieMatches[0].awayTeam.name}
                        </p>
                      )}
                      <div className="space-y-2">
                        {tieMatches
                          .sort(
                            (a, b) =>
                              new Date(a.utcDate).getTime() -
                              new Date(b.utcDate).getTime(),
                          )
                          .map((match, legIndex) => {
                            const isFinished = match.status === "FINISHED";
                            const isTwoLegged =
                              !isGroupPhase && tieMatches.length > 1;
                            return (
                              <Link
                                key={match.id}
                                href={`/match/${code}/${match.id}`}
                                className="group flex items-center justify-between border border-[#E4E0D4] bg-white rounded-md px-4 py-3 shadow-sm hover:shadow-md hover:border-[#C4791F] transition-all"
                              >
                                <div className="flex items-center gap-2 w-2/5">
                                  <img
                                    src={match.homeTeam.crest}
                                    alt=""
                                    className="w-5 h-5 shrink-0"
                                  />
                                  <span className="text-sm truncate text-[#14201A]">
                                    {match.homeTeam.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isTwoLegged && (
                                    <span className="font-mono text-[10px] text-[#6B7A70] uppercase">
                                      Leg {legIndex + 1}
                                    </span>
                                  )}
                                  {isFinished ? (
                                    <span className="font-mono text-sm font-medium text-[#14201A]">
                                      {match.score.fullTime.home} –{" "}
                                      {match.score.fullTime.away}
                                    </span>
                                  ) : (
                                    <span className="font-mono text-xs text-[#6B7A70]">
                                      {new Date(
                                        match.utcDate,
                                      ).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 w-2/5 justify-end">
                                  <span className="text-sm truncate text-right text-[#14201A]">
                                    {match.awayTeam.name}
                                  </span>
                                  <img
                                    src={match.awayTeam.crest}
                                    alt=""
                                    className="w-5 h-5 shrink-0"
                                  />
                                </div>
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
