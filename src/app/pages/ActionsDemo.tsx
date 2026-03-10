import { AppSidebar } from "../components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { CustomActionsSection, CompactActions } from "../components/CustomActionsSection";
import { Settings, ExternalLink, Users, CreditCard, Link as LinkIcon } from "lucide-react";

export default function ActionsDemo() {
  const customActions = [
    {
      id: "settings",
      label: "Configurações",
      description: "Ajustes da conta, preferências e segurança",
      icon: Settings,
      variant: "outline" as const,
      onClick: () => alert("Configurações clicked"),
    },
    {
      id: "manage-plan",
      label: "Gerenciar Plano",
      description: "Upgrade, renovação, faturamento e limites",
      icon: ExternalLink,
      variant: "primary" as const,
      onClick: () => alert("Gerenciar Plano clicked"),
    },
  ];

  const expandedActions = [
    ...customActions,
    {
      id: "billing",
      label: "Faturamento",
      description: "Notas fiscais, histórico e formas de pagamento",
      icon: CreditCard,
      variant: "outline" as const,
      onClick: () => alert("Faturamento clicked"),
    },
    {
      id: "team",
      label: "Gerenciar Usuários",
      description: "Convites, permissões e controle de acesso",
      icon: Users,
      variant: "outline" as const,
      onClick: () => alert("Gerenciar Usuários clicked"),
    },
  ];

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1400px] mx-auto space-y-12">
            {/* Page Header */}
            <div>
              <h1 className="text-4xl font-semibold mb-3">Ações Personalizadas</h1>
              <p className="text-base text-gray-400">
                Componentes reutilizáveis para gestão de conta com variantes Clean e Premium
              </p>
            </div>

            {/* Premium Variant */}
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Variante Premium</h2>
                <p className="text-sm text-gray-500">
                  Gradiente sutil, bordas com glow discreto e visual mais elaborado
                </p>
              </div>
              <CustomActionsSection
                variant="premium"
                title="Ações Personalizadas"
                subtitle="Gerencie sua conta e assinatura"
                actions={customActions}
              />
            </section>

            {/* Clean Variant */}
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Variante Clean</h2>
                <p className="text-sm text-gray-500">
                  Design minimalista com foco em clareza e contraste limpo
                </p>
              </div>
              <CustomActionsSection
                variant="clean"
                title="Ações Personalizadas"
                subtitle="Gerencie sua conta e assinatura"
                actions={customActions}
              />
            </section>

            {/* Compact Actions */}
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Versão Compacta</h2>
                <p className="text-sm text-gray-500">
                  Botões inline para integração em headers e barras de ferramentas
                </p>
              </div>
              <div className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8">
                <CompactActions actions={customActions} />
              </div>
            </section>

            {/* Expanded with More Actions - Premium */}
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Escalabilidade - 4 Ações (Premium)</h2>
                <p className="text-sm text-gray-500">
                  Demonstração com mais ações para mostrar flexibilidade do grid
                </p>
              </div>
              <CustomActionsSection
                variant="premium"
                title="Central de Gerenciamento"
                subtitle="Acesso rápido a todas as configurações e ferramentas"
                actions={expandedActions}
              />
            </section>

            {/* Expanded with More Actions - Clean */}
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Escalabilidade - 4 Ações (Clean)</h2>
                <p className="text-sm text-gray-500">
                  Mesma estrutura na variante Clean mantendo consistência
                </p>
              </div>
              <CustomActionsSection
                variant="clean"
                title="Central de Gerenciamento"
                subtitle="Acesso rápido a todas as configurações e ferramentas"
                actions={expandedActions}
              />
            </section>

            {/* States Demo */}
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Estados de Interação</h2>
                <p className="text-sm text-gray-500">
                  Loading, disabled e estados normais lado a lado
                </p>
              </div>
              <CustomActionsSection
                variant="premium"
                title="Estados dos Botões"
                subtitle="Hover, focus, active, disabled e loading"
                actions={[
                  {
                    id: "normal",
                    label: "Normal",
                    description: "Estado padrão do botão",
                    icon: Settings,
                    variant: "outline",
                    onClick: () => alert("Normal clicked"),
                  },
                  {
                    id: "loading",
                    label: "Carregando",
                    description: "Estado de loading com spinner",
                    icon: ExternalLink,
                    variant: "primary",
                    onClick: () => {},
                    loading: true,
                  },
                  {
                    id: "disabled",
                    label: "Desabilitado",
                    description: "Estado desabilitado",
                    icon: CreditCard,
                    variant: "outline",
                    onClick: () => {},
                    disabled: true,
                  },
                  {
                    id: "active",
                    label: "Ativo",
                    description: "Estado ativo/selecionado",
                    icon: Users,
                    variant: "primary",
                    onClick: () => alert("Active clicked"),
                  },
                ]}
              />
            </section>

            {/* Design Tokens Info */}
            <section className="bg-[rgba(255,255,255,0.02)] backdrop-blur-sm rounded-[18px] border border-[rgba(255,255,255,0.06)] p-8">
              <h2 className="text-2xl font-semibold mb-6">Especificações Técnicas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-base font-semibold text-[#00C2FF] mb-4">Design Tokens</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <span className="text-gray-300">Border Radius:</span> 18px (card), 12px (buttons)
                    </li>
                    <li>
                      <span className="text-gray-300">Button Height:</span> 44px (mínimo para toque)
                    </li>
                    <li>
                      <span className="text-gray-300">Grid Gap:</span> 16px (responsive)
                    </li>
                    <li>
                      <span className="text-gray-300">Shadow Primary:</span> 0 4px 16px rgba(0,194,255,0.25)
                    </li>
                    <li>
                      <span className="text-gray-300">Transition:</span> 200ms (all interactions)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#7A5CFF] mb-4">Acessibilidade</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <span className="text-gray-300">Contraste:</span> AA+ em todos os textos
                    </li>
                    <li>
                      <span className="text-gray-300">Focus-visible:</span> Ring azul com offset
                    </li>
                    <li>
                      <span className="text-gray-300">Aria-label:</span> Em todos os botões
                    </li>
                    <li>
                      <span className="text-gray-300">Tooltips:</span> Desktop (hover), Mobile (texto abaixo)
                    </li>
                    <li>
                      <span className="text-gray-300">Teclado:</span> Navegação completa
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#00FF9C] mb-4">Estados</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <span className="text-gray-300">Default:</span> Opacidade base
                    </li>
                    <li>
                      <span className="text-gray-300">Hover:</span> Background +4%, Shadow +50%
                    </li>
                    <li>
                      <span className="text-gray-300">Active:</span> Shadow reduzido
                    </li>
                    <li>
                      <span className="text-gray-300">Disabled:</span> Opacity 50%
                    </li>
                    <li>
                      <span className="text-gray-300">Loading:</span> Spinner animado
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#fbbf24] mb-4">Responsividade</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <span className="text-gray-300">Desktop:</span> Grid 2 colunas
                    </li>
                    <li>
                      <span className="text-gray-300">Tablet:</span> Grid 2 colunas
                    </li>
                    <li>
                      <span className="text-gray-300">Mobile:</span> Empilhado (1 coluna)
                    </li>
                    <li>
                      <span className="text-gray-300">Tooltips Desktop:</span> Hover acima
                    </li>
                    <li>
                      <span className="text-gray-300">Descrições Mobile:</span> Texto abaixo
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
