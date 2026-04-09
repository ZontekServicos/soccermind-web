import { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  GitCompareArrows,
  History as HistoryIcon,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  deleteAnalysisHubEntry,
  getAnalyses,
  subscribeToAnalysisHubUpdates,
  type AnalysisViewModel as AnalysisHistory,
} from "../services/analysis";

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterType = "all" | AnalysisHistory["type"];
type PeriodType = "7d" | "30d" | "90d" | "all";
type SortOption = "date_desc" | "date_asc" | "type";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  comparison: { bg: "rgba(122,92,255,0.15)", text: "#7A5CFF", border: "rgba(122,92,255,0.3)" },
  report:     { bg: "rgba(0,255,156,0.15)",  text: "#00FF9C", border: "rgba(0,255,156,0.3)"  },
  analysis:   { bg: "rgba(0,194,255,0.15)",  text: "#00C2FF", border: "rgba(0,194,255,0.3)"  },
};

const FALLBACK_BADGE_STYLE = {
  bg: "rgba(148,163,184,0.15)", text: "#94a3b8", border: "rgba(148,163,184,0.3)",
};

const STATUS_BADGE_STYLES: Record<AnalysisHistory["status"], { bg: string; text: string; border: string }> = {
  completed:   { bg: "rgba(0,255,156,0.15)",  text: "#00FF9C", border: "rgba(0,255,156,0.3)"  },
  in_progress: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  archived:    { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  comparison: GitCompareArrows,
  report:     FileText,
  analysis:   Sparkles,
};

const TYPE_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: "all",        label: "Todos os tipos" },
  { value: "analysis",   label: "Análise"        },
  { value: "comparison", label: "Comparação"     },
  { value: "report",     label: "Relatório"      },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "date_desc", label: "Mais recente" },
  { value: "date_asc",  label: "Mais antigo"  },
  { value: "type",      label: "Por tipo"     },
];

const PERIOD_IN_DAYS: Partial<Record<Exclude<PeriodType, "all">, number>> = {
  "7d": 7, "30d": 30, "90d": 90,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function History() {
  const navigate = useNavigate();

  const [historyItems, setHistoryItems] = useState<AnalysisHistory[]>([]);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterType, setFilterType]     = useState<FilterType>("all");
  const [filterPeriod, setFilterPeriod] = useState<PeriodType>("all");
  const [sortOption, setSortOption]     = useState<SortOption>("date_desc");
  const [isLoading, setIsLoading]       = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError]       = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);

  // ── Load & live-refresh ──────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    async function load(opts?: { silent?: boolean }) {
      if (!opts?.silent) setIsLoading(true);
      try {
        const res = await getAnalyses();
        if (!active) return;
        setHistoryItems(Array.isArray(res.data) ? res.data : []);
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        setHistoryItems([]);
        setLoadError(err instanceof Error ? err.message : "Não foi possível carregar o histórico.");
      } finally {
        if (active && !opts?.silent) setIsLoading(false);
      }
    }

    void load();

    const unsubscribe = subscribeToAnalysisHubUpdates(() => {
      void load({ silent: true });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let items = [...historyItems];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.players.some((p) => p.toLowerCase().includes(q)) ||
          item.user.toLowerCase().includes(q),
      );
    }

    if (filterType !== "all") {
      items = items.filter((item) => item.type === filterType);
    }

    if (filterPeriod !== "all") {
      const days = PERIOD_IN_DAYS[filterPeriod];
      if (days) {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        items = items.filter((item) => new Date(item.date).getTime() >= cutoff);
      }
    }

    items.sort((a, b) => {
      if (sortOption === "date_asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOption === "type")     return a.typeLabel.localeCompare(b.typeLabel);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return items;
  }, [historyItems, searchQuery, filterType, filterPeriod, sortOption]);

  const stats = useMemo(() => ({
    total:       historyItems.length,
    analyses:    historyItems.filter((i) => i.type === "analysis").length,
    comparisons: historyItems.filter((i) => i.type === "comparison").length,
    reports:     historyItems.filter((i) => i.type === "report").length,
  }), [historyItems]);

  const activeFiltersCount = [filterType !== "all", searchQuery !== ""].filter(Boolean).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterPeriod("all");
  };

  const handleExport = () => {
    const content = filteredData
      .map((i) =>
        `${i.typeLabel} | ${i.title} | ${i.players.join(", ")} | ${new Date(i.date).toLocaleDateString("pt-BR")}`,
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-soccermind-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (item: AnalysisHistory) => {
    if (deletingId) return;
    if (!window.confirm("Remover este registro do histórico?")) return;

    setDeletingId(item.id);
    setActionFeedback(null);
    setActionError(null);

    try {
      await deleteAnalysisHubEntry(item);
      setHistoryItems((prev) => prev.filter((e) => e.id !== item.id));
      setActionFeedback("Registro removido do histórico.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Não foi possível excluir.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">

            {/* ── Header ── */}
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="mb-2 text-4xl font-semibold">Histórico</h1>
                <p className="text-sm text-gray-500">
                  Registro de análises, comparações e relatórios salvos manualmente
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-5 hover:bg-[rgba(255,255,255,0.04)]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Button
                  onClick={() => navigate("/compare")}
                  className="h-11 rounded-[12px] bg-[#00C2FF]/90 px-6 font-semibold text-[#07142A] shadow-[0_4px_16px_rgba(0,194,255,0.25)] hover:bg-[#00C2FF]"
                >
                  <GitCompareArrows className="mr-2 h-4 w-4" />
                  Nova Comparação
                </Button>
              </div>
            </div>

            {/* ── KPIs ── */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <KPICard
                icon={HistoryIcon} iconColor="#00C2FF" iconBg="rgba(0,194,255,0.12)"
                label="Total" value={stats.total}
                onClick={() => setFilterType("all")}
              />
              <KPICard
                icon={Sparkles} iconColor="#00C2FF" iconBg="rgba(0,194,255,0.08)"
                label="Análises" value={stats.analyses}
                onClick={() => setFilterType("analysis")}
              />
              <KPICard
                icon={GitCompareArrows} iconColor="#7A5CFF" iconBg="rgba(122,92,255,0.12)"
                label="Comparações" value={stats.comparisons}
                onClick={() => setFilterType("comparison")}
              />
              <KPICard
                icon={FileText} iconColor="#00FF9C" iconBg="rgba(0,255,156,0.12)"
                label="Relatórios" value={stats.reports}
                onClick={() => setFilterType("report")}
              />
            </div>

            {/* ── Filters ── */}
            <div className="mb-8 rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5 backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">

                <div className="relative sm:col-span-2 lg:col-span-5">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar por título, jogador ou analista..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] pl-11 focus:border-[#00C2FF]"
                  />
                </div>

                <div className="lg:col-span-3">
                  <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                    <SelectTrigger className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
                      <Filter className="mr-2 h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="border-[rgba(255,255,255,0.1)] bg-[#0A1B35]">
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-2">
                  <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as PeriodType)}>
                    <SelectTrigger className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent className="border-[rgba(255,255,255,0.1)] bg-[#0A1B35]">
                      <SelectItem value="all">Todo período</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-2">
                  <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                    <SelectTrigger className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[rgba(255,255,255,0.1)] bg-[#0A1B35]">
                      {SORT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {filterType !== "all" && (
                    <FilterChip
                      label={`Tipo: ${TYPE_OPTIONS.find((o) => o.value === filterType)?.label ?? filterType}`}
                      onRemove={() => setFilterType("all")}
                    />
                  )}
                  {searchQuery && (
                    <FilterChip label={`"${searchQuery}"`} onRemove={() => setSearchQuery("")} />
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>

            {/* ── Feedback toasts ── */}
            {actionFeedback && (
              <div className="mb-6 rounded-[16px] border border-[rgba(0,255,156,0.18)] bg-[rgba(0,255,156,0.08)] px-5 py-4 text-sm text-[#9CFFD1]">
                {actionFeedback}
              </div>
            )}
            {(loadError ?? actionError) && (
              <div className="mb-6 rounded-[16px] border border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {loadError ?? actionError}
              </div>
            )}

            {/* ── Content ── */}
            {isLoading ? (
              <LoadingState />
            ) : filteredData.length === 0 ? (
              <EmptyState
                hasFilters={activeFiltersCount > 0 || filterPeriod !== "all"}
                onClear={handleClearFilters}
              />
            ) : (
              <>
                <p className="mb-4 text-xs text-gray-600">
                  {filteredData.length} {filteredData.length === 1 ? "registro" : "registros"}
                </p>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredData.map((item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      deleting={deletingId === item.id}
                      onView={() => navigate(`/analysis/${item.id}`)}
                      onDelete={() => void handleDelete(item)}
                    />
                  ))}
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KPICard = memo(({
  icon: Icon, iconColor, iconBg, label, value, onClick,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5 text-left transition-all hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)]"
  >
    <div className="mb-3 flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[9px]" style={{ background: iconBg }}>
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{label}</span>
    </div>
    <p className="text-3xl font-bold tabular-nums" style={{ color: iconColor }}>{value}</p>
  </button>
));
KPICard.displayName = "KPICard";

// ─── Filter Chip ──────────────────────────────────────────────────────────────

const FilterChip = memo(({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs text-gray-300">
    {label}
    <button onClick={onRemove} className="transition-colors hover:text-white">
      <X className="h-3 w-3" />
    </button>
  </span>
));
FilterChip.displayName = "FilterChip";

// ─── History Card ─────────────────────────────────────────────────────────────

const HistoryCard = memo(({
  item, deleting, onView, onDelete,
}: {
  item: AnalysisHistory;
  deleting: boolean;
  onView: () => void;
  onDelete: () => void;
}) => {
  const typeBadge   = TYPE_BADGE_STYLES[item.type]    ?? FALLBACK_BADGE_STYLE;
  const statusBadge = STATUS_BADGE_STYLES[item.status] ?? FALLBACK_BADGE_STYLE;
  const TypeIcon    = TYPE_ICONS[item.type] ?? FileText;

  const dateStr = new Date(item.date).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const timeStr = new Date(item.date).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="group flex flex-col rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5 transition-all hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.035)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">

      {/* Top: type + status + date */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-[10px] font-semibold"
            style={{ backgroundColor: typeBadge.bg, color: typeBadge.text, borderColor: typeBadge.border }}
          >
            <TypeIcon className="h-3 w-3" />
            {item.typeLabel}
          </span>
          <span
            className="inline-flex items-center rounded-[6px] border px-2 py-1 text-[10px] font-semibold"
            style={{ backgroundColor: statusBadge.bg, color: statusBadge.text, borderColor: statusBadge.border }}
          >
            {item.statusLabel}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-medium tabular-nums text-gray-400">{dateStr}</p>
          <p className="text-[10px] tabular-nums text-gray-600">{timeStr}</p>
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-100">
        {item.title}
      </h3>

      {/* Description */}
      {item.description && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">
          {item.description}
        </p>
      )}

      {/* Players */}
      {item.players.length > 0 && (
        <div className="mb-4 flex items-start gap-1.5">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-600" />
          <span className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {item.players.join(", ")}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-4">
        <span className="text-[11px] text-[#00C2FF] truncate max-w-[60%]">{item.user}</span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <ActionButton icon={Eye} tooltip="Ver análise" onClick={onView} />
          <ActionButton
            icon={deleting ? Loader2 : Trash2}
            tooltip={deleting ? "Excluindo..." : "Remover do histórico"}
            variant="danger"
            disabled={deleting || !item.canDelete}
            spinning={deleting}
            onClick={onDelete}
          />
        </div>
      </div>
    </div>
  );
});
HistoryCard.displayName = "HistoryCard";

// ─── Action Button ────────────────────────────────────────────────────────────

const ActionButton = memo(({
  icon: Icon, tooltip, variant = "default", disabled = false, spinning = false, onClick,
}: {
  icon: React.ElementType;
  tooltip: string;
  variant?: "default" | "danger";
  disabled?: boolean;
  spinning?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    aria-label={tooltip}
    className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors
      ${variant === "danger"
        ? "hover:bg-[rgba(255,77,79,0.15)] hover:text-[#FF4D4F]"
        : "hover:bg-[rgba(0,194,255,0.15)] hover:text-[#00C2FF]"
      }
      ${disabled ? "cursor-not-allowed opacity-40" : ""}
    `}
  >
    <Icon className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
  </button>
));
ActionButton.displayName = "ActionButton";

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = memo(({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) => (
  <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-16 text-center backdrop-blur-sm">
    <div className="mx-auto max-w-sm">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[14px] bg-[rgba(0,194,255,0.08)]">
        <HistoryIcon className="h-8 w-8 text-[#00C2FF]/50" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="mb-2 text-lg font-semibold text-gray-200">Nenhum resultado</h3>
          <p className="mb-5 text-sm leading-relaxed text-gray-500">
            Nenhum registro encontrado com os filtros ativos.
          </p>
          <button
            onClick={onClear}
            className="rounded-[10px] border border-[rgba(0,194,255,0.3)] bg-[rgba(0,194,255,0.1)] px-5 py-2.5 text-sm font-semibold text-[#00C2FF] transition-all hover:bg-[rgba(0,194,255,0.16)]"
          >
            Limpar filtros
          </button>
        </>
      ) : (
        <>
          <h3 className="mb-2 text-lg font-semibold text-gray-200">Histórico vazio</h3>
          <p className="text-sm leading-relaxed text-gray-500">
            Nenhum registro salvo ainda. Use o botão{" "}
            <span className="font-semibold text-[#00C2FF]">"Salvar no histórico"</span>{" "}
            nas páginas de análise, comparação ou relatório.
          </p>
        </>
      )}
    </div>
  </div>
));
EmptyState.displayName = "EmptyState";

// ─── Loading State ────────────────────────────────────────────────────────────

const LoadingState = memo(() => (
  <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-16 text-center backdrop-blur-sm">
    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#00C2FF]/60" />
    <p className="text-sm text-gray-500">Carregando histórico...</p>
  </div>
));
LoadingState.displayName = "LoadingState";
