"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getMatches, getCompetitions, Match, League } from "@/lib/api";

export default function LeaguePage() {
  const params = useParams();
  const code = params.code as string;

  const [league, setLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMatches(code),
      getCompetitions().then((leagues) => leagues.find((l) => l.code === code) ?? null),
    ])
      .then(([matchData, leagueData]) => {
        setMatches(matchData);
        setLeague(leagueData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  const groupedByMatchday = matches.reduce<Record<number, Match[]>>(
    (acc, match) => {
      const day = match.matchday;
      if (!acc[day]) acc[day] = [];
      acc[day].push(match);
      return acc;
    },
    {},
  );

  const matchdays = Object.keys(groupedByMatchday)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="font-mono text-xs text-[#6B7A70] hover:text-[#C4791F] transition-colors uppercase tracking-wider"
      >
        ← All competitions
      </Link>

      <h1 className="font-display text-4xl font-semibold mt-4 mb-10 flex items-center gap-3 text-[#14201A]">
        {league?.emblem && (
          <img src={league.emblem} alt="" className="w-9 h-9 object-contain" />
        )}
        <span>{league?.name ?? code}</span>
      </h1>

      {loading ? (
        <p className="font-mono text-sm text-[#6B7A70]">Loading fixtures…</p>
      ) : matchdays.length === 0 ? (
        <p className="font-mono text-sm text-[#6B7A70]">No matches found.</p>
      ) : (
        <div className="space-y-10">
          {matchdays.map((day) => (
            <section key={day}>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-xs text-[#C4791F] tracking-widest uppercase">
                  Matchday {day}
                </span>
                <span className="flex-1 h-px bg-[#E4E0D4]" />
              </div>

              <div className="space-y-2">
                {groupedByMatchday[day]?.map((match) => {
                  const isFinished = match.status === "FINISHED";
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

                      {isFinished ? (
                        <span className="font-mono text-sm font-medium text-[#14201A]">
                          {match.score.fullTime.home} –{" "}
                          {match.score.fullTime.away}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-[#6B7A70]">
                          {new Date(match.utcDate).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
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
            </section>
          ))}
        </div>
      )}
    </main>
  );
}