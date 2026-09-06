import assert from "node:assert/strict";
import test from "node:test";
import {
  THEME_SCHEMA,
  ThemeSwitcher,
  defineTheme,
  validateThemeManifest,
} from "../dist/index.js";

const defaultTheme = defineTheme({
  schema: THEME_SCHEMA,
  id: "default",
  name: "Totem Default",
  version: "0.2.0",
  enabledByDefault: true,
  presentation: {
    tokens: { "color.background": "#101216", "motion.enabled": true },
    scenes: {
      ambient: {
        safeAreaMode: "strict",
        transition: { enter: "fade", durationMs: 180 },
      },
    },
    ambient: { scene: "ambient", idleAfterMs: 30000 },
    led: { idle: { semantic: "idle", effect: "breathe", intensity: 0.3 } },
  },
  persona: { name: "Totem", instructions: ["Be concise and helpful."] },
  voice: { provider: "local", model: "default", voice: "neutral", rate: 1 },
});

const minimalTheme = defineTheme({
  schema: THEME_SCHEMA,
  id: "minimal",
  name: "Minimal",
  version: "0.1.0",
  presentation: { tokens: { "motion.enabled": false } },
});

test("validates a full presentation-only theme", () => {
  const result = validateThemeManifest(defaultTheme);
  assert.equal(result.ok, true);
});

test("rejects privileged fields anywhere in a theme", () => {
  const result = validateThemeManifest({
    schema: THEME_SCHEMA,
    id: "bad-theme",
    name: "Bad",
    version: "1.0.0",
    presentation: { tokens: { ok: true }, permissions: ["network"] },
  });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "theme_privilege_forbidden"));
});

test("rejects malformed ids and versions", () => {
  const result = validateThemeManifest({
    schema: THEME_SCHEMA,
    id: "Portal Theme",
    name: "Portal",
    version: "latest",
  });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "invalid_id"));
  assert.ok(result.issues.some((issue) => issue.code === "invalid_version"));
});

test("hot switches and rolls back deterministically", () => {
  const runtime = new ThemeSwitcher([defaultTheme, minimalTheme], "default");
  assert.equal(runtime.snapshot().activeThemeId, "default");
  assert.equal(runtime.activate("minimal").activeThemeId, "minimal");
  assert.equal(runtime.snapshot().previousThemeId, "default");
  assert.equal(runtime.rollback().activeThemeId, "default");
});

test("fails closed for unknown theme activation", () => {
  const runtime = new ThemeSwitcher([defaultTheme], "default");
  assert.throws(() => runtime.activate("missing"), /not installed/);
});
