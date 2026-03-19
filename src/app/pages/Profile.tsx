import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CustomActionsSection } from "../components/CustomActionsSection";
import {
  Calendar,
  Package,
  CheckCircle,
  TrendingUp,
  Settings,
  ExternalLink,
  Eye,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState, useMemo, memo } from "react";
import { getProfileUpsells } from "../services/profile";
import clubLogo from "../../assets/club-logo.png";

const fallbackImage = "/placeholder.png";

interface Upsell {
  id: string;
  title: string;
  description: string;
  status: "Ativo" | "Inativo" | "Pendente";
  activatedDate: string;
  icon: React.ElementType;
  color: string;
  category: string;
}

const mockUpsells: Upsell[] = [
  {
    id: "1",
    title: "Análise Avançada com IA",
    description: "Relatórios preditivos com Machine Learning",
    status: "Ativo",
    activatedDate: "2025-01-15",
    icon: TrendingUp,
    color: "#00C2FF",
    category: "Analytics",
  },
  {
    id: "2",
    title: "Dashboard Premium",
    description: "Visualizações personalizadas e métricas exclusivas",
    status: "Ativo",
    activatedDate: "2025-01-01",
    icon: BarChart3,
    color: "#00FF9C",
    category: "Visualização",
  },
  {
    id: "3",
    title: "Comparação Ilimitada",
    description: "Compare até 10 jogadores simultaneamente",
    status: "Ativo",
    activatedDate: "2025-01-01",
    icon: Users,
    color: "#7A5CFF",
    category: "Analytics",
  },
  {
    id: "4",
    title: "API de Integração",
    description: "Conecte aos seus sistemas internos de gestão",
    status: "Ativo",
    activatedDate: "2025-02-10",
    icon: CheckCircle,
    color: "#00FF9C",
    category: "Integração",
  },
];

type FilterType = "all" | "Ativo" | "Inativo" | "Pendente";
type SortType = "date-desc" | "date-asc" | "name-asc" | "name-desc";

export default function Profile() {
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("date-desc");

  useEffect(() => {
    let active = true;

    async function loadUpsells() {
      const response = await getProfileUpsells();
      if (!active) {
        return;
      }

      setUpsells(
        response.data.map((upsell) => ({
          ...upsell,
          icon:
            upsell.iconKey === "dashboard"
              ? BarChart3
              : upsell.iconKey === "compare"
                ? Users
                : upsell.iconKey === "integration"
                  ? CheckCircle
                  : TrendingUp,
        })),
      );
    }

    loadUpsells();

    return () => {
      active = false;
    };
  }, []);

  const filteredUpsells = useMemo(() => {
    let filtered = [...upsells];

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.activatedDate).getTime() - new Date(a.activatedDate).getTime();
        case "date-asc":
          return new Date(a.activatedDate).getTime() - new Date(b.activatedDate).getTime();
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [filterStatus, sortBy, upsells]);

  // Contract calculations
  const startDate = new Date("2025-01-01");
  const endDate = new Date("2027-12-31");
  const today = new Date();
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = totalDays - elapsedDays;
  const progressPercent = Math.round((elapsedDays / totalDays) * 100);
  const remainingMonths = Math.floor(remainingDays / 30);

  const contractStatus = remainingDays > 180 ? "Saudável" : remainingDays > 60 ? "Atenção" : "Crítico";

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1400px] mx-auto">
            {/* Profile Header - Executive */}
            <ProfileHeader />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
              {/* Contract Status - Executive Card */}
              <div className="xl:col-span-2">
                <ContractStatusCard
                  startDate={startDate}
                  endDate={endDate}
                  remainingMonths={remainingMonths}
                  progressPercent={progressPercent}
                  status={contractStatus}
                />
              </div>

              {/* Usage Statistics - Compact */}
              <UsageStatsCard />
            </div>

            {/* Upsells Section - Redesigned */}
            <UpsellsSection
              upsells={filteredUpsells}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// ========================================
// PROFILE HEADER
// ========================================
const ProfileHeader = memo(() => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Left: Club Info */}
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-[14px] overflow-hidden bg-white p-2 flex items-center justify-center flex-shrink-0 ring-2 ring-[rgba(0,194,255,0.2)]">
            <img
              src={clubLogo}
              alt="Sport Club Corinthians"
              className="w-full h-full object-contain"
              onError={(event) => {
                event.currentTarget.src = fallbackImage;
              }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold mb-2">Sport Club Corinthians</h1>
            <p className="text-base text-gray-400 mb-3">Plano Empresarial Premium</p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <div>
                <span className="text-gray-500">ID da Conta:</span> <span className="font-mono">ACC-2025-8742</span>
              </div>
              <div>
                <span className="text-gray-500">Responsável:</span> Ricardo Santos
              </div>
              <div>
                <span className="text-gray-500">Atualizado:</span> 28/02/2026
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] rounded-[12px] h-11 px-5"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button className="bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] rounded-[12px] h-11 px-6 font-semibold shadow-[0_4px_16px_rgba(0,194,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,194,255,0.35)] transition-all">
            <ExternalLink className="w-4 h-4 mr-2" />
            Gerenciar Plano
          </Button>
        </div>
      </div>
    </div>
  );
});

ProfileHeader.displayName = "ProfileHeader";

// ========================================
// CONTRACT STATUS CARD
// ========================================
interface ContractStatusCardProps {
  startDate: Date;
  endDate: Date;
  remainingMonths: number;
  progressPercent: number;
  status: string;
}

const ContractStatusCard = memo(
  ({ startDate, endDate, remainingMonths, progressPercent, status }: ContractStatusCardProps) => {
    const statusConfig = {
      Saudável: { color: "#00FF9C", bg: "rgba(0,255,156,0.12)", icon: CheckCircle },
      Atenção: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", icon: AlertTriangle },
      Crítico: { color: "#FF4D4F", bg: "rgba(255,77,79,0.12)", icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const StatusIcon = config.icon;

    return (
      <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[rgba(0,194,255,0.12)] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#00C2FF]" />
            </div>
            <h2 className="text-xl font-semibold">Vigência de Contrato</h2>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border"
            style={{ background: config.bg, color: config.color, borderColor: config.color + "40" }}
          >
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{status}</span>
          </div>
        </div>

        {/* Date Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <MetricBox
            label="Data de Início"
            value={startDate.toLocaleDateString("pt-BR")}
            icon={Calendar}
            color="#00C2FF"
          />
          <MetricBox
            label="Data de Término"
            value={endDate.toLocaleDateString("pt-BR")}
            icon={Calendar}
            color="#00C2FF"
          />
          <MetricBox label="Tempo Restante" value={`${remainingMonths} meses`} icon={Clock} color="#00FF9C" />
        </div>

        {/* Progress Bar */}
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400 font-medium">Progresso do Contrato</span>
            <span className="text-sm text-[#00C2FF] font-semibold tabular-nums">{progressPercent}% concluído</span>
          </div>
          <div className="w-full bg-[rgba(255,255,255,0.04)] rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00C2FF] to-[#7A5CFF] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
            <span>{startDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
            <span>{endDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
          </div>
        </div>

        {/* Alert (if needed) */}
        {status !== "Saudável" && (
          <div
            className="mt-6 flex items-start gap-3 p-4 rounded-[12px] border"
            style={{ background: config.bg, borderColor: config.color + "40" }}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: config.color }} />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: config.color }}>
                {status === "Atenção" ? "Contrato se aproxima do fim" : "Renovação Urgente"}
              </p>
              <p className="text-xs text-gray-400">
                {status === "Atenção"
                  ? "Recomendamos iniciar o processo de renovação nos próximos 60 dias."
                  : "Entre em contato com nosso time comercial para garantir a continuidade do serviço."}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ContractStatusCard.displayName = "ContractStatusCard";

interface MetricBoxProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const MetricBox = memo(({ label, value, icon: Icon, color }: MetricBoxProps) => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className="text-xl font-semibold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
});

MetricBox.displayName = "MetricBox";

// ========================================
// USAGE STATS CARD
// ========================================
const UsageStatsCard = memo(() => {
  const stats = [
    { label: "Análises", value: 247, change: +18, icon: BarChart3, color: "#00C2FF" },
    { label: "Relatórios", value: 89, change: +12, icon: FileText, color: "#7A5CFF" },
    { label: "Comparações", value: 134, change: +25, icon: Users, color: "#00FF9C" },
    { label: "Usuários", value: 12, change: +8, icon: Users, color: "#00C2FF" },
  ];

  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-semibold">Estatísticas de Uso</h2>
        <button
          className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-5">
        {stats.map((stat) => (
          <UsageStatItem key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
        <p className="text-xs text-gray-600">
          Período: <span className="text-gray-400">Últimos 30 dias</span>
        </p>
      </div>
    </div>
  );
});

UsageStatsCard.displayName = "UsageStatsCard";

interface UsageStatItemProps {
  stat: {
    label: string;
    value: number;
    change: number;
    icon: React.ElementType;
    color: string;
  };
}

const UsageStatItem = memo(({ stat }: UsageStatItemProps) => {
  const Icon = stat.icon;
  const isPositive = stat.change > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: `${stat.color}15` }}>
          <Icon className="w-4 h-4" style={{ color: stat.color }} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>
            {stat.value}
          </p>
        </div>
      </div>
      <div
        className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-[6px]"
        style={{
          background: isPositive ? "rgba(0,255,156,0.12)" : "rgba(255,77,79,0.12)",
          color: isPositive ? "#00FF9C" : "#FF4D4F",
        }}
      >
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(stat.change)}%
      </div>
    </div>
  );
});

UsageStatItem.displayName = "UsageStatItem";

// ========================================
// UPSELLS SECTION
// ========================================
interface UpsellsSectionProps {
  upsells: Upsell[];
  filterStatus: FilterType;
  setFilterStatus: (value: FilterType) => void;
  sortBy: SortType;
  setSortBy: (value: SortType) => void;
}

const UpsellsSection = memo(({ upsells, filterStatus, setFilterStatus, sortBy, setSortBy }: UpsellsSectionProps) => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[rgba(122,92,255,0.12)] flex items-center justify-center">
            <Package className="w-5 h-5 text-[#7A5CFF]" />
          </div>
          <h2 className="text-xl font-semibold">Serviços Adquiridos</h2>
          <span className="text-sm text-gray-500">({upsells.length} itens)</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterType)}>
            <SelectTrigger className="w-[140px] bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[10px] h-10">
              <Filter className="w-3.5 h-3.5 mr-2 text-gray-500" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
              <SelectItem value="Pendente">Pendentes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
            <SelectTrigger className="w-[160px] bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] rounded-[10px] h-10">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A1B35] border-[rgba(255,255,255,0.1)]">
              <SelectItem value="date-desc">Mais recentes</SelectItem>
              <SelectItem value="date-asc">Mais antigos</SelectItem>
              <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {upsells.map((upsell) => (
          <UpsellCard key={upsell.id} upsell={upsell} />
        ))}
      </div>

      {upsells.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Nenhum serviço encontrado com os filtros aplicados</p>
        </div>
      )}
    </div>
  );
});

UpsellsSection.displayName = "UpsellsSection";

// ========================================
// UPSELL CARD
// ========================================
interface UpsellCardProps {
  upsell: Upsell;
}

const UpsellCard = memo(({ upsell }: UpsellCardProps) => {
  const Icon = upsell.icon;

  const statusConfig = {
    Ativo: { bg: "rgba(0,255,156,0.12)", text: "#00FF9C", border: "rgba(0,255,156,0.3)" },
    Inativo: { bg: "rgba(148,163,184,0.12)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
    Pendente: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  };

  const config = statusConfig[upsell.status];

  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6 hover:border-[rgba(255,255,255,0.1)] transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: `${upsell.color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: upsell.color }} />
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1">{upsell.title}</h3>
            <p className="text-xs text-gray-600">{upsell.category}</p>
          </div>
        </div>
        <span
          className="px-2.5 py-1 text-[10px] rounded-[6px] font-semibold border flex-shrink-0"
          style={{ backgroundColor: config.bg, color: config.text, borderColor: config.border }}
        >
          {upsell.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{upsell.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <div className="text-xs text-gray-600">
          <span className="text-gray-500">Ativado:</span>{" "}
          {new Date(upsell.activatedDate).toLocaleDateString("pt-BR")}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#00C2FF] hover:text-white hover:bg-[rgba(0,194,255,0.12)] h-8 px-3 rounded-[8px] opacity-0 group-hover:opacity-100 transition-all"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          Detalhes
        </Button>
      </div>
    </div>
  );
});

UpsellCard.displayName = "UpsellCard";
