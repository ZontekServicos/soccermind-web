import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileText,
  Filter,
  History as HistoryIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  deleteAnalysisHubEntry,
  getAnalyses,
  subscribeToAnalysisHubUpdates,
  type AnalysisViewModel as AnalysisHistory,
} from "../services/analysis";

type FilterType = "all" | AnalysisHistory["type"];
type FilterStatus = "all" | AnalysisHistory["status"];
type PeriodType = "7d" | "30d" | "90d" | "all" | "custom";
type SortField = "date" | "type" | "user";
type SortOrder = "asc" | "desc";

type BadgeStyle = {
  bg: string;
  text: string;
  border: string;
};

const FALLBACK_BADGE_STYLE: BadgeStyle = {
  bg: "rgba(148,163,184,0.15)",
  text: "#94a3b8",
  border: "rgba(148,163,184,0.3)",
};

const TYPE_BADGE_STYLES: Record<AnalysisHistory["type"] | string, BadgeStyle> = {
  comparison: { bg: "rgba(122,92,255,0.15)", text: "#7A5CFF", border: "rgba(122,92,255,0.3)" },
  report: { bg: "rgba(0,255,156,0.15)", text: "#00FF9C", border: "rgba(0,255,156,0.3)" },
  analysis: { bg: "rgba(0,194,255,0.15)", text: "#00C2FF", border: "rgba(0,194,255,0.3)" },
};

const STATUS_BADGE_STYLES: Record<AnalysisHistory["status"], BadgeStyle> = {
  completed: { bg: "rgba(0,255,156,0.15)", text: "#00FF9C", border: "rgba(0,255,156,0.3)" },
  in_progress: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  archived: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
};

const TYPE_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: "all", label: "Todos os tipos" },
  { value: "comparison", label: "Comparação" },
  { value: "report", label: "Relatório" },
];

const STATUS_OPTIONS: Array<{ value: FilterStatus; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "completed", label: "Concluido" },
  { value: "in_progress", label: "Em andamento" },
  { value: "archived", label: "Arquivado" },
];

const PERIOD_IN_DAYS: Partial<Record<Exclude<PeriodType, "custom" | "all">, number>> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export default function History() {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<AnalysisHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPeriod, setFilterPeriod] = useState<PeriodType>("90d");
  const [filterClub, setFilterClub] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHistory(options?: { silent?: boolean }) {
      if (!options?.silent) {
        setIsLoading(true);
      }

      try {
        const response = await getAnalyses();
        if (!active) {
          return;
        }

        setHistoryItems(Array.isArray(response.data) ? response.data : []);
        setLoadError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        setHistoryItems([]);
        setLoadError(error instanceof Error ? error.message : "Nao foi possivel carregar a central de analises.");
      } finally {
        if (active && !options?.silent) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    const unsubscribe = subscribeToAnalysisHubUpdates(() => {
      void loadHistory({ silent: true });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const availableClubs = useMemo(() => {
    const clubs = Array.from(new Set(historyItems.map((item) => item.club).filter(Boolean)));
    return clubs.sort((a, b) => a.localeCompare(b));
  }, [historyItems]);

  const filteredData = useMemo(() => {
    let filtered = [...historyItems];

    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(normalizedQuery) ||
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery) ||
          item.players.some((player) => player.toLowerCase().includes(normalizedQuery)) ||
          item.user.toLowerCase().includes(normalizedQuery),
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    if (filterClub !== "all") {
      filtered = filtered.filter((item) => item.club === filterClub);
    }

    if (filterPeriod !== "custom" && filterPeriod !== "all") {
      const periodDays = PERIOD_IN_DAYS[filterPeriod];
      if (periodDays) {
        const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
        filtered = filtered.filter((item) => new Date(item.date).getTime() >= cutoff);
      }
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === "type") {
        comparison = a.typeLabel.localeCompare(b.typeLabel);
      } else if (sortField === "user") {
        comparison = a.user.localeCompare(b.user);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [filterClub, filterPeriod, filterStatus, filterType, historyItems, searchQuery, sortField, sortOrder]);

  const stats = useMemo(() => {
    const total = historyItems.length;
    const comparisons = historyItems.filter((item) => item.type === "comparison").length;
    const reports = historyItems.filter((item) => item.type === "report").length;

    return {
      total: { value: total, change: 12 },
      comparisons: { value: comparisons, change: 8 },
      reports: { value: reports, change: 15 },
    };
  }, [historyItems]);

  const activeFiltersCount = [
    filterType !== "all",
    filterStatus !== "all",
    filterClub !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const filterTypeLabel =
    filterType === "all" ? "Todos os tipos" : TYPE_OPTIONS.find((option) => option.value === filterType)?.label ?? filterType;

  const filterStatusLabel =
    filterStatus === "all"
      ? "Todos os status"
      : STATUS_OPTIONS.find((option) => option.value === filterStatus)?.label ?? filterStatus;

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterClub("all");
    setFilterPeriod("30d");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortOrder("desc");
  };

  const handleDeleteAnalysis = async (item: AnalysisHistory) => {
    if (deletingId) {
      return;
    }

    const confirmed = window.confirm("Deseja remover esta analise da central?");
    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setActionFeedback(null);
    setActionError(null);

    try {
      await deleteAnalysisHubEntry(item);
      setHistoryItems((current) => current.filter((entry) => entry.id !== item.id));
      setActionFeedback(
        item.deleteManagedBy === "scout_report"
          ? "ScoutReport removido da central com sucesso."
          : "Analise removida da central com sucesso.",
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Nao foi possivel excluir a analise.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            <HeaderSection onCreateAnalysis={() => navigate("/compare")} />
            <KPISection stats={stats} onFilterClick={setFilterType} />
            <FiltersSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              filterTypeLabel={filterTypeLabel}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterStatusLabel={filterStatusLabel}
              filterPeriod={filterPeriod}
              setFilterPeriod={setFilterPeriod}
              filterClub={filterClub}
              setFilterClub={setFilterClub}
              availableClubs={availableClubs}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={handleClearFilters}
            />
            {actionFeedback && (
              <div className="mb-6 rounded-[16px] border border-[rgba(0,255,156,0.18)] bg-[rgba(0,255,156,0.08)] px-5 py-4 text-sm text-[#9CFFD1]">
                {actionFeedback}
              </div>
            )}
            {(loadError || actionError) && (
              <div className="mb-6 rounded-[16px] border border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {loadError ?? actionError}
              </div>
            )}
            <ActivityTable
              data={filteredData}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              isLoading={isLoading}
              deletingId={deletingId}
              onViewReport={(item) => navigate(`/analysis/${item.id}`)}
              onDelete={handleDeleteAnalysis}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

const HeaderSection = memo(({ onCreateAnalysis }: { onCreateAnalysis: () => void }) => {
  return (
    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="mb-3 text-4xl font-semibold">Histórico</h1>
        <p className="text-sm text-gray-500">Registro de análises, comparações e relatórios salvos manualmente</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-5 hover:bg-[rgba(255,255,255,0.04)]"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button
          onClick={onCreateAnalysis}
          className="h-11 rounded-[12px] bg-[#00C2FF]/90 px-6 font-semibold text-[#07142A] shadow-[0_4px_16px_rgba(0,194,255,0.25)] transition-all hover:bg-[#00C2FF] hover:shadow-[0_6px_20px_rgba(0,194,255,0.35)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Analise
        </Button>
      </div>
    </div>
  );
});

HeaderSection.displayName = "HeaderSection";

interface KPISectionProps {
  stats: {
    total: { value: number; change: number };
    comparisons: { value: number; change: number };
    reports: { value: number; change: number };
  };
  onFilterClick: (type: FilterType) => void;
}

const KPISection = memo(({ stats, onFilterClick }: KPISectionProps) => {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      <KPICard
        icon={HistoryIcon}
        iconColor="#00C2FF"
        iconBg="rgba(0,194,255,0.15)"
        label="Total de Analises"
        value={stats.total.value}
        change={stats.total.change}
        subtitle="Ultimos 30 dias"
        onClick={() => onFilterClick("all")}
      />
      <KPICard
        icon={Users}
        iconColor="#7A5CFF"
        iconBg="rgba(122,92,255,0.15)"
        label="Comparacoes"
        value={stats.comparisons.value}
        change={stats.comparisons.change}
        subtitle="Analises comparativas"
        onClick={() => onFilterClick("comparison")}
      />
      <KPICard
        icon={FileText}
        iconColor="#00FF9C"
        iconBg="rgba(0,255,156,0.15)"
        label="Relatorios"
        value={stats.reports.value}
        change={stats.reports.change}
        subtitle="Relatorios gerados"
        onClick={() => onFilterClick("report")}
      />
    </div>
  );
});

KPISection.displayName = "KPISection";

interface KPICardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
  change: number;
  subtitle: string;
  onClick: () => void;
}

const KPICard = memo(({ icon: Icon, iconColor, iconBg, label, value, change, subtitle, onClick }: KPICardProps) => {
  return (
    <button
      onClick={onClick}
      className="group rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 text-left backdrop-blur-sm transition-all hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px]" style={{ background: iconBg }}>
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{label}</span>
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: change > 0 ? "rgba(0,255,156,0.15)" : "rgba(255,77,79,0.15)",
            color: change > 0 ? "#00FF9C" : "#FF4D4F",
          }}
        >
          <TrendingUp className="h-3 w-3" />
          {change > 0 ? "+" : ""}
          {change}%
        </div>
      </div>
      <p className="mb-2 text-4xl font-bold" style={{ color: iconColor }}>
        {value}
      </p>
      <p className="text-xs text-gray-600">{subtitle}</p>
    </button>
  );
});

KPICard.displayName = "KPICard";

interface FiltersSectionProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterType: FilterType;
  setFilterType: (value: FilterType) => void;
  filterTypeLabel: string;
  filterStatus: FilterStatus;
  setFilterStatus: (value: FilterStatus) => void;
  filterStatusLabel: string;
  filterPeriod: PeriodType;
  setFilterPeriod: (value: PeriodType) => void;
  filterClub: string;
  setFilterClub: (value: string) => void;
  availableClubs: string[];
  activeFiltersCount: number;
  onClearFilters: () => void;
}

const FiltersSection = memo(({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterTypeLabel,
  filterStatus,
  setFilterStatus,
  filterStatusLabel,
  filterPeriod,
  setFilterPeriod,
  filterClub,
  setFilterClub,
  availableClubs,
  activeFiltersCount,
  onClearFilters,
}: FiltersSectionProps) => {
  return (
    <div className="mb-8 rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 backdrop-blur-sm">
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Buscar por jogador, analista ou ID..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] pl-11 focus:border-[#00C2FF]"
          />
        </div>

        <div className="lg:col-span-2">
          <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
            <SelectTrigger className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
              <Filter className="mr-2 h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="border-[rgba(255,255,255,0.1)] bg-[#0A1B35]">
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
            <SelectTrigger className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-[rgba(255,255,255,0.1)] bg-[#0A1B35]">
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as PeriodType)}>
            <SelectTrigger className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent className="border-[rgba(255,255,255,0.1)] bg-[#0A1B35]">
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select value={filterClub} onValueChange={setFilterClub}>
            <SelectTrigger className="h-11 rounded-[12px] border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
              <SelectValue placeholder="Clube" />
            </SelectTrigger>
            <SelectContent className="border-[rgba(255,255,255,0.1)] bg-[#0A1B35]">
              <SelectItem value="all">Todos os clubes</SelectItem>
              {availableClubs.map((club) => (
                <SelectItem key={club} value={club}>
                  {club}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {filterType !== "all" && <FilterChip label={`Tipo: ${filterTypeLabel}`} onRemove={() => setFilterType("all")} />}
            {filterStatus !== "all" && (
              <FilterChip label={`Status: ${filterStatusLabel}`} onRemove={() => setFilterStatus("all")} />
            )}
            {filterClub !== "all" && <FilterChip label={`Clube: ${filterClub}`} onRemove={() => setFilterClub("all")} />}
            {searchQuery && <FilterChip label={`Busca: "${searchQuery}"`} onRemove={() => setSearchQuery("")} />}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="ml-auto rounded-[8px] text-gray-500 hover:bg-[rgba(255,255,255,0.04)] hover:text-gray-300"
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
});

FiltersSection.displayName = "FiltersSection";

const FilterChip = memo(({ label, onRemove }: { label: string; onRemove: () => void }) => {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs text-gray-300">
      {label}
      <button onClick={onRemove} className="transition-colors hover:text-white" aria-label={`Remover filtro ${label}`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
});

FilterChip.displayName = "FilterChip";

interface ActivityTableProps {
  data: AnalysisHistory[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  isLoading: boolean;
  deletingId: string | null;
  onViewReport: (item: AnalysisHistory) => void;
  onDelete: (item: AnalysisHistory) => void;
}

const ActivityTable = memo(({
  data,
  sortField,
  sortOrder,
  onSort,
  isLoading,
  deletingId,
  onViewReport,
  onDelete,
}: ActivityTableProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
            <tr>
              <TableHeader label="Tipo" field="type" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <th className="px-5 py-4 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500">Analise</th>
              <th className="px-5 py-4 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500">Jogadores</th>
              <TableHeader label="Analista" field="user" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <TableHeader label="Data" field="date" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <th className="px-5 py-4 text-left text-[10px] font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-5 py-4 text-center text-[10px] font-medium uppercase tracking-wider text-gray-500">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <ActivityRow
                key={item.id}
                item={item}
                deleting={deletingId === item.id}
                onViewReport={onViewReport}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ActivityTable.displayName = "ActivityTable";

interface TableHeaderProps {
  label: string;
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

const TableHeader = memo(({ label, field, sortField, sortOrder, onSort }: TableHeaderProps) => {
  const isActive = sortField === field;

  return (
    <th className="px-5 py-4 text-left">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-300"
      >
        {label}
        {isActive &&
          (sortOrder === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 text-[#00C2FF]" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-[#00C2FF]" />
          ))}
      </button>
    </th>
  );
});

TableHeader.displayName = "TableHeader";

const ActivityRow = memo(({
  item,
  deleting,
  onViewReport,
  onDelete,
}: {
  item: AnalysisHistory;
  deleting: boolean;
  onViewReport: (item: AnalysisHistory) => void;
  onDelete: (item: AnalysisHistory) => void;
}) => {
  const canDelete = item.canDelete;
  const canViewReport = !item.isLegacy;
  const deleteLabel = !canDelete
    ? "Remocao indisponivel"
    : item.deleteManagedBy === "scout_report"
      ? "Removivel via ScoutReport"
      : "Removivel via Analysis";

  return (
    <tr className="group transition-colors hover:bg-[rgba(255,255,255,0.02)]">
      <td className="px-5 py-4">
        <TypeBadge type={item.type} label={item.typeLabel} />
      </td>
      <td className="px-5 py-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-200">{item.title}</p>
          {item.description && <p className="max-w-[320px] text-xs text-gray-500">{item.description}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] ${item.isLegacy ? "text-[#fbbf24]" : "text-gray-500"}`}>{item.sourceLabel}</span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                canDelete
                  ? "border-[rgba(0,255,156,0.22)] text-[#9CFFD1]"
                  : "border-[rgba(251,191,36,0.28)] text-[#F8D98B]"
              }`}
              title={item.deleteHint}
            >
              {deleteLabel}
            </span>
          </div>
          <span className="font-mono text-xs text-gray-500">{item.id}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm text-gray-300">{item.players.join(", ")}</span>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm text-[#00C2FF]">{item.user}</span>
      </td>
      <td className="px-5 py-4">
        <span className="tabular-nums text-xs text-gray-500">
          {new Date(item.date).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={item.status} label={item.statusLabel} />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {canViewReport ? (
            <ActionButton icon={Eye} tooltip="Ver relatorio" onClick={() => onViewReport(item)} />
          ) : (
            <span
              className="text-center text-[11px] text-gray-500"
              title={
                item.type === "report"
                  ? "Visualizacao detalhada disponivel apenas para relatorios persistidos na central Analysis."
                  : "Visualizacao detalhada desta analise ainda nao esta habilitada."
              }
            >
              Sem viewer
            </span>
          )}
          {canDelete ? (
            <ActionButton
              icon={Trash2}
              tooltip={deleting ? "Excluindo..." : item.deleteHint}
              variant="danger"
              disabled={deleting}
              onClick={() => onDelete(item)}
            />
          ) : (
            <span className="text-center text-[11px] text-[#F8D98B]" title={item.deleteHint}>
              Gerenciado pelo legado
            </span>
          )}
        </div>
      </td>
    </tr>
  );
});

ActivityRow.displayName = "ActivityRow";

const TypeBadge = memo(({ type, label }: { type: AnalysisHistory["type"]; label: string }) => {
  const colors = TYPE_BADGE_STYLES[type] ?? FALLBACK_BADGE_STYLE;

  return (
    <span
      className="inline-flex items-center rounded-[6px] border px-2.5 py-1 text-[10px] font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {label}
    </span>
  );
});

TypeBadge.displayName = "TypeBadge";

const StatusBadge = memo(({ status, label }: { status: AnalysisHistory["status"]; label: string }) => {
  const colors = STATUS_BADGE_STYLES[status] ?? FALLBACK_BADGE_STYLE;

  return (
    <span
      className="inline-flex items-center rounded-[6px] border px-2.5 py-1 text-[10px] font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

const ActionButton = memo(({
  icon: Icon,
  tooltip,
  variant = "default",
  disabled = false,
  onClick,
}: {
  icon: React.ElementType;
  tooltip: string;
  variant?: "default" | "danger";
  disabled?: boolean;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors ${
        variant === "danger"
          ? "hover:bg-[rgba(255,77,79,0.15)] hover:text-[#FF4D4F]"
          : "hover:bg-[rgba(0,194,255,0.15)] hover:text-[#00C2FF]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      title={tooltip}
      aria-label={tooltip}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
});

ActionButton.displayName = "ActionButton";

const EmptyState = memo(() => {
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-16 text-center backdrop-blur-sm">
      <div className="mx-auto max-w-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[14px] bg-[rgba(0,194,255,0.08)]">
          <HistoryIcon className="h-8 w-8 text-[#00C2FF]/60" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-200">Sem registros no período</h3>
        <p className="text-sm leading-relaxed text-gray-500">
          Salve manualmente uma análise, comparação ou relatório para que ela apareça aqui.
        </p>
        <p className="mt-3 text-xs text-gray-600">
          Dica: use o botão <span className="text-[#00C2FF]">"Salvar no histórico"</span> disponível nas páginas de análise e comparação.
        </p>
      </div>
    </div>
  );
});

EmptyState.displayName = "EmptyState";

const LoadingState = memo(() => {
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-16 text-center backdrop-blur-sm">
      <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#00C2FF]" />
      <p className="text-sm text-gray-500">Carregando analises...</p>
    </div>
  );
});

LoadingState.displayName = "LoadingState";
