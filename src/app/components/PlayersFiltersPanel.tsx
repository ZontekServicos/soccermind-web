import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronsUpDown, RotateCcw, Search, Sparkles, X } from "lucide-react";
import type { PlayerFilterOptions } from "../services/players";

export interface PlayersRankingFiltersState {
  search: string;
  positions: string[];
  nationality: string;
  team: string;
  league: string;
  source: string;
  minAge: string;
  maxAge: string;
  minOverall: string;
  maxOverall: string;
  minPotential: string;
  maxPotential: string;
  minValue: string;
  maxValue: string;
}

interface PlayersFiltersPanelProps {
  filters: PlayersRankingFiltersState;
  options: PlayerFilterOptions;
  activeFiltersCount: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSearchChange: (value: string) => void;
  onFieldChange: (field: keyof Omit<PlayersRankingFiltersState, "positions" | "search">, value: string) => void;
  onTogglePosition: (position: string) => void;
  onClearFilters: () => void;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  helperText?: string;
  onChange: (value: string) => void;
}

interface NumberRangeFieldProps {
  label: string;
  minValue: string;
  maxValue: string;
  minPlaceholder: string;
  maxPlaceholder: string;
  helperText?: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

function mergeSelectedOption(options: string[], selectedValue: string) {
  if (!selectedValue || options.includes(selectedValue)) {
    return options;
  }

  return [selectedValue, ...options];
}

function useDismissableLayer<T extends HTMLElement>(open: boolean, onDismiss: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open, onDismiss]);

  return ref;
}

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  helperText,
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useDismissableLayer<HTMLDivElement>(open, () => setOpen(false));

  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const mergedOptions = mergeSelectedOption(options, value);

    if (!normalizedQuery) {
      return mergedOptions;
    }

    return mergedOptions.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [options, query, value]);

  return (
    <div className="space-y-2" ref={ref}>
      <div className="flex items-center justify-between gap-3">
        <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">{label}</label>
        {helperText && <span className="text-[11px] text-gray-600">{helperText}</span>}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] px-4 py-3 text-left text-sm text-gray-100 transition-all hover:border-[rgba(0,194,255,0.28)] hover:bg-[rgba(7,20,42,0.88)]"
        >
          <span className={value ? "text-gray-100" : "text-gray-500"}>{value || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 text-gray-500" />
        </button>

        {open && (
          <div className="absolute left-0 top-[calc(100%+10px)] z-30 w-full overflow-hidden rounded-[18px] border border-[rgba(0,194,255,0.22)] bg-[#08152b]/98 shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="border-b border-[rgba(255,255,255,0.06)] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Buscar ${label.toLowerCase()}`}
                  className="w-full rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] py-2.5 pl-10 pr-3 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
                />
              </div>
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-sm transition-colors ${
                  !value ? "bg-[rgba(0,194,255,0.12)] text-[#00C2FF]" : "text-gray-300 hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <span>Todos</span>
                {!value && <Check className="h-4 w-4" />}
              </button>

              {visibleOptions.map((option) => {
                const selected = option === value;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "bg-[rgba(0,194,255,0.12)] text-[#00C2FF]"
                        : "text-gray-300 hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    <span className="truncate">{option}</span>
                    {selected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}

              {visibleOptions.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-gray-500">Nenhuma opcao encontrada.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NumberRangeField({
  label,
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  helperText,
  onMinChange,
  onMaxChange,
}: NumberRangeFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">{label}</label>
        {helperText && <span className="text-[11px] text-gray-600">{helperText}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          inputMode="numeric"
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
          placeholder={minPlaceholder}
          className="w-full rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] px-4 py-3 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
        />
        <input
          type="number"
          inputMode="numeric"
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
          placeholder={maxPlaceholder}
          className="w-full rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] px-4 py-3 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
        />
      </div>
    </div>
  );
}

function PositionSelector({
  selectedPositions,
  options,
  onTogglePosition,
}: {
  selectedPositions: string[];
  options: string[];
  onTogglePosition: (position: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useDismissableLayer<HTMLDivElement>(open, () => setOpen(false));

  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  return (
    <div className="space-y-2" ref={ref}>
      <div className="flex items-center justify-between gap-3">
        <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">Posicoes</label>
        <span className="text-[11px] text-gray-600">Selecao multipla</span>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] px-4 py-3 text-left text-sm text-gray-100 transition-all hover:border-[rgba(0,194,255,0.28)] hover:bg-[rgba(7,20,42,0.88)]"
        >
          <span className={selectedPositions.length > 0 ? "text-gray-100" : "text-gray-500"}>
            {selectedPositions.length > 0 ? `${selectedPositions.length} posicoes selecionadas` : "Todas as posicoes"}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-[calc(100%+10px)] z-30 w-full overflow-hidden rounded-[18px] border border-[rgba(0,194,255,0.22)] bg-[#08152b]/98 shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="border-b border-[rgba(255,255,255,0.06)] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar posicao"
                  className="w-full rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] py-2.5 pl-10 pr-3 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
                />
              </div>
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto p-2">
              {visibleOptions.map((option) => {
                const selected = selectedPositions.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onTogglePosition(option)}
                    className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "bg-[rgba(0,194,255,0.12)] text-[#00C2FF]"
                        : "text-gray-300 hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    <span>{option}</span>
                    {selected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}

              {visibleOptions.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-gray-500">Nenhuma posicao encontrada.</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {selectedPositions.map((position) => (
          <button
            key={position}
            type="button"
            onClick={() => onTogglePosition(position)}
            className="inline-flex items-center gap-1 rounded-full border border-[rgba(0,194,255,0.24)] bg-[rgba(0,194,255,0.12)] px-3 py-1 text-xs font-medium text-[#9BE7FF] transition-colors hover:bg-[rgba(0,194,255,0.18)]"
          >
            <span>{position}</span>
            <X className="h-3 w-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function PlayersFiltersPanel({
  filters,
  options,
  activeFiltersCount,
  isExpanded,
  onToggleExpanded,
  onSearchChange,
  onFieldChange,
  onTogglePosition,
  onClearFilters,
}: PlayersFiltersPanelProps) {
  const hasFilters = activeFiltersCount > 0;

  return (
    <div className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(9,22,43,0.94),rgba(6,16,33,0.92))] shadow-[0_20px_70px_rgba(0,0,0,0.4)]">
      <div className="relative overflow-hidden border-b border-[rgba(255,255,255,0.06)] px-6 py-5">
        <div className="absolute inset-y-0 right-0 w-48 bg-[radial-gradient(circle_at_top_right,rgba(0,194,255,0.16),transparent_68%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#7FDBFF]">
              <Sparkles className="h-3.5 w-3.5" />
              Intelligence Filters
            </div>
            <h2 className="text-xl font-semibold text-gray-100">Refine o radar de scouting com multiplos criterios</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Combine contexto esportivo, performance, potencial e faixa financeira para encontrar o perfil ideal sem sair do ranking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 text-sm text-gray-400">
              <span className="font-semibold text-[#00C2FF]">{activeFiltersCount}</span> filtros ativos
            </div>
            <button
              type="button"
              onClick={onClearFilters}
              disabled={!hasFilters}
              className="inline-flex items-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.08)] px-4 py-2.5 text-sm font-medium text-gray-300 transition-all hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.03)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar filtros
            </button>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="inline-flex items-center gap-2 rounded-[14px] border border-[rgba(0,194,255,0.22)] bg-[rgba(0,194,255,0.12)] px-4 py-2.5 text-sm font-medium text-[#9BE7FF] transition-all hover:bg-[rgba(0,194,255,0.16)]"
            >
              {isExpanded ? "Recolher painel" : "Expandir painel"}
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[2200px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <FilterSection
              title="Identificacao"
              description="Busque rapidamente por nome e combine com a matriz de posicoes para refinar o shortlist com precisao."
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">Nome do jogador</label>
                  <span className="text-[11px] text-gray-600">Atualizacao automatica</span>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Buscar por nome, clube, liga ou nacionalidade"
                    className="w-full rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,20,42,0.68)] py-3.5 pl-11 pr-4 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
                  />
                </div>
              </div>

              <PositionSelector
                selectedPositions={filters.positions}
                options={options.positions}
                onTogglePosition={onTogglePosition}
              />
            </FilterSection>

            <FilterSection
              title="Contexto esportivo"
              description="Cruze origem dos dados, competicao, clube e pais para focar no universo competitivo mais relevante."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <SearchableSelect
                  label="Nacionalidade"
                  value={filters.nationality}
                  options={options.nationalities}
                  placeholder="Todas as nacionalidades"
                  onChange={(value) => onFieldChange("nationality", value)}
                />
                <SearchableSelect
                  label="Clube"
                  value={filters.team}
                  options={options.teams}
                  placeholder="Todos os clubes"
                  onChange={(value) => onFieldChange("team", value)}
                />
                <SearchableSelect
                  label="Liga"
                  value={filters.league}
                  options={options.leagues}
                  placeholder="Todas as ligas"
                  onChange={(value) => onFieldChange("league", value)}
                />
                <SearchableSelect
                  label="Source"
                  value={filters.source}
                  options={options.sources}
                  placeholder="Todas as fontes"
                  helperText="Preparado para novas fontes"
                  onChange={(value) => onFieldChange("source", value)}
                />
              </div>
            </FilterSection>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <FilterSection
              title="Faixa etaria"
              description="Defina a janela de idade ideal para projetos de curto prazo, valorizacao ou sucessao."
            >
              <NumberRangeField
                label="Idade"
                minValue={filters.minAge}
                maxValue={filters.maxAge}
                minPlaceholder="Min"
                maxPlaceholder="Max"
                onMinChange={(value) => onFieldChange("minAge", value)}
                onMaxChange={(value) => onFieldChange("maxAge", value)}
              />
            </FilterSection>

            <FilterSection
              title="Performance e potencial"
              description="Equilibre nivel atual e teto de desenvolvimento para separar impacto imediato de upside de mercado."
            >
              <div className="space-y-4">
                <NumberRangeField
                  label="Overall"
                  minValue={filters.minOverall}
                  maxValue={filters.maxOverall}
                  minPlaceholder="Min"
                  maxPlaceholder="Max"
                  onMinChange={(value) => onFieldChange("minOverall", value)}
                  onMaxChange={(value) => onFieldChange("maxOverall", value)}
                />
                <NumberRangeField
                  label="Potential"
                  minValue={filters.minPotential}
                  maxValue={filters.maxPotential}
                  minPlaceholder="Min"
                  maxPlaceholder="Max"
                  onMinChange={(value) => onFieldChange("minPotential", value)}
                  onMaxChange={(value) => onFieldChange("maxPotential", value)}
                />
              </div>
            </FilterSection>

            <FilterSection
              title="Financeiro"
              description="Aplique um teto ou piso de mercado para alinhar o ranking a cenarios reais de investimento."
            >
              <NumberRangeField
                label="Valor de mercado"
                minValue={filters.minValue}
                maxValue={filters.maxValue}
                minPlaceholder="Min EUR"
                maxPlaceholder="Max EUR"
                helperText="Use valor inteiro em euro"
                onMinChange={(value) => onFieldChange("minValue", value)}
                onMaxChange={(value) => onFieldChange("maxValue", value)}
              />
            </FilterSection>
          </div>
        </div>
      </div>
    </div>
  );
}