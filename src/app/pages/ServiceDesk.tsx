import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Plus, Search, Calendar, User, X, Paperclip,
  UserPlus, Key, UserMinus, Lock, Zap, GraduationCap,
  Rocket, Ticket, ArrowRight, Clock, AlertCircle,
  CheckCircle2, CircleDot, ChevronDown,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { getServiceDeskTickets, type ServiceDeskTicket } from "../services/serviceDesk";

// ─── helpers ────────────────────────────────────────────────────────────────

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return "agora mesmo";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "há 1 dia";
  if (d < 30) return `há ${d} dias`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ServiceDesk() {
  const { t, language } = useLanguage();
  const [tickets, setTickets] = useState<ServiceDeskTicket[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;
    async function loadTickets() {
      const response = await getServiceDeskTickets();
      if (!active) return;
      setTickets(response.data as ServiceDeskTicket[]);
    }
    loadTickets();
    return () => { active = false; };
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "open" && ticket.status === "open") ||
      (activeTab === "in_progress" && ticket.status === "in_progress") ||
      (activeTab === "resolved" && ticket.status === "resolved");
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesPriority && matchesSearch;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  const PRIORITY_COLORS: Record<string, string> = {
    low: "#6B7280",
    medium: "#F59E0B",
    high: "#EF4444",
    critical: "#FF0000",
  };

  return (
    <div className="flex h-screen bg-[var(--background)]" key={language}>
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-8">

            {/* ── Header ────────────────────────────────────── */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(0,194,255,0.12)] border border-[rgba(0,194,255,0.2)] flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-[#00C2FF]" />
                  </div>
                  <h1
                    className="text-3xl font-bold text-white"
                    style={{ textShadow: "0 0 40px rgba(0,194,255,0.25)" }}
                  >
                    {t("servicedesk.title")}
                  </h1>
                </div>
                <p className="text-sm text-gray-400 pl-[52px]">
                  Gerencie solicitações, suporte técnico e acessos da plataforma
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-[#07142A] transition-all"
                style={{
                  background: "linear-gradient(135deg,#00C2FF,#0099CC)",
                  boxShadow: "0 0 24px rgba(0,194,255,0.35)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 36px rgba(0,194,255,0.55)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(0,194,255,0.35)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <Plus className="w-4 h-4" />
                Nova solicitação
              </button>
            </div>

            {/* ── Stats row ─────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { key: "all",         label: "Total",       icon: Ticket,        color: "#00C2FF" },
                { key: "open",        label: "Abertos",     icon: CircleDot,     color: "#00C2FF" },
                { key: "in_progress", label: "Em andamento",icon: Clock,         color: "#F59E0B" },
                { key: "resolved",    label: "Resolvidos",  icon: CheckCircle2,  color: "#00FF9C" },
              ].map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="relative text-left p-4 rounded-[16px] border transition-all duration-200"
                  style={{
                    background: activeTab === key
                      ? `rgba(${color === "#00C2FF" ? "0,194,255" : color === "#F59E0B" ? "245,158,11" : "0,255,156"},0.08)`
                      : "rgba(255,255,255,0.02)",
                    borderColor: activeTab === key ? `${color}40` : "rgba(255,255,255,0.05)",
                    boxShadow: activeTab === key ? `0 0 20px ${color}18` : "none",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${color}18` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{label}</span>
                  </div>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: activeTab === key ? color : "white" }}
                  >
                    {counts[key as keyof typeof counts]}
                  </span>
                  {activeTab === key && (
                    <div
                      className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                      style={{ background: color }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ── Search + priority ─────────────────────────── */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por ID, título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 transition-all focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,194,255,0.4)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,194,255,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Priority chips */}
              <div
                className="flex items-center gap-1.5 px-2 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {[
                  { value: "all",    label: "Todos",  color: "#9CA3AF" },
                  { value: "high",   label: "Alta",   color: PRIORITY_COLORS.high },
                  { value: "medium", label: "Média",  color: PRIORITY_COLORS.medium },
                  { value: "low",    label: "Baixa",  color: PRIORITY_COLORS.low },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setFilterPriority(value)}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                    style={
                      filterPriority === value
                        ? {
                            background: `${color}20`,
                            color,
                            border: `1px solid ${color}35`,
                            boxShadow: `0 0 8px ${color}25`,
                          }
                        : { color: "#6B7280" }
                    }
                  >
                    {value !== "all" && (
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                        style={{ background: color }}
                      />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Ticket list ───────────────────────────────── */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <EmptyState />
              ) : (
                filteredTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} t={t} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {isCreateModalOpen && (
        <CreateTicketModal onClose={() => setIsCreateModalOpen(false)} t={t} />
      )}
    </div>
  );
}

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-[20px]"
      style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(0,194,255,0.08)", border: "1px solid rgba(0,194,255,0.15)" }}
      >
        <Search className="w-7 h-7 text-[#00C2FF]/50" />
      </div>
      <p className="text-gray-400 font-medium mb-1">Nenhum chamado encontrado</p>
      <p className="text-xs text-gray-600">Tente ajustar os filtros ou abra uma nova solicitação</p>
    </div>
  );
}

// ─── ticket card ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  open:        { label: "Aberto",       color: "#00C2FF", Icon: CircleDot     },
  in_progress: { label: "Em andamento", color: "#F59E0B", Icon: Clock         },
  resolved:    { label: "Resolvido",    color: "#00FF9C", Icon: CheckCircle2  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:      { label: "Baixa",    color: "#6B7280" },
  medium:   { label: "Média",    color: "#F59E0B" },
  high:     { label: "Alta",     color: "#EF4444" },
  critical: { label: "Crítica",  color: "#FF0000" },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  user_management: UserPlus,
  platform:        Zap,
  commercial:      Rocket,
};

function TicketCard({ ticket }: { ticket: ServiceDeskTicket; t: (k: string) => string }) {
  const status   = STATUS_CONFIG[ticket.status]   ?? STATUS_CONFIG.open;
  const priority = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium;
  const Icon     = CATEGORY_ICONS[ticket.category as keyof typeof CATEGORY_ICONS] ?? Ticket;

  return (
    <div
      className="group relative flex gap-5 p-5 rounded-[18px] cursor-pointer transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "rgba(255,255,255,0.04)";
        el.style.borderColor = "rgba(0,194,255,0.15)";
        el.style.transform   = "translateY(-2px)";
        el.style.boxShadow   = "0 8px 32px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background  = "rgba(255,255,255,0.025)";
        el.style.borderColor = "rgba(255,255,255,0.05)";
        el.style.transform   = "translateY(0)";
        el.style.boxShadow   = "none";
      }}
    >
      {/* Priority accent bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
        style={{ background: priority.color, opacity: 0.7 }}
      />

      {/* Category icon */}
      <div
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(0,194,255,0.08)",
          border: "1px solid rgba(0,194,255,0.15)",
        }}
      >
        <Icon className="w-5 h-5 text-[#00C2FF]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: ID + badges */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs text-gray-500 font-mono">{ticket.id}</span>

          {/* Status badge */}
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: `${status.color}18`, color: status.color }}
          >
            <status.Icon className="w-3 h-3" />
            {status.label}
          </span>

          {/* Priority badge */}
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: `${priority.color}15`, color: priority.color }}
          >
            <AlertCircle className="w-3 h-3" />
            {priority.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-white mb-1 leading-snug">
          {ticket.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-3">
          {ticket.description}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {relativeDate(ticket.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {ticket.assignee}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(ticket.date).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>

      {/* Action arrow */}
      <div className="shrink-0 flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-4 h-4 text-[#00C2FF]" />
      </div>
    </div>
  );
}

// ─── create ticket modal ──────────────────────────────────────────────────────

interface CreateTicketModalProps {
  onClose: () => void;
  t: (key: string) => string;
}

function CreateTicketModal({ onClose, t }: CreateTicketModalProps) {
  const [ticketType, setTicketType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const ticketTypes = [
    {
      category: t("ticket.user_management"),
      options: [
        { value: "ticket.create_user",        label: t("ticket.create_user"),        icon: UserPlus },
        { value: "ticket.change_permissions",  label: t("ticket.change_permissions"), icon: Key      },
        { value: "ticket.remove_user",         label: t("ticket.remove_user"),        icon: UserMinus},
        { value: "ticket.reset_password",      label: t("ticket.reset_password"),     icon: Lock     },
      ],
    },
    {
      category: "Plataforma",
      options: [
        { value: "ticket.request_training",   label: t("ticket.request_training"),   icon: GraduationCap },
        { value: "ticket.technical_support",   label: t("ticket.technical_support"),  icon: Zap           },
      ],
    },
    {
      category: "Comercial",
      options: [
        { value: "ticket.request_module", label: t("ticket.request_module"), icon: Rocket },
      ],
    },
  ];

  const priorityOptions = [
    { value: "low",      label: "Baixa",   color: "#6B7280" },
    { value: "medium",   label: "Média",   color: "#F59E0B" },
    { value: "high",     label: "Alta",    color: "#EF4444" },
    { value: "critical", label: "Crítica", color: "#FF0000" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating ticket:", { ticketType, title, description, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-[24px]"
        style={{
          background: "rgba(8,18,40,0.98)",
          border: "1px solid rgba(0,194,255,0.2)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(0,194,255,0.1)",
        }}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-5"
          style={{
            background: "rgba(8,18,40,0.98)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.2)" }}
            >
              <Plus className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nova solicitação</h2>
              <p className="text-xs text-gray-500">Preencha os detalhes do chamado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Type select */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de solicitação <span className="text-[#00C2FF]">*</span>
            </label>
            <div className="relative">
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white appearance-none cursor-pointer transition-all focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundImage: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,194,255,0.4)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,194,255,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <option value="" disabled className="bg-[#0A1428] text-gray-500">
                  Selecione o tipo...
                </option>
                {ticketTypes.map((cat) => (
                  <optgroup key={cat.category} label={cat.category} className="bg-[#0A1428] text-gray-400">
                    {cat.options.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#0A1428] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00C2FF] pointer-events-none" />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título <span className="text-[#00C2FF]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Criar login para novo scout"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 transition-all focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,194,255,0.4)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,194,255,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Prioridade <span className="text-[#00C2FF]">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorityOptions.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPriority(value)}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-150"
                  style={
                    priority === value
                      ? {
                          background: `${color}20`,
                          color,
                          border: `1px solid ${color}40`,
                          boxShadow: `0 0 12px ${color}20`,
                        }
                      : {
                          background: "rgba(255,255,255,0.03)",
                          color: "#6B7280",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }
                  }
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                    style={{ background: priority === value ? color : "#374151" }}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição <span className="text-[#00C2FF]">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              placeholder="Descreva detalhadamente sua solicitação..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 transition-all focus:outline-none resize-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,194,255,0.4)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,194,255,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("servicedesk.attach_files")}
              <span className="text-gray-600 font-normal ml-2">— opcional</span>
            </label>
            <div
              className="flex flex-col items-center justify-center py-8 rounded-xl cursor-pointer transition-all group"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1.5px dashed rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,194,255,0.25)";
                (e.currentTarget as HTMLElement).style.background  = "rgba(0,194,255,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.background  = "rgba(255,255,255,0.02)";
              }}
            >
              <Paperclip className="w-6 h-6 text-gray-500 mb-2 group-hover:text-[#00C2FF] transition-colors" />
              <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                Arraste ou clique para anexar
              </p>
              <p className="text-xs text-gray-600 mt-1">PDF, PNG, JPG até 10MB</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Cancelar
            </Button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#07142A] transition-all"
              style={{
                background: "linear-gradient(135deg,#00C2FF,#0099CC)",
                boxShadow: "0 0 20px rgba(0,194,255,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(0,194,255,0.5)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,194,255,0.3)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {t("servicedesk.create_ticket")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
