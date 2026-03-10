import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "pt" | "en" | "es" | "de";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations dictionary
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Navigation
    "nav.operation": "Operação",
    "nav.dashboard": "Dashboard",
    "nav.tactical_fit": "Fit Tático",
    "nav.analysis": "Análises",
    "nav.players_ranking": "Ranking de Jogadores",
    "nav.player_vs_player": "Player vs Player",
    "nav.reports": "Relatórios",
    "nav.history": "Análises",
    "nav.governance": "Governança",
    "nav.health_analytics": "Health Analytics",
    "nav.support": "Suporte",
    "nav.service_desk": "Service Desk",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Visão estratégica do elenco e indicadores de performance",
    "dashboard.players_analyzed": "Jogadores Analisados",
    "dashboard.avg_efficiency": "Capital Efficiency Médio",
    "dashboard.high_risk_players": "Jogadores Alto Risco",
    "dashboard.total_market_value": "Valor de Mercado Total",
    "dashboard.this_month": "este mês",
    "dashboard.vs_last_month": "vs. mês anterior",
    "dashboard.attention_needed": "Atenção necessária",
    "dashboard.this_year": "este ano",
    
    // Login
    "login.title": "Bem-vindo",
    "login.subtitle": "Acesse sua conta para continuar",
    "login.email": "Email",
    "login.email_placeholder": "seu@email.com",
    "login.password": "Senha",
    "login.password_placeholder": "••••••••",
    "login.show_password": "Mostrar senha",
    "login.hide_password": "Ocultar senha",
    "login.loading": "Carregando...",
    "login.remember_me": "Lembrar-me",
    "login.forgot_password": "Esqueceu a senha?",
    "login.submit_button": "Entrar na Plataforma",
    "login.new_to_platform": "Novo na plataforma?",
    "login.no_account": "Ainda não tem uma conta?",
    "login.contact_team": "Entre em contato com nosso time",
    "login.footer": "Inteligência estratégica para decisões profissionais.",
    "login.error_generic": "Ocorreu um erro. Tente novamente mais tarde.",
    
    // Forgot Password
    "forgot.title": "Recuperar Senha",
    "forgot.subtitle": "Enviaremos um link de recuperação para seu email",
    "forgot.info": "Digite seu email cadastrado e enviaremos instruções para redefinir sua senha.",
    "forgot.submit": "Enviar Link de Recuperação",
    "forgot.success_message": "Email de recuperação enviado! Verifique sua caixa de entrada.",
    "forgot.success_title": "Email Enviado!",
    "forgot.success_text": "Enviamos um link de recuperação para",
    "forgot.success_spam": "Verifique também a pasta de spam se não encontrar o email.",
    "forgot.resend": "Enviar Novamente",
    "forgot.back_login": "Voltar para o login",
    "forgot.need_help": "Precisa de ajuda?",
    "forgot.contact_support": "Entre em contato com o suporte →",
    "forgot.error_generic": "Erro ao enviar email de recuperação",
    
    // Common
    "common.welcome": "Bem-vindo",
    "common.logout": "Sair",
    "common.profile": "Perfil",
    "common.settings": "Configurações",
    
    // Health Analytics
    "health.title": "Health Analytics",
    "health.subtitle": "Análise estratégica do impacto de lesões na performance e longevidade do atleta",
    "health.injury_risk_score": "Injury Risk Score",
    
    // Service Desk
    "servicedesk.title": "Service Desk",
    "servicedesk.subtitle": "Central de atendimento e suporte técnico",
    "servicedesk.new_ticket": "Abrir Novo Chamado",
    "servicedesk.ticket_id": "ID do Chamado",
    "servicedesk.type": "Tipo de Solicitação",
    "servicedesk.status": "Status",
    "servicedesk.date": "Data de Abertura",
    "servicedesk.priority": "Prioridade",
    "servicedesk.assignee": "Responsável",
    "servicedesk.description": "Descrição",
    "servicedesk.attach_files": "Anexar Arquivos",
    "servicedesk.filter_status": "Filtrar por Status",
    "servicedesk.filter_type": "Filtrar por Tipo",
    "servicedesk.all": "Todos",
    "servicedesk.create_ticket": "Criar Chamado",
    "servicedesk.cancel": "Cancelar",
    "servicedesk.view_details": "Ver Detalhes",
    "servicedesk.no_tickets": "Nenhum chamado encontrado",
    "servicedesk.total_tickets": "Total de Chamados",
    "servicedesk.open_tickets": "Chamados Abertos",
    "servicedesk.resolved_tickets": "Chamados Resolvidos",
    
    // Ticket Types
    "ticket.user_management": "Gestão de Usuários",
    "ticket.create_user": "Criar novo login de usuário",
    "ticket.change_permissions": "Alterar permissões de acesso",
    "ticket.remove_user": "Remover usuário da plataforma",
    "ticket.reset_password": "Resetar senha de usuário",
    "ticket.platform_commercial": "Plataforma / Comercial",
    "ticket.request_module": "Solicitar novo módulo (Upsell)",
    "ticket.request_training": "Solicitar treinamento da plataforma",
    "ticket.technical_support": "Solicitar suporte técnico",
    
    // Ticket Status
    "status.open": "Aberto",
    "status.in_progress": "Em análise",
    "status.resolved": "Resolvido",
    
    // Priority
    "priority.low": "Baixa",
    "priority.medium": "Média",
    "priority.high": "Alta",
    "priority.critical": "Crítica",
  },
  en: {
    // Navigation
    "nav.operation": "Operation",
    "nav.dashboard": "Dashboard",
    "nav.tactical_fit": "Tactical Fit",
    "nav.analysis": "Analysis",
    "nav.players_ranking": "Players Ranking",
    "nav.player_vs_player": "Player vs Player",
    "nav.reports": "Reports",
    "nav.history": "Analysis",
    "nav.governance": "Governance",
    "nav.health_analytics": "Health Analytics",
    "nav.support": "Support",
    "nav.service_desk": "Service Desk",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Strategic squad overview and performance indicators",
    "dashboard.players_analyzed": "Players Analyzed",
    "dashboard.avg_efficiency": "Average Capital Efficiency",
    "dashboard.high_risk_players": "High Risk Players",
    "dashboard.total_market_value": "Total Market Value",
    "dashboard.this_month": "this month",
    "dashboard.vs_last_month": "vs. last month",
    "dashboard.attention_needed": "Attention needed",
    "dashboard.this_year": "this year",
    
    // Login
    "login.title": "Welcome",
    "login.subtitle": "Sign in to your account to continue",
    "login.email": "Email",
    "login.email_placeholder": "your@email.com",
    "login.password": "Password",
    "login.password_placeholder": "••••••••",
    "login.show_password": "Show password",
    "login.hide_password": "Hide password",
    "login.loading": "Loading...",
    "login.remember_me": "Remember me",
    "login.forgot_password": "Forgot password?",
    "login.submit_button": "Sign In to Platform",
    "login.new_to_platform": "New to the platform?",
    "login.no_account": "Don't have an account yet?",
    "login.contact_team": "Contact our team",
    "login.footer": "Strategic intelligence for professional decisions.",
    "login.error_generic": "An error occurred. Please try again later.",
    
    // Forgot Password
    "forgot.title": "Forgot Password",
    "forgot.subtitle": "We will send a recovery link to your email",
    "forgot.info": "Enter your registered email and we will send instructions to reset your password.",
    "forgot.submit": "Send Recovery Link",
    "forgot.success_message": "Recovery email sent! Check your inbox.",
    "forgot.success_title": "Email Sent!",
    "forgot.success_text": "We sent a recovery link to",
    "forgot.success_spam": "Also check the spam folder if you don't find the email.",
    "forgot.resend": "Resend",
    "forgot.back_login": "Back to login",
    "forgot.need_help": "Need help?",
    "forgot.contact_support": "Contact support →",
    "forgot.error_generic": "Error sending recovery email",
    
    // Common
    "common.welcome": "Welcome",
    "common.logout": "Logout",
    "common.profile": "Profile",
    "common.settings": "Settings",
    
    // Health Analytics
    "health.title": "Health Analytics",
    "health.subtitle": "Strategic analysis of injury impact on athlete performance and longevity",
    "health.injury_risk_score": "Injury Risk Score",
    
    // Service Desk
    "servicedesk.title": "Service Desk",
    "servicedesk.subtitle": "Customer support and technical assistance center",
    "servicedesk.new_ticket": "Open New Ticket",
    "servicedesk.ticket_id": "Ticket ID",
    "servicedesk.type": "Request Type",
    "servicedesk.status": "Status",
    "servicedesk.date": "Opening Date",
    "servicedesk.priority": "Priority",
    "servicedesk.assignee": "Assignee",
    "servicedesk.description": "Description",
    "servicedesk.attach_files": "Attach Files",
    "servicedesk.filter_status": "Filter by Status",
    "servicedesk.filter_type": "Filter by Type",
    "servicedesk.all": "All",
    "servicedesk.create_ticket": "Create Ticket",
    "servicedesk.cancel": "Cancel",
    "servicedesk.view_details": "View Details",
    "servicedesk.no_tickets": "No tickets found",
    "servicedesk.total_tickets": "Total Tickets",
    "servicedesk.open_tickets": "Open Tickets",
    "servicedesk.resolved_tickets": "Resolved Tickets",
    
    // Ticket Types
    "ticket.user_management": "User Management",
    "ticket.create_user": "Create new user login",
    "ticket.change_permissions": "Change access permissions",
    "ticket.remove_user": "Remove user from platform",
    "ticket.reset_password": "Reset user password",
    "ticket.platform_commercial": "Platform / Commercial",
    "ticket.request_module": "Request new module (Upsell)",
    "ticket.request_training": "Request platform training",
    "ticket.technical_support": "Request technical support",
    
    // Ticket Status
    "status.open": "Open",
    "status.in_progress": "In Progress",
    "status.resolved": "Resolved",
    
    // Priority
    "priority.low": "Low",
    "priority.medium": "Medium",
    "priority.high": "High",
    "priority.critical": "Critical",
  },
  es: {
    // Navigation
    "nav.operation": "Operación",
    "nav.dashboard": "Tablero",
    "nav.tactical_fit": "Ajuste Táctico",
    "nav.analysis": "Análisis",
    "nav.players_ranking": "Ranking de Jugadores",
    "nav.player_vs_player": "Jugador vs Jugador",
    "nav.reports": "Informes",
    "nav.history": "Análisis",
    "nav.governance": "Gobernanza",
    "nav.health_analytics": "Health Analytics",
    "nav.support": "Soporte",
    "nav.service_desk": "Service Desk",
    
    // Dashboard
    "dashboard.title": "Tablero",
    "dashboard.subtitle": "Visión estratégica de la plantilla e indicadores de rendimiento",
    "dashboard.players_analyzed": "Jugadores Analizados",
    "dashboard.avg_efficiency": "Eficiencia de Capital Promedio",
    "dashboard.high_risk_players": "Jugadores de Alto Riesgo",
    "dashboard.total_market_value": "Valor de Mercado Total",
    "dashboard.this_month": "este mes",
    "dashboard.vs_last_month": "vs. mes anterior",
    "dashboard.attention_needed": "Atención necesaria",
    "dashboard.this_year": "este año",
    
    // Login
    "login.title": "Bienvenido",
    "login.subtitle": "Accede a tu cuenta para continuar",
    "login.email": "Correo electrónico",
    "login.email_placeholder": "tu@email.com",
    "login.password": "Contraseña",
    "login.password_placeholder": "••••••••",
    "login.show_password": "Mostrar contraseña",
    "login.hide_password": "Ocultar contraseña",
    "login.loading": "Cargando...",
    "login.remember_me": "Recordarme",
    "login.forgot_password": "¿Olvidaste tu contraseña?",
    "login.submit_button": "Acceder a la Plataforma",
    "login.new_to_platform": "¿Nuevo en la plataforma?",
    "login.no_account": "¿Aún no tienes una cuenta?",
    "login.contact_team": "Contacta con nuestro equipo",
    "login.footer": "Inteligencia estratégica para decisiones profesionales.",
    "login.error_generic": "Ocurrió un error. Por favor, inténtalo de nuevo más tarde.",
    
    // Forgot Password
    "forgot.title": "Recuperar Contraseña",
    "forgot.subtitle": "Enviaremos un enlace de recuperación a tu correo electrónico",
    "forgot.info": "Escribe tu correo electrónico registrado y te enviaremos instrucciones para restablecer tu contraseña.",
    "forgot.submit": "Enviar Enlace de Recuperación",
    "forgot.success_message": "Correo electrónico de recuperación enviado. Verifica tu bandeja de entrada.",
    "forgot.success_title": "¡Correo Enviado!",
    "forgot.success_text": "Hemos enviado un enlace de recuperación a",
    "forgot.success_spam": "También verifica la carpeta de spam si no encuentras el correo electrónico.",
    "forgot.resend": "Reenviar",
    "forgot.back_login": "Volver al inicio de sesión",
    "forgot.need_help": "¿Necesitas ayuda?",
    "forgot.contact_support": "Contacta al soporte →",
    "forgot.error_generic": "Error al enviar el correo electrónico de recuperación",
    
    // Common
    "common.welcome": "Bienvenido",
    "common.logout": "Salir",
    "common.profile": "Perfil",
    "common.settings": "Configuración",
    
    // Health Analytics
    "health.title": "Health Analytics",
    "health.subtitle": "Análisis estratégico del impacto de lesiones en el rendimiento y longevidad del atleta",
    "health.injury_risk_score": "Puntuación de Riesgo de Lesión",
    
    // Service Desk
    "servicedesk.title": "Service Desk",
    "servicedesk.subtitle": "Central de atención y soporte técnico",
    "servicedesk.new_ticket": "Abrir Novo Chamado",
    "servicedesk.ticket_id": "ID do Chamado",
    "servicedesk.type": "Tipo de Solicitação",
    "servicedesk.status": "Status",
    "servicedesk.date": "Data de Abertura",
    "servicedesk.priority": "Prioridade",
    "servicedesk.assignee": "Responsável",
    "servicedesk.description": "Descrição",
    "servicedesk.attach_files": "Anexar Arquivos",
    "servicedesk.filter_status": "Filtrar por Status",
    "servicedesk.filter_type": "Filtrar por Tipo",
    "servicedesk.all": "Todos",
    "servicedesk.create_ticket": "Criar Chamado",
    "servicedesk.cancel": "Cancelar",
    "servicedesk.view_details": "Ver Detalhes",
    "servicedesk.no_tickets": "Nenhum chamado encontrado",
    "servicedesk.total_tickets": "Total de Chamados",
    "servicedesk.open_tickets": "Chamados Abertos",
    "servicedesk.resolved_tickets": "Chamados Resolvidos",
    
    // Ticket Types
    "ticket.user_management": "Gestão de Usuários",
    "ticket.create_user": "Criar novo login de usuário",
    "ticket.change_permissions": "Alterar permissões de acesso",
    "ticket.remove_user": "Remover usuário da plataforma",
    "ticket.reset_password": "Resetar senha de usuário",
    "ticket.platform_commercial": "Plataforma / Comercial",
    "ticket.request_module": "Solicitar novo módulo (Upsell)",
    "ticket.request_training": "Solicitar treinamento da plataforma",
    "ticket.technical_support": "Solicitar suporte técnico",
    
    // Ticket Status
    "status.open": "Aberto",
    "status.in_progress": "Em análise",
    "status.resolved": "Resolvido",
    
    // Priority
    "priority.low": "Baixa",
    "priority.medium": "Média",
    "priority.high": "Alta",
    "priority.critical": "Crítica",
  },
  de: {
    // Navigation
    "nav.operation": "Betrieb",
    "nav.dashboard": "Dashboard",
    "nav.tactical_fit": "Taktische Eignung",
    "nav.analysis": "Analysen",
    "nav.players_ranking": "Spieler-Ranking",
    "nav.player_vs_player": "Spieler vs Spieler",
    "nav.reports": "Berichte",
    "nav.history": "Analysen",
    "nav.governance": "Governance",
    "nav.health_analytics": "Health Analytics",
    "nav.support": "Support",
    "nav.service_desk": "Service Desk",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Strategischer Kaderüberblick und Leistungsindikatoren",
    "dashboard.players_analyzed": "Analysierte Spieler",
    "dashboard.avg_efficiency": "Durchschnittliche Kapitaleffizienz",
    "dashboard.high_risk_players": "Hochrisikospieler",
    "dashboard.total_market_value": "Gesamtmarktwert",
    "dashboard.this_month": "diesen Monat",
    "dashboard.vs_last_month": "vs. letzten Monat",
    "dashboard.attention_needed": "Aufmerksamkeit erforderlich",
    "dashboard.this_year": "dieses Jahr",
    
    // Login
    "login.title": "Willkommen",
    "login.subtitle": "Melden Sie sich bei Ihrem Konto an, um fortzufahren",
    "login.email": "E-Mail",
    "login.email_placeholder": "ihre@email.com",
    "login.password": "Passwort",
    "login.password_placeholder": "••••••••",
    "login.show_password": "Passwort anzeigen",
    "login.hide_password": "Passwort verbergen",
    "login.loading": "Laden...",
    "login.remember_me": "Angemeldet bleiben",
    "login.forgot_password": "Passwort vergessen?",
    "login.submit_button": "Bei der Plattform anmelden",
    "login.new_to_platform": "Neu bei der Plattform?",
    "login.no_account": "Haben Sie noch kein Konto?",
    "login.contact_team": "Kontaktieren Sie unser Team",
    "login.footer": "Strategische Intelligenz für professionelle Entscheidungen.",
    "login.error_generic": "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    
    // Forgot Password
    "forgot.title": "Passwort vergessen",
    "forgot.subtitle": "Wir senden Ihnen einen Wiederherstellungsschritt an Ihre E-Mail-Adresse",
    "forgot.info": "Geben Sie Ihre registrierte E-Mail-Adresse ein, und wir senden Ihnen Anweisungen, Ihr Passwort zurückzusetzen.",
    "forgot.submit": "Wiederherstellungsschritt senden",
    "forgot.success_message": "Wiederherstellungsmail gesendet! Überprüfen Sie Ihren Posteingang.",
    "forgot.success_title": "E-Mail gesendet!",
    "forgot.success_text": "Wir haben einen Wiederherstellungsschritt an",
    "forgot.success_spam": "Überprüfen Sie auch den Spam-Ordner, wenn Sie die E-Mail nicht finden.",
    "forgot.resend": "Erneut senden",
    "forgot.back_login": "Zurück zum Login",
    "forgot.need_help": "Brauchen Sie Hilfe?",
    "forgot.contact_support": "Kontaktieren Sie den Support →",
    "forgot.error_generic": "Fehler beim Senden der Wiederherstellungsmail",
    
    // Common
    "common.welcome": "Willkommen",
    "common.logout": "Abmelden",
    "common.profile": "Profil",
    "common.settings": "Einstellungen",
    
    // Health Analytics
    "health.title": "Health Analytics",
    "health.subtitle": "Strategische Analyse des Einflusses von Verletzungen auf Leistung und Langzeitfähigkeit des Athleten",
    "health.injury_risk_score": "Verletzungsrisikopunktzahl",
    
    // Service Desk
    "servicedesk.title": "Service Desk",
    "servicedesk.subtitle": "Kundendienst und technischer Support",
    "servicedesk.new_ticket": "Neuen Ticket erstellen",
    "servicedesk.ticket_id": "Ticket-ID",
    "servicedesk.type": "Anfrageart",
    "servicedesk.status": "Status",
    "servicedesk.date": "Erstelldatum",
    "servicedesk.priority": "Priorität",
    "servicedesk.assignee": "Zuständig",
    "servicedesk.description": "Beschreibung",
    "servicedesk.attach_files": "Dateien anhängen",
    "servicedesk.filter_status": "Nach Status filtern",
    "servicedesk.filter_type": "Nach Art filtern",
    "servicedesk.all": "Alle",
    "servicedesk.create_ticket": "Ticket erstellen",
    "servicedesk.cancel": "Abbrechen",
    "servicedesk.view_details": "Details anzeigen",
    "servicedesk.no_tickets": "Keine Tickets gefunden",
    "servicedesk.total_tickets": "Gesamtzahl der Tickets",
    "servicedesk.open_tickets": "Offene Tickets",
    "servicedesk.resolved_tickets": "Gelöste Tickets",
    
    // Ticket Types
    "ticket.user_management": "Benutzerverwaltung",
    "ticket.create_user": "Neuen Benutzer erstellen",
    "ticket.change_permissions": "Zugriffsrechte ändern",
    "ticket.remove_user": "Benutzer von der Plattform entfernen",
    "ticket.reset_password": "Benutzerpasswort zurücksetzen",
    "ticket.platform_commercial": "Plattform / Kommerz",
    "ticket.request_module": "Neues Modul anfordern (Upsell)",
    "ticket.request_training": "Plattformtraining anfordern",
    "ticket.technical_support": "Technischen Support anfordern",
    
    // Ticket Status
    "status.open": "Offen",
    "status.in_progress": "In Bearbeitung",
    "status.resolved": "Gelöst",
    
    // Priority
    "priority.low": "Niedrig",
    "priority.medium": "Mittel",
    "priority.high": "Hoch",
    "priority.critical": "Kritisch",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Load language from localStorage or default to 'pt'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("soccermind_language");
    return (savedLanguage as Language) || "pt";
  });

  // Persist language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("soccermind_language", language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}