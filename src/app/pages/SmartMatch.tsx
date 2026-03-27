import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Building2, ChevronRight, ShieldCheck, Sparkles, Target } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { getPlayer, getSmartMatch, type SmartMatchClub } from "../../services/players";

function getScoreTone(score: number) {
  if (score >= 85) {
    return {
      bar: "bg-[#00FF9C]",
      text: "text-[#B6FFD8]",
      border: "border-[rgba(0,255,156,0.24)]",
      bg: "bg-[rgba(0,255,156,0.08)]",
    };
  }

  if (score >= 70) {
    return {
      bar: "bg-[#FFB800]",
      text: "text-[#F8D98B]",
      border: "border-[rgba(255,184,0,0.24)]",
      bg: "bg-[rgba(255,184,0,0.08)]",
    };
  }

  return {
    bar: "bg-[#FF4D4F]",
    text: "text-[#FFB4B5]",
    border: "border-[rgba(255,77,79,0.24)]",
    bg: "bg-[rgba(255,77,79,0.08)]",
  };
}

function MatchBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

export default function SmartMatch() {
  const navigate = useNavigate();
  const { playerId } = useParams<{ playerId: string }>();
  const [playerName, setPlayerName] = useState<string>("");
  const [clubs, setClubs] = useState<SmartMatchClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSmartMatch() {
      if (!playerId) {
        setError("Jogador nao encontrado para Smart Match.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [playerResponse, smartMatchResponse] = await Promise.all([getPlayer(playerId), getSmartMatch(playerId)]);
        if (!active) {
          return;
        }

        setPlayerName(playerResponse.data?.name ?? "Jogador");
        setClubs(Array.isArray(smartMatchResponse.data?.clubs) ? smartMatchResponse.data.clubs : []);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o Smart Match.");
        setClubs([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSmartMatch();

    return () => {
      active = false;
    };
  }, [playerId]);

  const bestMatch = useMemo(() => clubs[0] ?? null, [clubs]);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-[1480px] space-y-6">
              <Skeleton className="h-44 rounded-[28px] bg-white/10" />
              <div className="grid gap-5 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-64 rounded-[24px] bg-white/10" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[#07142A]">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-xl rounded-[22px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] p-8 text-center text-[#FFB4B5]">
              {error}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1480px] space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
              <div className="absolute -right-16 top-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.18),transparent_68%)] blur-2xl" />
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-5 h-10 rounded-[12px] px-0 text-gray-400 hover:bg-transparent hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">
                <Sparkles className="h-3.5 w-3.5" />
                Smart Match
              </div>
              <h1 className="mt-4 text-4xl font-semibold text-white">Melhores destinos para {playerName}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-400">
                Esta leitura usa o ScoutReport como base de decisao e transforma o score em recomendacoes de encaixe para clubes monitorados.
              </p>

              {bestMatch ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[22px] border border-[rgba(0,255,156,0.22)] bg-[rgba(0,255,156,0.08)] p-5">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#9CFFD1]">Best Match</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-[#9CFFD1]" />
                      <h2 className="text-2xl font-semibold text-white">{bestMatch.club}</h2>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-200">{bestMatch.reason}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/8 bg-white/5 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Fit Score</p>
                        <p className="mt-2 text-4xl font-semibold text-white">{bestMatch.fitScore}</p>
                      </div>
                      <Target className="h-8 w-8 text-[#00C2FF]" />
                    </div>
                    <div className="mt-5">
                      <MatchBar value={bestMatch.fitScore} color="#00C2FF" />
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            {clubs.length === 0 ? (
              <div className="rounded-[24px] border border-white/8 bg-white/5 px-8 py-16 text-center text-sm text-gray-400 backdrop-blur-sm">
                Nenhum encaixe de Smart Match foi encontrado para este jogador.
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-3">
                {clubs.map((club) => {
                  const tone = getScoreTone(club.fitScore);

                  return (
                    <article
                      key={`${club.club}-${club.league ?? "league"}`}
                      className={`rounded-[24px] border ${tone.border} ${tone.bg} p-6 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400">Clube recomendado</p>
                          <h2 className="mt-3 text-2xl font-semibold text-white">{club.club}</h2>
                          <p className="mt-2 text-sm text-gray-300">{club.league ?? "Liga nao informada"}</p>
                        </div>
                        <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${tone.border} ${tone.text}`}>
                          {club.fitScore}
                        </div>
                      </div>

                      <div className="mt-5">
                        <MatchBar
                          value={club.fitScore}
                          color={club.fitScore >= 85 ? "#00FF9C" : club.fitScore >= 70 ? "#FFB800" : "#FF4D4F"}
                        />
                      </div>

                      <p className="mt-5 text-sm leading-relaxed text-gray-200">{club.reason}</p>

                      <div className="mt-6 grid gap-3">
                        {[
                          { label: "Overall fit", value: club.breakdown.overall },
                          { label: "Risk fit", value: club.breakdown.risk },
                          { label: "Financial fit", value: club.breakdown.financial },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                              <span>{item.label}</span>
                              <span>{item.value}</span>
                            </div>
                            <MatchBar value={item.value} color="#00C2FF" />
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#9BE7FF]">
                        <ShieldCheck className="h-4 w-4" />
                        Prioridade de encaixe para decisao executiva
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
