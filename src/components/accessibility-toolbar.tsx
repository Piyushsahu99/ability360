import { Accessibility, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  applyDisplaySettings,
  defaultDisplaySettings,
  readDisplaySettings,
  writeDisplaySettings,
  type DisplaySettings,
} from "@/lib/accessibility";

const scales: DisplaySettings["textScale"][] = ["normal", "large", "xlarge"];
const scaleLabels: Record<DisplaySettings["textScale"], string> = {
  normal: "Normal",
  large: "Large",
  xlarge: "Extra large",
};

export function AccessibilityToolbar() {
  const [settings, setSettings] = useState<DisplaySettings>(defaultDisplaySettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readDisplaySettings();
    setSettings(stored);
    applyDisplaySettings(stored);
    setReady(true);
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<DisplaySettings>).detail;
      if (detail) setSettings(detail);
    };
    window.addEventListener("ability360:a11y-change", onChange);
    return () => window.removeEventListener("ability360:a11y-change", onChange);
  }, []);

  function update(patch: Partial<DisplaySettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeDisplaySettings(next);
  }

  function step(direction: 1 | -1) {
    const index = scales.indexOf(settings.textScale);
    const next = scales[Math.min(scales.length - 1, Math.max(0, index + direction))];
    update({ textScale: next });
  }

  if (!ready) return null;

  const toggles: { key: keyof DisplaySettings; label: string; hint: string }[] = [
    { key: "highContrast", label: "High contrast", hint: "Stronger colours and borders" },
    { key: "reduceMotion", label: "Reduce motion", hint: "Stops animation and transitions" },
    { key: "dyslexicFont", label: "Readable font", hint: "Wider letter and word spacing" },
    { key: "underlineLinks", label: "Underline links", hint: "Links never rely on colour alone" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          className="fixed bottom-4 right-4 z-50 size-12 rounded-full shadow-lg"
          aria-label="Accessibility settings"
        >
          <Accessibility className="size-6" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-80">
        <h2 className="text-sm font-semibold">Accessibility settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Saved on this device. Works whether or not you are signed in.
        </p>

        <div className="mt-4">
          <Label className="text-xs font-medium">Text size</Label>
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11"
              onClick={() => step(-1)}
              disabled={settings.textScale === "normal"}
              aria-label="Decrease text size"
            >
              <Minus className="size-4" aria-hidden="true" />
            </Button>
            <span className="flex-1 text-center text-sm" aria-live="polite">
              {scaleLabels[settings.textScale]}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11"
              onClick={() => step(1)}
              disabled={settings.textScale === "xlarge"}
              aria-label="Increase text size"
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          {toggles.map((toggle) => (
            <li key={toggle.key} className="flex items-start justify-between gap-3">
              <div>
                <Label htmlFor={`a11y-${toggle.key}`} className="text-sm">
                  {toggle.label}
                </Label>
                <p className="text-xs text-muted-foreground">{toggle.hint}</p>
              </div>
              <Switch
                id={`a11y-${toggle.key}`}
                checked={Boolean(settings[toggle.key])}
                onCheckedChange={(checked) => update({ [toggle.key]: checked } as Partial<DisplaySettings>)}
              />
            </li>
          ))}
        </ul>

        <Button
          type="button"
          variant="ghost"
          className="mt-4 min-h-11 w-full"
          onClick={() => update(defaultDisplaySettings)}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset to defaults
        </Button>
      </PopoverContent>
    </Popover>
  );
}
