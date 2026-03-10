import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  History as HistoryIcon,
  Users,
  FileText,
  Plus,
  Download,
  Search,
  Filter,
  X,
  ChevronDown,
  Eye,
  Copy,
  Trash2,
  MoreVertical,
  TrendingUp,
  Calendar,
  ChevronUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useMemo, memo } from "react";

interface AnalysisHistory {
  id: string;
  date: string;
  type: "Comparação" | "Relatório" | "Dashboard";
  players: string[];
  user: string;
  club: string;
  status: "Concluído" | "Em andamento" | "Arquivado";
}

const mockHistory: AnalysisHistory[] = [
  {
    id: "AH-001",
    date: "2026-02-26T14:35:00",
    type: "Comparação",
    players: ["Gabriel Barbosa", "Pedro Guilherme"],
    user: "João Silva",
    club: "Corinthians",
    status: "Concluído",
  },
  {
    id: "AH-002",
    date: "2026-02-25T11:20:00",
    type: "Relatório",
    players: ["Vitor Roque"],
    user: "Maria Oliveira",
    club: "Flamengo",
    status: "Concluído",
  },
  {
    id: "AH-003",
    date: "2026-02-24T16:45:00",
    type: "Comparação",
    players: ["Luiz Henrique", "Gabriel Barbosa"],
    user: "João Silva",
    club: "Corinthians",
    status: "Concluído",
  },
  {
    id: "AH-004",
    date: "2026-02-23T09:15:00",
    type: "Dashboard",
    players: ["Elenco Completo"],
    user: "Carlos Mendes",
    club: "Palmeiras",
    status: "Em andamento",
  },
  {
    id: "AH-005",
    date: "2026-02-22T13:30:00",
    type: "Relatório",
    players: ["Pedro Guilherme"],
    user: "Maria Oliveira",
    club: "Flamengo",
    status: "Concluído",
  },
];

type FilterType = "all" | "Comparação" | "Relatório" | "Dashboard";
type PeriodType = "7d" | "30d" | "90d" | "custom";
type SortField = "date" | "type" | "user";
type SortOrder = "asc" | "desc";

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterPeriod, setFilterPeriod] = useState<PeriodType>("30d");
  const [filterClub, setFilterClub] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLoading, setIsLoading] = useState(false);

  // Filter and sort logic
  const filteredData = useMemo(() => {
    let filtered = [...mockHistory];

    // Search
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.players.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.user.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    // Club filter
    if (filterClub !== "all") {
      filtered = filtered.filter((item) => item.club === filterClub);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === "type") {
        comparison = a.type.localeCompare(b.type);
      } else if (sortField === "user") {
        comparison = a.user.localeCompare(b.user);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [searchQuery, filterType, filterClub, sortField, sortOrder]);

  const stats = useMemo(() => {
    const total = mockHistory.length;
    const comparisons = mockHistory.filter((h) => h.type === "Comparação").length;
    const reports = mockHistory.filter((h) => h.type === "Relatório").length;

    return {
      total: { value: total, change: +12 },
      comparisons: { value: comparisons, change: +8 },
      reports: { value: reports, change: +15 },
    };
  }, []);

  const activeFiltersCount = [
    filterType !== "all",
    filterClub !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterClub("all");
    setFilterPeriod("30d");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            {/* Header with Actions */}
            <HeaderSection />

            {/* KPI Cards */}
            <KPISection stats={stats} onFilterClick={setFilterType} />

            {/* Filters Bar */}
            <FiltersSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              filterPeriod={filterPeriod}
              setFilterPeriod={setFilterPeriod}
              filterClub={filterClub}
              setFilterClub={setFilterClub}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={handleClearFilters}
            />

            {/* Activity Table */}
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

// ========================================
// HEADER SECTION
// ========================================
const HeaderSection = memo(() => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
      <div>
        <h1 className="text-4xl font-semibold mb-3">Análises</h1>
        <p className="text-sm text-gray-500">
          Hub de monitoramento estratégico de análises e comparações
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
          Nova Análise
        </Button>
      </div>
    </div>
  );
});

HeaderSection.displayName = "HeaderSection";

// ========================================
// KPI SECTION
// ========================================
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
        label="Total de Análises"
        value={stats.total.value}
        change={stats.total.change}
        subtitle="Últimos 30 dias"
        onClick={() => onFilterClick("all")}
      />
      <KPICard
        icon={Users}
        iconColor="#7A5CFF"
        iconBg="rgba(122,92,255,0.15)"
        label="Comparações"
        value={stats.comparisons.value}
        change={stats.comparisons.change}
        subtitle="Análises comparativas"
        onClick={() => onFilterClick("Comparação")}
      />
      <KPICard
        icon={FileText}
        iconColor="#00FF9C"
        iconBg="rgba(0,255,156,0.15)"
        label="Relatórios"
        value={stats.reports.value}
        change={stats.reports.change}
        subtitle="Relatórios gerados"
        onClick={() => onFilterClick("Relatório")}
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

const KPICard = memo(({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  change,
  subtitle,
  onClick,
}: KPICardProps) => {
  return (
    <button
      onClick={onClick}
      className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] p-6 border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center"
            style={{ background: iconBg }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            {label}
          </span>
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

// ========================================
// FILTERS SECTION
// ========================================
interface FiltersSectionProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterType: FilterType;
  setFilterType: (value: FilterType) => void;
  filterPeriod: PeriodType;
  setFilterPeriod: (value: PeriodType) => void;
  filterClub: string;
  setFilterClub: (value: string) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

const FiltersSection = memo(({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterPeriod,
  setFilterPeriod,
  filterClub,
  setFilterClub,
  activeFiltersCount,
  onClearFilters,
}: FiltersSectionProps) => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] p-6 border border-[rgba(255,255,255,0.06)] mb-8">
      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Buscar por jogador, analista ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] focus:border-[#00C2FF] rounded-[12px] h-11"
          />
        </div>

        {/* Type Filter */}
        <div className="lg:col-span-3">
          <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
            <SelectTrigger className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[12px] h-11">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="Comparação">Comparação</SelectItem>
              <SelectItem value="Relatório">Relatório</SelectItem>
              <SelectItem value="Dashboard">Dashboard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Period Filter */}
        <div className="lg:col-span-2">
          <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as PeriodType)}>
            <SelectTrigger className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[12px] h-11">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Club Filter */}
        <div className="lg:col-span-3">
          <Select value={filterClub} onValueChange={setFilterClub}>
            <SelectTrigger className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[12px] h-11">
              <SelectValue placeholder="Clube" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
              <SelectItem value="all">Todos os clubes</SelectItem>
              <SelectItem value="Corinthians">Corinthians</SelectItem>
              <SelectItem value="Flamengo">Flamengo</SelectItem>
              <SelectItem value="Palmeiras">Palmeiras</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {filterType !== "all" && (
              <FilterChip label={`Tipo: ${filterType}`} onRemove={() => setFilterType("all")} />
            )}
            {filterClub !== "all" && (
              <FilterChip label={`Clube: ${filterClub}`} onRemove={() => setFilterClub("all")} />
            )}
            {searchQuery && (
              <FilterChip label={`Busca: "${searchQuery}"`} onRemove={() => setSearchQuery("")} />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs text-gray-500 hover:text-gray-300 ml-auto"
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
    <div className="flex items-center gap-1.5 bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.3)] rounded-[8px] px-2.5 py-1">
      <span className="text-xs text-[#00C2FF]">{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-[rgba(0,194,255,0.2)] rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3 text-[#00C2FF]" />
      </button>
    </div>
  );
});

FilterChip.displayName = "FilterChip";

// ========================================
// ACTIVITY TABLE
// ========================================
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
        <table className="w-full">
          <thead className="sticky top-0 bg-[rgba(255,255,255,0.04)] backdrop-blur-sm z-10 border-b border-[rgba(255,255,255,0.06)]">
            <tr>
              <TableHeader label="Tipo" field="type" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <th className="text-left py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                ID
              </th>
              <th className="text-left py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                Jogadores
              </th>
              <TableHeader label="Responsável" field="user" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <TableHeader label="Data/Hora" field="date" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <th className="text-center py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                Status
              </th>
              <th className="text-center py-4 px-5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
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
        {isActive && (
          sortOrder === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#00C2FF]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#00C2FF]" />
          )
        )}
      </button>
    </th>
  );
});

TableHeader.displayName = "TableHeader";

const ActivityRow = memo(({ item }: { item: AnalysisHistory }) => {
  return (
    <tr className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
      <td className="py-4 px-5">
        <TypeBadge type={item.type} />
      </td>
      <td className="py-4 px-5">
        <span className="text-xs text-gray-500 font-mono">{item.id}</span>
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
        <StatusBadge status={item.status} />
      </td>
      <td className="py-4 px-5">
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton icon={Eye} tooltip="Ver detalhes" />
          <ActionButton icon={Copy} tooltip="Duplicar" />
          <ActionButton icon={FileText} tooltip="Gerar relatório" />
          <ActionButton icon={Trash2} tooltip="Excluir" variant="danger" />
        </div>
      </td>
    </tr>
  );
});

ActivityRow.displayName = "ActivityRow";

const TypeBadge = memo(({ type }: { type: string }) => {
  const config = {
    Comparação: { bg: "rgba(122,92,255,0.15)", text: "#7A5CFF", border: "rgba(122,92,255,0.3)" },
    Relatório: { bg: "rgba(0,255,156,0.15)", text: "#00FF9C", border: "rgba(0,255,156,0.3)" },
    Dashboard: { bg: "rgba(0,194,255,0.15)", text: "#00C2FF", border: "rgba(0,194,255,0.3)" },
  };

  const colors = config[type as keyof typeof config];

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-[10px] rounded-[6px] font-semibold border"
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {type}
    </span>
  );
});

TypeBadge.displayName = "TypeBadge";

const StatusBadge = memo(({ status }: { status: string }) => {
  const config = {
    Concluído: { bg: "rgba(0,255,156,0.15)", text: "#00FF9C", border: "rgba(0,255,156,0.3)" },
    "Em andamento": { bg: "rgba(251,191,36,0.15)", text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
    Arquivado: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
  };

  const colors = config[status as keyof typeof config];

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-[10px] rounded-[6px] font-semibold border"
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {status}
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

// ========================================
// EMPTY & LOADING STATES
// ========================================
const EmptyState = memo(() => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-[rgba(0,194,255,0.1)] rounded-[14px] flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-[#00C2FF]" />
        </div>
        <h3 className="text-xl font-semibold mb-3">Nenhuma análise encontrada</h3>
        <p className="text-sm text-gray-500 mb-6">
          Ajuste os filtros ou crie uma nova análise para começar
        </p>
        <Button className="bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] rounded-[12px] h-11 px-6 font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Nova Análise
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
      <p className="text-sm text-gray-500">Carregando análises...</p>
    </div>
  );
});

LoadingState.displayName = "LoadingState";
