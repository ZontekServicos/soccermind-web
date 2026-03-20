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
  Copy,
  Download,
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
import { getAnalyses, type AnalysisViewModel as AnalysisHistory } from "../services/analysis";

type FilterType = "all" | AnalysisHistory["type"];
type PeriodType = "7d" | "30d" | "90d" | "custom";
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

const TYPE_BADGE_STYLES: Record<AnalysisHistory["type"], BadgeStyle> = {
  comparison: { bg: "rgba(122,92,255,0.15)", text: "#7A5CFF", border: "rgba(122,92,255,0.3)" },
  report: { bg: "rgba(0,255,156,0.15)", text: "#00FF9C", border: "rgba(0,255,156,0.3)" },
};

const STATUS_BADGE_STYLES: Record<AnalysisHistory["status"], BadgeStyle> = {
  completed: { bg: "rgba(0,255,156,0.15)", text: "#00FF9C", border: "rgba(0,255,156,0.3)" },
  in_progress: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  archived: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
};

const TYPE_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: "all", label: "Todos os tipos" },
  { value: "comparison", label: "Comparacao" },
  { value: "report", label: "Relatorio" },
];

export default function History() {
  const [historyItems, setHistoryItems] = useState<AnalysisHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterPeriod, setFilterPeriod] = useState<PeriodType>("30d");
  const [filterClub, setFilterClub] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      setIsLoading(true);

      try {
        const response = await getAnalyses();
        if (!active) {
          return;
        }

        setHistoryItems(Array.isArray(response.data) ? response.data : []);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
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
          item.players.some((player) => player.toLowerCase().includes(normalizedQuery)) ||
          item.user.toLowerCase().includes(normalizedQuery),
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    if (filterClub !== "all") {
      filtered = filtered.filter((item) => item.club === filterClub);
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
  }, [filterClub, filterType, historyItems, searchQuery, sortField, sortOrder]);

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

  const activeFiltersCount = [filterType !== "all", filterClub !== "all", searchQuery !== ""].filter(Boolean).length;

  const filterTypeLabel =
    filterType === "all" ? "Todos os tipos" : TYPE_OPTIONS.find((option) => option.value === filterType)?.label ?? filterType;

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
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

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            <HeaderSection />
            <KPISection stats={stats} onFilterClick={setFilterType} />
            <FiltersSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              filterTypeLabel={filterTypeLabel}
              filterPeriod={filterPeriod}
              setFilterPeriod={setFilterPeriod}
              filterClub={filterClub}
              setFilterClub={setFilterClub}
              availableClubs={availableClubs}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={handleClearFilters}
            />
            <ActivityTable
              data={filteredData}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

const HeaderSection = memo(() => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
      <div>
        <h1 className="text-4xl font-semibold mb-3">Analises</h1>
        <p className="text-sm text-gray-500">
          Hub de monitoramento estrategico de analises e comparacoes
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] rounded-[12px] h-11 px-5"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button className="bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] rounded-[12px] h-11 px-6 font-semibold shadow-[0_4px_16px_rgba(0,194,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,194,255,0.35)] transition-all">
          <Plus className="w-4 h-4 mr-2" />
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
      className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] p-6 border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: iconBg }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</span>
        </div>
        <div
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: change > 0 ? "rgba(0,255,156,0.15)" : "rgba(255,77,79,0.15)",
            color: change > 0 ? "#00FF9C" : "#FF4D4F",
          }}
        >
          <TrendingUp className="w-3 h-3" />
          {change > 0 ? "+" : ""}
          {change}%
        </div>
      </div>
      <p className="text-4xl font-bold mb-2" style={{ color: iconColor }}>
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
  filterPeriod,
  setFilterPeriod,
  filterClub,
  setFilterClub,
  availableClubs,
  activeFiltersCount,
  onClearFilters,
}: FiltersSectionProps) => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] p-6 border border-[rgba(255,255,255,0.06)] mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Buscar por jogador, analista ou ID..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-11 bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] focus:border-[#00C2FF] rounded-[12px] h-11"
          />
        </div>

        <div className="lg:col-span-3">
          <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
            <SelectTrigger className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[12px] h-11">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as PeriodType)}>
            <SelectTrigger className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[12px] h-11">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
              <SelectItem value="7d">Ultimos 7 dias</SelectItem>
              <SelectItem value="30d">Ultimos 30 dias</SelectItem>
              <SelectItem value="90d">Ultimos 90 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-3">
          <Select value={filterClub} onValueChange={setFilterClub}>
            <SelectTrigger className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[12px] h-11">
              <SelectValue placeholder="Clube" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
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
          <div className="flex items-center gap-2 flex-wrap">
            {filterType !== "all" && <FilterChip label={`Tipo: ${filterTypeLabel}`} onRemove={() => setFilterType("all")} />}
            {filterClub !== "all" && <FilterChip label={`Clube: ${filterClub}`} onRemove={() => setFilterClub("all")} />}
            {searchQuery && <FilterChip label={`Busca: "${searchQuery}"`} onRemove={() => setSearchQuery("")} />}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="ml-auto text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.04)] rounded-[8px]"
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
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-xs text-gray-300">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors" aria-label={`Remover filtro ${label}`}>
        <X className="w-3 h-3" />
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
}

const ActivityTable = memo(({ data, sortField, sortOrder, onSort, isLoading }: ActivityTableProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
            <tr>
              <TableHeader label="Tipo" field="type" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <th className="text-left py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Analise</th>
              <th className="text-left py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Jogadores</th>
              <TableHeader label="Analista" field="user" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <TableHeader label="Data" field="date" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <th className="text-left py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Status</th>
              <th className="text-center py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <ActivityRow key={item.id} item={item} />
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
    <th className="text-left py-4 px-5">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider font-medium hover:text-gray-300 transition-colors"
      >
        {label}
        {isActive &&
          (sortOrder === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#00C2FF]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#00C2FF]" />
          ))}
      </button>
    </th>
  );
});

TableHeader.displayName = "TableHeader";

const ActivityRow = memo(({ item }: { item: AnalysisHistory }) => {
  return (
    <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
      <td className="py-4 px-5">
        <TypeBadge type={item.type} label={item.typeLabel} />
      </td>
      <td className="py-4 px-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-200">{item.title}</p>
          <span className="text-xs text-gray-500 font-mono">{item.id}</span>
        </div>
      </td>
      <td className="py-4 px-5">
        <span className="text-sm text-gray-300">{item.players.join(", ")}</span>
      </td>
      <td className="py-4 px-5">
        <span className="text-sm text-[#00C2FF]">{item.user}</span>
      </td>
      <td className="py-4 px-5">
        <span className="text-xs text-gray-500 tabular-nums">
          {new Date(item.date).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </td>
      <td className="py-4 px-5">
        <StatusBadge status={item.status} label={item.statusLabel} />
      </td>
      <td className="py-4 px-5">
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton icon={Copy} tooltip="Duplicar" />
          <ActionButton icon={FileText} tooltip="Gerar relatorio" />
          <ActionButton icon={Trash2} tooltip="Excluir" variant="danger" />
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
      className="inline-flex items-center px-2.5 py-1 text-[10px] rounded-[6px] font-semibold border"
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
      className="inline-flex items-center px-2.5 py-1 text-[10px] rounded-[6px] font-semibold border"
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
}: {
  icon: React.ElementType;
  tooltip: string;
  variant?: "default" | "danger";
}) => {
  return (
    <button
      className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
        variant === "danger"
          ? "hover:bg-[rgba(255,77,79,0.15)] hover:text-[#FF4D4F]"
          : "hover:bg-[rgba(0,194,255,0.15)] hover:text-[#00C2FF]"
      }`}
      title={tooltip}
      aria-label={tooltip}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
});

ActionButton.displayName = "ActionButton";

const EmptyState = memo(() => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-[rgba(0,194,255,0.1)] rounded-[14px] flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-[#00C2FF]" />
        </div>
        <h3 className="text-xl font-semibold mb-3">Nenhuma analise encontrada</h3>
        <p className="text-sm text-gray-500 mb-6">
          Ajuste os filtros ou crie uma nova analise para comecar
        </p>
        <Button className="bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] rounded-[12px] h-11 px-6 font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Nova Analise
        </Button>
      </div>
    </div>
  );
});

EmptyState.displayName = "EmptyState";

const LoadingState = memo(() => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-16 text-center">
      <Loader2 className="w-12 h-12 text-[#00C2FF] animate-spin mx-auto mb-4" />
      <p className="text-sm text-gray-500">Carregando analises...</p>
    </div>
  );
});

LoadingState.displayName = "LoadingState";
