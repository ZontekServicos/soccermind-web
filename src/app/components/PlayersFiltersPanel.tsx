import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  Radar,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { PlayerFilterOptions } from "../services/players";
import type { PlayersFiltersState } from "../utils/playerFilters";
import { cn } from "./ui/utils";

interface PlayersFiltersPanelProps {
  filters: PlayersFiltersState;
  options: PlayerFilterOptions;
  activeFiltersCount: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSearchChange: (value: string) => void;
  onFieldChange: (field: keyof Omit<PlayersFiltersState, "positions" | "search">, value: string) => void;
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

function FilterMeta({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-semibold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function FieldShell({
  label,
  helperText,
  children,
}: {
  label: string;
  helperText?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">{label}</label>
        {helperText ? <span className="text-[11px] text-gray-600">{helperText}</span> : null}
      </div>
      {children}
    </div>
  );
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
    <div ref={ref}>
      <FieldShell label={label} helperText={helperText}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(9,23,45,0.86),rgba(8,18,35,0.8))] px-4 py-3.5 text-left text-sm text-gray-100 transition-all hover:border-[rgba(0,194,255,0.28)] hover:shadow-[0_0_0_1px_rgba(0,194,255,0.08)]"
          >
            <span className={value ? "text-gray-100" : "text-gray-500"}>{value || placeholder}</span>
            <ChevronsUpDown className="h-4 w-4 text-gray-500" />
          </button>

          {open && (
            <div className="absolute left-0 top-[calc(100%+10px)] z-30 w-full overflow-hidden rounded-[20px] border border-[rgba(0,194,255,0.24)] bg-[#07152a]/98 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="border-b border-[rgba(255,255,255,0.06)] p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={`Buscar ${label.toLowerCase()}`}
                    className="w-full rounded-[13px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] py-2.5 pl-10 pr-3 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
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
                  className={cn(
                    "flex w-full items-center justify-between rounded-[13px] px-3 py-2 text-sm transition-colors",
                    !value ? "bg-[rgba(0,194,255,0.12)] text-[#00C2FF]" : "text-gray-300 hover:bg-[rgba(255,255,255,0.04)]",
                  )}
                >
                  <span>Todos</span>
                  {!value ? <Check className="h-4 w-4" /> : null}
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
                      className={cn(
                        "flex w-full items-center justify-between rounded-[13px] px-3 py-2 text-sm transition-colors",
                        selected
                          ? "bg-[rgba(0,194,255,0.12)] text-[#00C2FF]"
                          : "text-gray-300 hover:bg-[rgba(255,255,255,0.04)]",
                      )}
                    >
                      <span className="truncate">{option}</span>
                      {selected ? <Check className="h-4 w-4" /> : null}
                    </button>
                  );
                })}

                {visibleOptions.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-gray-500">Nenhuma opcao encontrada.</div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </FieldShell>
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
    <FieldShell label={label} helperText={helperText}>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          inputMode="numeric"
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
          placeholder={minPlaceholder}
          className="w-full rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(9,23,45,0.86),rgba(8,18,35,0.8))] px-4 py-3.5 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
        />
        <input
          type="number"
          inputMode="numeric"
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
          placeholder={maxPlaceholder}
          className="w-full rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(9,23,45,0.86),rgba(8,18,35,0.8))] px-4 py-3.5 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
        />
      </div>
    </FieldShell>
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
    <div ref={ref}>
      <FieldShell label="Posicoes" helperText="Selecao multipla">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(9,23,45,0.86),rgba(8,18,35,0.8))] px-4 py-3.5 text-left text-sm text-gray-100 transition-all hover:border-[rgba(0,194,255,0.28)]"
          >
            <span className={selectedPositions.length > 0 ? "text-gray-100" : "text-gray-500"}>
              {selectedPositions.length > 0 ? `${selectedPositions.length} posicoes selecionadas` : "Todas as posicoes"}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute left-0 top-[calc(100%+10px)] z-30 w-full overflow-hidden rounded-[20px] border border-[rgba(0,194,255,0.24)] bg-[#07152a]/98 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="border-b border-[rgba(255,255,255,0.06)] p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar posicao"
                    className="w-full rounded-[13px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] py-2.5 pl-10 pr-3 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
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
                      className={cn(
                        "flex w-full items-center justify-between rounded-[13px] px-3 py-2 text-sm transition-colors",
                        selected
                          ? "bg-[rgba(0,194,255,0.12)] text-[#00C2FF]"
                          : "text-gray-300 hover:bg-[rgba(255,255,255,0.04)]",
                      )}
                    >
                      <span>{option}</span>
                      {selected ? <Check className="h-4 w-4" /> : null}
                    </button>
                  );
                })}

                {visibleOptions.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-gray-500">Nenhuma posicao encontrada.</div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {selectedPositions.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedPositions.map((position) => (
              <button
                key={position}
                type="button"
                onClick={() => onTogglePosition(position)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,194,255,0.22)] bg-[linear-gradient(180deg,rgba(0,194,255,0.16),rgba(0,194,255,0.08))] px-3 py-1.5 text-xs font-medium text-[#AEEBFF] transition-colors hover:bg-[rgba(0,194,255,0.18)]"
              >
                <span>{position}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        ) : null}
      </FieldShell>
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
    <section className="rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">{description}</p>
        </div>
        <div className="mt-0.5 h-9 w-9 rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]" />
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const FilterGroup = FilterSection;
const FilterDropdown = SearchableSelect;
const FilterToggle = PositionSelector;
const FilterSlider = NumberRangeField;

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
    <section className="overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(9,22,43,0.96),rgba(5,14,29,0.96))] shadow-[0_22px_72px_rgba(0,0,0,0.42)]">
      <div className="relative overflow-hidden border-b border-[rgba(255,255,255,0.06)] px-6 py-6">
        <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_top_right,rgba(0,194,255,0.18),transparent_68%)]" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-[radial-gradient(circle,rgba(122,92,255,0.12),transparent_72%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#8EDFFF]">
              <Sparkles className="h-3.5 w-3.5" />
              Player Intelligence Filters
            </div>
            <h2 className="text-[26px] font-semibold leading-tight text-white">Painel de decisao para refinar o radar de scouting</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
              Organize a busca em camadas claras: identificacao, contexto competitivo, nivel atual, upside e faixa financeira.
              O painel permanece consistente em todas as experiencias que trabalham com universo de jogadores.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <FilterMeta label="Filtros ativos" value={`${activeFiltersCount}`} accent="#00C2FF" />
            <FilterMeta label="Painel" value={isExpanded ? "Expandido" : "Compacto"} accent="#C6B8FF" />
            <FilterMeta label="Busca" value="Live 300ms" accent="#00FF9C" />
          </div>
        </div>

        <div className="relative mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs text-gray-400">
            <Radar className="h-3.5 w-3.5 text-[#00C2FF]" />
            Controle unico para ranking, compare e reports
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onClearFilters}
              disabled={!hasFilters}
              className="inline-flex items-center gap-2 rounded-[15px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 text-sm font-medium text-gray-300 transition-all hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.05)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar filtros
            </button>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="inline-flex items-center gap-2 rounded-[15px] border border-[rgba(0,194,255,0.24)] bg-[linear-gradient(180deg,rgba(0,194,255,0.16),rgba(0,194,255,0.08))] px-4 py-2.5 text-sm font-medium text-[#9BE7FF] transition-all hover:bg-[rgba(0,194,255,0.18)]"
            >
              <span>{isExpanded ? "Recolher painel" : "Expandir painel"}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </button>
          </div>
        </div>
      </div>

      <div className={cn("overflow-hidden transition-all duration-300", isExpanded ? "max-h-[2400px] opacity-100" : "max-h-0 opacity-0")}>
        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <FilterGroup
              title="Context"
              description="Abra a busca por nome e combine a malha de posicoes para refinar rapidamente o shortlist."
            >
              <FieldShell label="Nome do jogador" helperText="Atualizacao automatica">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Buscar por nome, clube, liga ou nacionalidade"
                    className="w-full rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(9,23,45,0.86),rgba(8,18,35,0.8))] py-3.5 pl-11 pr-4 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-[rgba(0,194,255,0.28)]"
                  />
                </div>
              </FieldShell>

              <FilterToggle
                selectedPositions={filters.positions}
                options={options.positions}
                onTogglePosition={onTogglePosition}
              />
            </FilterGroup>

            <FilterGroup
              title="Market"
              description="Cruze pais, clube, liga e origem de dados para deixar o radar mais aderente ao recorte de decisao."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FilterDropdown
                  label="Nacionalidade"
                  value={filters.nationality}
                  options={options.nationalities}
                  placeholder="Todas as nacionalidades"
                  onChange={(value) => onFieldChange("nationality", value)}
                />
                <FilterDropdown
                  label="Clube"
                  value={filters.team}
                  options={options.teams}
                  placeholder="Todos os clubes"
                  onChange={(value) => onFieldChange("team", value)}
                />
                <FilterDropdown
                  label="Liga"
                  value={filters.league}
                  options={options.leagues}
                  placeholder="Todas as ligas"
                  onChange={(value) => onFieldChange("league", value)}
                />
                <FilterDropdown
                  label="Source"
                  value={filters.source}
                  options={options.sources}
                  placeholder="Todas as fontes"
                  helperText="Preparado para multiplas origens"
                  onChange={(value) => onFieldChange("source", value)}
                />
              </div>
            </FilterGroup>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <FilterGroup
              title="Performance"
              description="Separe talentos para impacto imediato, valorizacao futura ou equilibrio de ciclo."
            >
              <FilterSlider
                label="Idade"
                minValue={filters.minAge}
                maxValue={filters.maxAge}
                minPlaceholder="Min"
                maxPlaceholder="Max"
                onMinChange={(value) => onFieldChange("minAge", value)}
                onMaxChange={(value) => onFieldChange("maxAge", value)}
              />
            </FilterGroup>

            <FilterGroup
              title="Performance"
              description="Equilibre performance atual e potencial para diferenciar prontidao competitiva de teto de crescimento."
            >
              <div className="space-y-4">
                <FilterSlider
                  label="Overall"
                  minValue={filters.minOverall}
                  maxValue={filters.maxOverall}
                  minPlaceholder="Min"
                  maxPlaceholder="Max"
                  onMinChange={(value) => onFieldChange("minOverall", value)}
                  onMaxChange={(value) => onFieldChange("maxOverall", value)}
                />
                <FilterSlider
                  label="Potential"
                  minValue={filters.minPotential}
                  maxValue={filters.maxPotential}
                  minPlaceholder="Min"
                  maxPlaceholder="Max"
                  onMinChange={(value) => onFieldChange("minPotential", value)}
                  onMaxChange={(value) => onFieldChange("maxPotential", value)}
                />
              </div>
            </FilterGroup>

            <FilterGroup
              title="Market"
              description="Ajuste piso e teto de investimento para alinhar o shortlist a cenarios reais de mercado."
            >
              <FilterSlider
                label="Valor de mercado"
                minValue={filters.minValue}
                maxValue={filters.maxValue}
                minPlaceholder="Min EUR"
                maxPlaceholder="Max EUR"
                helperText="Use valor inteiro em euro"
                onMinChange={(value) => onFieldChange("minValue", value)}
                onMaxChange={(value) => onFieldChange("maxValue", value)}
              />
            </FilterGroup>
          </div>
        </div>
      </div>
    </section>
  );
}
