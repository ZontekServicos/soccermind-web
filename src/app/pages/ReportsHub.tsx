import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, Eye, FileText, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import { deleteScoutReport, getScoutReports, type StoredScoutReport } from "../../services/scoutReports";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function ReportsSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[24px] border border-white/8 bg-white/5 p-6 backdrop-blur-sm"
        >
          <Skeleton className="h-5 w-28 bg-white/10" />
          <Skeleton className="mt-4 h-8 w-2/3 bg-white/10" />
          <Skeleton className="mt-3 h-16 w-full bg-white/10" />
          <div className="mt-6 flex gap-3">
            <Skeleton className="h-10 flex-1 bg-white/10" />
            <Skeleton className="h-10 flex-1 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getRiskTone(value: string | undefined) {
  switch (value) {
    case "LOW":
      return "border-[rgba(0,255,156,0.24)] bg-[rgba(0,255,156,0.12)] text-[#B6FFD8]";
    case "HIGH":
      return "border-[rgba(255,77,79,0.28)] bg-[rgba(255,77,79,0.14)] text-[#FFB4B5]";
    default:
      return "border-[rgba(255,184,0,0.28)] bg-[rgba(255,184,0,0.12)] text-[#F8D98B]";
  }
}

function ReportCard({
  report,
  deleting,
  onDelete,
}: {
  report: StoredScoutReport;
  deleting: boolean;
  onDelete: (id: string) => void;
}) {
  const decisionSummary = report.content.decisionSummary;
  const riskTone = getRiskTone(decisionSummary?.riskLevel);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="group rounded-[24px] border border-white/8 bg-white/5 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl transition-colors hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">
            <FileText className="h-3.5 w-3.5" />
            {report.type}
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">{report.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            {report.description || "Relatorio salvo na central inteligente do SoccerMind."}
          </p>
        </div>
        <div className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Analista</p>
          <p className="mt-2 text-sm font-semibold text-white">{report.analyst}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-400">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <Calendar className="h-3.5 w-3.5 text-[#9BE7FF]" />
          {formatDate(report.createdAt)}
        </span>
        {decisionSummary ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,194,255,0.18)] bg-[rgba(0,194,255,0.08)] px-3 py-1.5 text-[#9BE7FF]">
            {decisionSummary.confidence}% confidence
          </span>
        ) : null}
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          {report.players.length} atleta{report.players.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-5 rounded-[18px] border border-[rgba(0,194,255,0.16)] bg-[rgba(0,194,255,0.08)] p-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#9BE7FF]">Decision Summary</p>
        <p className="mt-3 text-sm font-semibold leading-[1.8] text-white">
          {decisionSummary?.decision || "Resumo decisorio ainda nao disponivel para este ScoutReport."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {decisionSummary ? (
            <>
              <div className="min-w-[148px] flex-1">
                <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-gray-400">
                  <span>Confidence</span>
                  <span>{decisionSummary.confidence}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#00C2FF] transition-all duration-500"
                    style={{ width: `${decisionSummary.confidence}%` }}
                  />
                </div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${riskTone}`}>
                <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
                {decisionSummary.riskLevel}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400">Confianca e risco nao informados.</span>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          asChild
          className="h-11 rounded-[14px] bg-[#00C2FF]/90 px-5 font-semibold text-[#07142A] transition-transform hover:scale-[1.01] hover:bg-[#00C2FF]"
        >
          <Link to={`/reports/${report.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver relatorio
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => onDelete(report.id)}
          disabled={deleting}
          className="h-11 rounded-[14px] border-[rgba(255,77,79,0.28)] bg-[rgba(255,77,79,0.08)] px-5 text-[#FFB4B5] transition-colors hover:bg-[rgba(255,77,79,0.14)]"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleting ? "Excluindo..." : "Excluir"}
        </Button>
      </div>
    </motion.article>
  );
}

export default function ReportsHub() {
  const [reports, setReports] = useState<StoredScoutReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);

      try {
        const response = await getScoutReports();
        if (!active) {
          return;
        }

        setReports(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setReports([]);
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os relatórios.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      await deleteScoutReport(id);
      setReports((current) => current.filter((report) => report.id !== id));
      toast.success("Relatorio removido da central.");
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir o relatorio.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#07142A]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[1560px] space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(11,27,53,0.98),rgba(7,20,42,0.94))] px-7 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
              <div className="absolute -right-16 top-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.18),transparent_68%)] blur-2xl" />
              <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.14),transparent_70%)] blur-2xl" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-4xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#9BE7FF]">
                    <FileText className="h-3.5 w-3.5" />
                    ScoutReport Hub
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold text-white">Central inteligente de relatórios</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
                    Tudo o que foi salvo pelo time agora orbita em torno de ScoutReport: decisão, contexto, explainability e histórico executivo.
                  </p>
                </div>

                <Button
                  asChild
                  className="h-12 rounded-[16px] bg-[#00C2FF]/90 px-5 font-semibold text-[#07142A] shadow-[0_10px_28px_rgba(0,194,255,0.24)] transition-transform hover:scale-[1.01] hover:bg-[#00C2FF]"
                >
                  <Link to="/reports">
                    <Plus className="mr-2 h-4 w-4" />
                    Gerar novo relatorio
                  </Link>
                </Button>
              </div>
            </section>

            {error ? (
              <div className="rounded-[18px] border border-[rgba(255,77,79,0.22)] bg-[rgba(255,77,79,0.08)] px-5 py-4 text-sm text-[#FFB4B5]">
                {error}
              </div>
            ) : null}

            {loading ? <ReportsSkeleton /> : null}

            {!loading && reports.length === 0 ? (
              <div className="rounded-[24px] border border-white/8 bg-white/5 px-8 py-16 text-center text-sm text-gray-400 backdrop-blur-sm">
                Nenhum ScoutReport salvo ainda. Gere um novo parecer executivo para popular a central.
              </div>
            ) : null}

            {!loading && reports.length > 0 ? (
              <AnimatePresence>
                <div className="grid gap-5 xl:grid-cols-2">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      deleting={deletingId === report.id}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </AnimatePresence>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
