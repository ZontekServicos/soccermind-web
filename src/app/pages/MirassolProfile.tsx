import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Card } from "../components/ui/card";
import { getTeamProfile, type TeamProfile, type TeamSquadPlayer } from "../services/team";

// ---------------------------------------------------------------------------
// Mirassol brand constants
// ---------------------------------------------------------------------------
const MIRASSOL_RED   = "#CC0000";
const MIRASSOL_BLACK = "#1A1A1A";
const MIRASSOL_NAME  = "Mirassol";

const SPORTMONKS_PLACEHOLDER = "placeholder.png";

// ---------------------------------------------------------------------------
// Position normaliser — maps Sportmonks English positions to display labels
// ---------------------------------------------------------------------------
const POSITION_LABEL: Record<string, string> = {
  Goalkeeper:  "GK",
  Defender:    "DEF",
  Midfielder:  "MID",
  Attacker:    "FWD",
};

function shortPosition(positions: string[]): string {
  const raw = positions[0] ?? "Unknown";
  return POSITION_LABEL[raw] ?? raw.slice(0, 3).toUpperCase();
}

// ---------------------------------------------------------------------------
// Overall color
// ---------------------------------------------------------------------------
function overallColor(v: number | null): string {
  if (!v) return "text-gray-500";
  if (v >= 75) return "text-[#00FF9C]";
  if (v >= 65) return "text-[#00C2FF]";
  if (v >= 55) return "text-[#FBBF24]";
  return "text-gray-400";
}

// ---------------------------------------------------------------------------
// DNA bar
// ---------------------------------------------------------------------------
function DnaBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-right text-xs text-gray-400">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF6B6B]"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-xs font-bold text-white">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player avatar
// ---------------------------------------------------------------------------
function PlayerAvatar({ name, imageUrl, size = 48 }: { name: string; imageUrl: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hasReal  = !!imageUrl && !imageUrl.includes(SPORTMONKS_PLACEHOLDER);
  const px       = `${size}px`;

  if (hasReal) {
    return (
      <div
        className="overflow-hidden rounded-full ring-2 ring-[rgba(204,0,0,0.5)] flex-shrink-0"
        style={{ width: px, height: px }}
      >
        <img
          src={imageUrl!}
          alt={name}
          className="h-full w-full object-cover object-top"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = "none";
            const parent = el.parentElement;
            if (parent) {
              parent.innerHTML = `<div style="width:${px};height:${px}" class="flex items-center justify-center rounded-full bg-gradient-to-br from-[#CC0000] to-[#1A1A1A] text-white font-bold text-sm">${initials}</div>`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#CC0000] to-[#1A1A1A] font-bold text-white text-sm"
      style={{ width: px, height: px }}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attribute mini bar
// ---------------------------------------------------------------------------
function AttrBar({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0;
  return (
    <div className="text-center">
      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-bold text-white">{v || "—"}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player row
// ---------------------------------------------------------------------------
function PlayerRow({ player, rank }: { player: TeamSquadPlayer; rank: number }) {
  return (
    <Link
      to={`/players/${player.id}`}
      className="flex items-center gap-3 p-3 rounded-[12px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(204,0,0,0.06)] hover:border-[rgba(204,0,0,0.3)] transition-all group"
    >
      {/* Rank */}
      <span className="w-6 text-center text-xs text-gray-600 font-mono">{rank}</span>

      {/* Avatar */}
      <PlayerAvatar name={player.name} imageUrl={player.image} size={40} />

      {/* Name + position */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white group-hover:text-[#FF6B6B] transition-colors truncate">
          {player.name}
        </p>
        <p className="text-[11px] text-gray-500">{player.nationality} · {player.age} anos</p>
      </div>

      {/* Position badge */}
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(204,0,0,0.15)] text-[#FF9999]">
        {shortPosition(player.positions)}
      </span>

      {/* Attributes */}
      <div className="hidden lg:flex gap-4">
        <AttrBar label="PAC" value={player.attributes.pace} />
        <AttrBar label="SHO" value={player.attributes.shooting} />
        <AttrBar label="PAS" value={player.attributes.passing} />
        <AttrBar label="DRI" value={player.attributes.dribbling} />
        <AttrBar label="DEF" value={player.attributes.defending} />
        <AttrBar label="PHY" value={player.attributes.physical} />
      </div>

      {/* Overall */}
      <div className="w-12 text-center">
        <span className={`text-xl font-black ${overallColor(player.overall)}`}>
          {player.overall ?? "—"}
        </span>
      </div>

      {/* Potential */}
      <div className="w-10 text-center hidden sm:block">
        <span className="text-xs text-gray-500">{player.potential ?? "—"}</span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({ label, value, accent = "#CC0000" }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] p-4 text-center">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{label}</p>
      <p className="text-3xl font-black" style={{ color: accent }}>{value}</p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function MirassolProfile() {
  const [data, setData] = useState<TeamProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTeamProfile(MIRASSOL_NAME)
      .then((res) => setData(res.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">

          {/* ── Hero banner ─────────────────────────────────────────────────── */}
          <div
            className="relative px-8 py-10 border-b border-[rgba(255,255,255,0.06)]"
            style={{
              background: `linear-gradient(135deg, ${MIRASSOL_BLACK} 0%, #0D0D0D 40%, #140000 100%)`,
            }}
          >
            {/* Red glow top-left */}
            <div
              className="absolute top-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-20"
              style={{ background: MIRASSOL_RED }}
            />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 max-w-[1400px] mx-auto">
              {/* Club logo */}
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[rgba(204,0,0,0.5)] bg-white flex items-center justify-center shadow-[0_0_40px_rgba(204,0,0,0.35)] flex-shrink-0">
                {data?.team.logoPath ? (
                  <img
                    src={data.team.logoPath}
                    alt="Mirassol FC"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="text-4xl font-black text-[#CC0000]">M</span>
                )}
              </div>

              <div className="text-center sm:text-left">
                <p className="text-xs uppercase tracking-[0.3em] text-[#FF9999] mb-1">
                  Clube Parceiro · Série A 2026
                </p>
                <h1 className="text-5xl font-black text-white mb-2">
                  Mirassol FC
                </h1>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-gray-400">
                  {data && (
                    <>
                      <span>{data.stats.totalPlayers} jogadores</span>
                      <span>·</span>
                      <span>OVR médio <strong className="text-white">{data.stats.avgOverall}</strong></span>
                      <span>·</span>
                      <span>POT médio <strong className="text-white">{data.stats.avgPotential}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Body ─────────────────────────────────────────────────────────── */}
          <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">

            {loading && (
              <div className="flex items-center justify-center py-24 text-gray-400">
                Carregando elenco...
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-24 text-red-400">
                {error}
              </div>
            )}

            {data && (
              <>
                {/* Squad overview KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="OVR Médio"   value={data.stats.avgOverall}   accent={MIRASSOL_RED} />
                  <StatCard label="Potencial"   value={data.stats.avgPotential} accent="#FF6B6B" />
                  <StatCard label="Pace"        value={data.stats.avgPace}       accent="#FF9999" />
                  <StatCard label="Passe"       value={data.stats.avgPassing}    accent="#FF9999" />
                  <StatCard label="Defesa"      value={data.stats.avgDefending}  accent="#FF9999" />
                  <StatCard label="Físico"      value={data.stats.avgPhysical}   accent="#FF9999" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* ── DNA Squad Average ─────────────────────────────────── */}
                  <Card className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.07)] p-6">
                    <h3 className="text-xs uppercase tracking-widest text-[#FF9999] mb-1">DNA do Elenco</h3>
                    <p className="text-sm text-gray-500 mb-5">Perfil médio das 5 dimensões SoccerMind</p>
                    <div className="space-y-3">
                      <DnaBar label="Impacto"     value={data.stats.dnaAvg.impact} />
                      <DnaBar label="Inteligência" value={data.stats.dnaAvg.intelligence} />
                      <DnaBar label="Def. IQ"     value={data.stats.dnaAvg.defensiveIQ} />
                      <DnaBar label="Consistência" value={data.stats.dnaAvg.consistency} />
                      <DnaBar label="Potencial"   value={data.stats.dnaAvg.potential} />
                    </div>
                  </Card>

                  {/* ── Position distribution ─────────────────────────────── */}
                  <Card className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.07)] p-6">
                    <h3 className="text-xs uppercase tracking-widest text-[#FF9999] mb-1">Distribuição por Posição</h3>
                    <p className="text-sm text-gray-500 mb-5">Quantidade e OVR médio por setor</p>
                    <div className="space-y-2">
                      {data.stats.positionDistribution.map((pos) => (
                        <div key={pos.position} className="flex items-center gap-3">
                          <span className="w-28 text-xs text-gray-400 truncate">{pos.position}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                background: MIRASSOL_RED,
                                width: `${Math.min(100, (pos.count / data.stats.totalPlayers) * 100 * 3)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-6 text-right">{pos.count}</span>
                          {pos.avgOverall !== null && (
                            <span className={`text-xs font-bold w-8 text-right ${overallColor(pos.avgOverall)}`}>
                              {pos.avgOverall}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* ── Top 5 players ─────────────────────────────────────── */}
                  <Card className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.07)] p-6">
                    <h3 className="text-xs uppercase tracking-widest text-[#FF9999] mb-1">Top Performers</h3>
                    <p className="text-sm text-gray-500 mb-5">5 jogadores com maior OVR</p>
                    <div className="space-y-3">
                      {data.squad
                        .filter((p) => p.overall !== null)
                        .slice(0, 5)
                        .map((p, i) => (
                          <Link
                            key={p.id}
                            to={`/players/${p.id}`}
                            className="flex items-center gap-3 group"
                          >
                            <span className="text-xs text-gray-600 font-mono w-4">{i + 1}</span>
                            <PlayerAvatar name={p.name} imageUrl={p.image} size={32} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white group-hover:text-[#FF6B6B] transition-colors truncate">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-gray-600">{shortPosition(p.positions)}</p>
                            </div>
                            <span className={`text-lg font-black ${overallColor(p.overall)}`}>
                              {p.overall}
                            </span>
                          </Link>
                        ))}
                    </div>
                  </Card>
                </div>

                {/* ── Full squad list ───────────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Elenco Completo</h2>
                      <p className="text-sm text-gray-500">
                        {data.stats.scoredPlayers} de {data.stats.totalPlayers} com overall calculado
                      </p>
                    </div>
                    {/* Legend */}
                    <div className="hidden sm:flex gap-4 text-[10px] text-gray-600 uppercase tracking-widest">
                      <span className="w-6 text-center">#</span>
                      <span className="w-10" />
                      <span className="flex-1">Nome</span>
                      <span>POS</span>
                      <span className="hidden lg:flex gap-4">
                        <span className="w-8 text-center">PAC</span>
                        <span className="w-8 text-center">SHO</span>
                        <span className="w-8 text-center">PAS</span>
                        <span className="w-8 text-center">DRI</span>
                        <span className="w-8 text-center">DEF</span>
                        <span className="w-8 text-center">PHY</span>
                      </span>
                      <span className="w-12 text-center">OVR</span>
                      <span className="w-10 text-center hidden sm:block">POT</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {data.squad.map((player, i) => (
                      <PlayerRow key={player.id} player={player} rank={i + 1} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
