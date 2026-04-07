import { User, Bell, Calendar, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router";
import { memo, useContext } from "react";
import clubLogo from "../../assets/club-logo.png";
import { AuthContext } from "../contexts/AuthContext";
import { LanguageSelector } from "./LanguageSelector";

const fallbackImage = "/placeholder.png";

interface AppHeaderProps {
  userName?: string;
  userClub?: string;
  userRole?: string;
}

export function AppHeader({
  userName,
  userClub,
  userRole,
}: AppHeaderProps) {
  const navigate = useNavigate();
  
  // Use context directly with optional check
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const logout = authContext?.logout || (() => {});

  // Use auth context if no props provided
  const displayName = userName || user?.clubName || "Sport Club Corinthians";
  const displayRole = userRole || (user?.role ? getRoleLabel(user.role) : "");

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
      {/* Left Section - Date */}
      <DateDisplay date={today} />

      {/* Right Section - Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Notification Button */}
        <NotificationButton count={0} />

        {/* Profile Section */}
        <ProfileSection
          userName={displayName}
          userRole={displayRole}
          userClub={userClub}
        />

        {/* Logout Button */}
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

// ========================================
// DATE DISPLAY COMPONENT
// ========================================
interface DateDisplayProps {
  date: string;
}

const DateDisplay = memo(({ date }: DateDisplayProps) => {
  // Capitalize first letter
  const formattedDate = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-[8px] bg-[rgba(0,194,255,0.08)] flex items-center justify-center">
        <Calendar className="w-4 h-4 text-[#00C2FF]" />
      </div>
      <span className="text-sm text-gray-400 font-medium">{formattedDate}</span>
    </div>
  );
});

DateDisplay.displayName = "DateDisplay";

// ========================================
// NOTIFICATION BUTTON COMPONENT
// ========================================
interface NotificationButtonProps {
  count: number;
}

const NotificationButton = memo(({ count }: NotificationButtonProps) => {
  return (
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
  );
});

NotificationButton.displayName = "NotificationButton";

// ========================================
// PROFILE SECTION COMPONENT
// ========================================
interface ProfileSectionProps {
  userName: string;
  userRole: string;
  userClub: string;
}

const ProfileSection = memo(({ userName, userRole, userClub }: ProfileSectionProps) => {
  return (
    <Link
      to="/profile"
      className="flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-[var(--nav-item-hover-bg)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nav-bg)] group"
      aria-label="Acessar perfil"
    >
      {/* User Info */}
      <div className="text-right">
        <p className="text-sm font-medium text-white group-hover:text-[#00C2FF] transition-colors">
          {userName}
        </p>
        {userRole && (
          <p className="text-xs text-gray-500">
            {userRole}
            {userClub && ` • ${userClub}`}
          </p>
        )}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1.5 ring-2 ring-transparent group-hover:ring-[rgba(0,194,255,0.3)] transition-all">
        <img
          src={clubLogo}
          alt={userName}
          className="w-full h-full object-contain"
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />
      </div>
    </Link>
  );
});

ProfileSection.displayName = "ProfileSection";

// Helper function to get role label
function getRoleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "gestor":
      return "Gestor";
    case "scout":
      return "Scout";
    default:
      return "";
  }
}
