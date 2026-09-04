Fantasyac CC0 equipment icons — packed atlas runtime format

Source pack: 496 pixel art icons for medieval/fantasy RPG
Artist: Henrique Lazarini (7Soul1)
License: CC0 / Public Domain
Source archive: 496_RPG_icons.zip

Runtime optimization for Google AI Studio / GitHub import:
- 404 equipment mappings are packed into 13 PNG atlases instead of 404 files.
- Each atlas stores up to 32 icons in an 8x4 grid (256x256 per cell).
- Each runtime cell now displays the primary equipment icon only; the old
  decorative theme/material side-icons were removed because they read as
  unrelated extra equipment in inventory/detail views.
- UI rendering is handled by src/components/IllustrationImage.tsx with an
  explicit SVG cell clip for mobile Chromium/WebView compatibility.
- Legacy /assets/equipment/cc0/mapped/eq_XXXX.png save values are still
  recognized at runtime.
- New equipment mappings use equipment-atlas://eq_XXXX virtual URLs.
- No AI-generated image assets are used in this CC0 equipment-art set.
