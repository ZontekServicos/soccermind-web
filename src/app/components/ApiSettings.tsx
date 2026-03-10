/**
 * Soccer Mind API Settings Panel
 * Developer tool for managing API integration
 */

import { useState } from "react";
import { API_CONFIG, API_FEATURES, isApiEnabled, MIGRATION } from "../config/api-config";
import { Button } from "./ui/button";
import { Settings, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export function ApiSettings() {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      {/* Toggle Button - Fixed position */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 right-4 z-50 bg-[#7A5CFF] hover:bg-[#6A4CFF] text-white p-3 rounded-full shadow-lg transition-all duration-200"
        title="API Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Settings Panel */}
      {showPanel && (
        <div className="fixed bottom-20 right-4 z-50 w-96 bg-[#0A1B35] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">API Configuration</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* API Status */}
          <div className="mb-6 p-4 bg-[rgba(255,255,255,0.02)] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {API_CONFIG.ENABLED ? (
                <CheckCircle className="w-5 h-5 text-[#00FF9C]" />
              ) : (
                <XCircle className="w-5 h-5 text-[#FF4D4F]" />
              )}
              <span className="font-semibold">
                API Status: {API_CONFIG.ENABLED ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {API_CONFIG.BASE_URL}
            </p>
          </div>

          {/* Configuration */}
          <div className="space-y-3 mb-6">
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

          {/* Feature Flags */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 text-gray-400 uppercase">
              Feature Flags
            </h4>
            <div className="space-y-2">
              {Object.entries(API_FEATURES).map(([key, value]) => (
                <FeatureFlag
                  key={key}
                  name={key}
                  enabled={value}
                />
              ))}
            </div>
          </div>

          {/* Warning */}
          {!API_CONFIG.ENABLED && (
            <div className="flex items-start gap-2 p-3 bg-[rgba(255,193,7,0.1)] border border-[rgba(255,193,7,0.3)] rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-200">
                <p className="font-semibold mb-1">API Disabled</p>
                <p className="text-yellow-300">
                  Platform is using mock data. Enable API in{" "}
                  <code className="px-1 py-0.5 bg-black/20 rounded">
                    /src/app/config/api-config.ts
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
            <p className="text-xs text-gray-500">
              To enable API integration:
            </p>
            <ol className="mt-2 text-xs text-gray-400 space-y-1 list-decimal list-inside">
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
    <div className="flex items-start justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="ml-3">
        {value ? (
          <span className="text-xs px-2 py-1 bg-[#00FF9C]/10 text-[#00FF9C] rounded">
            ON
          </span>
        ) : (
          <span className="text-xs px-2 py-1 bg-[#FF4D4F]/10 text-[#FF4D4F] rounded">
            OFF
          </span>
        )}
      </div>
    </div>
  );
}

function FeatureFlag({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-[rgba(255,255,255,0.02)] rounded text-xs">
      <span className="text-gray-300">
        {name.replace(/_/g, " ").toLowerCase()}
      </span>
      {enabled ? (
        <CheckCircle className="w-3 h-3 text-[#00FF9C]" />
      ) : (
        <XCircle className="w-3 h-3 text-gray-600" />
      )}
    </div>
  );
}

/**
 * Data Source Indicator Badge
 * Shows whether data is from API or Mock
 */
export function DataSourceBadge({ isApiData }: { isApiData: boolean }) {
  if (!MIGRATION.shouldShowDataSource()) return null;

  const label = MIGRATION.getDataSourceLabel(isApiData);
  const color = MIGRATION.getDataSourceColor(isApiData);

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}
