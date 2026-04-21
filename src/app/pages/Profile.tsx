import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Calendar,
  Package,
  CheckCircle,
  TrendingUp,
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
  Shield,
  Mail,
  Pencil,
  X,
  Check,
  Camera,
  Building2,
  User,
  AlertCircle,
  Image,
} from "lucide-react";
import { useEffect, useState, useMemo, memo, useRef } from "react";
import { getProfileUpsells, type ProfileUpsell } from "../services/profile";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../contexts/ProfileContext";
import { updateUserProfile } from "../../services/userProfile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Upsell extends Omit<ProfileUpsell, "iconKey"> {
  id: string;
  title: string;
  description: string;
  status: "Ativo" | "Inativo" | "Pendente";
  activatedDate: string;
  icon: React.ElementType;
  color: string;
  category: string;
}

type FilterType = "all" | "Ativo" | "Inativo" | "Pendente";
type SortType = "date-desc" | "date-asc" | "name-asc" | "name-desc";

const ROLE_LABELS: Record<string, string> = {
  admin:  "Administrador",
  gestor: "Gestor",
  scout:  "Scout",
  viewer: "Visualizador",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Profile() {
  const { user } = useAuth();
  const { profile, profileLoading, setProfile } = useProfile();

  const [upsells,      setUpsells]      = useState<Upsell[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterType>("all");
  const [sortBy,       setSortBy]       = useState<SortType>("date-desc");

  // Load upsells
  useEffect(() => {
    let active = true;
    async function loadUpsells() {
      const response = await getProfileUpsells();
      if (!active) return;
      setUpsells(
        response.data.map((upsell) => ({
          ...upsell,
          icon:
            upsell.iconKey === "dashboard"   ? BarChart3
            : upsell.iconKey === "compare"   ? Users
            : upsell.iconKey === "integration" ? CheckCircle
            : TrendingUp,
        })),
      );
    }
    loadUpsells();
    return () => { active = false; };
  }, []);

  const filteredUpsells = useMemo(() => {
    let filtered = [...upsells];
    if (filterStatus !== "all") filtered = filtered.filter((item) => item.status === filterStatus);
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return new Date(b.activatedDate).getTime() - new Date(a.activatedDate).getTime();
        case "date-asc":  return new Date(a.activatedDate).getTime() - new Date(b.activatedDate).getTime();
        case "name-asc":  return a.title.localeCompare(b.title);
        case "name-desc": return b.title.localeCompare(a.title);
        default:          return 0;
      }
    });
    return filtered;
  }, [filterStatus, sortBy, upsells]);

  const startDate       = new Date("2025-01-01");
  const endDate         = new Date("2027-12-31");
  const today           = new Date();
  const totalDays       = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays     = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays   = totalDays - elapsedDays;
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
  const remainingMonths = Math.floor(remainingDays / 30);
  const contractStatus  = remainingDays > 180 ? "Saudavel" : remainingDays > 60 ? "Atencao" : "Critico";

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1400px] mx-auto">

            <ProfileHeader
              user={user}
              profile={profile}
              profileLoading={profileLoading}
              onSave={setProfile}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
              <div className="xl:col-span-2">
                <ContractStatusCard
                  startDate={startDate}
                  endDate={endDate}
                  remainingMonths={remainingMonths}
                  progressPercent={progressPercent}
                  status={contractStatus}
                />
              </div>
              <UsageStatsCard />
            </div>

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

// ─── Profile header ───────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  user:           { name: string; email: string; role: string; clubName: string } | null;
  profile:        import("../../services/userProfile").UserProfile | null;
  profileLoading: boolean;
  onSave:         (updated: import("../../services/userProfile").UserProfile) => void;
}

interface EditForm {
  name:        string;
  clubName:    string;
  clubLogoUrl: string;
  avatarUrl:   string;
}

const ProfileHeader = memo(({ user, profile, profileLoading, onSave }: ProfileHeaderProps) => {
  // Merge: API profile takes priority over JWT auth data
  const displayName     = profile?.name        ?? user?.name     ?? "";
  const displayEmail    = profile?.email        ?? user?.email    ?? "";
  const displayClub     = profile?.clubName     ?? user?.clubName ?? "";
  const displayClubLogo = profile?.clubLogoUrl  ?? null;
  const displayAvatar   = profile?.avatarUrl    ?? null;
  const displayRole     = profile?.role         ?? user?.role     ?? "scout";
  const roleLabel       = ROLE_LABELS[displayRole] ?? displayRole;

  const userInitials = (displayName || displayEmail)
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const clubInitials = displayClub
    .split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "ORG";

  // Edit state
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState<EditForm>({
    name:        displayName,
    clubName:    displayClub,
    clubLogoUrl: displayClubLogo ?? "",
    avatarUrl:   displayAvatar   ?? "",
  });

  // Keep form in sync when profile loads from API
  useEffect(() => {
    if (!editing) {
      setForm({
        name:        profile?.name       ?? user?.name     ?? "",
        clubName:    profile?.clubName   ?? user?.clubName ?? "",
        clubLogoUrl: profile?.clubLogoUrl ?? "",
        avatarUrl:   profile?.avatarUrl  ?? "",
      });
    }
  }, [profile, user, editing]);

  const handleEdit = () => {
    setSaveError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setForm({
      name:        profile?.name        ?? user?.name     ?? "",
      clubName:    profile?.clubName    ?? user?.clubName ?? "",
      clubLogoUrl: profile?.clubLogoUrl ?? "",
      avatarUrl:   profile?.avatarUrl   ?? "",
    });
    setSaveError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        name:        form.name.trim()        || undefined,
        clubName:    form.clubName.trim()    || undefined,
        clubLogoUrl: form.clubLogoUrl.trim() || undefined,
        avatarUrl:   form.avatarUrl.trim()   || undefined,
      };
      const res = await updateUserProfile(payload);
      onSave(res.data);
      setEditing(false);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  // Live preview failed flags
  const [avatarFailed,   setAvatarFailed]   = useState(false);
  const [clubLogoFailed, setClubLogoFailed] = useState(false);

  const avatarSrc   = editing ? form.avatarUrl   : displayAvatar;
  const clubLogoSrc = editing ? form.clubLogoUrl : displayClubLogo;

  const showAvatar   = !!avatarSrc   && !avatarFailed;
  const showClubLogo = !!clubLogoSrc && !clubLogoFailed;

  return (
    <div className="relative bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8 mb-8 transition-all duration-200">

      {/* ── Success toast ─────────────────────────────────────────────── */}
      {saved && (
        <div className="mb-6 flex items-center gap-3 rounded-[12px] border border-[rgba(0,255,156,0.25)] bg-[rgba(0,255,156,0.07)] px-4 py-3">
          <Check className="h-4 w-4 flex-shrink-0 text-[#00FF9C]" />
          <p className="text-sm font-medium text-[#00FF9C]">Perfil atualizado com sucesso</p>
        </div>
      )}

      {/* ── Error banner ──────────────────────────────────────────────── */}
      {saveError && (
        <div className="mb-6 flex items-center gap-3 rounded-[12px] border border-[rgba(255,77,79,0.25)] bg-[rgba(255,77,79,0.07)] px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#FF4D4F]" />
          <p className="text-sm font-medium text-[#FFB4B5]">{saveError}</p>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="ml-auto text-[#FF4D4F] hover:opacity-70 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

        {/* ── Left: identity ────────────────────────────────────────────── */}
        <div className="flex items-start gap-6 flex-1 min-w-0">

          {/* Organization logo */}
          <div className="w-20 h-20 rounded-[14px] overflow-hidden bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center flex-shrink-0">
            {showClubLogo ? (
              <img
                key={clubLogoSrc!}
                src={clubLogoSrc!}
                alt={displayClub || "Logo"}
                className="w-full h-full object-contain p-2"
                onError={() => setClubLogoFailed(true)}
                onLoad={() => setClubLogoFailed(false)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1">
                <Building2 className="w-7 h-7 text-gray-600" />
                {clubInitials && (
                  <span className="text-[9px] font-bold text-gray-700 tracking-widest">
                    {clubInitials}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Info block */}
          <div className="min-w-0 flex-1">
            {editing ? (
              /* ── Edit form ─────────────────────────────────────── */
              <div className="space-y-4 pt-1">

                {/* ── Organization section ── */}
                <div className="rounded-[12px] border border-[rgba(0,194,255,0.1)] bg-[rgba(0,194,255,0.03)] p-4 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00C2FF]/60 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" />
                    Organização
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        Nome do clube
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: FC Barcelona"
                        value={form.clubName}
                        maxLength={120}
                        onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value }))}
                        className="w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-[#00C2FF] focus:bg-[rgba(0,194,255,0.05)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        <Image className="h-3 w-3" />
                        URL do logo
                      </label>
                      <input
                        type="url"
                        placeholder="https://…"
                        value={form.clubLogoUrl}
                        onChange={(e) => {
                          setClubLogoFailed(false);
                          setForm((f) => ({ ...f, clubLogoUrl: e.target.value }));
                        }}
                        className="w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-[#00C2FF] focus:bg-[rgba(0,194,255,0.05)]"
                      />
                    </div>
                  </div>
                </div>

                {/* ── User section ── */}
                <div className="rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600 flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    Usuário
                  </p>

                  {/* Avatar preview + URL input */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      {showAvatar ? (
                        <img
                          key={form.avatarUrl}
                          src={avatarSrc!}
                          alt="Avatar"
                          className="h-14 w-14 rounded-full object-cover object-top border-2 border-[rgba(0,194,255,0.35)]"
                          onError={() => setAvatarFailed(true)}
                          onLoad={() => setAvatarFailed(false)}
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[rgba(0,194,255,0.35)] bg-[rgba(0,194,255,0.12)] text-base font-bold text-[#00C2FF]">
                          {userInitials}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(0,0,0,0.4)] bg-[#00C2FF]">
                        <Camera className="h-2.5 w-2.5 text-[#07142A]" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        URL do avatar
                      </label>
                      <input
                        type="url"
                        placeholder="https://…"
                        value={form.avatarUrl}
                        onChange={(e) => {
                          setAvatarFailed(false);
                          setForm((f) => ({ ...f, avatarUrl: e.target.value }));
                        }}
                        className="w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-[#00C2FF] focus:bg-[rgba(0,194,255,0.05)]"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                      <User className="h-3 w-3" />
                      Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={form.name}
                      maxLength={100}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-[#00C2FF] focus:bg-[rgba(0,194,255,0.05)]"
                    />
                  </div>
                </div>

                {/* Read-only row */}
                <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    <span className="font-mono">{displayEmail || "—"}</span>
                    <span className="ml-1 rounded-full bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 text-[10px] text-gray-600">
                      somente leitura
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-[#00C2FF]" />
                    <span>{roleLabel}</span>
                  </span>
                </div>
              </div>
            ) : (
              /* ── View mode ─────────────────────────────────────── */
              <>
                {/* Organization name as main heading */}
                <h1 className="text-3xl font-semibold mb-0.5">
                  {profileLoading
                    ? <span className="inline-block h-8 w-52 animate-pulse rounded-[8px] bg-[rgba(255,255,255,0.06)]" />
                    : (displayClub || "Minha Organização")}
                </h1>
                <p className="text-xs text-gray-600 mb-4 flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />
                  Organização
                </p>

                {/* Divider */}
                <div className="w-12 h-px bg-[rgba(255,255,255,0.06)] mb-4" />

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  {/* User avatar + name */}
                  <div className="flex items-center gap-2">
                    {showAvatar ? (
                      <img
                        src={displayAvatar!}
                        alt={displayName}
                        className="h-6 w-6 rounded-full object-cover object-top border border-[rgba(0,194,255,0.3)]"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(0,194,255,0.3)] bg-[rgba(0,194,255,0.1)] text-[9px] font-bold text-[#00C2FF]">
                        {userInitials}
                      </div>
                    )}
                    <Shield className="h-3.5 w-3.5 text-[#00C2FF]" />
                    <span className="font-medium text-gray-300">
                      {profileLoading
                        ? <span className="inline-block h-3 w-24 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
                        : (displayName || "—")}
                    </span>
                    <span className="text-gray-600">·</span>
                    <span>{roleLabel}</span>
                  </div>
                  {/* Email */}
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-600" />
                    <span className="font-mono">{displayEmail || "—"}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: action buttons ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 text-sm font-medium text-gray-400 transition-all hover:border-[rgba(255,255,255,0.18)] hover:text-gray-200 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#00C2FF] px-5 py-2.5 text-sm font-bold text-[#07142A] shadow-[0_4px_16px_rgba(0,194,255,0.3)] transition-all hover:bg-[#33CFFF] hover:shadow-[0_6px_20px_rgba(0,194,255,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07142A] border-t-transparent" />
                    Salvando…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleEdit}
                className="bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] rounded-[12px] h-11 px-5 gap-2"
              >
                <Pencil className="h-4 w-4" />
                Editar Perfil
              </Button>
              <Button className="bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] rounded-[12px] h-11 px-6 font-semibold shadow-[0_4px_16px_rgba(0,194,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,194,255,0.35)] transition-all gap-2">
                <ExternalLink className="h-4 w-4" />
                Gerenciar Plano
              </Button>
            </>
          )}
        </div>

      </div>
    </div>
  );
});

ProfileHeader.displayName = "ProfileHeader";

// ─── Contract status card ─────────────────────────────────────────────────────

interface ContractStatusCardProps {
  startDate:       Date;
  endDate:         Date;
  remainingMonths: number;
  progressPercent: number;
  status:          string;
}

const ContractStatusCard = memo(({ startDate, endDate, remainingMonths, progressPercent, status }: ContractStatusCardProps) => {
  const statusConfig = {
    Saudavel: { color: "#00FF9C", bg: "rgba(0,255,156,0.12)",  icon: CheckCircle,  label: "Saudável" },
    Atencao:  { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", icon: AlertTriangle, label: "Atenção"  },
    Critico:  { color: "#FF4D4F", bg: "rgba(255,77,79,0.12)",  icon: AlertTriangle, label: "Crítico"  },
  };

  const config      = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.Saudavel;
  const StatusIcon  = config.icon;
  const progressColor = progressPercent > 80 ? "#FF4D4F" : progressPercent > 60 ? "#fbbf24" : "#00C2FF";

  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8">
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
          <span className="text-sm font-semibold">{config.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <MetricBox label="Data de Início"  value={startDate.toLocaleDateString("pt-BR")} icon={Calendar} color="#00C2FF" />
        <MetricBox label="Data de Término" value={endDate.toLocaleDateString("pt-BR")}   icon={Calendar} color="#00C2FF" />
        <MetricBox label="Tempo Restante"  value={`${remainingMonths} meses`}             icon={Clock}    color="#00FF9C" />
      </div>

      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400 font-medium">Progresso do Contrato</span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: progressColor }}>
            {progressPercent}% concluído
          </span>
        </div>
        <div className="w-full bg-[rgba(255,255,255,0.04)] rounded-full h-3 overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%`, background: `linear-gradient(to right, #00C2FF, ${progressColor})` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
          <span>{startDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
          <span>{endDate.toLocaleDateString("pt-BR",   { month: "short", year: "numeric" })}</span>
        </div>
      </div>

      {status !== "Saudavel" && (
        <div
          className="mt-6 flex items-start gap-3 p-4 rounded-[12px] border"
          style={{ background: config.bg, borderColor: config.color + "40" }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: config.color }} />
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1" style={{ color: config.color }}>
              {status === "Atencao" ? "Contrato se aproxima do fim" : "Renovação Urgente"}
            </p>
            <p className="text-xs text-gray-400">
              {status === "Atencao"
                ? "Recomendamos iniciar o processo de renovação nos próximos 60 dias."
                : "Entre em contato com nosso time comercial para garantir a continuidade do serviço."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

ContractStatusCard.displayName = "ContractStatusCard";

interface MetricBoxProps {
  label: string;
  value: string;
  icon:  React.ElementType;
  color: string;
}

const MetricBox = memo(({ label, value, icon: Icon, color }: MetricBoxProps) => (
  <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-5">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-[7px] flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</p>
    </div>
    <p className="text-xl font-semibold tabular-nums" style={{ color }}>{value}</p>
  </div>
));

MetricBox.displayName = "MetricBox";

// ─── Usage stats card ─────────────────────────────────────────────────────────

const UsageStatsCard = memo(() => {
  const stats = [
    { label: "Análises",    value: 247, change: +18, icon: BarChart3, color: "#00C2FF" },
    { label: "Relatórios",  value: 89,  change: +12, icon: FileText,  color: "#7A5CFF" },
    { label: "Comparações", value: 134, change: +25, icon: Users,     color: "#00FF9C" },
    { label: "Usuários",    value: 12,  change: +8,  icon: Users,     color: "#00C2FF" },
  ];

  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-semibold">Estatísticas de Uso</h2>
        <button className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors" title="Atualizar">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-5">
        {stats.map((stat) => <UsageStatItem key={stat.label} stat={stat} />)}
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
  stat: { label: string; value: number; change: number; icon: React.ElementType; color: string };
}

const UsageStatItem = memo(({ stat }: UsageStatItemProps) => {
  const Icon       = stat.icon;
  const isPositive = stat.change > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: `${stat.color}15` }}>
          <Icon className="w-4 h-4" style={{ color: stat.color }} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
        </div>
      </div>
      <div
        className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-[6px]"
        style={{
          background: isPositive ? "rgba(0,255,156,0.12)" : "rgba(255,77,79,0.12)",
          color:      isPositive ? "#00FF9C"              : "#FF4D4F",
        }}
      >
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(stat.change)}%
      </div>
    </div>
  );
});

UsageStatItem.displayName = "UsageStatItem";

// ─── Upsells section ──────────────────────────────────────────────────────────

interface UpsellsSectionProps {
  upsells:         Upsell[];
  filterStatus:    FilterType;
  setFilterStatus: (value: FilterType) => void;
  sortBy:          SortType;
  setSortBy:       (value: SortType) => void;
}

const UpsellsSection = memo(({ upsells, filterStatus, setFilterStatus, sortBy, setSortBy }: UpsellsSectionProps) => (
  <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-[rgba(122,92,255,0.12)] flex items-center justify-center">
          <Package className="w-5 h-5 text-[#7A5CFF]" />
        </div>
        <h2 className="text-xl font-semibold">Serviços Adquiridos</h2>
        <span className="text-sm text-gray-500">({upsells.length} itens)</span>
      </div>

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

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {upsells.map((upsell) => <UpsellCard key={upsell.id} upsell={upsell} />)}
    </div>

    {upsells.length === 0 && (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-[16px] bg-[rgba(122,92,255,0.08)] flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-gray-700" />
        </div>
        <p className="text-sm text-gray-500 mb-1">Nenhum serviço encontrado</p>
        <p className="text-xs text-gray-700">Ajuste os filtros para ver outros itens</p>
      </div>
    )}
  </div>
));

UpsellsSection.displayName = "UpsellsSection";

// ─── Upsell card ──────────────────────────────────────────────────────────────

interface UpsellCardProps {
  upsell: Upsell;
}

const UpsellCard = memo(({ upsell }: UpsellCardProps) => {
  const Icon = upsell.icon;

  const statusConfig = {
    Ativo:    { bg: "rgba(0,255,156,0.12)",   text: "#00FF9C", border: "rgba(0,255,156,0.3)"   },
    Inativo:  { bg: "rgba(148,163,184,0.12)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
    Pendente: { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", border: "rgba(251,191,36,0.3)"  },
  };

  const config = statusConfig[upsell.status];

  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6 hover:border-[rgba(255,255,255,0.1)] transition-all group">
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

      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{upsell.description}</p>

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
