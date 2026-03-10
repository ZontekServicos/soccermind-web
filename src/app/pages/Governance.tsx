import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Shield,
  User,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Plus,
  Download,
  Search,
  Filter,
  X,
  Eye,
  Copy,
  FileDown,
  MoreVertical,
  TrendingUp,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useMemo, memo } from "react";

interface GovernanceRecord {
  id: string;
  date: string;
  requestedBy: string;
  role: string;
  player: string;
  action: string;
  justification: string;
  status: "Aprovado" | "Pendente" | "Em Análise" | "Reprovado";
  approvedBy?: string;
  area: string;
  version: string;
  lastUpdate: string;
  createdBy: string;
  reviewedBy?: string;
}

const mockRecords: GovernanceRecord[] = [
  {
    id: "GOV-2026-001",
    date: "2026-02-20T14:35:00",
    requestedBy: "João Silva",
    role: "Diretor Executivo",
    player: "Gabriel Barbosa",
    action: "Análise Comparativa Completa",
    justification:
      "Avaliação para renovação contratual. Necessário comparar com opções do mercado antes da decisão final.",
    status: "Aprovado",
    approvedBy: "Ricardo Santos (Presidente)",
    area: "Gestão de Elenco",
    version: "1.2",
    lastUpdate: "2026-02-21T10:15:00",
    createdBy: "João Silva",
    reviewedBy: "Maria Oliveira",
  },
  {
    id: "GOV-2026-002",
    date: "2026-02-18T11:20:00",
    requestedBy: "Maria Oliveira",
    role: "Scout Chefe",
    player: "Vitor Roque",
    action: "Relatório de Risco Estrutural",
    justification:
      "Monitoramento de ativo estratégico. Verificar evolução no clube europeu e possibilidade de retorno.",
    status: "Aprovado",
    approvedBy: "João Silva (Diretor Executivo)",
    area: "Scouting",
    version: "1.0",
    lastUpdate: "2026-02-18T16:45:00",
    createdBy: "Maria Oliveira",
    reviewedBy: "Carlos Mendes",
  },
  {
    id: "GOV-2026-003",
    date: "2026-02-15T09:15:00",
    requestedBy: "Carlos Mendes",
    role: "Diretor Financeiro",
    player: "Pedro Guilherme",
    action: "Análise de Capital Efficiency",
    justification: "Avaliação de custo-benefício para planejamento orçamentário 2026/2027.",
    status: "Em Análise",
    area: "Financeiro",
    version: "1.0",
    lastUpdate: "2026-02-16T14:30:00",
    createdBy: "Carlos Mendes",
  },
  {
    id: "GOV-2026-004",
    date: "2026-02-12T16:45:00",
    requestedBy: "João Silva",
    role: "Diretor Executivo",
    player: "Luiz Henrique",
    action: "Relatório Completo de Liquidez",
    justification:
      "Análise de oportunidade de mercado. Clube europeu demonstrou interesse e necessitamos avaliar o timing ideal de venda.",
    status: "Aprovado",
    approvedBy: "Ricardo Santos (Presidente)",
    area: "Gestão de Elenco",
    version: "1.1",
    lastUpdate: "2026-02-13T11:20:00",
    createdBy: "João Silva",
    reviewedBy: "Maria Oliveira",
  },
  {
    id: "GOV-2026-005",
    date: "2026-02-10T13:30:00",
    requestedBy: "Maria Oliveira",
    role: "Scout Chefe",
    player: "Gabriel Barbosa",
    action: "Atualização de Anti-Flop Index",
    justification: "Monitoramento trimestral de performance. Verificar se métricas se mantêm dentro do esperado.",
    status: "Aprovado",
    approvedBy: "João Silva (Diretor Executivo)",
    area: "Scouting",
    version: "1.0",
    lastUpdate: "2026-02-10T17:00:00",
    createdBy: "Maria Oliveira",
  },
];

type FilterStatus = "all" | "Aprovado" | "Pendente" | "Em Análise" | "Reprovado";
type PeriodType = "7d" | "30d" | "90d" | "custom";

export default function Governance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPeriod, setFilterPeriod] = useState<PeriodType>("30d");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  const filteredData = useMemo(() => {
    let filtered = [...mockRecords];

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    if (filterArea !== "all") {
      filtered = filtered.filter((item) => item.area === filterArea);
    }

    return filtered;
  }, [searchQuery, filterStatus, filterArea]);

  const stats = useMemo(() => {
    const total = mockRecords.length;
    const approved = mockRecords.filter((r) => r.status === "Aprovado").length;
    const inAnalysis = mockRecords.filter((r) => r.status === "Em Análise").length;
    const activeUsers = new Set(mockRecords.map((r) => r.requestedBy)).size;

    return {
      total: { value: total, change: +18 },
      approved: { value: approved, change: +25 },
      inAnalysis: { value: inAnalysis, change: -10 },
      activeUsers: { value: activeUsers, change: +5 },
    };
  }, []);

  const activeFiltersCount = [
    filterStatus !== "all",
    filterArea !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterArea("all");
    setFilterPeriod("30d");
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecords(newExpanded);
  };

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            {/* Header Section */}
            <HeaderSection />

            {/* KPI Section */}
            <KPISection stats={stats} onFilterClick={setFilterStatus} />

            {/* Filters Section */}
            <FiltersSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterPeriod={filterPeriod}
              setFilterPeriod={setFilterPeriod}
              filterArea={filterArea}
              setFilterArea={setFilterArea}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={handleClearFilters}
            />

            {/* Records List */}
            <RecordsSection
              records={filteredData}
              expandedRecords={expandedRecords}
              onToggleExpand={toggleExpand}
            />

            {/* Compliance Notice */}
            <ComplianceSection />
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
        <h1 className="text-4xl font-semibold mb-3">Governança</h1>
        <p className="text-sm text-gray-500">Controle executivo e rastreabilidade de decisões estratégicas</p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] rounded-[12px] h-11 px-5"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Auditoria
        </Button>
        <Button className="bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] rounded-[12px] h-11 px-6 font-semibold shadow-[0_4px_16px_rgba(0,194,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,194,255,0.35)] transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Novo Registro
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
    approved: { value: number; change: number };
    inAnalysis: { value: number; change: number };
    activeUsers: { value: number; change: number };
  };
  onFilterClick: (status: FilterStatus) => void;
}

const KPISection = memo(({ stats, onFilterClick }: KPISectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <KPICard
        icon={FileText}
        iconColor="#00C2FF"
        iconBg="rgba(0,194,255,0.15)"
        label="Total de Registros"
        value={stats.total.value}
        change={stats.total.change}
        subtitle="Últimos 30 dias"
        onClick={() => onFilterClick("all")}
      />
      <KPICard
        icon={CheckCircle}
        iconColor="#00FF9C"
        iconBg="rgba(0,255,156,0.15)"
        label="Aprovados"
        value={stats.approved.value}
        change={stats.approved.change}
        subtitle="Decisões finalizadas"
        onClick={() => onFilterClick("Aprovado")}
      />
      <KPICard
        icon={Clock}
        iconColor="#fbbf24"
        iconBg="rgba(251,191,36,0.15)"
        label="Em Análise"
        value={stats.inAnalysis.value}
        change={stats.inAnalysis.change}
        subtitle="Aguardando aprovação"
        onClick={() => onFilterClick("Em Análise")}
      />
      <KPICard
        icon={User}
        iconColor="#7A5CFF"
        iconBg="rgba(122,92,255,0.15)"
        label="Usuários Ativos"
        value={stats.activeUsers.value}
        change={stats.activeUsers.change}
        subtitle="Executivos e analistas"
        onClick={() => {}}
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

// ========================================
// FILTERS SECTION
// ========================================
interface FiltersSectionProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (value: FilterStatus) => void;
  filterPeriod: PeriodType;
  setFilterPeriod: (value: PeriodType) => void;
  filterArea: string;
  setFilterArea: (value: string) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

const FiltersSection = memo(
  ({
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPeriod,
    setFilterPeriod,
    filterArea,
    setFilterArea,
    activeFiltersCount,
    onClearFilters,
  }: FiltersSectionProps) => {
    return (
      <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] p-6 border border-[rgba(255,255,255,0.06)] mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar por ID, jogador ou responsável..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] focus:border-[#00C2FF] rounded-[12px] h-11"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[12px] h-11">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Em Análise">Em Análise</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Reprovado">Reprovado</SelectItem>
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

          {/* Area Filter */}
          <div className="lg:col-span-3">
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[12px] h-11">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
                <SelectItem value="all">Todas as áreas</SelectItem>
                <SelectItem value="Gestão de Elenco">Gestão de Elenco</SelectItem>
                <SelectItem value="Scouting">Scouting</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
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
              {filterStatus !== "all" && (
                <FilterChip label={`Status: ${filterStatus}`} onRemove={() => setFilterStatus("all")} />
              )}
              {filterArea !== "all" && (
                <FilterChip label={`Área: ${filterArea}`} onRemove={() => setFilterArea("all")} />
              )}
              {searchQuery && <FilterChip label={`Busca: "${searchQuery}"`} onRemove={() => setSearchQuery("")} />}
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
  }
);

FiltersSection.displayName = "FiltersSection";

const FilterChip = memo(({ label, onRemove }: { label: string; onRemove: () => void }) => {
  return (
    <div className="flex items-center gap-1.5 bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.3)] rounded-[8px] px-2.5 py-1">
      <span className="text-xs text-[#00C2FF]">{label}</span>
      <button onClick={onRemove} className="hover:bg-[rgba(0,194,255,0.2)] rounded-full p-0.5 transition-colors">
        <X className="w-3 h-3 text-[#00C2FF]" />
      </button>
    </div>
  );
});

FilterChip.displayName = "FilterChip";

// ========================================
// RECORDS SECTION
// ========================================
interface RecordsSectionProps {
  records: GovernanceRecord[];
  expandedRecords: Set<string>;
  onToggleExpand: (id: string) => void;
}

const RecordsSection = memo(({ records, expandedRecords, onToggleExpand }: RecordsSectionProps) => {
  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4 mb-8">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          isExpanded={expandedRecords.has(record.id)}
          onToggleExpand={() => onToggleExpand(record.id)}
        />
      ))}
    </div>
  );
});

RecordsSection.displayName = "RecordsSection";

interface RecordCardProps {
  record: GovernanceRecord;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const RecordCard = memo(({ record, isExpanded, onToggleExpand }: RecordCardProps) => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] overflow-hidden hover:border-[rgba(255,255,255,0.1)] transition-all group">
      <div className="p-6">
        {/* Line 1: ID + Status + Date */}
        <div className="flex items-start justify-between mb-5 pb-5 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-[#00C2FF] font-mono">{record.id}</h3>
            <StatusBadge status={record.status} />
            <div className="flex items-center gap-1.5 text-xs text-gray-500 tabular-nums">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(record.date).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionButton icon={Eye} tooltip="Ver detalhes" />
            <ActionButton icon={FileDown} tooltip="Baixar PDF" />
            <ActionButton icon={Copy} tooltip="Duplicar decisão" />
          </div>
        </div>

        {/* Line 2: Solicitante + Aprovador + Área */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          <MetaField label="Solicitante" value={`${record.requestedBy} (${record.role})`} icon={User} />
          <MetaField
            label={record.status === "Aprovado" ? "Aprovado Por" : "Status"}
            value={record.approvedBy || "Aguardando aprovação"}
            icon={CheckCircle}
            color={record.approvedBy ? "#00FF9C" : "#fbbf24"}
          />
          <MetaField label="Área Responsável" value={record.area} icon={Shield} />
        </div>

        {/* Line 3: Jogador + Ação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Jogador</p>
            <p className="text-sm font-semibold text-gray-200">{record.player}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Ação Solicitada</p>
            <p className="text-sm font-semibold text-gray-200">{record.action}</p>
          </div>
        </div>

        {/* Line 4: Justificativa (truncated) */}
        <div className="pt-5 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Justificativa Técnica</p>
          <p className={`text-sm text-gray-400 leading-relaxed ${!isExpanded && "line-clamp-2"}`}>
            {record.justification}
          </p>
          {record.justification.length > 100 && (
            <button
              onClick={onToggleExpand}
              className="text-xs text-[#00C2FF] hover:text-[#00a8e0] mt-2 flex items-center gap-1 transition-colors"
            >
              {isExpanded ? (
                <>
                  Ver menos <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Ver mais <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Audit Trail (shown when expanded) */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-4">Trilha de Auditoria</p>
            <div className="space-y-3">
              <AuditItem
                label="Criado por"
                value={record.createdBy}
                timestamp={record.date}
                color="#00C2FF"
              />
              {record.reviewedBy && (
                <AuditItem
                  label="Revisado por"
                  value={record.reviewedBy}
                  timestamp={record.lastUpdate}
                  color="#7A5CFF"
                />
              )}
              {record.approvedBy && (
                <AuditItem
                  label="Aprovado por"
                  value={record.approvedBy}
                  timestamp={record.lastUpdate}
                  color="#00FF9C"
                />
              )}
            </div>
            <div className="mt-4 flex items-center gap-6 text-xs text-gray-600">
              <span>Versão: {record.version}</span>
              <span>
                Última atualização:{" "}
                {new Date(record.lastUpdate).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

RecordCard.displayName = "RecordCard";

interface MetaFieldProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
}

const MetaField = memo(({ label, value, icon: Icon, color = "#00C2FF" }: MetaFieldProps) => {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm text-gray-300 truncate">{value}</p>
      </div>
    </div>
  );
});

MetaField.displayName = "MetaField";

interface AuditItemProps {
  label: string;
  value: string;
  timestamp: string;
  color: string;
}

const AuditItem = memo(({ label, value, timestamp, color }: AuditItemProps) => {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-gray-500 min-w-[120px]">{label}</span>
      <span className="text-gray-300 font-medium flex-1">{value}</span>
      <span className="text-xs text-gray-600 tabular-nums">
        {new Date(timestamp).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
});

AuditItem.displayName = "AuditItem";

const StatusBadge = memo(({ status }: { status: string }) => {
  const config = {
    Aprovado: { bg: "rgba(0,255,156,0.15)", text: "#00FF9C", border: "rgba(0,255,156,0.3)" },
    Pendente: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
    "Em Análise": { bg: "rgba(251,191,36,0.15)", text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
    Reprovado: { bg: "rgba(255,77,79,0.15)", text: "#FF4D4F", border: "rgba(255,77,79,0.3)" },
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

const ActionButton = memo(
  ({ icon: Icon, tooltip }: { icon: React.ElementType; tooltip: string }) => {
    return (
      <button
        className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[rgba(0,194,255,0.15)] hover:text-[#00C2FF]"
        title={tooltip}
        aria-label={tooltip}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  }
);

ActionButton.displayName = "ActionButton";

// ========================================
// COMPLIANCE SECTION
// ========================================
const ComplianceSection = memo(() => {
  return (
    <div className="bg-gradient-to-br from-[rgba(0,255,156,0.05)] to-[rgba(0,194,255,0.05)] backdrop-blur-sm rounded-[18px] border border-[rgba(0,255,156,0.2)] p-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-[rgba(0,255,156,0.15)] rounded-[12px] flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-[#00FF9C]" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-3">Conformidade e Transparência</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Todos os registros são mantidos de acordo com as diretrizes de governança corporativa do clube. O sistema
            garante rastreabilidade completa de todas as decisões estratégicas relacionadas a atletas, incluindo
            solicitante, aprovador, justificativa técnica e data de execução.
          </p>
          <div className="bg-[rgba(0,194,255,0.08)] border-l-4 border-[#00C2FF] rounded-r-[10px] p-4">
            <p className="text-xs text-gray-400">
              <strong className="text-[#00C2FF] font-semibold">Política de Retenção:</strong> Registros mantidos por 5
              anos conforme regulamento interno. Acesso restrito a executivos e membros do conselho deliberativo. Todas
              as ações são registradas com timestamp e versionamento automático.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

ComplianceSection.displayName = "ComplianceSection";

// ========================================
// EMPTY STATE
// ========================================
const EmptyState = memo(() => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-16 text-center mb-8">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-[rgba(0,194,255,0.1)] rounded-[14px] flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-[#00C2FF]" />
        </div>
        <h3 className="text-xl font-semibold mb-3">Nenhum registro encontrado</h3>
        <p className="text-sm text-gray-500 mb-6">Ajuste os filtros ou crie um novo registro de governança</p>
        <Button className="bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] rounded-[12px] h-11 px-6 font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Novo Registro
        </Button>
      </div>
    </div>
  );
});

EmptyState.displayName = "EmptyState";
