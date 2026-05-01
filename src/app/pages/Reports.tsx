import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { useAuth } from "../contexts/AuthContext";
import { EMPTY_PLAYER, type PlayerExtended } from "../types/player";
import { downloadExecutiveReportPdf } from "../utils/executiveReportPdf";
import type { ExecutiveReportMetric } from "../utils/executiveReport";
import {
  type CompareViewModel,
  getExecutiveReportData,
  getReportShortlist,
  type ExecutiveReportModel,
} from "../services/reports";
import { createReportAnalysis, type AnalysisViewModel } from "../services/analysis";

function money(value: number | null) {
  if (value === null || value === 0) return "N/A";
  if (value >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `EUR ${(value / 1_000).toFixed(0)}K`;
  return `EUR ${value.toFixed(0)}`;
}

function dedupePlayers(players: PlayerExtended[]) {
  const seen = new Set<string>();
  return players.filter((player) => {
    if (!player.id || seen.has(player.id)) return false;
    seen.add(player.id);
    return true;
  });
}

// ─── Player Combobox ─────────────────────────────────────────────────────────

function PlayerCombobox({
  label,
  value,
  players,
  variant,
  onChange,
  onSearch,
}: {
  label: string;
  value: string;
  players: PlayerExtended[];
  variant: "A" | "B";
  onChange: (player: PlayerExtended) => void;
  onSearch?: (q: string) => Promise<PlayerExtended[]>;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerExtended[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = inputValue.trim();
    if (!q || q.length < 2 || !onSearch) { setSearchResults(null); return; }
    const id = window.setTimeout(() => {
      setSearching(true);
      onSearch(q)
        .then((r) => setSearchResults(r))
        .catch(() => setSearchResults(null))
        .finally(() => setSearching(false));
    }, 300);
    return () => window.clearTimeout(id);
  }, [inputValue, onSearch]);

  useEffect(() => { if (!open) { setInputValue(""); setSearchResults(null); } }, [open]);

  const displayPlayers = searchResults ?? (
    inputValue.trim()
      ? players.filter((p) => `${p.name} ${p.club} ${p.position} ${p.nationality}`.toLowerCase().includes(inputValue.toLowerCase()))
      : players
  );

  const accent = variant === "A" ? "#38BDF8" : "#C084FC";
  const accentBg = variant === "A" ? "rgba(56,189,248,0.08)" : "rgba(192,132,252,0.08)";
  const accentBorder = variant === "A" ? "rgba(56,189,248,0.28)" : "rgba(192,132,252,0.28)";
  const labelColor = variant === "A" ? "text-[#9BE7FF]" : "text-[#D8B4FE]";
  const selected = players.find((p) => p.id === value) ?? searchResults?.find((p) => p.id === value);

  const tierColors: Record<string, string> = {
    ELITE: "#FFD700", A: "#C8C8DC", B: "#CD7F32", C: "#7A9CC8", DEVELOPMENT: "#6EE7B7",
  };

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between gap-3">
        <label className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] ${labelColor}`}>
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: accent }} />
          {label}
        </label>
        <span className="text-[11px] text-gray-600">
          {variant === "A" ? "Candidato principal" : "Benchmark alternativo"}
        </span>
      </div>

      {/* Combobox trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex h-14 w-full items-center justify-between gap-3 rounded-[14px] border px-4 text-left backdrop-blur-sm transition-all"
            style={{
              borderColor: open ? accent : accentBorder,
              background: open ? accentBg : "rgba(255,255,255,0.02)",
              boxShadow: open ? `0 0 0 3px ${accent}20` : undefined,
            }}
          >
            {selected ? (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-black"
                  style={{ background: `${accent}18`, color: accent, border: `1.5px solid ${accent}50` }}
                >
                  {selected.overallRating > 0 ? selected.overallRating : "–"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{selected.name}</p>
                  <p className="truncate text-xs text-gray-400">{selected.position} · {selected.club}</p>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Buscar jogador por nome, clube ou posição…</span>
            )}
            <ChevronDown
              className="h-4 w-4 flex-shrink-0 text-gray-500 transition-transform"
              style={{ transform: open ? "rotate(180deg)" : undefined }}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          style={{ width: "var(--radix-popover-trigger-width)", border: `1px solid ${accent}40`, background: "#0A1B35" }}
          align="start"
        >
          <Command shouldFilter={false} className="bg-transparent">
            <CommandInput
              placeholder="Nome, clube ou posição…"
              value={inputValue}
              onValueChange={setInputValue}
              className="border-b text-white placeholder:text-gray-500"
              style={{ borderColor: `${accent}25` }}
            />
            <CommandList className="max-h-[320px]">
              {searching && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-500">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-gray-600 border-t-gray-300" />
                  Buscando…
                </div>
              )}
              {!searching && displayPlayers.length === 0 && (
                <CommandEmpty className="py-8 text-center text-sm text-gray-500">
                  Nenhum jogador encontrado.
                </CommandEmpty>
              )}
              <CommandGroup>
                {displayPlayers.map((player) => {
                  const isSelected = player.id === value;
                  const tierColor = tierColors[player.tier] ?? "#7A9CC8";
                  return (
                    <CommandItem
                      key={player.id}
                      value={`${player.name} ${player.club} ${player.position} ${player.nationality}`}
                      onSelect={() => { onChange(player); setOpen(false); }}
                      className="cursor-pointer rounded-[10px] px-3 py-2.5 aria-selected:bg-[rgba(255,255,255,0.06)]"
                    >
                      <div
                        className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-black"
                        style={{ background: `${accent}14`, color: isSelected ? accent : "#9CA3AF", border: `1.5px solid ${isSelected ? accent : "rgba(255,255,255,0.1)"}50` }}
                      >
                        {player.overallRating > 0 ? player.overallRating : "–"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${isSelected ? "text-white" : "text-gray-200"}`}>{player.name}</p>
                        <p className="truncate text-[11px] text-gray-500">{player.position} · {player.club}</p>
                        <p className="truncate text-[10px] text-gray-600">ID: {player.id}</p>
                      </div>
                      <span
                        className="mr-2 flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ color: tierColor, borderColor: `${tierColor}44`, background: `${tierColor}12` }}
                      >
                        {player.tier}
                      </span>
                      {isSelected && <Check className="h-4 w-4 flex-shrink-0" style={{ color: accent }} />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected player info card */}
      {selected && (
        <div
          className="flex items-center gap-3 rounded-[14px] px-3 py-3 transition-all"
          style={{ border: `1px solid ${accent}20`, background: `${accent}05` }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black"
            style={{ background: `${accent}18`, color: accent, border: `2px solid ${accent}45` }}
          >
            {selected.overallRating > 0 ? selected.overallRating : "–"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{selected.name}</p>
            <p className="truncate text-xs text-gray-400">
              {selected.position} · {selected.club}
              {selected.age > 0 ? ` · ${selected.age} anos` : ""}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-gray-500">POT</p>
            <p className="text-sm font-bold" style={{ color: accent }}>
              {selected.potential > 0 ? selected.potential : "–"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Metric row ───────────────────────────────────────────────────────────────

function MetricRow({ metric, nameA, nameB }: { metric: ExecutiveReportMetric; nameA: string; nameB: string }) {
  const maxVal = Math.max(metric.a, metric.b, 1);
  const wA = Math.max(6, Math.round((metric.a / maxVal) * 100));
  const wB = Math.max(6, Math.round((metric.b / maxVal) * 100));
  const fmt = metric.format === "currency" ? money : (v: number) => v.toFixed(metric.format === "decimal" ? 1 : 0);

  const winnerColor = metric.winner === "A" ? "text-[#38BDF8]" : metric.winner === "B" ? "text-[#C084FC]" : "text-gray-300";
  const winnerBadgeBg = metric.winner === "A"
    ? "border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.08)] text-[#38BDF8]"
    : metric.winner === "B"
    ? "border-[rgba(192,132,252,0.3)] bg-[rgba(192,132,252,0.08)] text-[#C084FC]"
    : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-gray-300";

  return (
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,20,42,0.6)] px-4 py-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-300">{metric.label}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${winnerBadgeBg}`}>
          {metric.winner === "DRAW" ? "Empate" : metric.winner === "A" ? nameA : nameB}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2">
        <div>
          <p className={`mb-1 text-base font-bold ${metric.winner === "A" ? "text-[#38BDF8]" : "text-white"}`}>{fmt(metric.a)}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#0EA5E9,#38BDF8)]" style={{ width: `${wA}%` }} />
          </div>
        </div>
        <span className="text-center text-[9px] uppercase tracking-widest text-gray-600">vs</span>
        <div>
          <p className={`mb-1 text-right text-base font-bold ${metric.winner === "B" ? "text-[#C084FC]" : "text-white"}`}>{fmt(metric.b)}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div className="ml-auto h-full rounded-full bg-[linear-gradient(90deg,#A855F7,#C084FC)]" style={{ width: `${wB}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Other helpers ────────────────────────────────────────────────────────────

function MetricHeroCard({ label, value, caption, accent }: { label: string; value: string; caption: string; accent: "cyan" | "violet" }) {
  const color = accent === "cyan" ? "text-[#9BE7FF]" : "text-[#C7B8FF]";
  const bg = accent === "cyan" ? "bg-[rgba(0,194,255,0.16)]" : "bg-[rgba(122,92,255,0.18)]";
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-5 py-4 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{caption}</p>
      <div className={`mt-4 h-1 rounded-full ${bg}`} />
    </div>
  );
}

function StatusBanner({ children, tone }: { children: ReactNode; tone: "error" | "loading" }) {
  const styles = tone === "error"
    ? "border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] text-[#FFB4B5]"
    : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-400";
  return <div className={`rounded-[16px] border px-5 py-4 text-sm ${styles}`}>{children}</div>;
}

function ReportLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6">
          <div className="h-3 w-32 rounded-full bg-white/10" />
          <div className="mt-4 h-8 w-3/4 rounded-full bg-white/10" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className={`h-3 rounded-full bg-white/10`} style={{ width: `${90 - i * 10}%` }} />)}
          </div>
        </div>
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availablePlayers, setAvailablePlayers] = useState<PlayerExtended[]>([]);
  const [playerA, setPlayerA] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [playerB, setPlayerB] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveFeedbackTone, setSaveFeedbackTone] = useState<"success" | "error" | "info">("info");
  const [comparisonData, setComparisonData] = useState<CompareViewModel | null>(null);
  const [reportModel, setReportModel] = useState<ExecutiveReportModel | null>(null);
  const [savedAnalysis, setSavedAnalysis] = useState<AnalysisViewModel | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const lastPersistedSelectionRef = useRef<string>("");

  useEffect(() => {
    let active = true;
    async function load() {
      setPlayersLoading(true);
      try {
        const res = await getReportShortlist({ page: 1, limit: 80 });
        if (!active) return;
        const list = Array.isArray(res.data.players) ? res.data.players : [];
        setAvailablePlayers(list);
        setPlayersError(null);
        setReportError(list.length > 0 ? "Selecione dois jogadores para gerar o relatório executivo." : null);
      } catch (err) {
        if (!active) return;
        setAvailablePlayers([]);
        setPlayersError(err instanceof Error ? err.message : "Erro ao carregar a shortlist de jogadores");
      } finally {
        if (active) setPlayersLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      if (!playerA.id || !playerB.id || playerA.id === playerB.id) {
        setComparisonData(null);
        setReportModel(null);
        setSavedAnalysis(null);
        setReportLoading(false);
        setReportError(
          !playerA.id || !playerB.id
            ? "Selecione dois jogadores para gerar o relatório executivo."
            : "Selecione dois jogadores diferentes para gerar o relatório executivo.",
        );
        return;
      }
      setReportLoading(true);
      try {
        const res = await getExecutiveReportData(playerA, playerB, {
          analyst: user?.name,
          generatedAt: new Date(),
          status: "Concluido",
        });
        if (!active) return;
        const payload = res.data ?? null;
        setComparisonData(payload?.comparisonData ?? null);
        setReportModel(payload?.reportModel ?? null);
        setReportError(null);
      } catch (err) {
        if (!active) return;
        setComparisonData(null);
        setReportModel(null);
        setSavedAnalysis(null);
        setReportError(err instanceof Error ? err.message : "Erro ao gerar o relatorio executivo");
      } finally {
        if (active) setReportLoading(false);
      }
    }
    void loadReport();
    return () => { active = false; };
  }, [playerA.id, playerB.id, user?.name]);

  const selectablePlayers = useMemo(
    () => dedupePlayers([playerA, playerB, ...availablePlayers].filter((p) => p.id && p.id !== EMPTY_PLAYER.id)),
    [availablePlayers, playerA, playerB],
  );
  const displayPlayerA = comparisonData?.playerA ?? playerA;
  const displayPlayerB = comparisonData?.playerB ?? playerB;

  async function handleExportPdf() {
    if (!reportModel || reportLoading) return;
    setExporting(true);
    try { downloadExecutiveReportPdf(reportModel); }
    finally { window.setTimeout(() => setExporting(false), 250); }
  }

  function handleOpenSavedReport() {
    if (!savedAnalysis?.id) {
      setSaveFeedbackTone("error");
      setSaveFeedback("Salve o relatório no histórico primeiro.");
      return;
    }
    navigate(`/analysis/${savedAnalysis.id}`);
  }

  async function handleSaveToHistory() {
    if (!reportModel || saveLoading) return;
    setSaveLoading(true);
    setSaveFeedback(null);
    try {
      const res = await createReportAnalysis({
        playerIds: [playerA.id, playerB.id],
        title: `Relatório Executivo - ${reportModel.subtitle}`,
        description: reportModel.recommendationSummary,
        analyst: user?.name,
      });
      lastPersistedSelectionRef.current = [playerA.id, playerB.id].sort().join(":");
      setSavedAnalysis(res.data);
      setSaveFeedbackTone("success");
      setSaveFeedback(`Salvo no histórico: "${res.data.title}"`);
    } catch (err) {
      setSaveFeedbackTone("error");
      setSaveFeedback(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaveLoading(false);
    }
  }

  const handleSearch = useCallback(
    (q: string) => getReportShortlist({ search: q, limit: 20 }).then((r) => r.data.players),
    [],
  );

  const insightColors = {
    cyan:    { border: "rgba(0,194,255,0.2)",   bg: "rgba(0,194,255,0.06)",   text: "#9BE7FF" },
    violet:  { border: "rgba(122,92,255,0.2)",  bg: "rgba(122,92,255,0.06)",  text: "#C7B8FF" },
    emerald: { border: "rgba(0,255,156,0.2)",   bg: "rgba(0,255,156,0.06)",   text: "#9CFFD1" },
  } as const;

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1600px] space-y-6">

            {/* ── Header ── */}
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.16),transparent_68%)] blur-2xl" />
              <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.16),transparent_72%)] blur-2xl" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-4xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Executive Intelligence
                  </div>
                  <h1 className="text-4xl font-semibold text-white">Relatório Executivo</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
                    Selecione dois perfis, gere o relatório comparativo e exporte em PDF com recomendação final e leitura de risco.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {reportModel ? reportModel.subtitle : `${displayPlayerA.name} vs ${displayPlayerB.name}`}
                    </span>
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {reportModel ? `Gerado em ${reportModel.generatedAtLabel}` : "Aguardando comparação"}
                    </span>
                    <span className="rounded-full border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.08)] px-3 py-1.5 text-[#9BE7FF]">
                      <Link to="/history">Central de Análises</Link>
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MetricHeroCard label="Shortlist" value={`${availablePlayers.length}`} caption="Jogadores disponíveis" accent="cyan" />
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-4 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Ações</p>
                    <div className="mt-3 grid gap-2.5">
                      <Button
                        className="h-10 rounded-[12px] border border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.14)] px-4 text-sm font-semibold text-[#B6FFD8] shadow-[0_4px_14px_rgba(0,255,156,0.14)] hover:bg-[rgba(0,255,156,0.22)] disabled:opacity-40"
                        onClick={() => void handleSaveToHistory()}
                        disabled={!reportModel || reportLoading || saveLoading || !!savedAnalysis}
                      >
                        {saveLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        {savedAnalysis ? "Salvo ✓" : "Salvar no Histórico"}
                      </Button>
                      {savedAnalysis && (
                        <Button
                          variant="ghost"
                          className="h-8 rounded-[10px] border border-[rgba(255,255,255,0.08)] text-xs text-gray-400 hover:text-gray-200"
                          onClick={handleOpenSavedReport}
                        >
                          <ExternalLink className="mr-1.5 h-3 w-3" />
                          Abrir no Histórico
                        </Button>
                      )}
                      <Button
                        className="h-10 rounded-[12px] bg-[#00C2FF]/90 px-4 text-sm font-semibold text-[#07142A] shadow-[0_4px_16px_rgba(0,194,255,0.25)] hover:bg-[#00C2FF] disabled:opacity-40"
                        onClick={() => void handleExportPdf()}
                        disabled={!reportModel || reportLoading || exporting}
                      >
                        {exporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Exportar PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Feedback ── */}
            {saveFeedback && (
              <div className={`rounded-[16px] border px-5 py-4 text-sm ${saveFeedbackTone === "success" ? "border-[rgba(0,255,156,0.18)] bg-[rgba(0,255,156,0.08)] text-[#9CFFD1]" : saveFeedbackTone === "error" ? "border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] text-[#FFB4B5]" : "border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.08)] text-[#9BE7FF]"}`}>
                {saveFeedback}
              </div>
            )}

            {/* ── Player selectors ── */}
            <section className="grid gap-6 rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.3)] xl:grid-cols-2">
              <PlayerCombobox
                label="Player A"
                value={playerA.id}
                players={selectablePlayers}
                variant="A"
                onChange={setPlayerA}
                onSearch={handleSearch}
              />
              <PlayerCombobox
                label="Player B"
                value={playerB.id}
                players={selectablePlayers}
                variant="B"
                onChange={setPlayerB}
                onSearch={handleSearch}
              />
            </section>

            {/* ── Banners ── */}
            {playersError && <StatusBanner tone="error">{playersError}</StatusBanner>}
            {reportError && <StatusBanner tone="error">{reportError}</StatusBanner>}
            {playersLoading && <StatusBanner tone="loading">Carregando shortlist para o relatório…</StatusBanner>}
            {reportLoading && <ReportLoadingSkeleton />}

            {!playersLoading && selectablePlayers.length === 0 && (
              <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-6 py-14 text-center text-sm text-gray-500">
                Nenhum jogador encontrado na shortlist. Verifique se há jogadores cadastrados no sistema.
              </div>
            )}

            {/* ── Report content ── */}
            {reportModel && !reportLoading && (
              <div className="space-y-6">

                {/* Winner hero */}
                <section className="relative overflow-hidden rounded-[28px] border border-[rgba(0,194,255,0.18)] bg-[linear-gradient(135deg,rgba(10,27,53,0.98),rgba(11,19,41,0.96))] px-7 py-7">
                  <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.15),transparent_65%)] blur-2xl" />
                  <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.10),transparent_72%)] blur-2xl" />

                  <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-2xl">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">
                        <Trophy className="h-3.5 w-3.5" />
                        Decisão Final
                      </div>
                      <h2 className="text-3xl font-semibold text-white">
                        {reportModel.recommendedPlayer?.name ?? "Resultado equivalente"}
                      </h2>
                      <p className="mt-1.5 text-sm uppercase tracking-[0.2em] text-gray-500">
                        {reportModel.recommendationLabel}
                      </p>
                      <p className="mt-4 max-w-xl text-sm leading-7 text-gray-300">
                        {reportModel.recommendationSummary}
                      </p>
                    </div>

                    {/* Status stats */}
                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 xl:w-56">
                      {[
                        { label: "Status", value: savedAnalysis?.statusLabel ?? reportModel.status, color: "#00FF9C" },
                        { label: "Recorte", value: reportModel.subtitle, color: "#00C2FF" },
                        { label: "Gerado em", value: reportModel.generatedAtLabel, color: "#7A5CFF" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                          <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500">{s.label}</p>
                          <p className="mt-1.5 text-sm font-semibold text-white">{s.value}</p>
                          <div className="mt-2 h-0.5 rounded-full" style={{ background: `${s.color}40` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Executive summary + takeaways */}
                {(reportModel.executiveSummary || reportModel.takeaways?.length > 0) && (
                  <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                    {reportModel.executiveSummary && (
                      <div className="rounded-[22px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-6">
                        <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-gray-500">Resumo Executivo</p>
                        <p className="text-sm leading-7 text-gray-300">{reportModel.executiveSummary}</p>
                      </div>
                    )}
                    {reportModel.takeaways?.length > 0 && (
                      <div className="rounded-[22px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-6">
                        <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-gray-500">Pontos-chave</p>
                        <ul className="space-y-2.5">
                          {reportModel.takeaways.map((t, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00C2FF]" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Metrics grid */}
                {reportModel.metrics?.length > 0 && (
                  <div className="rounded-[22px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-6">
                    <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-gray-500">Métricas comparativas</p>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {reportModel.metrics.slice(0, 9).map((metric) => (
                        <MetricRow
                          key={metric.label}
                          metric={metric}
                          nameA={displayPlayerA.name}
                          nameB={displayPlayerB.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Insights */}
                {reportModel.insights?.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {reportModel.insights.map((insight, i) => {
                      const c = insightColors[insight.tone] ?? insightColors.cyan;
                      return (
                        <div
                          key={i}
                          className="rounded-[20px] p-5"
                          style={{ border: `1px solid ${c.border}`, background: c.bg }}
                        >
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: c.text }}>{insight.title}</p>
                          <p className="text-sm leading-6 text-gray-300">{insight.content}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* AI Narrative */}
                {reportModel.aiNarrative?.length > 0 && (
                  <div className="rounded-[22px] border border-[rgba(122,92,255,0.18)] bg-[rgba(122,92,255,0.04)] p-6">
                    <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-[#C7B8FF]">Análise Narrativa</p>
                    <div className="space-y-3">
                      {reportModel.aiNarrative.map((paragraph, i) => (
                        <p key={i} className="text-sm leading-7 text-gray-300">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
