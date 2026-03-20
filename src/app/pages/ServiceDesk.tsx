import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Plus, Search, Calendar, User, X, Paperclip, UserPlus, Key, UserMinus, Lock, Zap, GraduationCap, Rocket } from "lucide-react";
import { Button } from "../components/ui/button";
import { getServiceDeskTickets, type ServiceDeskTicket } from "../services/serviceDesk";

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
      if (!active) {
        return;
      }

      setTickets(response.data as ServiceDeskTicket[]);
    }

    loadTickets();

    return () => {
      active = false;
    };
  }, []);

  // Filter tickets based on active tab, priority filter, and search
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

  // Count tickets by status
  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div className="flex h-screen bg-[var(--background)]" key={language}>
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1400px] mx-auto space-y-8">
            {/* Header with New Ticket Button */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-4xl mb-2">{t("servicedesk.title")}</h1>
                <p className="text-gray-400">{t("servicedesk.subtitle")}</p>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#00C2FF] hover:bg-[#00A8E0] text-[#07142A] font-semibold px-8 py-3.5 rounded-xl shadow-[0_0_24px_rgba(0,194,255,0.35)] hover:shadow-[0_0_32px_rgba(0,194,255,0.5)] transition-all hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t("servicedesk.new_ticket")}
              </Button>
            </div>

            {/* Tabs for Status Filtering */}
            <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)] inline-flex gap-2">
              <TabButton
                label={`${t("servicedesk.all")} (${counts.all})`}
                isActive={activeTab === "all"}
                onClick={() => setActiveTab("all")}
              />
              <TabButton
                label={`${t("status.open")} (${counts.open})`}
                isActive={activeTab === "open"}
                onClick={() => setActiveTab("open")}
                color="#00C2FF"
              />
              <TabButton
                label={`${t("status.in_progress")} (${counts.in_progress})`}
                isActive={activeTab === "in_progress"}
                onClick={() => setActiveTab("in_progress")}
                color="#FFA500"
              />
              <TabButton
                label={`${t("status.resolved")} (${counts.resolved})`}
                isActive={activeTab === "resolved"}
                onClick={() => setActiveTab("resolved")}
                color="#00FF9C"
              />
            </div>

            {/* Search and Priority Filter */}
            <div className="flex gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar chamados por ID, tÃ­tulo ou descriÃ§Ã£o..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/20 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                />
              </div>

              {/* Priority Filter */}
              <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-xl p-2 shadow-[0_4px_16px_rgba(0,0,0,0.2)] inline-flex gap-2 border border-[rgba(255,255,255,0.06)]">
                <PriorityFilterButton
                  label={t("servicedesk.all")}
                  isActive={filterPriority === "all"}
                  onClick={() => setFilterPriority("all")}
                />
                <PriorityFilterButton
                  label={t("priority.high")}
                  isActive={filterPriority === "high"}
                  onClick={() => setFilterPriority("high")}
                  color="#FF4D4F"
                />
                <PriorityFilterButton
                  label={t("priority.medium")}
                  isActive={filterPriority === "medium"}
                  onClick={() => setFilterPriority("medium")}
                  color="#FFA500"
                />
                <PriorityFilterButton
                  label={t("priority.low")}
                  isActive={filterPriority === "low"}
                  onClick={() => setFilterPriority("low")}
                  color="#6B7280"
                />
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-16 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <div className="w-20 h-20 rounded-full bg-[rgba(0,194,255,0.1)] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-[#00C2FF]/50" />
                  </div>
                  <p className="text-gray-400 text-lg">{t("servicedesk.no_tickets")}</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} t={t} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <CreateTicketModal onClose={() => setIsCreateModalOpen(false)} t={t} />
      )}
    </div>
  );
}

// ========================================
// TAB BUTTON COMPONENT
// ========================================
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  color?: string;
}

function TabButton({ label, isActive, onClick, color = "#00C2FF" }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? "text-[#07142A] shadow-[0_4px_16px_rgba(0,194,255,0.3)]"
          : "text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.03)]"
      }`}
      style={isActive ? { backgroundColor: color } : {}}
    >
      {label}
    </button>
  );
}

// ========================================
// PRIORITY FILTER BUTTON COMPONENT
// ========================================
interface PriorityFilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  color?: string;
}

function PriorityFilterButton({ label, isActive, onClick, color = "#00C2FF" }: PriorityFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? "shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
          : "text-gray-500 hover:text-white hover:bg-[rgba(255,255,255,0.03)]"
      }`}
      style={isActive ? { backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` } : {}}
    >
      {label}
    </button>
  );
}

// ========================================
// TICKET CARD COMPONENT
// ========================================
interface TicketCardProps {
  ticket: ServiceDeskTicket;
  t: (key: string) => string;
}

function TicketCard({ ticket, t }: TicketCardProps) {
  const statusConfig = {
    open: {
      label: t("status.open"),
      color: "#00C2FF",
      bg: "rgba(0, 194, 255, 0.15)",
    },
    in_progress: {
      label: t("status.in_progress"),
      color: "#FFA500",
      bg: "rgba(255, 165, 0, 0.15)",
    },
    resolved: {
      label: t("status.resolved"),
      color: "#00FF9C",
      bg: "rgba(0, 255, 156, 0.15)",
    },
  };

  const priorityConfig = {
    low: { label: t("priority.low"), color: "#6B7280" },
    medium: { label: t("priority.medium"), color: "#FFA500" },
    high: { label: t("priority.high"), color: "#FF4D4F" },
    critical: { label: t("priority.critical"), color: "#FF4D4F" },
  };

  const categoryIcons = {
    user_management: UserPlus,
    platform: Zap,
    commercial: Rocket,
  };

  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];
  const Icon = categoryIcons[ticket.category as keyof typeof categoryIcons];

  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-0.5 group border border-[rgba(255,255,255,0.04)] hover:border-[rgba(0,194,255,0.2)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header: ID, Status, Priority */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(0,194,255,0.1)] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#00C2FF]" />
            </div>
            <span className="text-base font-semibold text-white">{ticket.id}</span>
            <div
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${priority.color}15`, color: priority.color }}
            >
              {priority.label}
            </div>
          </div>

          {/* Title and Description */}
          <h3 className="text-lg font-medium text-white mb-2">{ticket.title}</h3>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">{ticket.description}</p>

          {/* Footer: Date and Assignee */}
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(ticket.date).toLocaleDateString("pt-BR")}
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {ticket.assignee}
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <button className="ml-6 text-[#00C2FF] hover:text-white transition-colors font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
          {t("servicedesk.view_details")}
          <span className="text-lg">â†’</span>
        </button>
      </div>
    </div>
  );
}

// ========================================
// CREATE TICKET MODAL COMPONENT
// ========================================
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
        { value: "ticket.create_user", label: t("ticket.create_user"), icon: UserPlus },
        { value: "ticket.change_permissions", label: t("ticket.change_permissions"), icon: Key },
        { value: "ticket.remove_user", label: t("ticket.remove_user"), icon: UserMinus },
        { value: "ticket.reset_password", label: t("ticket.reset_password"), icon: Lock },
      ],
    },
    {
      category: "Plataforma",
      options: [
        { value: "ticket.request_training", label: t("ticket.request_training"), icon: GraduationCap },
        { value: "ticket.technical_support", label: t("ticket.technical_support"), icon: Zap },
      ],
    },
    {
      category: "Comercial",
      options: [
        { value: "ticket.request_module", label: t("ticket.request_module"), icon: Rocket },
      ],
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating ticket:", { ticketType, title, description, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[rgba(10,20,40,0.98)] border border-[rgba(0,194,255,0.2)] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_80px_rgba(0,194,255,0.15)] max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-[rgba(10,20,40,0.98)] border-b border-[rgba(255,255,255,0.08)] p-6 flex items-center justify-between backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-semibold mb-1">{t("servicedesk.new_ticket")}</h2>
            <p className="text-sm text-gray-400">Preencha os detalhes do seu chamado</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] flex items-center justify-center transition-all hover:scale-105"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Ticket Type - Custom Styled Select */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t("servicedesk.type")} *
            </label>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/20 transition-all appearance-none cursor-pointer hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(0,194,255,0.3)] hover:shadow-[0_0_20px_rgba(0,194,255,0.15)]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2300C2FF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                paddingRight: "3rem",
              }}
            >
              <option value="" disabled className="bg-[#0A1428] text-gray-500">
                Selecione o tipo de solicitaÃ§Ã£o
              </option>
              {ticketTypes.map((category) => (
                <optgroup key={category.category} label={category.category} className="bg-[#0A1428] text-gray-400 font-semibold py-2">
                  {category.options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#0A1428] text-white py-2 px-4 hover:bg-[rgba(0,194,255,0.1)]">
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              TÃ­tulo do Chamado *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Criar login para novo scout"
              className="w-full px-4 py-3.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/20 transition-all"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t("servicedesk.priority")} *
            </label>
            <div className="grid grid-cols-4 gap-3">
              {["low", "medium", "high", "critical"].map((p) => {
                const colors = {
                  low: "#6B7280",
                  medium: "#FFA500",
                  high: "#FF4D4F",
                  critical: "#FF0000",
                };
                const isActive = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                        : "bg-[rgba(255,255,255,0.03)] text-gray-400 hover:bg-[rgba(255,255,255,0.06)]"
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: `${colors[p as keyof typeof colors]}20`,
                            color: colors[p as keyof typeof colors],
                            border: `1px solid ${colors[p as keyof typeof colors]}50`,
                          }
                        : {}
                    }
                  >
                    {t(`priority.${p}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t("servicedesk.description")} *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              placeholder="Descreva detalhadamente sua solicitaÃ§Ã£o..."
              className="w-full px-4 py-3.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/20 transition-all resize-none"
            />
          </div>

          {/* Attach Files */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t("servicedesk.attach_files")}
            </label>
            <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl p-10 text-center hover:border-[#00C2FF]/30 transition-all cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-[rgba(0,194,255,0.1)] flex items-center justify-center mx-auto mb-3 group-hover:bg-[rgba(0,194,255,0.15)] transition-all">
                <Paperclip className="w-8 h-8 text-[#00C2FF]/70 group-hover:text-[#00C2FF] transition-all" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Clique para selecionar ou arraste arquivos aqui</p>
              <p className="text-xs text-gray-600">PDF, PNG, JPG atÃ© 10MB</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] text-gray-300 border-[rgba(255,255,255,0.1)] py-3.5 rounded-xl"
            >
              {t("servicedesk.cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#00C2FF] hover:bg-[#00A8E0] text-[#07142A] font-semibold py-3.5 rounded-xl shadow-[0_0_24px_rgba(0,194,255,0.35)] hover:shadow-[0_0_32px_rgba(0,194,255,0.5)] hover:scale-[1.02] transition-all"
            >
              {t("servicedesk.create_ticket")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
