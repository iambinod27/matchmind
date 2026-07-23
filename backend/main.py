from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import os
from dotenv import load_dotenv
import httpx
import time

load_dotenv()

FOOTBALL_API_BASE = "https://api.football-data.org/v4"
FOOTBALL_API_KEY = os.getenv("FOOTBALL_DATA_API_KEY")
CACHE_TTL = 300  # 5 minutes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class MatchAnalysisRequest(BaseModel):
    team_a: str
    team_b: str
    score: str
    summary: str


@app.get("/health")
def health():
    return {"status": "ok"}


_matches_cache: dict[str, tuple[float, dict]] = {}

@app.get("/matches/{competition_code}")
async def get_matches(competition_code: str, status: str | None = None):
    cache_key = f"{competition_code}:{status}"
    now = time.time()

    if cache_key in _matches_cache:
        cached_time, cached_data = _matches_cache[cache_key]
        if now - cached_time < CACHE_TTL:
            return cached_data

    async with httpx.AsyncClient(timeout=10.0) as client_http:
        params = {"status": status} if status else {}
        resp = await client_http.get(
            f"{FOOTBALL_API_BASE}/competitions/{competition_code}/matches",
            headers={"X-Auth-Token": FOOTBALL_API_KEY},
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    _matches_cache[cache_key] = (now, data)
    return data


@app.post("/analyze/{competition_code}/{match_id}")
async def analyze_real_match(competition_code: str, match_id: int):
    async with httpx.AsyncClient(timeout=10.0) as client_http:
        resp = await client_http.get(
            f"{FOOTBALL_API_BASE}/matches/{match_id}",
            headers={"X-Auth-Token": FOOTBALL_API_KEY},
        )
        resp.raise_for_status()
        match = resp.json()

    team_a = match["homeTeam"]["name"]
    team_b = match["awayTeam"]["name"]
    score = f"{match['score']['fullTime']['home']} - {match['score']['fullTime']['away']}"

    prompt = f"""You are a football Analyst. Give a short tactical summary.
Match: {team_a} vs {team_b}
Final score: {score}
Competition: {match['competition']['name']}
MatchDay: {match.get('matchday')}

Give 3 punchy sentences, pundit style."""

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt,
    )

    return {"team_a": team_a, "team_b": team_b, "score": score, "analysis": response.text}


@app.get("/predict/{competition_code}/{match_id}")
async def predict_match(competition_code: str, match_id: int):
    async with httpx.AsyncClient(timeout=10.0) as client_http:
        match_resp = await client_http.get(
            f"{FOOTBALL_API_BASE}/matches/{match_id}",
            headers={"X-Auth-Token": FOOTBALL_API_KEY},
        )
        match_resp.raise_for_status()
        match = match_resp.json()

        home_id = match["homeTeam"]["id"]
        away_id = match["awayTeam"]["id"]

        home_form_resp = await client_http.get(
            f"{FOOTBALL_API_BASE}/teams/{home_id}/matches",
            headers={"X-Auth-Token": FOOTBALL_API_KEY},
            params={"status": "FINISHED", "limit": 5},
        )

        away_form_resp = await client_http.get(
            f"{FOOTBALL_API_BASE}/teams/{away_id}/matches",
            headers={"X-Auth-Token": FOOTBALL_API_KEY},
            params={"status": "FINISHED", "limit": 5},
        )

        home_form = home_form_resp.json().get("matches", [])
        away_form = away_form_resp.json().get("matches", [])

    def summarize_form(team_id: int, matches: list) -> str:
        results = []
        valid_matches = [
            m for m in matches
            if m["score"]["fullTime"]["home"] is not None
            and m["score"]["fullTime"]["away"] is not None
        ]
        for m in valid_matches[-5:]:
            home_goals = m["score"]["fullTime"]["home"]
            away_goals = m["score"]["fullTime"]["away"]
            is_home = m["homeTeam"]["id"] == team_id
            opponent = m["awayTeam"]["name"] if is_home else m["homeTeam"]["name"]
            gf = home_goals if is_home else away_goals
            ga = away_goals if is_home else home_goals
            result = "W" if gf > ga else "L" if gf < ga else "D"
            results.append(f"{result} ({gf}-{ga} vs {opponent})")
        return ", ".join(results) if results else "No recent finished matches"

    team_a = match["homeTeam"]["name"]
    team_b = match["awayTeam"]["name"]
    home_form_str = summarize_form(home_id, home_form)
    away_form_str = summarize_form(away_id, away_form)

    prompt = f"""You are a football analyst making a prediction.

Upcoming match: {team_a} (home) vs {team_b} (away)
Competition: {match['competition']['name']}

{team_a} last 5 results: {home_form_str}
{team_b} last 5 results: {away_form_str}

Predict the outcome. Respond in plain text only, no markdown, no asterisks, no bold formatting.

Format exactly like this:
Predicted scoreline: [score]
Confidence: [low/medium/high]
Reasoning: [two sentences of pundit-style reasoning based on the form shown]"""

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt,
    )

    return {
        "team_a": team_a,
        "team_b": team_b,
        "home_form": home_form_str,
        "away_form": away_form_str,
        "prediction": response.text,
    }


_competitions_cache = None

@app.get("/competitions")
async def get_competitions():
    global _competitions_cache
    if _competitions_cache is not None:
        return _competitions_cache

    async with httpx.AsyncClient(timeout=10.0) as client_http:
        resp = await client_http.get(
            f"{FOOTBALL_API_BASE}/competitions",
            headers={"X-Auth-Token": FOOTBALL_API_KEY},
        )
        resp.raise_for_status()
        data = resp.json()

    result = [
        {"code": c["code"], "name": c["name"], "emblem": c["emblem"]}
        for c in data["competitions"]
        if c["code"] in {"PL", "PD", "BL1", "SA", "FL1", "CL", "WC", "ELC", "DED", "PPL", "BSA", "EC"}
    ]
    _competitions_cache = result
    return result


_standings_cache: dict[str, tuple[float, dict]] = {}

@app.get("/standings/{competition_code}")
async def get_standings(competition_code: str):
    now = time.time()
    if competition_code in _standings_cache:
        cached_time, cached_data = _standings_cache[competition_code]
        if now - cached_time < CACHE_TTL:
            return cached_data

    async with httpx.AsyncClient(timeout=10.0) as client_http:
        resp = await client_http.get(
            f"{FOOTBALL_API_BASE}/competitions/{competition_code}/standings",
            headers={"X-Auth-Token": FOOTBALL_API_KEY},
        )
        resp.raise_for_status()
        data = resp.json()

    _standings_cache[competition_code] = (now, data)
    return data