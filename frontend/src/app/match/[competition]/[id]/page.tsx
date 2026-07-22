"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { predictMatch, PredictionResponse, Match } from "@/lib/api";
import Link from "next/link";

interface AnalysisResponse {
  team_a: string;
  team_b: string;
  score: string;
  analysis: string;
}

function FormGuide({ form }: { form: string }) {
  const results = form.split(", ").map((entry) => entry.charAt(0));
  const colors: Record<string, string> = {
    W: "bg-[#2F8F4E] text-white",
    D: "bg-[#E8B93D] text-[#14201A]",
    L: "bg-[#D64545] text-white",
  };
  return (
    <div className="flex gap-1.5">
      {results.map((r, i) => (
        <span
          key={i}
          className={`font-mono text-xs w-6 h-6 flex items-center justify-center rounded ${colors[r] ?? colors.D}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

export default function MatchDetail() {
  const params = useParams();
  const competition = params.competition as string;
  const id = Number(params.id);

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [recap, setRecap] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setPrediction(null);
    setRecap(null);

    fetch(`http://localhost:8000/matches/${competition}`)
      .then((r) => r.json())
      .then((data) => {
        const match = data.matches.find((m: Match) => m.id === id);

        if (match?.status === "FINISHED") {
          return fetch(`http://localhost:8000/analyze/${competition}/${id}`, {
            method: "POST",
          })
            .then((r) => r.json())
            .then(setRecap);
        } else {
          return predictMatch(competition, id).then(setPrediction);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false)); // ← this was missing
  }, [competition, id]);

  if (loading) {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-6 py-16 sm:py-24">
        <p className="font-mono text-sm text-[#6B7A70]">Loading…</p>
      </main>
    );
  }

  if (error || (!prediction && !recap)) {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-6 py-16 sm:py-24">
        <p className="font-mono text-sm text-[#D64545]">
          Couldn't load match details.
        </p>
      </main>
    );
  }

  if (recap) {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#14201A] border border-[#E4E0D4] bg-white rounded-md px-3 py-1.5 hover:border-[#C4791F] hover:text-[#C4791F] transition-colors"
        >
          ← All competitions
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-4 mb-2 text-[#14201A]">
          {recap.team_a} vs {recap.team_b}
        </h1>
        <p className="font-mono text-xl font-medium mb-6 text-[#14201A]">
          {recap.score}
        </p>
        <div className="border-t border-[#E4E0D4] pt-5">
          <h2 className="font-mono text-xs text-[#C4791F] uppercase tracking-widest mb-3">
            Recap
          </h2>
          <p className="text-lg font-display leading-relaxed whitespace-pre-line text-[#14201A]">
            {recap.analysis}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#14201A] border border-[#E4E0D4] bg-white rounded-md px-3 py-1.5 hover:border-[#C4791F] hover:text-[#C4791F] transition-colors"
      >
        ← All competitions
      </Link>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-4 mb-8 text-[#14201A]">
        {prediction!.team_a} vs {prediction!.team_b}
      </h1>

      <div className="space-y-6">
        <div>
          <h2 className="font-mono text-xs text-[#6B7A70] uppercase tracking-widest mb-2">
            {prediction!.team_a} — last 5
          </h2>
          <FormGuide form={prediction!.home_form} />
        </div>

        <div>
          <h2 className="font-mono text-xs text-[#6B7A70] uppercase tracking-widest mb-2">
            {prediction!.team_b} — last 5
          </h2>
          <FormGuide form={prediction!.away_form} />
        </div>

        <div className="border-t border-[#E4E0D4] pt-5">
          <h2 className="font-mono text-xs text-[#C4791F] uppercase tracking-widest mb-3">
            Prediction
          </h2>
          <p className="text-lg font-display leading-relaxed whitespace-pre-line text-[#14201A]">
            {prediction!.prediction}
          </p>
        </div>
      </div>
    </main>
  );
}
