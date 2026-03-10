import { Link } from "react-router";
import logo from "../../assets/logo.png";
import heroImage from "../../assets/hero-image.png";
import { ChevronDown, Brain, Target, TrendingUp, AlertCircle, Lightbulb, Database, BarChart3, Eye, Shield, Server, Monitor, Users, Mail, Phone, MapPin, Search, DollarSign, Activity } from "lucide-react";

const fallbackImage = "/placeholder.png";

export default function Landing() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020817]/90 backdrop-blur-sm border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <img
              src={logo}
              alt="Soccer Mind Logo"
              className="h-12"
              onError={(event) => {
                event.currentTarget.src = fallbackImage;
              }}
            />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('sobre')} className="hover:text-[#a855f7] transition-colors">Sobre</button>
            <button onClick={() => scrollToSection('solucao')} className="hover:text-[#a855f7] transition-colors">Solução</button>
            <button onClick={() => scrollToSection('tecnologia')} className="hover:text-[#a855f7] transition-colors">Tecnologia</button>
            <button onClick={() => scrollToSection('contato')} className="hover:text-[#a855f7] transition-colors">Contato</button>
            <Link
              to="/login"
              className="ml-4 bg-[#a855f7] hover:bg-[#9333ea] text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-[0_4px_12px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:scale-[1.02]"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Gradient Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#a855f7]/20 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#06b6d4]/20 rounded-full blur-[128px]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <img
            src={heroImage}
            alt="Soccer Mind AI"
            className="w-full max-w-3xl mx-auto mb-8"
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
          />
          <p className="text-2xl md:text-3xl mb-4 text-gray-200">
            Inteligência para decidir melhor no futebol
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-lg text-gray-300 mb-12">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#a855f7] rounded-full"></span>
              Dados
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#06b6d4] rounded-full"></span>
              Contexto
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#a855f7] rounded-full"></span>
              Inteligência Artificial
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 mb-12">
            <span>Scouting</span>
            <span>•</span>
            <span>Performance</span>
            <span>•</span>
            <span>Gestão de risco</span>
          </div>
          <button 
            onClick={() => scrollToSection('sobre')}
            className="animate-bounce"
          >
            <ChevronDown className="w-8 h-8 text-[#a855f7]" />
          </button>
        </div>
      </section>

      {/* Intro Cards Section */}
      <section id="sobre" className="py-24 px-6 bg-gradient-to-b from-[#020817] to-[#0f172a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Por que surgiu */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 rounded-2xl border border-[#334155] hover:border-[#a855f7] transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#a855f7] to-[#9333ea] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#a855f7]">Por que surgiu a Soccer Mind?</h3>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-200 mb-3">O problema</h4>
                <p className="text-gray-400 leading-relaxed">
                  O futebol ainda toma muitas decisões com base em percepção, histórico isolado ou feeling — mesmo tendo dados disponíveis.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-200 mb-3">A nossa resposta</h4>
                <p className="text-gray-400 leading-relaxed mb-4">
                  A Soccer Mind nasceu para organizar, interpretar e conectar dados ao contexto real do jogo, ajudando clubes a decidirem com mais clareza, menos risco e mais inteligência.
                </p>
                <p className="text-[#a855f7] font-semibold">
                  Menos achismo. Mais decisão consciente.
                </p>
              </div>
            </div>

            {/* Card 2: O que é */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 rounded-2xl border border-[#334155] hover:border-[#06b6d4] transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#06b6d4] to-[#0891b2] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#06b6d4]">O que é a Soccer Mind?</h3>
              
              <p className="text-gray-400 leading-relaxed mb-4">
                A Soccer Mind é uma plataforma de inteligência esportiva aplicada ao futebol, que une dados, vídeo, contexto tático e inteligência artificial para apoiar clubes em scouting, desempenho e planejamento esportivo.
              </p>

              <div className="border-l-4 border-[#06b6d4] pl-4 py-2">
                <p className="text-gray-300 font-semibold mb-2">
                  Não entregamos apenas números.
                </p>
                <p className="text-[#06b6d4] font-bold">
                  Entregamos leitura de jogo, projeção e decisão.
                </p>
              </div>
            </div>

            {/* Card 3: Nosso propósito */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 rounded-2xl border border-[#334155] hover:border-[#a855f7] transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-[#a855f7] to-[#9333ea] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#a855f7]">Nosso propósito</h3>
              
              <p className="text-gray-400 mb-4">Ajudar clubes a:</p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="w-2 h-2 bg-[#a855f7] rounded-full"></span>
                  contratar melhor
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="w-2 h-2 bg-[#a855f7] rounded-full"></span>
                  errar menos
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="w-2 h-2 bg-[#a855f7] rounded-full"></span>
                  desenvolver mais
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="w-2 h-2 bg-[#a855f7] rounded-full"></span>
                  competir com inteligência
                </li>
              </ul>

              <p className="text-gray-400 leading-relaxed">
                Tudo isso respeitando a identidade, o modelo de jogo e a realidade financeira de cada clube.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="solucao" className="py-24 px-6 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              O PROBLEMA
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 text-white">
                O futebol ainda toma decisões críticas com base em:
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Percepção subjetiva</h4>
                    <p className="text-gray-400">Decisões baseadas em impressões pessoais sem validação objetiva</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Histórico isolado</h4>
                    <p className="text-gray-400">Análise de dados descontextualizados e fragmentados</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Comparações sem contexto</h4>
                    <p className="text-gray-400">Jogadores comparados sem considerar ligas, sistemas e funções</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Alto risco em contratações</h4>
                    <p className="text-gray-400">Investimentos milionários sem análise preditiva adequada</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 rounded-3xl border border-red-500/30">
              <p className="text-2xl text-gray-300 leading-relaxed">
                Mesmo com dados disponíveis, falta <span className="text-red-500 font-bold">interpretação</span> e <span className="text-red-500 font-bold">integração</span> entre scouting, comissão técnica e diretoria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#0f172a] to-[#020817]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">
              A NOSSA VISÃO
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-[#a855f7]/10 to-transparent p-8 rounded-2xl border border-[#a855f7]/30">
              <Lightbulb className="w-12 h-12 text-[#a855f7] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Decisões esportivas precisam ser:</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-300 text-lg">
                  <span className="w-3 h-3 bg-[#a855f7] rounded-full"></span>
                  Contextualizadas
                </li>
                <li className="flex items-center gap-3 text-gray-300 text-lg">
                  <span className="w-3 h-3 bg-[#a855f7] rounded-full"></span>
                  Comparáveis
                </li>
                <li className="flex items-center gap-3 text-gray-300 text-lg">
                  <span className="w-3 h-3 bg-[#a855f7] rounded-full"></span>
                  Projetáveis
                </li>
                <li className="flex items-center gap-3 text-gray-300 text-lg">
                  <span className="w-3 h-3 bg-[#a855f7] rounded-full"></span>
                  Mensuráveis
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#06b6d4]/10 to-transparent p-8 rounded-2xl border border-[#06b6d4]/30 flex items-center">
              <p className="text-xl text-gray-300 leading-relaxed">
                A Soccer Mind nasce para transformar <span className="text-[#06b6d4] font-bold">dados em decisão esportiva real</span>, respeitando o modelo de jogo e a realidade de cada clube.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-[#020817]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              COMO FUNCIONA
            </h2>
            <p className="text-xl text-gray-400">Visão Geral do Processo</p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#a855f7] to-[#9333ea] rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-white mb-2">1. Coleta</h4>
              <p className="text-sm text-gray-400">Ingestão de dados de múltiplas fontes</p>
            </div>

            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#06b6d4] to-[#0891b2] rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-white mb-2">2. Contextualização</h4>
              <p className="text-sm text-gray-400">Por posição, função e liga</p>
            </div>

            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#a855f7] to-[#9333ea] rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-white mb-2">3. Processamento</h4>
              <p className="text-sm text-gray-400">Estatístico e histórico completo</p>
            </div>

            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#06b6d4] to-[#0891b2] rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-white mb-2">4. IA</h4>
              <p className="text-sm text-gray-400">Análise e projeção inteligente</p>
            </div>

            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#a855f7] to-[#9333ea] rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-white mb-2">5. Decisão</h4>
              <p className="text-sm text-gray-400">Relatórios claros e acionáveis</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-2xl text-[#a855f7] font-bold">
              Dados brutos viram insight acionável.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="tecnologia" className="py-24 px-6 bg-gradient-to-b from-[#020817] to-[#0f172a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">
              TECNOLOGIA
            </h2>
          </div>

          {/* Backend and Frontend - Organized Side by Side */}
          <div className="mb-24">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Backend Card */}
              <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 rounded-3xl border border-[#a855f7]/30">
                <Server className="w-16 h-16 text-[#a855f7] mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">BACKEND</h3>
                <p className="text-[#a855f7] font-bold text-lg mb-6">A Base do Produto</p>
                <p className="text-gray-400 mb-6">O backend da Soccer Mind foi construído para futebol profissional.</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-[#a855f7] rounded-full mt-2"></span>
                    <p className="text-gray-300">ingestão de múltiplas fontes</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-[#a855f7] rounded-full mt-2"></span>
                    <p className="text-gray-300">normalização por minutos, posição e liga</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-[#a855f7] rounded-full mt-2"></span>
                    <p className="text-gray-300">histórico completo por jogador</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-[#a855f7] rounded-full mt-2"></span>
                    <p className="text-gray-300">comparação entre contextos diferentes</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-[#a855f7] rounded-full mt-2"></span>
                    <p className="text-gray-300">suporte a modelos de IA e scoring</p>
                  </div>
                </div>
                <p className="text-[#a855f7] font-bold mt-6">
                  Sem base sólida, não existe inteligência confiável.
                </p>
              </div>

              {/* Frontend Card */}
              <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 rounded-3xl border border-[#06b6d4]/30">
                <Monitor className="w-16 h-16 text-[#06b6d4] mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">FRONTEND</h3>
                <p className="text-[#06b6d4] font-bold text-lg mb-6">Decisão Rápida</p>
                <p className="text-gray-400 mb-6">O frontend é pensado para quem decide.</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-[#06b6d4] rounded-full mt-2"></span>
                    <p className="text-gray-300">leitura simples</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-[#06b6d4] rounded-full mt-2"></span>
                    <p className="text-gray-300">comparações visuais</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-[#06b6d4] rounded-full mt-2"></span>
                    <p className="text-gray-300">relatórios objetivos</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-[#06b6d4] rounded-full mt-2"></span>
                    <p className="text-gray-300">visão individual e coletiva</p>
                  </div>
                </div>
                <p className="text-[#06b6d4] font-bold mt-6">
                  Diretoria, scout e comissão técnica falam a mesma língua.
                </p>
              </div>
            </div>
          </div>

          {/* AI Section */}
          <div className="bg-gradient-to-br from-[#a855f7]/10 via-[#06b6d4]/10 to-transparent p-12 rounded-3xl border border-[#a855f7]/30 mb-24">
            <div className="text-center mb-12">
              <Brain className="w-20 h-20 text-[#a855f7] mx-auto mb-6" />
              <h3 className="text-4xl font-bold text-white mb-4">INTELIGÊNCIA ARTIFICIAL</h3>
              <p className="text-xl text-gray-300">A IA da Soccer Mind atua como camada de apoio à decisão.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#1e293b]/50 p-6 rounded-xl">
                <Shield className="w-10 h-10 text-[#a855f7] mb-4" />
                <h4 className="font-bold text-white mb-3">Análise de Risco</h4>
                <p className="text-gray-400 text-sm">análise de risco de contratação</p>
              </div>
              <div className="bg-[#1e293b]/50 p-6 rounded-xl">
                <TrendingUp className="w-10 h-10 text-[#06b6d4] mb-4" />
                <h4 className="font-bold text-white mb-3">Projeção</h4>
                <p className="text-gray-400 text-sm">projeção de desempenho</p>
              </div>
              <div className="bg-[#1e293b]/50 p-6 rounded-xl">
                <BarChart3 className="w-10 h-10 text-[#a855f7] mb-4" />
                <h4 className="font-bold text-white mb-3">Comparação</h4>
                <p className="text-gray-400 text-sm">comparação avançada entre atletas</p>
              </div>
              <div className="bg-[#1e293b]/50 p-6 rounded-xl">
                <Eye className="w-10 h-10 text-[#06b6d4] mb-4" />
                <h4 className="font-bold text-white mb-3">Padrões</h4>
                <p className="text-gray-400 text-sm">identificação de padrões ocultos</p>
              </div>
              <div className="bg-[#1e293b]/50 p-6 rounded-xl">
                <Users className="w-10 h-10 text-[#a855f7] mb-4" />
                <h4 className="font-bold text-white mb-3">Leitura Coletiva</h4>
                <p className="text-gray-400 text-sm">leitura coletiva do time</p>
              </div>
              <div className="bg-[#1e293b]/50 p-6 rounded-xl">
                <Activity className="w-10 h-10 text-[#06b6d4] mb-4" />
                <h4 className="font-bold text-white mb-3">Gestão Física</h4>
                <p className="text-gray-400 text-sm">histórico e previsão de lesões</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-2xl text-[#a855f7] font-bold">
                A IA organiza. O humano decide.
              </p>
            </div>
          </div>

          {/* Scouting and Valorization - Side by Side */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Scouting Card */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 rounded-3xl border border-[#a855f7]/30">
              <Search className="w-16 h-16 text-[#a855f7] mb-6" />
              <h3 className="text-3xl font-bold text-white mb-4">SCOUTING INTELIGENTE</h3>
              <p className="text-gray-400 mb-6">
                A Soccer Mind acompanha promessas do futebol no mundo em tempo contínuo.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#a855f7] rounded-full mt-2"></span>
                  <p className="text-gray-300">Fase de carreira</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#a855f7] rounded-full mt-2"></span>
                  <p className="text-gray-300">Evolução técnica e tática</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#a855f7] rounded-full mt-2"></span>
                  <p className="text-gray-300">Custo atual</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#a855f7] rounded-full mt-2"></span>
                  <p className="text-gray-300">Tendência de valorização</p>
                </div>
              </div>
              <p className="text-[#a855f7] font-bold">
                O objetivo é comprar antes do mercado inflacionar.
              </p>
            </div>

            {/* Valorization Card */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 rounded-3xl border border-[#06b6d4]/30">
              <DollarSign className="w-16 h-16 text-[#06b6d4] mb-6" />
              <h3 className="text-3xl font-bold text-white mb-4">VALORIZAÇÃO DE MERCADO</h3>
              <p className="text-gray-400 mb-6">A IA projeta:</p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#06b6d4] rounded-full mt-2"></span>
                  <p className="text-gray-300">Crescimento de performance</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#06b6d4] rounded-full mt-2"></span>
                  <p className="text-gray-300">Risco de estagnação</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#06b6d4] rounded-full mt-2"></span>
                  <p className="text-gray-300">Probabilidade de valorização</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">Isso permite:</p>
              <div className="space-y-3">
                <div className="bg-[#06b6d4]/10 px-4 py-2 rounded-lg">
                  <p className="text-gray-300">✓ Decisões antecipadas</p>
                </div>
                <div className="bg-[#06b6d4]/10 px-4 py-2 rounded-lg">
                  <p className="text-gray-300">✓ Melhor custo-benefício</p>
                </div>
                <div className="bg-[#06b6d4]/10 px-4 py-2 rounded-lg">
                  <p className="text-gray-300">✓ Redução de erro financeiro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differential Section */}
      <section className="py-24 px-6 bg-[#020817]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              DIFERENCIAL SOCCER MIND
            </h2>
          </div>

          <div className="bg-gradient-to-br from-[#a855f7]/10 via-[#06b6d4]/10 to-transparent p-12 rounded-3xl border border-[#a855f7]/30">
            <p className="text-2xl text-gray-300 text-center mb-12">
              Enquanto muitos sistemas mostram <span className="text-[#06b6d4] font-semibold">o que aconteceu</span>,<br />
              a Soccer Mind responde:
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#1e293b] p-6 rounded-xl border border-[#a855f7]">
                <h4 className="text-xl font-bold text-[#a855f7] mb-3">Por que aconteceu</h4>
                <p className="text-gray-400 text-sm">Contexto e análise causal</p>
              </div>
              <div className="bg-[#1e293b] p-6 rounded-xl border border-[#06b6d4]">
                <h4 className="text-xl font-bold text-[#06b6d4] mb-3">Se vai se repetir</h4>
                <p className="text-gray-400 text-sm">Análise preditiva</p>
              </div>
              <div className="bg-[#1e293b] p-6 rounded-xl border border-[#a855f7]">
                <h4 className="text-xl font-bold text-[#a855f7] mb-3">Se encaixa no modelo do clube</h4>
                <p className="text-gray-400 text-sm">Fit tático e estratégico</p>
              </div>
              <div className="bg-[#1e293b] p-6 rounded-xl border border-[#06b6d4]">
                <h4 className="text-xl font-bold text-[#06b6d4] mb-3">Se vale o investimento</h4>
                <p className="text-gray-400 text-sm">ROI e análise financeira</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#020817] to-[#0f172a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">
              PARA QUEM É
            </h2>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] hover:border-[#a855f7] transition-all">
              <div className="w-14 h-14 bg-[#a855f7]/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-[#a855f7]" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Clubes profissionais</h4>
            </div>

            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] hover:border-[#06b6d4] transition-all">
              <div className="w-14 h-14 bg-[#06b6d4]/10 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-[#06b6d4]" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Departamentos de scouting</h4>
            </div>

            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] hover:border-[#a855f7] transition-all">
              <div className="w-14 h-14 bg-[#a855f7]/10 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-[#a855f7]" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Comissões técnicas</h4>
            </div>

            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] hover:border-[#06b6d4] transition-all">
              <div className="w-14 h-14 bg-[#06b6d4]/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7 text-[#06b6d4]" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Gestão esportiva</h4>
            </div>

            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-[#334155] hover:border-[#a855f7] transition-all">
              <div className="w-14 h-14 bg-[#a855f7]/10 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-[#a855f7]" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Categorias de base</h4>
            </div>
          </div>

          <p className="text-center text-xl text-gray-400 mt-12">
            Adaptável à realidade de cada estrutura.
          </p>
        </div>
      </section>

      {/* Summary Section */}
      <section className="py-24 px-6 bg-[#0f172a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            EM UMA FRASE
          </h2>
          <div className="bg-gradient-to-br from-[#a855f7]/10 via-[#06b6d4]/10 to-transparent p-12 rounded-3xl border border-[#a855f7]/30">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">
              Soccer Mind
            </h3>
            <p className="text-2xl text-gray-300 leading-relaxed">
              Dados, contexto e inteligência artificial a serviço da decisão esportiva.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contato" className="py-24 px-6 bg-gradient-to-b from-[#0f172a] to-[#020817]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">
              ENCERRAMENTO
            </h2>
          </div>

          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-12 rounded-3xl border border-[#a855f7]/30">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">
              Estamos prontos para:
            </h3>

            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#a855f7]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-6 h-6 text-[#a855f7]" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Apresentar a plataforma</h4>
                  <p className="text-gray-400">Demonstração completa da Soccer Mind e suas funcionalidades</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#06b6d4]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-[#06b6d4]" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Entender a realidade do clube</h4>
                  <p className="text-gray-400">Análise das necessidades específicas e contexto atual</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#a855f7]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-[#a855f7]" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Adaptar a Soccer Mind às suas necessidades</h4>
                  <p className="text-gray-400">Personalização da plataforma para o modelo de jogo do clube</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a 
                href="https://wa.me/5511913267962" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-[#a855f7] to-[#9333ea] hover:from-[#9333ea] hover:to-[#a855f7] text-white px-12 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-[#a855f7]/20"
              >
                Fale Conosco
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[#020817] border-t border-[#1e293b]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <img
                src={logo}
                alt="Soccer Mind"
                className="h-16 mb-6"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
              <p className="text-gray-400 leading-relaxed">
                Inteligência esportiva aplicada ao futebol. Transformando dados em decisões conscientes.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Navegação</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => scrollToSection('sobre')} className="text-gray-400 hover:text-[#a855f7] transition-colors">
                    Sobre
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('solucao')} className="text-gray-400 hover:text-[#a855f7] transition-colors">
                    Solução
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('tecnologia')} className="text-gray-400 hover:text-[#a855f7] transition-colors">
                    Tecnologia
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('contato')} className="text-gray-400 hover:text-[#a855f7] transition-colors">
                    Contato
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Contato</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5 text-[#a855f7]" />
                  <a href="mailto:comercial@soccermind.com.br" className="hover:text-[#a855f7] transition-colors">
                    comercial@soccermind.com.br
                  </a>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5 text-[#a855f7]" />
                  <a href="https://wa.me/5511913267962" target="_blank" rel="noopener noreferrer" className="hover:text-[#a855f7] transition-colors">
                    +55 (11) 91326-7962
                  </a>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-5 h-5 text-[#a855f7]" />
                  São Paulo, Brasil
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#1e293b] pt-8 text-center text-gray-400">
            <p>© 2026 Soccer Mind. Todos os direitos reservados.</p>
            <p className="mt-2 text-sm">Dados • Contexto • Inteligência Artificial</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
