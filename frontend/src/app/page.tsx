"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCompetitions, League } from "@/lib/api";

export default function Home() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompetitions()
      .then(setLeagues)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen max-w-3/4 mx-auto px-6 py-16 sm:py-24">
      <div className="mb-12">
        <p className="font-mono text-xs tracking-widest text-[#8FA396] uppercase mb-3">
          Matchday Intelligence
        </p>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight">
          MatchMind
        </h1>
        <p className="text-[#8FA396] mt-3 max-w-md">
          AI-read form, results, and predictions across the world's top
          competitions.
        </p>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-[#8FA396]">
          Loading competitions…
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {leagues.map((league) => (
            <Link
              key={league.code}
              href={`/league/${league.code}`}
              className="group relative border border-[#E4E0D4] bg-white rounded-md p-5 flex flex-col items-start gap-3 shadow-sm hover:shadow-md hover:border-[#C4791F] transition-all"
            >
              <img
                src={league.emblem}
                alt=""
                className="w-9 h-9 object-contain"
              />
              <span className="font-display text-lg leading-tight text-[#14201A]">
                {league.name}
              </span>
              <span className="font-mono text-[10px] text-[#6B7A70] tracking-wider uppercase group-hover:text-[#C4791F] transition-colors">
                View fixtures →
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
