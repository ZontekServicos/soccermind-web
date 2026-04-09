import { useState, useEffect } from "react";
import { Play, Plus, X, Trash2, Film, Loader2, ExternalLink } from "lucide-react";
import {
  getPlayerVideos,
  addPlayerVideo,
  deletePlayerVideo,
  type PlayerVideo,
} from "../../../services/players";
import { SectionCard } from "./SectionCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VideoType = "HIGHLIGHT" | "MATCH" | "TRAINING" | "ANALYSIS";
type VideoSource = "YOUTUBE" | "VIMEO" | "WYSCOUT" | "UPLOAD";
type FilterType = "ALL" | VideoType;

interface VideoFormData {
  title: string;
  url: string;
  type: VideoType;
  source: VideoSource;
  season: string;
  description: string;
  thumbnail: string;
  tags: string;
}

const INITIAL_FORM: VideoFormData = {
  title: "",
  url: "",
  type: "HIGHLIGHT",
  source: "YOUTUBE",
  season: "",
  description: "",
  thumbnail: "",
  tags: "",
};

const TYPE_FILTERS: FilterType[] = ["ALL", "HIGHLIGHT", "MATCH", "TRAINING", "ANALYSIS"];

const TYPE_LABEL: Record<string, string> = {
  ALL: "Todos",
  HIGHLIGHT: "Highlight",
  MATCH: "Partida",
  TRAINING: "Treino",
  ANALYSIS: "Análise",
};

const TYPE_BADGE: Record<string, string> = {
  HIGHLIGHT: "border-[rgba(0,194,255,0.4)] bg-[rgba(0,194,255,0.15)] text-[#00C2FF]",
  MATCH: "border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.15)] text-[#d8b4fe]",
  TRAINING: "border-[rgba(0,255,156,0.4)] bg-[rgba(0,255,156,0.15)] text-[#00FF9C]",
  ANALYSIS: "border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.15)] text-[#fde68a]",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] ?? null;
}

function getEmbedUrl(video: PlayerVideo): string | null {
  if (video.source === "YOUTUBE") {
    const id = extractYoutubeId(video.url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
  }
  if (video.source === "VIMEO") {
    const id = extractVimeoId(video.url);
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
  }
  return null;
}

function getThumbnail(video: PlayerVideo): string | null {
  if (video.thumbnail) return video.thumbnail;
  if (video.source === "YOUTUBE") {
    const id = extractYoutubeId(video.url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  }
  return null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VideoCard({
  video,
  onPlay,
  onDelete,
  isDeleting,
}: {
  video: PlayerVideo;
  onPlay: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const thumbnail = getThumbnail(video);
  const badgeClass = TYPE_BADGE[video.type] ?? "border-gray-600 bg-gray-800 text-gray-300";

  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] transition-all duration-200 hover:border-[rgba(168,85,247,0.35)] hover:bg-[rgba(168,85,247,0.04)]">
      {/* Thumbnail */}
      <button
        type="button"
        onClick={onPlay}
        className="relative block w-full overflow-hidden"
        style={{ aspectRatio: "16/9" }}
        aria-label={`Reproduzir ${video.title}`}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(0,194,255,0.15),rgba(168,85,247,0.15))]">
            <Film className="h-10 w-10 text-[rgba(255,255,255,0.25)]" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.35)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,194,255,0.9)] shadow-[0_0_24px_rgba(0,194,255,0.5)]">
            <Play className="h-5 w-5 translate-x-0.5 text-[#07142A]" fill="currentColor" />
          </div>
        </div>
        {/* Duration badge */}
        {video.duration != null && (
          <span className="absolute bottom-2 right-2 rounded-md bg-[rgba(0,0,0,0.75)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {formatDuration(video.duration)}
          </span>
        )}
      </button>

      {/* Card body */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}>
            {TYPE_LABEL[video.type] ?? video.type}
          </span>
          {/* Delete button */}
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
            aria-label="Remover vídeo"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-400" />
            ) : (
              <Trash2 className="h-4 w-4 text-gray-500 transition-colors hover:text-red-400" />
            )}
          </button>
        </div>

        <p className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-white">{video.title}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[rgba(255,255,255,0.45)]">
          <span>{video.source}</span>
          {video.season && <span>• {video.season}</span>}
        </div>

        {video.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {video.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[10px] text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PlayerVideosSectionProps {
  playerId: string;
  analystName: string;
}

export function PlayerVideosSection({ playerId, analystName }: PlayerVideosSectionProps) {
  const [videos, setVideos] = useState<PlayerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [selectedVideo, setSelectedVideo] = useState<PlayerVideo | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<VideoFormData>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void loadVideos();
  }, [playerId]);

  async function loadVideos() {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlayerVideos(playerId);
      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Não foi possível carregar os vídeos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveVideo() {
    if (!formData.title.trim() || !formData.url.trim()) {
      setFormError("Título e URL são obrigatórios.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await addPlayerVideo(playerId, {
        title: formData.title.trim(),
        url: formData.url.trim(),
        type: formData.type,
        source: formData.source,
        season: formData.season.trim() || undefined,
        description: formData.description.trim() || undefined,
        thumbnail: formData.thumbnail.trim() || undefined,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        addedBy: analystName,
      });
      if (res.success && res.data) {
        setVideos((prev) => [res.data, ...prev]);
        setShowAddModal(false);
        setFormData(INITIAL_FORM);
      } else {
        setFormError(res.error ?? "Erro ao salvar vídeo.");
      }
    } catch {
      setFormError("Não foi possível salvar o vídeo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVideo(videoId: string) {
    setDeletingId(videoId);
    try {
      await deletePlayerVideo(playerId, videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch {
      // silently keep the video if delete fails
    } finally {
      setDeletingId(null);
    }
  }

  const filteredVideos =
    activeFilter === "ALL" ? videos : videos.filter((v) => v.type === activeFilter);

  const addButton = (
    <button
      type="button"
      onClick={() => {
        setFormData(INITIAL_FORM);
        setFormError(null);
        setShowAddModal(true);
      }}
      className="flex items-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#00C2FF,#a855f7)] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(0,194,255,0.25)] transition-opacity hover:opacity-90"
    >
      <Plus className="h-4 w-4" />
      Adicionar Vídeo
    </button>
  );

  return (
    <>
      <SectionCard
        eyebrow="Vídeos & Highlights"
        title="Biblioteca de Vídeos"
        description="Highlights, partidas e momentos de análise do jogador."
        accent="purple"
        aside={addButton}
      >
        {/* Filter pills */}
        {!loading && !error && (
          <div className="mb-5 flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                    isActive
                      ? "bg-[#00C2FF] text-[#07142A] shadow-[0_0_12px_rgba(0,194,255,0.35)]"
                      : "bg-[rgba(255,255,255,0.06)] text-gray-400 hover:bg-[rgba(255,255,255,0.10)] hover:text-white"
                  }`}
                >
                  {TYPE_LABEL[filter]}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[rgba(255,255,255,0.3)]" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-[16px] border border-[rgba(255,77,79,0.3)] bg-[rgba(255,77,79,0.08)] p-4 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => void loadVideos()}
              className="mt-3 rounded-lg bg-[rgba(255,255,255,0.08)] px-4 py-1.5 text-xs text-white hover:bg-[rgba(255,255,255,0.12)]"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(0,194,255,0.12),rgba(168,85,247,0.12))]">
              <Play className="h-7 w-7 text-[rgba(255,255,255,0.3)]" />
            </div>
            <p className="text-base font-semibold text-white">Nenhum vídeo adicionado ainda</p>
            <p className="mt-1 text-sm text-gray-500">
              Adicione highlights e momentos importantes do jogador
            </p>
            <button
              type="button"
              onClick={() => {
                setFormData(INITIAL_FORM);
                setFormError(null);
                setShowAddModal(true);
              }}
              className="mt-5 flex items-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#00C2FF,#a855f7)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,194,255,0.25)] transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Adicionar primeiro vídeo
            </button>
          </div>
        )}

        {/* No results for active filter */}
        {!loading && !error && videos.length > 0 && filteredVideos.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            Nenhum vídeo do tipo <strong className="text-gray-300">{TYPE_LABEL[activeFilter]}</strong> encontrado.
          </div>
        )}

        {/* Video grid */}
        {!loading && !error && filteredVideos.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onPlay={() => setSelectedVideo(video)}
                onDelete={() => void handleDeleteVideo(video.id)}
                isDeleting={deletingId === video.id}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* ------------------------------------------------------------------ */}
      {/* Playback modal                                                       */}
      {/* ------------------------------------------------------------------ */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.85)] p-4 backdrop-blur-sm"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.10)] bg-[#07142A] shadow-[0_32px_96px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.10)] text-white transition-colors hover:bg-[rgba(255,255,255,0.18)]"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Embed or external link */}
            {getEmbedUrl(selectedVideo) ? (
              <div style={{ aspectRatio: "16/9" }}>
                <iframe
                  src={getEmbedUrl(selectedVideo)!}
                  title={selectedVideo.title}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <Film className="h-12 w-12 text-[rgba(255,255,255,0.3)]" />
                <p className="text-sm text-gray-400">
                  Este vídeo não pode ser incorporado. Abra no link externo.
                </p>
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-[12px] bg-[rgba(255,255,255,0.08)] px-5 py-2.5 text-sm text-white hover:bg-[rgba(255,255,255,0.12)]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir vídeo
                </a>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-[rgba(255,255,255,0.06)] px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_BADGE[selectedVideo.type] ?? "border-gray-600 bg-gray-800 text-gray-300"}`}
                >
                  {TYPE_LABEL[selectedVideo.type] ?? selectedVideo.type}
                </span>
                <p className="text-sm font-semibold text-white">{selectedVideo.title}</p>
                {selectedVideo.season && (
                  <span className="ml-auto text-xs text-gray-500">{selectedVideo.season}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Add video modal                                                      */}
      {/* ------------------------------------------------------------------ */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.75)] p-4 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.10)] bg-[#07142A] shadow-[0_32px_96px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-6 py-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#d8b4fe]">Vídeos</p>
                <h3 className="text-lg font-semibold text-white">Adicionar Vídeo</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.14)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 px-6 py-5">
              {formError && (
                <div className="rounded-[12px] border border-[rgba(255,77,79,0.3)] bg-[rgba(255,77,79,0.08)] px-4 py-3 text-sm text-red-300">
                  {formError}
                </div>
              )}

              {/* Title */}
              <FormField label="Título *">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Gol contra Flamengo — 32'"
                  className={INPUT_CLASS}
                />
              </FormField>

              {/* URL */}
              <FormField label="URL *">
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={INPUT_CLASS}
                />
              </FormField>

              {/* Type + Source */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tipo">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as VideoType }))}
                    className={INPUT_CLASS}
                  >
                    <option value="HIGHLIGHT">Highlight</option>
                    <option value="MATCH">Partida</option>
                    <option value="TRAINING">Treino</option>
                    <option value="ANALYSIS">Análise</option>
                  </select>
                </FormField>
                <FormField label="Fonte">
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData((p) => ({ ...p, source: e.target.value as VideoSource }))}
                    className={INPUT_CLASS}
                  >
                    <option value="YOUTUBE">YouTube</option>
                    <option value="VIMEO">Vimeo</option>
                    <option value="WYSCOUT">Wyscout</option>
                    <option value="UPLOAD">Upload</option>
                  </select>
                </FormField>
              </div>

              {/* Season */}
              <FormField label="Temporada">
                <input
                  type="text"
                  value={formData.season}
                  onChange={(e) => setFormData((p) => ({ ...p, season: e.target.value }))}
                  placeholder="Ex: 2025/26"
                  className={INPUT_CLASS}
                />
              </FormField>

              {/* Description */}
              <FormField label="Descrição">
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Contexto ou observação sobre o vídeo..."
                  rows={2}
                  className={INPUT_CLASS + " resize-none"}
                />
              </FormField>

              {/* Thumbnail */}
              <FormField label="URL da Thumbnail">
                <input
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData((p) => ({ ...p, thumbnail: e.target.value }))}
                  placeholder="https://..."
                  className={INPUT_CLASS}
                />
              </FormField>

              {/* Tags */}
              <FormField label="Tags (separadas por vírgula)">
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="gol, dribles, pressão alta"
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 border-t border-[rgba(255,255,255,0.06)] px-6 py-5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-[14px] border border-[rgba(255,255,255,0.10)] bg-transparent py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSaveVideo()}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#00C2FF,#a855f7)] py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,194,255,0.25)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Salvando..." : "Salvar Vídeo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Micro-helpers
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  "w-full rounded-[12px] border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[rgba(0,194,255,0.4)] focus:bg-[rgba(0,194,255,0.05)]";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}
