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

A theme must not gain filesystem, shell, service, root, external-service, or MCP privileges merely by being a theme. Those capabilities belong to extensions and the core permission model.

## Private themes

The SDK is intentionally designed to support private/local themes containing assets that should not be redistributed publicly. Public Totem must never require such a theme.

The first working theme contract will be implemented during Phase 3 of the main Totem roadmap.
