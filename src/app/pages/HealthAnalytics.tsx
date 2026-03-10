import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Search, X, AlertCircle, Activity, TrendingDown, Clock, RotateCcw } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useState } from "react";

// ========================================
// DATABASE DE LESÕES
// ========================================
interface InjuryData {
  id: string;
  name: string;
  aliases: string[]; // variações de nome
  severity: "mild" | "moderate" | "severe";
  careerImpact: "no" | "partial" | "yes";
  avgTimeOut: number; // dias
  recurrenceRisk: number; // 0-100
  performanceImpact: number; // 0-100
  affectedAreas: string[];
  summary: string;
}

const injuryDatabase: InjuryData[] = [
  {
    id: "acl",
    name: "Ruptura de LCA",
    aliases: ["lca", "ligamento cruzado anterior", "acl", "ruptura lca"],
    severity: "severe",
    careerImpact: "yes",
    avgTimeOut: 270,
    recurrenceRisk: 85,
    performanceImpact: 75,
    affectedAreas: ["Explosão", "Aceleração", "Mudança de direção", "Estabilidade"],
    summary: "Lesão grave no ligamento cruzado anterior do joelho. Requer cirurgia e longo período de recuperação. Alto risco de perda de performance em explosão e mudanças rápidas de direção. Fundamental acompanhamento rigoroso durante reabilitação.",
  },
  {
    id: "pubalgia",
    name: "Pubalgia",
    aliases: ["pubalgia", "dor púbica", "hérnia do esportista", "groin pain"],
    severity: "moderate",
    careerImpact: "partial",
    avgTimeOut: 45,
    recurrenceRisk: 60,
    performanceImpact: 55,
    affectedAreas: ["Explosão", "Chute", "Sprint", "Rotação de tronco"],
    summary: "Lesão na região púbica com dor característica no movimento. Comum em atletas que realizam chutes repetidos. Pode tornar-se crônica se não tratada adequadamente. Requer fortalecimento de core e região pélvica.",
  },
  {
    id: "achilles",
    name: "Tendinite de Aquiles",
    aliases: ["aquiles", "tendão de aquiles", "tendinite aquiliana", "achilles"],
    severity: "moderate",
    careerImpact: "partial",
    avgTimeOut: 35,
    recurrenceRisk: 70,
    performanceImpact: 60,
    affectedAreas: ["Aceleração", "Salto vertical", "Sprint", "Arranque"],
    summary: "Inflamação do tendão de Aquiles, comum em atletas que realizam sprints frequentes. Alto risco de recorrência se o atleta retornar antes da recuperação completa. Impacta diretamente a capacidade de explosão e aceleração.",
  },
  {
    id: "hamstring",
    name: "Lesão de Isquiotibiais",
    aliases: ["isquiotibiais", "posterior de coxa", "hamstring", "estiramento posterior"],
    severity: "moderate",
    careerImpact: "partial",
    avgTimeOut: 28,
    recurrenceRisk: 75,
    performanceImpact: 50,
    affectedAreas: ["Sprint", "Aceleração", "Velocidade máxima"],
    summary: "Uma das lesões mais comuns no futebol. Ocorre geralmente em sprints de alta intensidade. Alto índice de recorrência se não houver trabalho preventivo adequado. Afeta diretamente a capacidade de sprint e aceleração.",
  },
  {
    id: "ankle_sprain",
    name: "Entorse de Tornozelo",
    aliases: ["entorse", "tornozelo", "ankle sprain", "torção de tornozelo"],
    severity: "mild",
    careerImpact: "no",
    avgTimeOut: 14,
    recurrenceRisk: 40,
    performanceImpact: 25,
    affectedAreas: ["Mudança de direção", "Estabilidade lateral"],
    summary: "Lesão leve a moderada nos ligamentos do tornozelo. Recuperação relativamente rápida quando tratada corretamente. Pode gerar instabilidade crônica se houver múltiplas recorrências. Trabalho proprioceptivo é fundamental.",
  },
  {
    id: "meniscus",
    name: "Lesão de Menisco",
    aliases: ["menisco", "meniscus", "ruptura menisco"],
    severity: "severe",
    careerImpact: "yes",
    avgTimeOut: 90,
    recurrenceRisk: 55,
    performanceImpact: 65,
    affectedAreas: ["Estabilidade", "Resistência", "Mudança de direção"],
    summary: "Lesão na cartilagem do joelho que pode requerer cirurgia dependendo da gravidade. Impacta a capacidade de absorção de impacto do joelho. Risco de desenvolvimento de artrose precoce se não tratada adequadamente.",
  },
  {
    id: "groin_strain",
    name: "Estiramento de Virilha",
    aliases: ["virilha", "groin", "adutor", "estiramento adutores"],
    severity: "mild",
    careerImpact: "no",
    avgTimeOut: 21,
    recurrenceRisk: 50,
    performanceImpact: 35,
    affectedAreas: ["Mudança de direção", "Chute", "Sprint lateral"],
    summary: "Lesão muscular na região dos adutores. Comum em movimentos laterais bruscos. Recuperação adequada e fortalecimento são essenciais para prevenir recorrência. Impacto moderado na performance de chute.",
  },
];

// ========================================
// EXEMPLOS RÁPIDOS (CHIPS)
// ========================================
const quickExamples = [
  { id: "acl", label: "LCA" },
  { id: "pubalgia", label: "Pubalgia" },
  { id: "achilles", label: "Aquiles" },
  { id: "hamstring", label: "Isquiotibiais" },
];

export default function HealthAnalytics() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentState, setCurrentState] = useState<"idle" | "confirmation" | "notFound" | "result">("idle");
  const [matchedInjury, setMatchedInjury] = useState<InjuryData | null>(null);
  const [suggestions, setSuggestions] = useState<InjuryData[]>([]);

  // ========================================
  // FUNÇÕES DE BUSCA
  // ========================================
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase().trim();
    
    // Tentar encontrar match exato ou por alias
    const exactMatch = injuryDatabase.find(
      (injury) =>
        injury.name.toLowerCase() === query ||
        injury.aliases.some((alias) => alias.toLowerCase() === query)
    );

    if (exactMatch) {
      setMatchedInjury(exactMatch);
      setCurrentState("confirmation");
      return;
    }

    // Buscar matches parciais (sugestões)
    const partialMatches = injuryDatabase.filter(
      (injury) =>
        injury.name.toLowerCase().includes(query) ||
        injury.aliases.some((alias) => alias.toLowerCase().includes(query))
    );

    if (partialMatches.length > 0) {
      setSuggestions(partialMatches.slice(0, 6));
      setCurrentState("notFound");
    } else {
      setSuggestions([]);
      setCurrentState("notFound");
    }
  };

  const handleQuickExample = (injuryId: string) => {
    const injury = injuryDatabase.find((i) => i.id === injuryId);
    if (injury) {
      setMatchedInjury(injury);
      setCurrentState("confirmation");
    }
  };

  const handleConfirm = () => {
    setCurrentState("result");
  };

  const handleReset = () => {
    setSearchQuery("");
    setCurrentState("idle");
    setMatchedInjury(null);
    setSuggestions([]);
  };

  const handleSelectSuggestion = (injury: InjuryData) => {
    setMatchedInjury(injury);
    setCurrentState("confirmation");
  };

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                {t("health.title")}
              </h1>
              <p className="text-base text-gray-400">
                {t("health.subtitle")}
              </p>
            </div>

            {/* SEÇÃO 1 — SEARCH BAR */}
            <div className="bg-[rgba(10,20,40,0.6)] backdrop-blur-xl rounded-[20px] border border-[rgba(255,255,255,0.06)] p-8 lg:p-10">
              <div className="space-y-6">
                {/* Campo de Busca */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Digite a lesão (ex: ruptura de LCA, pubalgia, tendinite patelar)"
                      className="w-full h-14 pl-12 pr-4 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/20 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="h-14 px-8 bg-gradient-to-r from-[#00C2FF] to-[#0099cc] rounded-[12px] font-semibold text-white hover:shadow-[0_0_20px_rgba(0,194,255,0.3)] transition-all"
                  >
                    Analisar
                  </button>
                </div>

                {/* Chips de Exemplos */}
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs text-gray-500">Exemplos rápidos:</span>
                  {quickExamples.map((example) => (
                    <button
                      key={example.id}
                      onClick={() => handleQuickExample(example.id)}
                      className="px-4 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-full text-sm text-gray-300 hover:bg-[rgba(0,194,255,0.1)] hover:border-[#00C2FF] hover:text-[#00C2FF] transition-all"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ESTADO A — CONFIRMAÇÃO */}
            {currentState === "confirmation" && matchedInjury && (
              <ConfirmationModal
                injury={matchedInjury}
                onConfirm={handleConfirm}
                onCancel={handleReset}
              />
            )}

            {/* ESTADO B — NÃO ENCONTRADO */}
            {currentState === "notFound" && (
              <NotFoundCard
                suggestions={suggestions}
                onSelectSuggestion={handleSelectSuggestion}
                onReset={handleReset}
              />
            )}

            {/* ESTADO C — RESULTADO */}
            {currentState === "result" && matchedInjury && (
              <ResultCard injury={matchedInjury} onReset={handleReset} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ========================================
// ESTADO A — MODAL DE CONFIRMAÇÃO
// ========================================
interface ConfirmationModalProps {
  injury: InjuryData;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({ injury, onConfirm, onCancel }: ConfirmationModalProps) {
  return (
    <div className="bg-[rgba(10,20,40,0.8)] backdrop-blur-xl rounded-[20px] border border-[rgba(0,194,255,0.3)] p-8 shadow-[0_0_40px_rgba(0,194,255,0.2)]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[rgba(0,194,255,0.1)] flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-[#00C2FF]" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">Confirmar lesão</h3>
          <p className="text-gray-400">
            Você quis dizer: <span className="text-white font-semibold">{injury.name}</span>?
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 h-12 bg-gradient-to-r from-[#00C2FF] to-[#0099cc] rounded-[10px] font-semibold text-white hover:shadow-[0_0_20px_rgba(0,194,255,0.3)] transition-all"
        >
          Sim, é essa
        </button>
        <button
          onClick={onCancel}
          className="flex-1 h-12 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] font-semibold text-gray-300 hover:bg-[rgba(255,255,255,0.08)] transition-all"
        >
          Não, pesquisar de novo
        </button>
      </div>
    </div>
  );
}

// ========================================
// ESTADO B — NÃO ENCONTRADO
// ========================================
interface NotFoundCardProps {
  suggestions: InjuryData[];
  onSelectSuggestion: (injury: InjuryData) => void;
  onReset: () => void;
}

function NotFoundCard({ suggestions, onSelectSuggestion, onReset }: NotFoundCardProps) {
  return (
    <div className="bg-[rgba(10,20,40,0.6)] backdrop-blur-xl rounded-[20px] border border-[rgba(255,77,79,0.2)] p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[rgba(255,77,79,0.1)] flex items-center justify-center flex-shrink-0">
          <X className="w-6 h-6 text-[#FF4D4F]" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">Não encontramos essa lesão</h3>
          <p className="text-gray-400">
            A lesão digitada não está no nosso banco de dados. Confira as sugestões abaixo ou tente novamente.
          </p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-500 font-semibold">Você quis dizer:</p>
          <div className="grid gap-3">
            {suggestions.map((injury) => (
              <button
                key={injury.id}
                onClick={() => onSelectSuggestion(injury)}
                className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-left hover:bg-[rgba(0,194,255,0.05)] hover:border-[#00C2FF] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium group-hover:text-[#00C2FF] transition-colors">
                    {injury.name}
                  </span>
                  <SeverityBadge severity={injury.severity} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full h-12 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] font-semibold text-gray-300 hover:bg-[rgba(255,255,255,0.08)] transition-all"
      >
        Tentar novamente
      </button>
    </div>
  );
}

// ========================================
// ESTADO C — RESULTADO
// ========================================
interface ResultCardProps {
  injury: InjuryData;
  onReset: () => void;
}

function ResultCard({ injury, onReset }: ResultCardProps) {
  const getCareerImpactConfig = (impact: InjuryData["careerImpact"]) => {
    switch (impact) {
      case "no":
        return { label: "Não", color: "#00FF9C", icon: "✓" };
      case "partial":
        return { label: "Parcial", color: "#FFB800", icon: "~" };
      case "yes":
        return { label: "Sim", color: "#FF4D4F", icon: "✕" };
    }
  };

  const careerImpact = getCareerImpactConfig(injury.careerImpact);

  return (
    <div className="space-y-6">
      {/* Header do Resultado */}
      <div className="bg-[rgba(10,20,40,0.6)] backdrop-blur-xl rounded-[20px] border border-[rgba(255,255,255,0.06)] p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-white">{injury.name}</h2>
              <SeverityBadge severity={injury.severity} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">Prejudicial à carreira?</span>
              <div
                className="px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2"
                style={{ backgroundColor: `${careerImpact.color}20`, color: careerImpact.color }}
              >
                <span className="text-lg leading-none">{careerImpact.icon}</span>
                {careerImpact.label}
              </div>
            </div>
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-gray-300 hover:bg-[rgba(255,255,255,0.08)] transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Nova busca
          </button>
        </div>

        {/* Métricas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Tempo Médio Fora */}
          <MetricCard
            icon={<Clock className="w-5 h-5" />}
            label="Tempo médio fora"
            value={`${injury.avgTimeOut} dias`}
            color="#00C2FF"
          />

          {/* Risco de Recorrência */}
          <MetricCard
            icon={<RotateCcw className="w-5 h-5" />}
            label="Risco de recorrência"
            value={`${injury.recurrenceRisk}%`}
            color="#FFB800"
          />

          {/* Impacto na Performance */}
          <MetricCard
            icon={<TrendingDown className="w-5 h-5" />}
            label="Impacto na performance"
            value={`${injury.performanceImpact}%`}
            color="#FF4D4F"
          />
        </div>

        {/* Áreas Afetadas */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Áreas afetadas:</h4>
          <div className="flex flex-wrap gap-2">
            {injury.affectedAreas.map((area, index) => (
              <div
                key={index}
                className="px-3 py-1.5 bg-[rgba(122,92,255,0.1)] border border-[rgba(122,92,255,0.3)] rounded-full text-sm text-[#7A5CFF]"
              >
                {area}
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Profissional */}
        <div className="p-5 bg-[rgba(255,255,255,0.02)] rounded-[12px] border border-[rgba(255,255,255,0.04)]">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-[#00FF9C] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[#00FF9C] mb-2">Análise Profissional</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{injury.summary}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// COMPONENTES AUXILIARES
// ========================================
function SeverityBadge({ severity }: { severity: InjuryData["severity"] }) {
  const config = {
    mild: { label: "Leve", color: "#00FF9C", icon: "🟢" },
    moderate: { label: "Moderada", color: "#FFB800", icon: "🟡" },
    severe: { label: "Grave", color: "#FF4D4F", icon: "🔴" },
  }[severity];

  return (
    <div
      className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
      style={{ backgroundColor: `${config.color}20`, color: config.color }}
    >
      <span>{config.icon}</span>
      {config.label}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  return (
    <div className="p-5 bg-[rgba(255,255,255,0.02)] rounded-[12px] border border-[rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-[8px] flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
