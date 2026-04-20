import {
  LayoutDashboard,
  Users,
  FileText,
  History,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  Activity,
  Headset,
  Search,
  Sparkles,
  Gem,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useState, memo } from "react";
import logo from "../../assets/logo.png";
import { useLanguage } from "../contexts/LanguageContext";

const fallbackImage = "/placeholder.png";

// Navigation structure with groups
const navigationGroups = [
  {
    label: "nav.operation",
    items: [
      { name: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "nav.scouting", href: "/player-search", icon: Search },
      { name: "nav.history", href: "/history", icon: History },
    ],
  },
  {
    label: "nav.analysis",
    items: [
      { name: "nav.tactical_fit", href: "/squad", icon: Target },
      { name: "nav.players_ranking",   href: "/players",          icon: Trophy },
      { name: "nav.scouting_ranking", href: "/scouting-ranking", icon: Sparkles },
      { name: "nav.hidden_gems",      href: "/hidden-gems",      icon: Gem },
      { name: "nav.player_vs_player", href: "/compare", icon: Users },
      { name: "nav.health_analytics", href: "/health-analytics", icon: Activity },
      { name: "nav.reports", href: "/reports", icon: FileText },
    ],
  },
  {
    label: "nav.support",
    items: [{ name: "nav.service_desk", href: "/service-desk", icon: Headset }],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  return (
    <aside
      className="bg-[var(--nav-bg)] border-r border-[var(--nav-border)] h-screen flex flex-col transition-all duration-300"
      style={{
        width: isCollapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
      }}
    >
      {/* Logo Section */}
      <div className="relative px-5 py-6 border-b border-[var(--nav-border)]">
        <Link
          to="/dashboard"
          className="block transition-opacity hover:opacity-80"
          aria-label="Soccer Mind Dashboard"
        >
          <img
            src={logo}
            alt="Soccer Mind"
            className="mix-blend-screen transition-all duration-300"
            style={{
              width: isCollapsed ? "32px" : "auto",
              height: isCollapsed ? "32px" : "auto",
              maxWidth: isCollapsed ? "32px" : "160px",
              margin: isCollapsed ? "0 auto" : "0",
            }}
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
          />
        </Link>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#00C2FF] rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(0,194,255,0.3)] hover:shadow-[0_0_18px_rgba(0,194,255,0.5)] transition-all focus:outline-none focus:ring-2 focus:ring-[#00C2FF] focus:ring-offset-2 focus:ring-offset-[var(--nav-bg)]"
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-[#07142A]" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-[#07142A]" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto overflow-x-hidden">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex > 0 ? "mt-8" : ""}>
            {/* Group Label */}
            {!isCollapsed && (
              <div className="px-3 mb-3">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">
                  {t(group.label)}
                </span>
              </div>
            )}

            {/* Group Items */}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-5 py-4 border-t border-[var(--nav-border)]">
          <p className="text-[10px] text-gray-600 leading-relaxed">
            © 2026 Soccer Mind
            <br />
            Inteligência estratégica
          </p>
        </div>
      )}
    </aside>
  );
}

// ========================================
// NAV ITEM COMPONENT
// ========================================
interface NavItemProps {
  item: {
    name: string;
    href: string;
    icon: React.ElementType;
  };
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem = memo(({ item, isActive, isCollapsed }: NavItemProps) => {
  const { t } = useLanguage();
  
  return (
    <Link
      to={item.href}
      className={`
        relative flex items-center gap-3 px-3 rounded-[var(--radius-md)] transition-all duration-200
        ${isCollapsed ? "justify-center" : ""}
        ${
          isActive
            ? "text-white bg-[var(--nav-item-active-bg)] shadow-[var(--nav-glow-active)]"
            : "text-[var(--nav-item-inactive)] hover:text-white hover:bg-[var(--nav-item-hover-bg)]"
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nav-bg)]
      `}
      style={{ height: "var(--nav-item-height)" }}
      title={isCollapsed ? t(item.name) : undefined}
      aria-label={t(item.name)}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Active Indicator */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-[var(--nav-item-active-indicator)] rounded-r-full transition-all"
          style={{
            width: "var(--nav-indicator-width)",
            height: "60%",
          }}
        />
      )}

      {/* Icon */}
      <item.icon className="w-5 h-5 flex-shrink-0" />

      {/* Label */}
      {!isCollapsed && (
        <span className="text-sm font-medium transition-colors">{t(item.name)}</span>
      )}
    </Link>
  );
});

NavItem.displayName = "NavItem";
