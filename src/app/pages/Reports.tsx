import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import {
  Brain,
  CheckCircle,
  Download,
  FileText,
  LoaderCircle,
  Save,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  X,
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
import { formatExecutiveMetric, type ExecutiveReportMetric } from "../utils/executiveReport";
import { downloadExecutiveReportPdf } from "../utils/executiveReportPdf";
import { createReportAnalysis } from "../services/analysis";
import {
  getExecutiveReportData,
  getReportShortlist,
  type CompareViewModel,
  type ExecutiveReportModel,
  type PlayerFilterOptions,
} from "../services/reports";

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
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveFeedbackTone, setSaveFeedbackTone] = useState<"success" | "error">("success");
  const [comparisonData, setComparisonData] = useState<CompareViewModel | null>(null);
  const [reportModel, setReportModel] = useState<ExecutiveReportModel | null>(null);
  const [filterOptions, setFilterOptions] = useState<PlayerFilterOptions>(EMPTY_FILTER_OPTIONS);

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
        return;
      }

      setReportLoading(true);

      try {
        const response = await getExecutiveReportData(playerA, playerB);

        if (!active) {
          return;
        }

        setComparisonData(response.data?.comparisonData ?? null);
        setReportModel(response.data?.reportModel ?? null);
        setReportError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        setComparisonData(null);
        setReportModel(null);
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
  }, [playerA.id, playerA.name, playerB.id, playerB.name]);

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
  const hasValidPlayers =
    Boolean(displayPlayerA.id) &&
    Boolean(displayPlayerB.id) &&
    displayPlayerA.id !== EMPTY_PLAYER.id &&
    displayPlayerB.id !== EMPTY_PLAYER.id &&
    displayPlayerA.id !== displayPlayerB.id;

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

  const handleSaveReport = async () => {
    if (!reportModel || !hasValidPlayers) {
      setSaveFeedbackTone("error");
      setSaveFeedback("Selecione dois jogadores validos para salvar o relatorio executivo.");
      return;
    }

    setSaving(true);
    setSaveFeedback(null);

    try {
      const response = await createReportAnalysis({
        playerIds: [displayPlayerA.id, displayPlayerB.id],
        title: `${reportModel.title} - ${reportModel.subtitle}`,
        analyst: user?.name,
      });

      setSaveFeedbackTone("success");
      setSaveFeedback(`Relatorio salvo com sucesso: ${response.data.title}. Ele ja esta disponivel na central de Analises.`);
    } catch (error) {
      setSaveFeedbackTone("error");
      setSaveFeedback(error instanceof Error ? error.message : "Nao foi possivel salvar o relatorio.");
    } finally {
      setSaving(false);
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
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricHeroCard label="Shortlist" value={`${availablePlayers.length}`} caption="Apos aplicacao dos filtros" accent="cyan" />
                  <MetricHeroCard label="Filtros ativos" value={`${activeFiltersCount}`} caption="Refinando o radar atual" accent="violet" />
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-4 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Acoes</p>
                    <p className="mt-2 text-lg font-semibold text-white">Salvar ou exportar</p>
                    <p className="mt-1 text-xs text-gray-500">Persista o parecer na central ou gere o PDF executivo.</p>
                    <div className="mt-4 grid gap-3">
                      <Button
                        className="h-11 rounded-[14px] border border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.14)] px-4 font-semibold text-[#B6FFD8] shadow-[0_6px_18px_rgba(0,255,156,0.14)] hover:bg-[rgba(0,255,156,0.2)]"
                        onClick={handleSaveReport}
                        disabled={!reportModel || reportLoading || saving || !hasValidPlayers}
                      >
                        {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar relatorio
                      </Button>
                      <Button
                        className="h-11 rounded-[14px] bg-[#00C2FF]/90 px-4 font-semibold text-[#07142A] shadow-[0_6px_18px_rgba(0,194,255,0.25)] hover:bg-[#00C2FF]"
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
                    : "border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] text-[#FFB4B5]"
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
            {reportLoading && <StatusBanner tone="loading">Gerando leitura executiva atual...</StatusBanner>}

            {!playersLoading && selectablePlayers.length === 0 && (
              <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-6 py-14 text-center text-sm text-gray-500">
                Nenhum jogador foi encontrado com os filtros atuais. Ajuste o painel para montar uma shortlist comparavel.
              </div>
            )}

            {reportModel && (
              <>
                <section className="relative overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(7,20,42,0.96),rgba(13,29,57,0.92))] px-7 py-7 shadow-[0_18px_56px_rgba(0,0,0,0.34)]">
                  <div className="absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_top_right,rgba(0,194,255,0.16),transparent_72%)]" />
                  <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">Decision Snapshot</p>
                      <h2 className="mt-3 text-3xl font-semibold text-white">{reportModel.recommendationLabel}</h2>
                      <p className="mt-4 max-w-3xl text-[15px] leading-[1.9] text-gray-300">{reportModel.recommendationSummary}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {reportModel.takeaways.slice(0, 2).map((takeaway) => (
                          <span
                            key={takeaway}
                            className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs text-gray-300"
                          >
                            {takeaway}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
                      <EditorialStat label="Status" value="Pronto para decisao" accent="#00FF9C" />
                      <EditorialStat label="Recorte" value={reportModel.subtitle} accent="#00C2FF" />
                      <EditorialStat label="Gerado em" value={reportModel.generatedAtLabel} accent="#7A5CFF" />
                    </div>
                  </div>
                </section>

                <SectionCard icon={FileText} iconColor="#00C2FF" iconBg="rgba(0,194,255,0.15)" title="Executive Summary">
                  <div className="max-w-[980px]">
                    <p className="text-[15px] leading-[1.9] text-gray-300">{reportModel.executiveSummary}</p>

                    <div className="mt-8 grid gap-5 lg:grid-cols-3">
                      {reportModel.insights.map((insight) => (
                        <InsightCard key={insight.title} insight={insight} />
                      ))}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={TrendingUp} iconColor="#7A5CFF" iconBg="rgba(122,92,255,0.15)" title="Comparative Analysis">
                  <div className="space-y-6">
                    <p className="max-w-[980px] text-[15px] leading-[1.9] text-gray-300">{reportModel.comparativeAnalysis}</p>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px]" role="table">
                        <thead className="sticky top-0 z-10 bg-[rgba(255,255,255,0.04)] backdrop-blur-sm">
                          <tr>
                            <th className="px-5 py-4 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500" scope="col">Metrica</th>
                            <th className="px-5 py-4 text-center text-[10px] font-medium uppercase tracking-wider text-gray-500" scope="col">{displayPlayerA.name}</th>
                            <th className="px-5 py-4 text-center text-[10px] font-medium uppercase tracking-wider text-gray-500" scope="col">{displayPlayerB.name}</th>
                            <th className="px-5 py-4 text-center text-[10px] font-medium uppercase tracking-wider text-gray-500" scope="col">Vencedor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                          {reportModel.metrics.map((metric) => (
                            <ComparisonRow key={metric.label} metric={metric} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={ShieldAlert} iconColor="#FF5A74" iconBg="rgba(255,90,116,0.15)" title="Risk Overview">
                  <div className="grid gap-8 lg:grid-cols-2">
                    <PlayerRiskBlock
                      player={displayPlayerA}
                      color="#00C2FF"
                      recommendation={reportModel.winner === "A"}
                    />
                    <PlayerRiskBlock
                      player={displayPlayerB}
                      color="#7A5CFF"
                      recommendation={reportModel.winner === "B"}
                    />
                  </div>
                  <p className="mt-8 max-w-[980px] text-[15px] leading-[1.9] text-gray-300">{reportModel.riskOverview}</p>
                </SectionCard>

                <section className="rounded-[20px] border border-[rgba(0,194,255,0.2)] bg-gradient-to-br from-[rgba(0,194,255,0.05)] to-[rgba(122,92,255,0.05)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" role="region" aria-label="AI Narrative">
                  <div className="mb-8 flex items-center gap-4 border-b border-[rgba(255,255,255,0.06)] pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#00C2FF] to-[#7A5CFF] shadow-[0_4px_16px_rgba(0,194,255,0.25)]">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-wide text-white">AI Narrative</h2>
                      <p className="mt-1 text-sm text-gray-400">Parecer contextualizado com leitura de mercado, risco e encaixe competitivo.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {reportModel.aiNarrative.map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 24)}`} className="max-w-[960px] text-[15px] leading-[1.9] text-gray-300">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[16px] border border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.08)] p-5">
                    <p className="text-sm leading-relaxed text-gray-200">
                      <strong className="font-semibold text-[#00FF9C]">Recomendacao Final:</strong> {reportModel.recommendationSummary}
                    </p>
                  </div>
                </section>

                <SectionCard icon={CheckCircle} iconColor="#00FF9C" iconBg="rgba(0,255,156,0.15)" title="Decision Checklist">
                  <div className="grid gap-4 lg:grid-cols-3">
                    {reportModel.takeaways.map((takeaway) => (
                      <div key={takeaway} className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(0,255,156,0.12)] text-[#00FF9C]">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <p className="text-sm leading-relaxed text-gray-300">{takeaway}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </>
            )}
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

function SectionCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  children,
}: {
  icon: ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] bg-[rgba(255,255,255,0.02)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" role="region" aria-label={title}>
      <div className="mb-8 flex items-center gap-4 border-b border-[rgba(255,255,255,0.06)] pb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-[12px]" style={{ background: iconBg }}>
          <Icon className="h-6 w-6" style={{ color: iconColor }} />
        </div>
        <h2 className="text-2xl font-semibold tracking-wide text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InsightCard({
  insight,
}: {
  insight: {
    title: string;
    content: string;
    tone: "cyan" | "violet" | "emerald";
  };
}) {
  const colors: Record<string, string> = {
    cyan: "#00C2FF",
    violet: "#7A5CFF",
    emerald: "#00FF9C",
  };

  const color = colors[insight.tone] ?? colors.cyan;

  return (
    <div className="rounded-[16px] border bg-[rgba(255,255,255,0.03)] p-5 transition-colors hover:bg-[rgba(255,255,255,0.04)]" style={{ borderColor: `${color}20` }}>
      <h4 className="mb-3 flex items-center gap-2 font-semibold" style={{ color }}>
        <div className="h-4 w-1 rounded-full" style={{ background: color }} />
        {insight.title}
      </h4>
      <p className="text-sm leading-relaxed text-gray-400">{insight.content}</p>
    </div>
  );
}

function ComparisonRow({ metric }: { metric: ExecutiveReportMetric }) {
  const winner = metric.winner;

  return (
    <tr className="transition-colors hover:bg-[rgba(255,255,255,0.02)]" role="row">
      <td className="px-5 py-4 text-sm text-gray-300" role="cell">{metric.label}</td>
      <td className="px-5 py-4 text-center tabular-nums" role="cell">
        <span className={`text-base font-bold ${winner === "A" ? "text-[#00C2FF]" : "text-gray-400"}`}>
          {formatExecutiveMetric(metric, metric.a)}
        </span>
      </td>
      <td className="px-5 py-4 text-center tabular-nums" role="cell">
        <span className={`text-base font-bold ${winner === "B" ? "text-[#7A5CFF]" : "text-gray-400"}`}>
          {formatExecutiveMetric(metric, metric.b)}
        </span>
      </td>
      <td className="px-5 py-4 text-center" role="cell">
        {winner === "DRAW" ? (
          <span className="text-xs text-gray-500">Empate</span>
        ) : (
          <CheckCircle className={`inline h-5 w-5 ${winner === "A" ? "text-[#00C2FF]" : "text-[#7A5CFF]"}`} />
        )}
      </td>
    </tr>
  );
}

function PlayerRiskBlock({
  player,
  color,
  recommendation,
}: {
  player: PlayerExtended;
  color: string;
  recommendation: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <div className="h-5 w-1 rounded-full" style={{ background: color }} />
          <span style={{ color }}>{player.name}</span>
        </h3>
        {recommendation && (
          <span className="rounded-full border border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00FF9C]">
            Preferred
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RiskCard title="Composite Risk" value={`${player.risk.score.toFixed(1)}`} subtitle={player.risk.level} description={player.risk.explanation} />
        <RiskCard title="Structural Risk" value={`${player.structuralRisk.score.toFixed(1)}`} subtitle={player.structuralRisk.level} description={player.structuralRisk.breakdown} />
        <RiskCard title="Financial Risk" value={`${player.financialRisk.index.toFixed(1)}`} subtitle={player.financialRisk.capitalExposure} description={player.financialRisk.investmentProfile} />
        <RiskCard title="Liquidity Window" value={`${player.liquidity.score.toFixed(1)}`} subtitle={player.liquidity.resaleWindow} description={player.liquidity.marketProfile} />
        <RiskCard title="Capital Efficiency" value={`${player.capitalEfficiency.toFixed(1)}`} subtitle={player.risk.level} description={`${player.name} combina leitura de custo, risco e desempenho dentro do recorte atual.`} />
      </div>
    </div>
  );
}

function RiskCard({
  title,
  value,
  subtitle,
  description,
}: {
  title: string;
  value: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">{title}</span>
        <span className="rounded-[8px] bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-xs font-semibold text-white">{subtitle}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}
