import { useState } from "react";
import { AlertCircle, CheckCircle, Settings, XCircle } from "lucide-react";
import { API_CONFIG, API_FEATURES, MIGRATION } from "../config/api-config";

export function ApiSettings() {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowPanel((current) => !current)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-[#7A5CFF] p-3 text-white shadow-lg transition-all duration-200 hover:bg-[#6A4CFF]"
        title="API Settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {showPanel && (
        <div className="fixed bottom-20 right-4 z-50 w-96 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1B35] p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">API Configuration</h3>
            <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-white">
              x
            </button>
          </div>

          <div className="mb-6 rounded-lg bg-[rgba(255,255,255,0.02)] p-4">
            <div className="mb-2 flex items-center gap-2">
              {API_CONFIG.ENABLED ? (
                <CheckCircle className="h-5 w-5 text-[#00FF9C]" />
              ) : (
                <XCircle className="h-5 w-5 text-[#FF4D4F]" />
              )}
              <span className="font-semibold">
                API Status: {API_CONFIG.ENABLED ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-gray-400">{API_CONFIG.BASE_URL}</p>
          </div>

          <div className="mb-6 space-y-3">
            <ConfigItem
              label="Auto Fetch"
              value={API_CONFIG.AUTO_FETCH}
              description="Automatically load data on mount"
            />
            <ConfigItem
              label="Debug Mode"
              value={API_CONFIG.DEBUG}
              description="Log API requests to console"
            />
            <ConfigItem
              label="Cache"
              value={API_CONFIG.CACHE.enabled}
              description="Cache API responses"
            />
          </div>

          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold uppercase text-gray-400">Feature Flags</h4>
            <div className="space-y-2">
              {Object.entries(API_FEATURES).map(([key, value]) => (
                <FeatureFlag key={key} name={key} enabled={value} />
              ))}
            </div>
          </div>

          {!API_CONFIG.ENABLED && (
            <div className="flex items-start gap-2 rounded-lg border border-[rgba(255,193,7,0.3)] bg-[rgba(255,193,7,0.1)] p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
              <div className="text-xs text-yellow-200">
                <p className="mb-1 font-semibold">API Disabled</p>
                <p className="text-yellow-300">
                  Platform is using mock data. Enable API in{" "}
                  <code className="rounded bg-black/20 px-1 py-0.5">/src/app/config/api-config.ts</code>
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-[rgba(255,255,255,0.1)] pt-4">
            <p className="text-xs text-gray-500">To enable API integration:</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-gray-400">
              <li>Configure CORS on backend</li>
              <li>Set API_CONFIG.ENABLED = true</li>
              <li>Enable feature flags as needed</li>
              <li>Set AUTO_FETCH = true (optional)</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}

function ConfigItem({
  label,
  value,
  description,
}: {
  label: string;
  value: boolean;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg bg-[rgba(255,255,255,0.02)] p-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="ml-3">
        {value ? (
          <span className="rounded bg-[#00FF9C]/10 px-2 py-1 text-xs text-[#00FF9C]">ON</span>
        ) : (
          <span className="rounded bg-[#FF4D4F]/10 px-2 py-1 text-xs text-[#FF4D4F]">OFF</span>
        )}
      </div>
    </div>
  );
}

function FeatureFlag({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded bg-[rgba(255,255,255,0.02)] p-2 text-xs">
      <span className="text-gray-300">{name.replace(/_/g, " ").toLowerCase()}</span>
      {enabled ? (
        <CheckCircle className="h-3 w-3 text-[#00FF9C]" />
      ) : (
        <XCircle className="h-3 w-3 text-gray-600" />
      )}
    </div>
  );
}

export function DataSourceBadge({ isApiData }: { isApiData: boolean }) {
  if (!MIGRATION.shouldShowDataSource()) return null;

  const label = MIGRATION.getDataSourceLabel(isApiData);
  const color = MIGRATION.getDataSourceColor(isApiData);

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}
