import { memo, InputHTMLAttributes, forwardRef, useState } from "react";
import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

// ========================================
// FORM FIELD
// ========================================
interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  helperText?: string;
}

export const FormField = memo(
  forwardRef<HTMLInputElement, FormFieldProps>(({ label, icon: Icon, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label 
          className="block text-sm font-medium text-gray-300/90" 
          htmlFor={props.id}
        >
          {label}
        </label>
        <div className="relative group">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <Icon className="w-5 h-5 text-gray-500 group-focus-within:text-[#00C2FF] transition-colors duration-200" />
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={`
              w-full h-[52px] rounded-[14px] px-4 
              bg-[rgba(255,255,255,0.03)]
              border backdrop-blur-sm
              text-white
              text-[15px] placeholder:text-gray-600/80
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              hover:bg-[rgba(255,255,255,0.05)]
              hover:border-[rgba(255,255,255,0.15)]
              disabled:opacity-40 disabled:cursor-not-allowed
              ${Icon ? "pl-12" : ""}
              ${error 
                ? "border-[rgba(255,77,79,0.4)] focus:ring-[rgba(255,77,79,0.3)] focus:border-[#FF4D4F]" 
                : "border-[rgba(255,255,255,0.08)] focus:border-[#00C2FF] focus:ring-[rgba(0,194,255,0.15)]"
              }
            `}
          />
        </div>
        {error && (
          <p className="text-xs text-[#FF4D4F]/90 flex items-center gap-1.5 pl-1">
            <span className="inline-block w-1 h-1 rounded-full bg-[#FF4D4F]" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-500/80 pl-1">{helperText}</p>
        )}
      </div>
    );
  })
);

FormField.displayName = "FormField";

// ========================================
// CHECKBOX
// ========================================
interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const CheckboxField = memo(({ id, label, checked, onChange }: CheckboxFieldProps) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.04)] text-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF] focus:ring-offset-2 focus:ring-offset-[#07142A] cursor-pointer"
      />
      <label htmlFor={id} className="ml-2 text-sm text-gray-400 cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
});

CheckboxField.displayName = "CheckboxField";

// ========================================
// AUTH BUTTON
// ========================================
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export const AuthButton = memo(
  ({ isLoading, variant = "primary", children, disabled, ...props }: AuthButtonProps) => {
    const isPrimary = variant === "primary";
    const { t } = useLanguage();

    return (
      <button
        {...props}
        disabled={disabled || isLoading}
        className={`
          w-full h-[54px] rounded-[14px] px-6
          font-semibold text-[15px]
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
          active:scale-[0.98]
          ${
            isPrimary
              ? "bg-gradient-to-r from-[#00C2FF] to-[#00a8e0] hover:from-[#00a8e0] hover:to-[#008fc4] text-[#07142A] shadow-[0_4px_24px_rgba(0,194,255,0.3)] hover:shadow-[0_6px_32px_rgba(0,194,255,0.4)] focus-visible:ring-[rgba(0,194,255,0.4)]"
              : "bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] text-white focus-visible:ring-[rgba(255,255,255,0.2)]"
          }
        `}
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {t("login.loading")}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

AuthButton.displayName = "AuthButton";

// ========================================
// ALERT MESSAGE
// ========================================
interface AlertMessageProps {
  type: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
}

export const AlertMessage = memo(({ type, message, onClose }: AlertMessageProps) => {
  const config = {
    error: {
      bg: "rgba(255,77,79,0.12)",
      border: "rgba(255,77,79,0.3)",
      text: "#FF4D4F",
      icon: "⚠️",
    },
    success: {
      bg: "rgba(0,255,156,0.12)",
      border: "rgba(0,255,156,0.3)",
      text: "#00FF9C",
      icon: "✓",
    },
    info: {
      bg: "rgba(0,194,255,0.12)",
      border: "rgba(0,194,255,0.3)",
      text: "#00C2FF",
      icon: "ℹ",
    },
  };

  const style = config[type];

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-[12px] border"
      style={{ background: style.bg, borderColor: style.border }}
    >
      <span className="text-lg flex-shrink-0">{style.icon}</span>
      <p className="text-sm flex-1" style={{ color: style.text }}>
        {message}
      </p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-sm flex-shrink-0 hover:opacity-70 transition-opacity"
          style={{ color: style.text }}
          aria-label="Fechar"
        >
          ×
        </button>
      )}
    </div>
  );
});

AlertMessage.displayName = "AlertMessage";

// ========================================
// PASSWORD FIELD (with toggle visibility)
// ========================================
interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  helperText?: string;
}

export const PasswordField = memo(
  forwardRef<HTMLInputElement, PasswordFieldProps>(({ label, icon: Icon, error, helperText, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useLanguage();

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="space-y-2">
        <label 
          className="block text-sm font-medium text-gray-300/90" 
          htmlFor={props.id}
        >
          {label}
        </label>
        <div className="relative group">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <Icon className="w-5 h-5 text-gray-500 group-focus-within:text-[#00C2FF] transition-colors duration-200" />
            </div>
          )}
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            {...props}
            className={`
              w-full h-[52px] rounded-[14px] px-4 
              bg-[rgba(255,255,255,0.03)]
              border backdrop-blur-sm
              text-white
              text-[15px] placeholder:text-gray-600/80
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              hover:bg-[rgba(255,255,255,0.05)]
              hover:border-[rgba(255,255,255,0.15)]
              disabled:opacity-40 disabled:cursor-not-allowed
              ${Icon ? "pl-12" : ""}
              pr-12
              ${error 
                ? "border-[rgba(255,77,79,0.4)] focus:ring-[rgba(255,77,79,0.3)] focus:border-[#FF4D4F]" 
                : "border-[rgba(255,255,255,0.08)] focus:border-[#00C2FF] focus:ring-[rgba(0,194,255,0.15)]"
              }
            `}
          />
          
          {/* Toggle Button */}
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-gray-500 hover:text-[#00C2FF] transition-colors duration-200 focus:outline-none focus:text-[#00C2FF]"
            aria-label={showPassword ? t("login.hide_password") : t("login.show_password")}
            title={showPassword ? t("login.hide_password") : t("login.show_password")}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {error && (
          <p className="text-xs text-[#FF4D4F]/90 flex items-center gap-1.5 pl-1">
            <span className="inline-block w-1 h-1 rounded-full bg-[#FF4D4F]" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-500/80 pl-1">{helperText}</p>
        )}
      </div>
    );
  })
);

PasswordField.displayName = "PasswordField";