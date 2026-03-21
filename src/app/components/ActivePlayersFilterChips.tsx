import { Funnel, X } from "lucide-react";
import { cn } from "./ui/utils";
import {
  getActivePlayerFilterDescriptors,
  type FilterFieldKey,
  type PlayersFiltersState,
} from "../utils/playerFilters";

interface ActivePlayersFilterChipsProps {
  filters: PlayersFiltersState;
  className?: string;
  onClearSearch: () => void;
  onRemovePosition: (position: string) => void;
  onClearField: (field: FilterFieldKey) => void;
  onClearRange: (fields: [FilterFieldKey, FilterFieldKey]) => void;
}

export function ActivePlayersFilterChips({
  filters,
  className,
  onClearSearch,
  onRemovePosition,
  onClearField,
  onClearRange,
}: ActivePlayersFilterChipsProps) {
  const descriptors = getActivePlayerFilterDescriptors(filters);

  if (descriptors.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(9,20,38,0.82),rgba(7,16,31,0.78))] px-5 py-4 shadow-[0_16px_42px_rgba(0,0,0,0.24)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8EDFFF]">
            <Funnel className="h-3.5 w-3.5" />
            Active Lens
          </div>
          <p className="mt-3 text-sm font-medium text-gray-100">Filtros ativos aplicados ao universo atual de jogadores.</p>
          <p className="mt-1 text-xs text-gray-500">Remova chips individualmente para abrir o radar sem desmontar toda a combinacao.</p>
        </div>

        <div className="rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm text-gray-400">
          <span className="font-semibold text-[#00C2FF]">{descriptors.length}</span> criterios ativos
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {descriptors.map((descriptor) => (
          <button
            key={descriptor.key}
            type="button"
            onClick={() => {
              if (descriptor.kind === "search") {
                onClearSearch();
                return;
              }

              if (descriptor.kind === "position" && descriptor.position) {
                onRemovePosition(descriptor.position);
                return;
              }

              if (descriptor.kind === "field" && descriptor.field) {
                onClearField(descriptor.field);
                return;
              }

              if (descriptor.kind === "range" && descriptor.fields) {
                onClearRange(descriptor.fields);
              }
            }}
            className="group inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-3.5 py-2 text-xs font-medium text-gray-200 transition-all hover:border-[rgba(0,194,255,0.26)] hover:bg-[rgba(0,194,255,0.12)] hover:text-[#BEEFFF]"
          >
            <span className="max-w-[280px] truncate">{descriptor.label}</span>
            <span className="rounded-full bg-[rgba(255,255,255,0.06)] p-1 transition-colors group-hover:bg-[rgba(0,194,255,0.18)]">
              <X className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
