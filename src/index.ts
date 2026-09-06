export const THEME_SCHEMA = "totem.theme/v0" as const;

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ThemeManifest {
  schema: typeof THEME_SCHEMA;
  id: string;
  name: string;
  version: string;
  compatibility?: {
    totem?: string;
  };
  enabledByDefault?: boolean;
  presentation?: {
    tokens?: Record<string, string | number | boolean>;
    assets?: Record<string, string>;
    fonts?: Record<string, string>;
    scenes?: Record<string, ThemeScene>;
    ambient?: ThemeAmbient;
    sounds?: Record<string, string>;
    led?: Record<string, ThemeLedBehavior>;
  };
  persona?: {
    name?: string;
    instructions?: string[];
    wakeWord?: {
      phrase?: string;
      acknowledgement?: string;
    };
  };
  voice?: {
    provider?: string;
    model?: string;
    voice?: string;
    rate?: number;
    pitch?: number;
  };
}

export interface ThemeScene {
  layout?: string;
  safeAreaMode?: "strict" | "relaxed";
  tokens?: Record<string, string | number | boolean>;
  assets?: Record<string, string>;
  transition?: {
    enter?: string;
    exit?: string;
    durationMs?: number;
  };
}

export interface ThemeAmbient {
  scene?: string;
  idleAfterMs?: number;
  screensaverAfterMs?: number;
}

export interface ThemeLedBehavior {
  semantic?: "idle" | "attention" | "success" | "error" | "listening" | "thinking";
  effect?: "solid" | "pulse" | "breathe" | "off";
  intensity?: number;
}

export interface ThemeValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type ThemeValidationResult =
  | { ok: true; value: ThemeManifest; issues: [] }
  | { ok: false; issues: ThemeValidationIssue[] };

const FORBIDDEN_PRIVILEGE_KEYS = new Set([
  "permissions",
  "capabilities",
  "mcp",
  "tools",
  "network",
  "filesystem",
  "shell",
  "secrets",
  "root",
  "services",
]);

const ID_RE = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pushIssue(
  issues: ThemeValidationIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

function scanForbidden(
  value: unknown,
  path: string,
  issues: ThemeValidationIssue[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbidden(item, `${path}[${index}]`, issues));
    return;
  }
  if (!isObject(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_PRIVILEGE_KEYS.has(key)) {
      pushIssue(
        issues,
        childPath,
        "theme_privilege_forbidden",
        `Themes cannot declare privileged '${key}' capability surfaces. Use an extension instead.`,
      );
    }
    scanForbidden(child, childPath, issues);
  }
}

function validateStringMap(
  value: unknown,
  path: string,
  issues: ThemeValidationIssue[],
): void {
  if (!isObject(value)) {
    pushIssue(issues, path, "invalid_object", "Expected an object.");
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "string") {
      pushIssue(issues, `${path}.${key}`, "invalid_string", "Expected a string value.");
    }
  }
}

export function validateThemeManifest(input: unknown): ThemeValidationResult {
  const issues: ThemeValidationIssue[] = [];
  if (!isObject(input)) {
    return {
      ok: false,
      issues: [{ path: "", code: "invalid_manifest", message: "Theme manifest must be a JSON object." }],
    };
  }

  scanForbidden(input, "", issues);

  if (input.schema !== THEME_SCHEMA) {
    pushIssue(issues, "schema", "unsupported_schema", `Expected schema '${THEME_SCHEMA}'.`);
  }
  if (typeof input.id !== "string" || !ID_RE.test(input.id)) {
    pushIssue(issues, "id", "invalid_id", "Theme id must use lowercase letters, digits, dots, underscores, or hyphens.");
  }
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    pushIssue(issues, "name", "invalid_name", "Theme name must be a non-empty string.");
  }
  if (typeof input.version !== "string" || !SEMVER_RE.test(input.version)) {
    pushIssue(issues, "version", "invalid_version", "Theme version must be SemVer.");
  }
  if (input.enabledByDefault !== undefined && typeof input.enabledByDefault !== "boolean") {
    pushIssue(issues, "enabledByDefault", "invalid_boolean", "enabledByDefault must be boolean.");
  }

  if (input.presentation !== undefined) {
    if (!isObject(input.presentation)) {
      pushIssue(issues, "presentation", "invalid_object", "presentation must be an object.");
    } else {
      if (input.presentation.assets !== undefined) validateStringMap(input.presentation.assets, "presentation.assets", issues);
      if (input.presentation.fonts !== undefined) validateStringMap(input.presentation.fonts, "presentation.fonts", issues);
      if (input.presentation.sounds !== undefined) validateStringMap(input.presentation.sounds, "presentation.sounds", issues);
    }
  }

  if (input.voice !== undefined) {
    if (!isObject(input.voice)) {
      pushIssue(issues, "voice", "invalid_object", "voice must be an object.");
    } else {
      for (const key of ["provider", "model", "voice"] as const) {
        const value = input.voice[key];
        if (value !== undefined && typeof value !== "string") {
          pushIssue(issues, `voice.${key}`, "invalid_string", `${key} must be a string.`);
        }
      }
      for (const key of ["rate", "pitch"] as const) {
        const value = input.voice[key];
        if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value))) {
          pushIssue(issues, `voice.${key}`, "invalid_number", `${key} must be a finite number.`);
        }
      }
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: input as unknown as ThemeManifest, issues: [] };
}

export function defineTheme<const T extends ThemeManifest>(manifest: T): T {
  const result = validateThemeManifest(manifest);
  if (!result.ok) {
    throw new ThemeValidationError(result.issues);
  }
  return manifest;
}

export class ThemeValidationError extends Error {
  readonly issues: ThemeValidationIssue[];

  constructor(issues: ThemeValidationIssue[]) {
    super(issues.map((issue) => `${issue.path || "manifest"}: ${issue.message}`).join("\n"));
    this.name = "ThemeValidationError";
    this.issues = issues;
  }
}

export interface ThemeRuntimeSnapshot {
  activeThemeId: string;
  previousThemeId?: string;
  manifest: ThemeManifest;
}

export class ThemeSwitcher {
  #themes = new Map<string, ThemeManifest>();
  #activeThemeId: string;
  #previousThemeId?: string;

  constructor(themes: readonly ThemeManifest[], fallbackThemeId: string) {
    for (const theme of themes) {
      const validated = defineTheme(theme);
      if (this.#themes.has(validated.id)) throw new Error(`Duplicate theme id '${validated.id}'.`);
      this.#themes.set(validated.id, validated);
    }
    if (!this.#themes.has(fallbackThemeId)) throw new Error(`Fallback theme '${fallbackThemeId}' is not installed.`);
    this.#activeThemeId = fallbackThemeId;
  }

  list(): ThemeManifest[] {
    return [...this.#themes.values()];
  }

  snapshot(): ThemeRuntimeSnapshot {
    const manifest = this.#themes.get(this.#activeThemeId);
    if (!manifest) throw new Error("Active theme disappeared from registry.");
    return {
      activeThemeId: this.#activeThemeId,
      ...(this.#previousThemeId ? { previousThemeId: this.#previousThemeId } : {}),
      manifest,
    };
  }

  activate(themeId: string): ThemeRuntimeSnapshot {
    if (!this.#themes.has(themeId)) throw new Error(`Theme '${themeId}' is not installed.`);
    if (themeId !== this.#activeThemeId) {
      this.#previousThemeId = this.#activeThemeId;
      this.#activeThemeId = themeId;
    }
    return this.snapshot();
  }

  rollback(): ThemeRuntimeSnapshot {
    if (!this.#previousThemeId) return this.snapshot();
    const target = this.#previousThemeId;
    this.#previousThemeId = this.#activeThemeId;
    this.#activeThemeId = target;
    return this.snapshot();
  }
}
