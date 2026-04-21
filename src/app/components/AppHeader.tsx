import { User, Bell, Calendar, LogOut, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router";
import { memo, useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useProfile } from "../contexts/ProfileContext";
import { LanguageSelector } from "./LanguageSelector";

interface AppHeaderProps {
  userName?: string;
  userClub?: string;
  userRole?: string;
}

export function AppHeader({ userName, userClub, userRole }: AppHeaderProps) {
  const navigate = useNavigate();

  const authContext = useContext(AuthContext);
  const user   = authContext?.user;
  const logout = authContext?.logout || (() => {});

  const { profile, profileLoading } = useProfile();

  // Profile data takes priority over JWT auth data and props
  const displayName     = profile?.name        ?? user?.name     ?? userName ?? "Usuário";
  const displayClubName = profile?.clubName     ?? user?.clubName ?? userClub ?? "Minha Organização";
  const displayRole     = profile?.role         ?? user?.role     ?? userRole ?? "";
  const displayAvatar   = profile?.avatarUrl    ?? null;
  const displayClubLogo = profile?.clubLogoUrl  ?? null;
  const roleLabel       = getRoleLabel(displayRole);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className="bg-[var(--nav-bg)] border-b border-[var(--nav-border)] px-6 flex items-center justify-between"
      style={{ height: "var(--topbar-height)" }}
    >
      <DateDisplay date={today} />

      <div className="flex items-center gap-3">
        <LanguageSelector />
        <NotificationButton count={0} />

        <ProfileSection
          userName={displayName}
          clubName={displayClubName}
          userRole={roleLabel}
          avatarUrl={displayAvatar}
          clubLogoUrl={displayClubLogo}
          loading={profileLoading}
        />

        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-400 hover:text-white hover:bg-[var(--nav-item-hover-bg)] rounded-[8px] transition-all focus-visible:ring-2 focus-visible:ring-[#00C2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nav-bg)]"
          aria-label="Sair"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}

// ─── Date display ─────────────────────────────────────────────────────────────

const DateDisplay = memo(({ date }: { date: string }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-[8px] bg-[rgba(0,194,255,0.08)] flex items-center justify-center">
      <Calendar className="w-4 h-4 text-[#00C2FF]" />
    </div>
    <span className="text-sm text-gray-400 font-medium">
      {date.charAt(0).toUpperCase() + date.slice(1)}
    </span>
  </div>
));
DateDisplay.displayName = "DateDisplay";

// ─── Notification button ──────────────────────────────────────────────────────

const NotificationButton = memo(({ count }: { count: number }) => (
  <Button
    variant="ghost"
    size="icon"
    className="relative text-gray-400 hover:text-white hover:bg-[var(--nav-item-hover-bg)] rounded-[8px] transition-all focus-visible:ring-2 focus-visible:ring-[#00C2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nav-bg)]"
    aria-label={`${count} notificações não lidas`}
  >
    <Bell className="w-5 h-5" />
    {count > 0 && (
      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#FF4D4F] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
        {count > 9 ? "9+" : count}
      </span>
    )}
  </Button>
));
NotificationButton.displayName = "NotificationButton";

// ─── Profile section ──────────────────────────────────────────────────────────

interface ProfileSectionProps {
  userName:    string;
  clubName:    string;
  userRole:    string;
  avatarUrl:   string | null;
  clubLogoUrl: string | null;
  loading:     boolean;
}

const ProfileSection = memo(({
  userName,
  clubName,
  userRole,
  avatarUrl,
  clubLogoUrl,
  loading,
}: ProfileSectionProps) => {
  const [avatarFailed,   setAvatarFailed]   = useState(false);
  const [clubLogoFailed, setClubLogoFailed] = useState(false);

  const showAvatar   = !!avatarUrl   && !avatarFailed;
  const showClubLogo = !!clubLogoUrl && !clubLogoFailed;

  const initials = userName
    .split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <Link
      to="/profile"
      className="flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-[var(--nav-item-hover-bg)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nav-bg)] group"
      aria-label="Acessar perfil"
    >
      {/* Text info */}
      <div className="text-right hidden sm:block">
        {loading ? (
          <>
            <div className="h-3.5 w-28 mb-1.5 animate-pulse rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-[rgba(255,255,255,0.04)]" />
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-white group-hover:text-[#00C2FF] transition-colors leading-tight">
              {clubName}
            </p>
            {userRole && (
              <p className="text-xs text-gray-500 leading-tight">
                {userName}{userRole ? ` · ${userRole}` : ""}
              </p>
            )}
          </>
        )}
      </div>

      {/* Avatar: club logo if set, otherwise user avatar, otherwise initials */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-transparent group-hover:ring-[rgba(0,194,255,0.3)] transition-all overflow-hidden flex-shrink-0 bg-[rgba(255,255,255,0.05)]">
        {showClubLogo ? (
          <img
            src={clubLogoUrl!}
            alt={clubName}
            className="w-full h-full object-contain p-1"
            onError={() => setClubLogoFailed(true)}
          />
        ) : showAvatar ? (
          <img
            src={avatarUrl!}
            alt={userName}
            className="w-full h-full object-cover object-top"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[rgba(0,194,255,0.12)]">
            <Building2 className="w-5 h-5 text-[#00C2FF]" />
          </div>
        )}
      </div>
    </Link>
  );
});
ProfileSection.displayName = "ProfileSection";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleLabel(role: string): string {
  switch (role) {
    case "admin":  return "Administrador";
    case "gestor": return "Gestor";
    case "scout":  return "Scout";
    default:       return role;
  }
}
