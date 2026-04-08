import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { ActivePlayersFilterChips } from "../components/ActivePlayersFilterChips";
import { PlayersFiltersPanel } from "../components/PlayersFiltersPanel";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { EMPTY_PLAYER, type PlayerExtended } from "../types/player";
import {
  buildApiFilters,
  countActiveFilters,
  DEFAULT_PLAYERS_FILTERS,
  type FilterFieldKey,
  type PlayersFiltersState,
  parseFiltersFromSearchParams,
} from "../utils/playerFilters";
import { downloadExecutiveReportPdf } from "../utils/executiveReportPdf";
import {
  type CompareViewModel,
  getExecutiveReportData,
  getReportShortlist,
  type ExecutiveReportModel,
  type PlayerFilterOptions,
} from "../services/reports";
import { createReportAnalysis, type AnalysisViewModel } from "../services/analysis";
import { toast } from "sonner";

const EMPTY_FILTER_OPTIONS: PlayerFilterOptions = {
  positions: [],
  nationalities: [],
  teams: [],
  leagues: [],
  sources: [],
};

function dedupePlayers(players: PlayerExtended[]) {
  const seen = new Set<string>();
  return players.filter((player) => {
    if (!player.id || seen.has(player.id)) {
      return false;
    }

    seen.add(player.id);
    return true;
  });
}

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const initialFilters = useMemo(() => parseFiltersFromSearchParams(urlSearchParams), []);
  const [filters, setFilters] = useState<PlayersFiltersState>(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search.trim());
  const [filtersExpanded, setFiltersExpanded] = useState(() => countActiveFilters(initialFilters) > 0);
  const [availablePlayers, setAvailablePlayers] = useState<PlayerExtended[]>([]);
  const [playerA, setPlayerA] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [playerB, setPlayerB] = useState<PlayerExtended>(EMPTY_PLAYER);
  const [selectAOpen, setSelectAOpen] = useState(false);
  const [selectBOpen, setSelectBOpen] = useState(false);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveFeedbackTone, setSaveFeedbackTone] = useState<"success" | "error" | "info">("info");
  const [comparisonData, setComparisonData] = useState<CompareViewModel | null>(null);
  const [reportModel, setReportModel] = useState<ExecutiveReportModel | null>(null);
  const [filterOptions, setFilterOptions] = useState<PlayerFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [savedAnalysis, setSavedAnalysis] = useState<AnalysisViewModel | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const lastPersistedSelectionRef = useRef<string>("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters.search]);

  const apiFilters = useMemo(() => buildApiFilters(filters, debouncedSearch), [filters, debouncedSearch]);
  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (filters.search.trim()) nextParams.set("search", filters.search.trim());
    if (filters.positions.length > 0) nextParams.set("positions", filters.positions.join(","));
    if (filters.nationality) nextParams.set("nationality", filters.nationality);
    if (filters.team) nextParams.set("team", filters.team);
    if (filters.league) nextParams.set("league", filters.league);
    if (filters.source) nextParams.set("source", filters.source);
    if (filters.minAge) nextParams.set("minAge", filters.minAge);
    if (filters.maxAge) nextParams.set("maxAge", filters.maxAge);
    if (filters.minOverall) nextParams.set("minOverall", filters.minOverall);
    if (filters.maxOverall) nextParams.set("maxOverall", filters.maxOverall);
    if (filters.minPotential) nextParams.set("minPotential", filters.minPotential);
    if (filters.maxPotential) nextParams.set("maxPotential", filters.maxPotential);
    if (filters.minValue) nextParams.set("minValue", filters.minValue);
    if (filters.maxValue) nextParams.set("maxValue", filters.maxValue);

    setUrlSearchParams(nextParams, { replace: true });
  }, [filters, setUrlSearchParams]);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      setPlayersLoading(true);

      try {
        const response = await getReportShortlist({ ...apiFilters, page: 1, limit: 80 });
        if (!active) {
          return;
        }

        const mappedPlayers = Array.isArray(response.data.players) ? response.data.players : [];

        setAvailablePlayers(mappedPlayers);
        setPlayersError(null);
        setFilterOptions(response.data.filterOptions ?? EMPTY_FILTER_OPTIONS);

        setPlayerA((current) => (current.id && current.id !== EMPTY_PLAYER.id ? current : mappedPlayers[0] ?? EMPTY_PLAYER));
        setPlayerB((current) =>
          current.id && current.id !== EMPTY_PLAYER.id ? current : mappedPlayers[1] ?? mappedPlayers[0] ?? EMPTY_PLAYER,
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setAvailablePlayers([]);
        setPlayersError(error instanceof Error ? error.message : "Erro ao carregar a shortlist de jogadores");
      } finally {
        if (active) {
          setPlayersLoading(false);
        }
      }
    }

    loadPlayers();

    return () => {
      active = false;
    };
  }, [apiFilters]);

  useEffect(() => {
    let active = true;

    async function loadExecutiveComparison() {
      if (!playerA.name || !playerB.name || playerA.name === "Sem dados" || playerB.name === "Sem dados") {
        setComparisonData(null);
        setReportModel(null);
        setSavedAnalysis(null);
        return;
      }

      setReportLoading(true);

      try {
        const response = await getExecutiveReportData(playerA, playerB, {
          analyst: user?.name,
          generatedAt: new Date(),
          status: "Concluido",
        });

        if (!active) {
          return;
        }

        const payload = response.data ?? null;
        const nextComparisonData = payload?.comparisonData ?? null;

        setComparisonData(nextComparisonData);
        setReportModel(payload?.reportModel ?? null);
        setReportError(null);

        // Auto-save removido — use o botão "Salvar no Histórico" para persistir manualmente.
      } catch (error) {
        if (!active) {
          return;
        }

        setComparisonData(null);
        setReportModel(null);
        setSavedAnalysis(null);
        setReportError(error instanceof Error ? error.message : "Erro ao gerar o relatorio executivo");
      } finally {
        if (active) {
          setReportLoading(false);
        }
      }
    }

    loadExecutiveComparison();

    return () => {
      active = false;
    };
  }, [playerA.id, playerA.name, playerB.id, playerB.name, user?.name]);

  const selectablePlayers = useMemo(
    () =>
      dedupePlayers(
        [playerA, playerB, ...availablePlayers].filter((player) => player.id && player.id !== EMPTY_PLAYER.id),
      ),
    [availablePlayers, playerA, playerB],
  );

  const playersById = useMemo(
    () => new Map(selectablePlayers.map((player) => [player.id, player])),
    [selectablePlayers],
  );

  const displayPlayerA = comparisonData?.playerA ?? playerA;
  const displayPlayerB = comparisonData?.playerB ?? playerB;
  const handleFieldChange = (field: FilterFieldKey, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleSearchChange = (value: string) => {
    setFilters((current) => ({ ...current, search: value }));
  };

  const handleTogglePosition = (position: string) => {
    setFilters((current) => ({
      ...current,
      positions: current.positions.includes(position)
        ? current.positions.filter((item) => item !== position)
        : [...current.positions, position],
    }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_PLAYERS_FILTERS);
  };

  const handleExportPdf = async () => {
    if (!reportModel || reportLoading) {
      return;
    }

    setExporting(true);

    try {
      downloadExecutiveReportPdf(reportModel);
    } finally {
      window.setTimeout(() => setExporting(false), 250);
    }
  };

  const handleOpenSavedReport = () => {
    if (!savedAnalysis?.id) {
      setSaveFeedbackTone("error");
      setSaveFeedback("Salve o relatório no histórico primeiro.");
      return;
    }
    navigate(`/analysis/${savedAnalysis.id}`);
  };

  const handleSaveToHistory = async () => {
    if (!reportModel || saveLoading) return;
    setSaveLoading(true);
    setSaveFeedback(null);
    try {
      const persisted = await createReportAnalysis({
        playerIds: [playerA.id, playerB.id],
        title: `Relatório Executivo - ${reportModel.subtitle}`,
        description: reportModel.recommendationSummary,
        analyst: user?.name,
      });
      lastPersistedSelectionRef.current = [playerA.id, playerB.id].sort().join(":");
      setSavedAnalysis(persisted.data);
      setSaveFeedbackTone("success");
      setSaveFeedback(`Salvo no histórico: "${persisted.data.title}"`);
    } catch (err) {
      setSaveFeedbackTone("error");
      setSaveFeedback(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1600px] space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.16),transparent_68%)] blur-2xl" />
              <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.16),transparent_72%)] blur-2xl" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-4xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Executive Intelligence
                  </div>
                  <h1 className="text-4xl font-semibold text-white">Relatorio Executivo</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
                    Filtre o universo de scouting, selecione dois perfis compativeis e gere um parecer executivo com recomendacao final, leitura de risco e exportacao real em PDF.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {reportModel ? reportModel.subtitle : `${displayPlayerA.name} vs ${displayPlayerB.name}`}
                    </span>
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
                      {reportModel ? `Gerado em ${reportModel.generatedAtLabel}` : "Aguardando comparacao"}
                    </span>
                    <span className="rounded-full border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.08)] px-3 py-1.5 text-[#9BE7FF]">
                      <Link to="/history">Central Analysis</Link>
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricHeroCard label="Shortlist" value={`${availablePlayers.length}`} caption="Apos aplicacao dos filtros" accent="cyan" />
                  <MetricHeroCard label="Filtros ativos" value={`${activeFiltersCount}`} caption="Refinando o radar atual" accent="violet" />
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-4 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Ações</p>
                    <p className="mt-1 text-xs text-gray-500">Salve manualmente quando quiser registrar esta análise no histórico.</p>
                    <div className="mt-4 grid gap-3">
                      <Button
                        className="h-11 rounded-[14px] border border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.14)] px-4 font-semibold text-[#B6FFD8] shadow-[0_6px_18px_rgba(0,255,156,0.14)] hover:bg-[rgba(0,255,156,0.2)] disabled:opacity-50"
                        onClick={() => void handleSaveToHistory()}
                        disabled={!reportModel || reportLoading || saveLoading || !!savedAnalysis}
                      >
                        {saveLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        {savedAnalysis ? "Salvo no histórico ✓" : "Salvar no Histórico"}
                      </Button>
                      {savedAnalysis && (
                        <Button
                          variant="ghost"
                          className="h-9 rounded-[12px] border border-[rgba(255,255,255,0.08)] text-xs text-gray-400 hover:text-gray-200"
                          onClick={handleOpenSavedReport}
                        >
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Abrir no Histórico
                        </Button>
                      )}
                      <Button
                        className="h-11 rounded-[14px] bg-[#00C2FF]/90 px-4 font-semibold text-[#07142A] shadow-[0_6px_18px_rgba(0,194,255,0.25)] hover:bg-[#00C2FF] disabled:opacity-50"
                        onClick={handleExportPdf}
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

            {saveFeedback && (
              <div
                className={`rounded-[16px] border px-5 py-4 text-sm ${
                  saveFeedbackTone === "success"
                    ? "border-[rgba(0,255,156,0.18)] bg-[rgba(0,255,156,0.08)] text-[#9CFFD1]"
                    : saveFeedbackTone === "error"
                      ? "border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] text-[#FFB4B5]"
                      : "border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.08)] text-[#9BE7FF]"
                }`}
              >
                {saveFeedback}
              </div>
            )}

            <PlayersFiltersPanel
              filters={filters}
              options={filterOptions}
              activeFiltersCount={activeFiltersCount}
              isExpanded={filtersExpanded}
              onToggleExpanded={() => setFiltersExpanded((current) => !current)}
              onSearchChange={handleSearchChange}
              onFieldChange={handleFieldChange}
              onTogglePosition={handleTogglePosition}
              onClearFilters={handleClearFilters}
            />

            <ActivePlayersFilterChips
              filters={filters}
              onClearSearch={() => setFilters((current) => ({ ...current, search: "" }))}
              onRemovePosition={(position) =>
                setFilters((current) => ({
                  ...current,
                  positions: current.positions.filter((item) => item !== position),
                }))
              }
              onClearField={(field) => setFilters((current) => ({ ...current, [field]: "" }))}
              onClearRange={([minField, maxField]) =>
                setFilters((current) => ({ ...current, [minField]: "", [maxField]: "" }))
              }
            />

            <section className="grid gap-6 rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.3)] xl:grid-cols-[1fr_1fr]">
              <PlayerSelector
                label="Player A"
                value={playerA.id}
                players={selectablePlayers}
                variant="A"
                open={selectAOpen}
                onOpenChange={setSelectAOpen}
                onChange={(value) => setPlayerA(playersById.get(value) ?? EMPTY_PLAYER)}
              />
              <PlayerSelector
                label="Player B"
                value={playerB.id}
                players={selectablePlayers}
                variant="B"
                open={selectBOpen}
                onOpenChange={setSelectBOpen}
                onChange={(value) => setPlayerB(playersById.get(value) ?? EMPTY_PLAYER)}
              />
            </section>

            {playersError && <StatusBanner tone="error">{playersError}</StatusBanner>}
            {reportError && <StatusBanner tone="error">{reportError}</StatusBanner>}
            {playersLoading && <StatusBanner tone="loading">Carregando shortlist para o relatorio...</StatusBanner>}
            {reportLoading && <ReportLoadingSkeleton />}

            {!playersLoading && selectablePlayers.length === 0 && (
              <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-6 py-14 text-center text-sm text-gray-500">
                Nenhum jogador foi encontrado com os filtros atuais. Ajuste o painel para montar uma shortlist comparavel.
              </div>
            )}

            {reportModel ? (
              <section className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(7,20,42,0.96),rgba(13,29,57,0.92))] px-7 py-7 shadow-[0_18px_56px_rgba(0,0,0,0.34)]">
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Analysis Saved</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{savedAnalysis?.title ?? reportModel.subtitle}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
                      O relatorio completo nao aparece mais nesta tela. Use os botoes acima para abrir a analise salva ou exportar o PDF.
                    </p>
                  </div>

                  <div className="grid gap-4 rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
                    <EditorialStat
                      label="Status"
                      value={reportLoading ? "Gerando" : savedAnalysis?.statusLabel ?? "Em andamento"}
                      accent={reportLoading ? "#FFB800" : "#00FF9C"}
                    />
                    <EditorialStat label="Recorte" value={reportModel.subtitle} accent="#00C2FF" />
                    <EditorialStat label="Gerado em" value={reportModel.generatedAtLabel} accent="#7A5CFF" />
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricHeroCard({
  label,
  value,
  caption,
  accent,
}: {
  label: string;
  value: string;
  caption: string;
  accent: "cyan" | "violet";
}) {
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

function EditorialStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
      <div className="mt-3 h-1 rounded-full" style={{ background: `${accent}33` }} />
    </div>
  );
}

function StatusBanner({ children, tone }: { children: ReactNode; tone: "error" | "loading" }) {
  const styles =
    tone === "error"
      ? "border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.08)] text-[#FFB4B5]"
      : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-gray-400";

  return <div className={`rounded-[16px] border px-5 py-4 text-sm ${styles}`}>{children}</div>;
}

function ReportLoadingSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6">
        <div className="h-3 w-32 rounded-full bg-white/10" />
        <div className="mt-4 h-8 w-3/4 rounded-full bg-white/10" />
        <div className="mt-4 space-y-3">
          <div className="h-3 w-full rounded-full bg-white/10" />
          <div className="h-3 w-5/6 rounded-full bg-white/10" />
          <div className="h-3 w-2/3 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="grid gap-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-20 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
          />
        ))}
      </div>
    </div>
  );
}

function PlayerSelector({
  label,
  value,
  players,
  variant,
  open,
  onOpenChange,
  onChange,
}: {
  label: string;
  value: string;
  players: PlayerExtended[];
  variant: "A" | "B";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
}) {
  const accent = variant === "A" ? "#00C2FF" : "#7A5CFF";
  const labelText = variant === "A" ? "Candidato principal" : "Benchmark alternativo";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">
          <div className="h-2 w-2 rounded-full" style={{ background: accent }} />
          {label}
        </label>
        <span className="text-[11px] text-gray-600">{labelText}</span>
      </div>

      <Select value={value} onValueChange={onChange} open={open} onOpenChange={onOpenChange}>
        <SelectTrigger
          className="h-14 rounded-[14px] border bg-[rgba(255,255,255,0.02)] px-4 backdrop-blur-sm transition-all"
          style={{
            borderColor: open ? accent : `${accent}50`,
            boxShadow: open ? `0 0 0 3px ${accent}22` : undefined,
          }}
        >
          <SelectValue placeholder={`Selecionar ${label}`} />
        </SelectTrigger>
        <SelectContent className="border-[rgba(255,255,255,0.1)] bg-[#0A1B35]">
          {players.map((player) => (
            <SelectItem key={player.id} value={player.id} className="focus:bg-[rgba(255,255,255,0.05)]">
              {player.name} - {player.club}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
