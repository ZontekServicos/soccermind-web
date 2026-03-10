import { memo, useState } from "react";
import { Settings, ExternalLink, Loader2, LucideIcon } from "lucide-react";
import { Button } from "./ui/button";

// ========================================
// TYPES
// ========================================
export type ActionVariant = "primary" | "secondary" | "outline";
export type SectionVariant = "clean" | "premium";

interface CustomAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  variant: ActionVariant;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface CustomActionsSectionProps {
  variant?: SectionVariant;
  title?: string;
  subtitle?: string;
  actions?: CustomAction[];
  className?: string;
}

// ========================================
// DEFAULT ACTIONS
// ========================================
const defaultActions: CustomAction[] = [
  {
    id: "settings",
    label: "Configurações",
    description: "Ajustes da conta, preferências e segurança",
    icon: Settings,
    variant: "outline",
    onClick: () => console.log("Configurações clicked"),
  },
  {
    id: "manage-plan",
    label: "Gerenciar Plano",
    description: "Upgrade, renovação, faturamento e limites",
    icon: ExternalLink,
    variant: "primary",
    onClick: () => console.log("Gerenciar Plano clicked"),
  },
];

// ========================================
// MAIN COMPONENT
// ========================================
export const CustomActionsSection = memo(
  ({
    variant = "premium",
    title = "Ações Personalizadas",
    subtitle = "Gerencie sua conta e assinatura",
    actions = defaultActions,
    className = "",
  }: CustomActionsSectionProps) => {
    return (
      <div className={`custom-actions-section ${className}`}>
        {variant === "premium" ? (
          <PremiumVariant title={title} subtitle={subtitle} actions={actions} />
        ) : (
          <CleanVariant title={title} subtitle={subtitle} actions={actions} />
        )}
      </div>
    );
  }
);

CustomActionsSection.displayName = "CustomActionsSection";

// ========================================
// PREMIUM VARIANT
// ========================================
interface VariantProps {
  title: string;
  subtitle: string;
  actions: CustomAction[];
}

const PremiumVariant = memo(({ title, subtitle, actions }: VariantProps) => {
  return (
    <div className="bg-gradient-to-br from-[rgba(0,194,255,0.04)] to-[rgba(122,92,255,0.04)] backdrop-blur-sm rounded-[18px] border border-[rgba(0,194,255,0.15)] p-8">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <ActionButton key={action.id} action={action} variant="premium" />
        ))}
      </div>
    </div>
  );
});

PremiumVariant.displayName = "PremiumVariant";

// ========================================
// CLEAN VARIANT
// ========================================
const CleanVariant = memo(({ title, subtitle, actions }: VariantProps) => {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <ActionButton key={action.id} action={action} variant="clean" />
        ))}
      </div>
    </div>
  );
});

CleanVariant.displayName = "CleanVariant";

// ========================================
// ACTION BUTTON
// ========================================
interface ActionButtonProps {
  action: CustomAction;
  variant: SectionVariant;
}

const ActionButton = memo(({ action, variant }: ActionButtonProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = action.icon;

  // Button styles based on action variant and section variant
  const getButtonStyles = () => {
    if (action.variant === "primary") {
      return variant === "premium"
        ? "bg-[#00C2FF] hover:bg-[#00a8e0] text-[#07142A] shadow-[0_4px_16px_rgba(0,194,255,0.3)] hover:shadow-[0_6px_20px_rgba(0,194,255,0.45)] active:shadow-[0_2px_8px_rgba(0,194,255,0.25)]"
        : "bg-[#00C2FF] hover:bg-[#00a8e0] text-[#07142A] shadow-[0_4px_16px_rgba(0,194,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,194,255,0.35)]";
    }

    // Outline/Secondary
    return variant === "premium"
      ? "bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(0,194,255,0.3)] hover:border-[rgba(0,194,255,0.5)] text-white active:bg-[rgba(255,255,255,0.06)]"
      : "bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] text-white active:bg-[rgba(255,255,255,0.03)]";
  };

  const buttonStyles = getButtonStyles();

  return (
    <div className="relative group">
      {/* Tooltip (Desktop only) */}
      {showTooltip && (
        <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0A1B35] border border-[rgba(0,194,255,0.3)] rounded-[10px] shadow-lg z-50 whitespace-nowrap">
          <p className="text-xs text-gray-300">{action.description}</p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-[#0A1B35] border-r border-b border-[rgba(0,194,255,0.3)] transform rotate-45" />
          </div>
        </div>
      )}

      {/* Button */}
      <button
        onClick={action.onClick}
        disabled={action.disabled || action.loading}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-full h-[44px] rounded-[12px] px-5 
          flex items-center justify-center gap-2.5
          font-semibold text-sm
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07142A]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${buttonStyles}
        `}
        aria-label={action.label}
        title={action.description}
      >
        {action.loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        <span>{action.label}</span>
      </button>

      {/* Mobile Description */}
      <p className="md:hidden text-xs text-gray-600 mt-2 text-center">{action.description}</p>
    </div>
  );
});

ActionButton.displayName = "ActionButton";

// ========================================
// COMPACT VERSION (Alternative Layout)
// ========================================
interface CompactActionsProps {
  actions?: CustomAction[];
  className?: string;
}

export const CompactActions = memo(({ actions = defaultActions, className = "" }: CompactActionsProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {actions.map((action) => {
        const Icon = action.icon;
        const isPrimary = action.variant === "primary";

        return (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            className={`
              h-11 px-5 rounded-[12px] 
              flex items-center gap-2
              font-semibold text-sm
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07142A]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isPrimary
                  ? "bg-[#00C2FF]/90 hover:bg-[#00C2FF] text-[#07142A] shadow-[0_4px_16px_rgba(0,194,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,194,255,0.35)]"
                  : "bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] text-white"
              }
            `}
            title={action.description}
            aria-label={action.label}
          >
            {action.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
});

CompactActions.displayName = "CompactActions";
