# Totem Theme SDK

Public typed contract for Totem presentation themes. Themes change **identity and presentation**, never capability.

## v0 contract

The SDK now defines `totem.theme/v0` with typed authoring, deterministic validation, and a small hot-switch runtime primitive.

A theme may define:

- visual tokens, assets, fonts, display scenes, safe-area behavior, and transitions;
- ambient/screensaver timing;
- semantic sound and LED presentation;
- persona name/instructions and wake-word presentation;
- TTS provider/model/voice references and presentation tuning.

A theme may **not** declare privileges. The validator recursively rejects privilege-bearing keys such as `permissions`, `capabilities`, `mcp`, `tools`, `network`, `filesystem`, `shell`, `secrets`, `root`, and `services`. Features requiring those capabilities must be implemented by extensions.

## Authoring

```ts
import { defineTheme, THEME_SCHEMA } from "@totem/theme-sdk";

export default defineTheme({
  schema: THEME_SCHEMA,
  id: "my-theme",
  name: "My Theme",
  version: "1.0.0",
  presentation: {
    tokens: {
      "color.background": "#101216",
      "motion.enabled": true,
    },
    scenes: {
      ambient: {
        safeAreaMode: "strict",
        transition: { enter: "fade", durationMs: 180 },
      },
    },
    ambient: { scene: "ambient", idleAfterMs: 30000 },
    led: {
      idle: { semantic: "idle", effect: "breathe", intensity: 0.3 },
    },
  },
  persona: {
    name: "Totem",
    instructions: ["Be concise and helpful."],
  },
  voice: {
    provider: "local",
    model: "default",
    voice: "neutral",
  },
});
```

`validateThemeManifest(value)` returns structured validation issues. `defineTheme(value)` throws `ThemeValidationError` for invalid manifests and preserves the author's inferred TypeScript type for valid manifests.

## Hot switching

`ThemeSwitcher` provides deterministic install-list/snapshot/activate/rollback semantics. Totem core may persist the selected id around this primitive; the SDK itself deliberately does not own storage, rendering, audio playback, or privileged services.

## Compatibility and private themes

Theme packages are ordinary presentation packages discovered through Totem's configured theme roots. Public Totem must not special-case proprietary themes. Private/local themes can use the exact same v0 manifest and runtime seam while keeping their assets private.

## Development

```bash
npm install
npm run check
```

CI runs the package on Windows and Ubuntu with Node 22.20 and Node 24.18.
