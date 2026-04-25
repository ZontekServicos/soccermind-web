import { useState, useMemo, useRef, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  ChevronRight,
  Clock,
  Crosshair,
  Heart,
  Info,
  RotateCcw,
  Search,
  ShieldAlert,
  Stethoscope,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { INJURY_DATABASE, INJURY_CATEGORIES, type InjuryEntry, type InjuryCategory } from "../../data/injuries";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<string, { icon: React.ElementType; color: string; emoji: string }> = {
  "Muscular":         { icon: Zap,          color: "#00FF9C", emoji: "💪" },
  "Tendão":           { icon: Activity,     color: "#00C2FF", emoji: "🦿" },
  "Ligamento":        { icon: ShieldAlert,  color: "#FBBF24", emoji: "🦵" },
  "Menisco":          { icon: Crosshair,    color: "#FBBF24", emoji: "🦴" },
  "Óssea":            { icon: ShieldAlert,  color: "#FF4D4F", emoji: "🦴" },
  "Quadril/Virilha":  { icon: Activity,     color: "#A78BFF", emoji: "🏃" },
  "Joelho":           { icon: Heart,        color: "#FBBF24", emoji: "🦵" },
  "Tornozelo/Pé":     { icon: Activity,     color: "#00C2FF", emoji: "🦶" },
  "Cabeça/Coluna":    { icon: Brain,        color: "#FF4D4F", emoji: "🧠" },
  "Ombro/Braço":      { icon: Activity,     color: "#94a3b8", emoji: "💪" },
  "Pele/Tegumento":   { icon: Heart,        color: "#94a3b8", emoji: "🩹" },
  "Olhos/Face":       { icon: Crosshair,    color: "#FF4D4F", emoji: "👁️" },
  "Órgãos Internos":  { icon: Heart,        color: "#FF4D4F", emoji: "❤️" },
  "Sistêmica/Médica": { icon: Stethoscope,  color: "#A78BFF", emoji: "🏥" },
  "Neurológica":      { icon: Brain,        color: "#7A5CFF", emoji: "⚡" },
  "Psicológica":      { icon: Brain,        color: "#00C2FF", emoji: "🧠" },
};

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV_CFG = [
  { level: 1, label: "Mínima",   color: "#00FF9C", desc: "Dias",             bg: "rgba(0,255,156,0.1)" },
  { level: 2, label: "Leve",     color: "#7FE8A2", desc: "1–2 semanas",      bg: "rgba(127,232,162,0.1)" },
  { level: 3, label: "Moderada", color: "#FBBF24", desc: "2–6 semanas",      bg: "rgba(251,191,36,0.1)" },
  { level: 4, label: "Grave",    color: "#FB923C", desc: "6 sem – 6 meses",  bg: "rgba(251,146,60,0.1)" },
  { level: 5, label: "Crítica",  color: "#FF4D4F", desc: "> 6 meses",        bg: "rgba(255,77,79,0.1)" },
];

function getSev(level: number) {
  return SEV_CFG.find((s) => s.level === level) ?? SEV_CFG[2];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function impactLabel(val: number): { text: string; color: string } {
  if (val >= 9) return { text: "Crítico",    color: "#FF4D4F" };
  if (val >= 7) return { text: "Alto",       color: "#FB923C" };
  if (val >= 5) return { text: "Moderado",   color: "#FBBF24" };
  if (val >= 3) return { text: "Baixo",      color: "#7FE8A2" };
  return           { text: "Mínimo",     color: "#00FF9C" };
}

function careerImpactCfg(s: string) {
  const upper = s.toLowerCase();
  if (upper.includes("não") || upper === "nao") return { label: "Não", color: "#00FF9C" };
  if (upper.includes("alta") || upper.includes("sim")) return { label: "Alto risco", color: "#FF4D4F" };
  return { label: "Parcial", color: "#FBBF24" };
}

// ─── Injury narrative generator ───────────────────────────────────────────────

function generateNarrative(inj: InjuryEntry): string[] {
  const sev = getSev(inj.severity);
  const career = careerImpactCfg(inj.careerImpact);
  const lines: string[] = [];

  // Line 1 — overview
  lines.push(
    `${inj.name} é classificada como lesão de gravidade ${sev.label.toLowerCase()} (nível ${inj.severity}/5), com afastamento médio de ${inj.timeOut} dias. ` +
    `O mecanismo principal de ocorrência é: ${inj.mechanism.toLowerCase()}, acometendo a região de ${inj.bodyRegion.toLowerCase()}.`
  );

  // Line 2 — performance impact
  const impacts = [
    { attr: "explosão", val: inj.impactExplosion },
    { attr: "sprint",   val: inj.impactSprint },
    { attr: "chute",    val: inj.impactKick },
    { attr: "drible",   val: inj.impactDribble },
    { attr: "cabeceio", val: inj.impactHeader },
  ].sort((a, b) => b.val - a.val);

  const topImpacts = impacts.filter((i) => i.val >= 7).map((i) => i.attr);
  if (topImpacts.length > 0) {
    lines.push(
      `Os atributos mais comprometidos são: ${topImpacts.join(", ")} — com impacto direto sobre a capacidade física do atleta durante e após a recuperação.`
    );
  } else {
    lines.push(
      `O impacto sobre os atributos físicos é moderado. Recuperação adequada permite retorno próximo ao nível original de desempenho.`
    );
  }

  // Line 3 — career + recurrence
  lines.push(
    `Risco de recorrência: ${inj.recurrenceRisk}. Impacto na carreira: ${career.label}. ` +
    `Protocolo recomendado: ${inj.treatment}.`
  );

  return lines;
}

// ─── Medical disclaimer ───────────────────────────────────────────────────────

function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        className="flex items-start gap-2 rounded-[12px] px-3 py-2.5"
        style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)" }}
      >
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#FBBF24]" />
        <p className="text-[11px] leading-relaxed text-[#FBBF24]/80">
          <span className="font-bold text-[#FBBF24]">Análise paliativa — </span>
          estas informações são de caráter orientativo. Não substituem a avaliação clínica de um fisioterapeuta ou médico do esporte.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[16px] border px-5 py-4"
      style={{
        borderColor: "rgba(251,191,36,0.28)",
        background: "linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(251,146,60,0.04) 100%)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <AlertTriangle className="h-4 w-4 text-[#FBBF24]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-[#FBBF24]">Aviso Médico Importante</p>
          <p className="text-xs leading-relaxed text-gray-300">
            As análises desta plataforma são de caráter <span className="font-semibold text-[#FBBF24]">paliativo e orientativo</span>, baseadas em dados estatísticos de lesões no futebol.
            Elas <span className="font-semibold text-white">não substituem</span> a avaliação clínica individualizada, o diagnóstico médico ou o acompanhamento de um{" "}
            <span className="font-semibold text-white">fisioterapeuta esportivo ou médico do esporte</span>.
          </p>
          <p className="text-xs text-gray-400">
            Em caso de lesão, procure imediatamente um profissional de saúde qualificado antes de tomar qualquer decisão clínica ou retorno ao esporte.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Search logic ─────────────────────────────────────────────────────────────

function searchInjuries(query: string): InjuryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return INJURY_DATABASE.filter(
    (inj) =>
      inj.name.toLowerCase().includes(q) ||
      inj.category.toLowerCase().includes(q) ||
      inj.bodyRegion.toLowerCase().includes(q) ||
      inj.mechanism.toLowerCase().includes(q)
  ).slice(0, 8);
}

// ─── Components ───────────────────────────────────────────────────────────────

function SeverityDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const cfg = getSev(n);
        return (
          <div
            key={n}
            className="h-2 w-2 rounded-full transition-all"
            style={{
              background: n <= level ? cfg.color : "rgba(255,255,255,0.08)",
              boxShadow: n <= level ? `0 0 4px ${cfg.color}80` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function ImpactBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(((10 - value) / 9) * 100);
  const cfg = impactLabel(value);
  const barColor = value >= 8 ? "#FF4D4F" : value >= 6 ? "#FB923C" : value >= 4 ? "#FBBF24" : "#00FF9C";

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[11px] text-gray-400">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]" style={{ height: 6 }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }}
        />
      </div>
      <span className="w-14 text-right text-[10px] font-semibold" style={{ color: cfg.color }}>
        {cfg.text}
      </span>
    </div>
  );
}

// ─── Injury detail card ───────────────────────────────────────────────────────

function InjuryDetailCard({ injury, onClose }: { injury: InjuryEntry; onClose: () => void }) {
  const sev     = getSev(injury.severity);
  const career  = careerImpactCfg(injury.careerImpact);
  const catCfg  = CATEGORY_CFG[injury.category] ?? { color: "#94a3b8", emoji: "🏥" };
  const narrative = generateNarrative(injury);

  const metrics = [
    { icon: Clock,         label: "Afastamento",         value: `${injury.timeOut} dias`,         color: "#00C2FF" },
    { icon: RotateCcw,     label: "Risco recorrência",   value: injury.recurrenceRisk,             color: "#FBBF24" },
    { icon: TrendingDown,  label: "Impacto carreira",    value: career.label,                      color: career.color },
    { icon: Crosshair,     label: "Gravidade",           value: sev.label,                         color: sev.color },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[24px] border p-0"
      style={{
        borderColor: `${sev.color}35`,
        background: "linear-gradient(160deg, rgba(10,25,50,0.99) 0%, rgba(7,18,38,0.98) 100%)",
        boxShadow: `0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px ${sev.color}15, inset 0 0 80px ${sev.color}05`,
      }}
    >
      {/* Top accent */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent 5%, ${sev.color} 40%, ${sev.color} 60%, transparent 95%)` }} />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-8 h-56 w-56 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${sev.color}12, transparent 70%)` }} />

      <div className="relative p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-xl"
              style={{ background: `${catCfg.color}15`, border: `1px solid ${catCfg.color}30` }}
            >
              {catCfg.emoji}
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: catCfg.color, background: `${catCfg.color}15`, border: `1px solid ${catCfg.color}30` }}>
                  {injury.category}
                </span>
                <SeverityDots level={injury.severity} />
                <span className="text-[11px] font-semibold" style={{ color: sev.color }}>{sev.label}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{injury.name}</h2>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {injury.bodyRegion} · {injury.mechanism}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-gray-400 transition-all hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-[14px] p-3"
              style={{ background: `${color}09`, border: `1px solid ${color}22` }}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" style={{ color }} />
                <span className="text-[9px] uppercase tracking-[0.18em] text-gray-500">{label}</span>
              </div>
              <span className="text-sm font-bold" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Performance impact bars */}
        <div
          className="rounded-[16px] p-4 space-y-2.5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-[#00C2FF]" />
            <span className="text-xs font-semibold text-gray-300">Impacto por Atributo</span>
            <span className="ml-auto text-[10px] text-gray-500">menor barra = mais impactado</span>
          </div>
          <ImpactBar label="Explosão"  value={injury.impactExplosion} />
          <ImpactBar label="Sprint"    value={injury.impactSprint} />
          <ImpactBar label="Chute"     value={injury.impactKick} />
          <ImpactBar label="Drible"    value={injury.impactDribble} />
          <ImpactBar label="Cabeceio"  value={injury.impactHeader} />
        </div>

        {/* Narrative analysis */}
        <div
          className="rounded-[16px] p-4 space-y-3"
          style={{ background: "rgba(0,194,255,0.04)", border: "1px solid rgba(0,194,255,0.12)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#00C2FF]" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#00C2FF]">Análise de Inteligência</span>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.25)" }}
            >
              Orientativo
            </span>
          </div>
          {narrative.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-gray-300">{line}</p>
          ))}
          <MedicalDisclaimer compact />
        </div>

        {/* Treatment protocol */}
        <div
          className="rounded-[14px] p-4 space-y-2"
          style={{ background: "rgba(0,255,156,0.04)", border: "1px solid rgba(0,255,156,0.14)" }}
        >
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-[#00FF9C]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#00FF9C]">Referência de Protocolo</span>
          </div>
          <p className="text-sm text-gray-300">{injury.treatment}</p>
          <p className="text-[11px] leading-relaxed text-gray-500">
            <span className="font-semibold text-gray-400">Importante:</span> este protocolo é uma referência geral de base epidemiológica.
            A conduta clínica deve ser definida exclusivamente pelo fisioterapeuta ou médico do esporte responsável pelo atleta,
            considerando histórico individual, exames de imagem e avaliação funcional presencial.
          </p>
        </div>

        {/* Full medical disclaimer */}
        <MedicalDisclaimer />
      </div>
    </div>
  );
}

// ─── Category panel ───────────────────────────────────────────────────────────

function CategoryPanel({
  selected,
  onSelect,
}: {
  selected: InjuryCategory | null;
  onSelect: (cat: InjuryCategory | null) => void;
}) {
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    INJURY_DATABASE.forEach((inj) => { m[inj.category] = (m[inj.category] ?? 0) + 1; });
    return m;
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {/* All */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex flex-col items-center gap-1.5 rounded-[14px] border px-3 py-3 text-center transition-all hover:-translate-y-0.5"
        style={
          !selected
            ? { borderColor: "#00C2FF60", background: "rgba(0,194,255,0.12)", color: "#00C2FF" }
            : { borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#94a3b8" }
        }
      >
        <span className="text-lg">🏥</span>
        <span className="text-[10px] font-semibold">Todas</span>
        <span className="text-[9px] opacity-60">{INJURY_DATABASE.length}</span>
      </button>

      {INJURY_CATEGORIES.map((cat) => {
        const cfg = CATEGORY_CFG[cat] ?? { color: "#94a3b8", emoji: "🏥" };
        const isActive = selected === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className="flex flex-col items-center gap-1.5 rounded-[14px] border px-3 py-3 text-center transition-all hover:-translate-y-0.5"
            style={
              isActive
                ? { borderColor: `${cfg.color}60`, background: `${cfg.color}15`, color: cfg.color }
                : { borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#94a3b8" }
            }
          >
            <span className="text-lg">{cfg.emoji}</span>
            <span className="text-[10px] font-semibold leading-tight">{cat}</span>
            <span className="text-[9px] opacity-60">{counts[cat] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Injury list ──────────────────────────────────────────────────────────────

function InjuryList({
  injuries,
  onSelect,
}: {
  injuries: InjuryEntry[];
  onSelect: (inj: InjuryEntry) => void;
}) {
  if (injuries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
          <Search className="h-6 w-6 text-gray-600" />
        </div>
        <p className="text-sm text-gray-500">Nenhuma lesão encontrada</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {injuries.map((inj) => {
        const sev    = getSev(inj.severity);
        const catCfg = CATEGORY_CFG[inj.category] ?? { color: "#94a3b8", emoji: "🏥" };
        return (
          <button
            key={inj.id}
            type="button"
            onClick={() => onSelect(inj)}
            className="group flex items-center gap-3 rounded-[14px] border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-base transition-all group-hover:scale-110"
              style={{ background: `${catCfg.color}15` }}
            >
              {catCfg.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-200 group-hover:text-white">{inj.name}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <SeverityDots level={inj.severity} />
                <span className="text-[10px]" style={{ color: sev.color }}>{sev.label}</span>
                <span className="text-[10px] text-gray-600">·</span>
                <span className="text-[10px] text-gray-500">{inj.timeOut} dias</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 transition-all group-hover:translate-x-0.5 group-hover:text-gray-300" />
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthAnalytics() {
  const [searchQuery, setSearchQuery]       = useState("");
  const [activeCategory, setActiveCategory] = useState<InjuryCategory | null>(null);
  const [selectedInjury, setSelectedInjury] = useState<InjuryEntry | null>(null);
  const [showSearch, setShowSearch]         = useState(false);
  const searchResults = useMemo(() => searchInjuries(searchQuery), [searchQuery]);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredInjuries = useMemo(() => {
    if (activeCategory) return INJURY_DATABASE.filter((i) => i.category === activeCategory);
    return INJURY_DATABASE;
  }, [activeCategory]);

  const displayList = searchQuery.trim() ? searchResults : filteredInjuries;

  // Show search dropdown on focus
  useEffect(() => {
    if (!searchQuery.trim()) setShowSearch(false);
    else setShowSearch(true);
  }, [searchQuery]);

  const handleSelect = (inj: InjuryEntry) => {
    setSelectedInjury(inj);
    setSearchQuery("");
    setShowSearch(false);
    inputRef.current?.blur();
  };

  const handleClose = () => setSelectedInjury(null);

  const sevStats = useMemo(() => {
    const m: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    INJURY_DATABASE.forEach((i) => { m[i.severity] = (m[i.severity] ?? 0) + 1; });
    return m;
  }, []);

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] space-y-6 p-6 lg:p-8">

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="pointer-events-none absolute -right-16 -top-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,77,79,0.14),transparent_68%)] blur-2xl" />
              <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.1),transparent_72%)] blur-2xl" />

              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,77,79,0.3)] bg-[rgba(255,77,79,0.08)] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.24em] text-[#FF7A7C]">
                    <Heart className="h-3.5 w-3.5" />
                    Scout Intelligence · Health Analytics
                  </div>
                  <h1 className="text-4xl font-black text-white">
                    Health{" "}
                    <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#FF4D4F,#FF9999)" }}>
                      Analytics
                    </span>
                  </h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-400">
                    Mapeamento de 212 lesões do futebol — impacto por atributo, risco de recorrência e análise de carreira com inteligência de scouting.
                  </p>
                  <div
                    className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]"
                    style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#FBBF24" }}
                  >
                    <Info className="h-3 w-3 shrink-0" />
                    Análise paliativa — não substitui avaliação de fisioterapeuta ou médico do esporte
                  </div>
                </div>

                {/* Stats strip */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Lesões Mapeadas",  value: "212",  color: "#00C2FF" },
                    { label: "Categorias",        value: "16",   color: "#A78BFF" },
                    { label: "Críticas (nível 5)", value: String(sevStats[5] ?? 0), color: "#FF4D4F" },
                    { label: "Graves (nível 4)",  value: String(sevStats[4] ?? 0), color: "#FB923C" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5" style={{ color }} />
                        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
                      </div>
                      <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Search bar ─────────────────────────────────────────────── */}
            <section className="relative">
              <div className="relative flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar lesão (ex: LCA, isquiotibiais, concussão, ruptura...)"
                    className="h-12 w-full rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#FF4D4F] focus:outline-none focus:ring-2 focus:ring-[#FF4D4F]/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); setShowSearch(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:text-gray-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dropdown results */}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[#0D1F3C] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                  {searchResults.map((inj) => {
                    const sev    = getSev(inj.severity);
                    const catCfg = CATEGORY_CFG[inj.category] ?? { color: "#94a3b8", emoji: "🏥" };
                    return (
                      <button
                        key={inj.id}
                        type="button"
                        onClick={() => handleSelect(inj)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-[rgba(255,255,255,0.05)]"
                      >
                        <span className="text-base">{catCfg.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">{inj.name}</p>
                          <p className="text-[10px] text-gray-500">{inj.category} · {inj.bodyRegion}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <SeverityDots level={inj.severity} />
                          <span className="text-[10px]" style={{ color: sev.color }}>{sev.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {showSearch && searchQuery.trim() && searchResults.length === 0 && (
                <div className="absolute z-50 mt-2 w-full rounded-[16px] border border-[rgba(255,77,79,0.2)] bg-[#0D1F3C] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-2 text-sm text-[#FF7A7C]">
                    <AlertTriangle className="h-4 w-4" />
                    Lesão não encontrada. Tente termos como: isquiotibiais, LCA, menisco, concussão...
                  </div>
                </div>
              )}
            </section>

            {/* ── Medical disclaimer (always visible) ────────────────────── */}
            <MedicalDisclaimer />

            {/* ── Selected injury detail ──────────────────────────────────── */}
            {selectedInjury && (
              <InjuryDetailCard injury={selectedInjury} onClose={handleClose} />
            )}

            {/* ── Category selector ──────────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#FF4D4F]" />
                <h2 className="text-sm font-semibold text-gray-200">Categorias de Lesão</h2>
                <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] text-gray-500">
                  {activeCategory ? INJURY_DATABASE.filter((i) => i.category === activeCategory).length : INJURY_DATABASE.length} lesões
                </span>
                {activeCategory && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className="ml-auto flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Limpar filtro
                  </button>
                )}
              </div>
              <CategoryPanel selected={activeCategory} onSelect={setActiveCategory} />
            </section>

            {/* ── Injury list ────────────────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00C2FF]" />
                <h2 className="text-sm font-semibold text-gray-200">
                  {searchQuery.trim() ? `Resultados para "${searchQuery}"` : activeCategory ? activeCategory : "Todas as Lesões"}
                </h2>
                <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] text-gray-500">
                  {displayList.length}
                </span>
              </div>
              <InjuryList injuries={displayList} onSelect={handleSelect} />
            </section>

            {/* ── Severity legend ────────────────────────────────────────── */}
            <section className="flex flex-wrap items-center gap-4 rounded-[16px] border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] px-5 py-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Gravidade:</span>
              {SEV_CFG.map((s) => (
                <span key={s.level} className="flex items-center gap-2 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 4px ${s.color}60` }} />
                  <span style={{ color: s.color }}>{s.level} – {s.label}</span>
                  <span className="text-gray-600">({s.desc})</span>
                </span>
              ))}
            </section>

            {/* ── Footer disclaimer ──────────────────────────────────────── */}
            <section
              className="flex flex-col items-center gap-2 rounded-[16px] border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.015)] px-6 py-4 text-center"
            >
              <div className="flex items-center gap-2 text-[#FBBF24]">
                <Stethoscope className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Aviso de Responsabilidade</span>
              </div>
              <p className="max-w-2xl text-[11px] leading-relaxed text-gray-500">
                Este módulo fornece referências epidemiológicas e análises paliativas com fins de <span className="text-gray-400 font-medium">suporte ao scouting esportivo</span>.
                Nenhuma informação aqui apresentada tem caráter diagnóstico ou terapêutico.{" "}
                <span className="text-gray-300 font-medium">A avaliação, diagnóstico e conduta clínica de qualquer lesão devem ser realizados exclusivamente por fisioterapeuta ou médico do esporte habilitado</span>,
                com base no histórico e na avaliação presencial do atleta.
              </p>
              <p className="text-[10px] text-gray-600">
                SoccerMind Health Analytics · Dados de referência baseados em literatura esportiva · Não substitui atendimento profissional
              </p>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
