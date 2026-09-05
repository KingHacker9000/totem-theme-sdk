# Totem Theme SDK

Public SDK and compatibility contract for Totem themes.

Themes change **identity and presentation**, not capability.

## Planned contents

- theme manifest schema
- visual token/palette contracts
- fonts/icons/assets conventions
- display scene and animation contracts
- ambient/screensaver hooks
- sound-effect and LED behavior definitions
- persona/system-prompt configuration schema
- wake-word presentation/configuration hooks
- TTS voice/model references
- theme preview/test tooling
- scaffolding/templates
- compatibility/version validation

## Security boundary

A theme must not gain filesystem, shell, service, root, external-service, MCP, agent-tool, network, or secrets privileges merely by being a theme. Those capabilities belong to extensions and the core permission model.

## Phase 1 stub contract

The full public theme SDK is **not frozen yet**. During Phase 1, the main `KingHacker9000/totem` repository owns a deliberately minimal discovery contract in `docs/DISCOVERY.md` using the pre-v1 schema id `totem.theme/v0`.

That stub exists only to prove local discovery/validation, enablement, diagnostics, fallback behavior, and presentation package loading. A Phase 1 theme manifest is explicitly forbidden from requesting capability/permission fields.

The Phase 1 stub is not the final theme manifest, compatibility promise, registry/install contract, hot-switch transaction model, or full presentation API. Implementations in this repository should not treat its incidental serialization details as permanent public API without an explicit later compatibility decision.

## Private themes

The SDK is intentionally designed to support private/local themes containing assets that should not be redistributed publicly. Public Totem must never require such a theme.

The full working theme SDK contract will be established in a later software phase after the Phase 1 runtime seams have been exercised.
