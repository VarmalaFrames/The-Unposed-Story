import React, { useState } from 'react';
import { ThemeColors, SiteSettings } from '../../types';
import { DEFAULT_THEME } from '../../data/initialData';
import { StorageService } from '../../services/storage';
import { RefreshCw, Check } from 'lucide-react';

interface ThemeManagerProps {
  settings: SiteSettings;
  onSettingsUpdated: (settings: SiteSettings) => void;
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({ settings, onSettingsUpdated }) => {
  const [theme, setTheme] = useState<ThemeColors>(settings.theme || DEFAULT_THEME);
  const [savedMessage, setSavedMessage] = useState(false);

  const applyColorsToCss = (colors: ThemeColors) => {
    const root = document.documentElement.style;
    root.setProperty('--c-bg', colors.bg);
    root.setProperty('--c-surface', colors.surface);
    root.setProperty('--c-ink', colors.ink);
    root.setProperty('--c-muted', colors.muted);
    root.setProperty('--c-line', colors.line);
    root.setProperty('--c-accent', colors.accent);
    root.setProperty('--c-accent-soft', colors.accentSoft);
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const next = { ...theme, [key]: value };
    setTheme(next);
    applyColorsToCss(next);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings = { ...settings, theme };
    StorageService.saveSettings(newSettings);
    onSettingsUpdated(newSettings);
    applyColorsToCss(theme);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleReset = () => {
    if (!window.confirm('Reset all colors back to the default Clean Minimalism theme?')) return;
    setTheme(DEFAULT_THEME);
    applyColorsToCss(DEFAULT_THEME);
    const newSettings = { ...settings, theme: DEFAULT_THEME };
    StorageService.saveSettings(newSettings);
    onSettingsUpdated(newSettings);
  };

  const colorFields: { key: keyof ThemeColors; label: string; desc: string }[] = [
    { key: 'bg', label: 'Page Background', desc: 'Main canvas background' },
    { key: 'surface', label: 'Surface Tint', desc: 'Card containers and section backings' },
    { key: 'ink', label: 'Main Text & Headings', desc: 'Primary typography color' },
    { key: 'muted', label: 'Secondary / Body Text', desc: 'Subdued captions and descriptions' },
    { key: 'line', label: 'Dividers & Borders', desc: 'Subtle separators and outlines' },
    { key: 'accent', label: 'Primary Accent Color', desc: 'Main button and focal point color' },
    { key: 'accentSoft', label: 'Secondary Accent Color', desc: 'Subtle highlight tone (Emerald Green)' },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Appearance &amp; Brand Colors
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-normal">
          Customize the aesthetic palette across your website with live real-time preview.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-2xs">
          {colorFields.map((field) => (
            <div key={field.key} className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900">{field.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-normal">{field.desc}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono uppercase text-gray-500 font-semibold">
                  {theme[field.key]}
                </span>
                <input
                  type="color"
                  value={theme[field.key]}
                  onChange={(e) => handleColorChange(field.key, e.target.value)}
                  className="w-10 h-9 p-0.5 rounded-lg cursor-pointer border border-gray-200 bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Live Palette Visualizer */}
        <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">
            Live Aesthetic Palette Sample
          </p>

          <div
            className="p-6 rounded-xl border shadow-2xs space-y-3"
            style={{ backgroundColor: theme.bg, borderColor: theme.line }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: theme.accentSoft }}
              />
              <span
                className="text-[10px] uppercase tracking-widest font-bold"
                style={{ color: theme.muted }}
              >
                The Unposed Story
              </span>
            </div>

            <h3
              className="text-2xl font-bold tracking-tight"
              style={{ color: theme.ink }}
            >
              Documenting Authentic Wedding Stories
            </h3>

            <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>
              Every celebration is captured with raw emotion, candid timing, and clean minimalism.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span
                className="px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold text-white shadow-2xs"
                style={{ backgroundColor: theme.accent }}
              >
                Explore Collection
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold"
                style={{
                  color: theme.ink,
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.line}`,
                }}
              >
                ★ Featured Story
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-full bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {savedMessage ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Colors Saved</span>
              </>
            ) : (
              <span>Save Theme Changes</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-3 rounded-full border border-gray-200 text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-black flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </form>
    </div>
  );
};
