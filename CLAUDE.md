# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**panl-site** is a single-page static HTML landing page for Panl, a modular baby sleep enclosure product. The entire site lives in one file: `panl-landing-page.html`.

No build system, no package manager, no framework — open the file in a browser to preview.

## Architecture

The file is organized into three sections:

1. **`<style>` block** — All CSS (~1100 lines), including design tokens, component styles, and responsive utilities
2. **`<body>`** — 13 page sections in document order (nav → hero → stats → problem → voices → solution → alternatives → how-it-works → safety → use-cases → independence-band → final-cta → footer)
3. **`<script>` block** — Three functions: `handleSubmit()` (form handler), `focusEmail()` (scroll-to-form), and an Intersection Observer for `.fade-up` scroll animations

## Design Tokens

All design decisions flow from CSS custom properties at the top of the `<style>` block:

- **Colors**: `--stone-*` (50–900), `--green-soft/mid/dark`, `--ink-*`
- **Typography**: `--font-serif` = Cormorant Garamond (headlines), `--font-sans` = DM Sans (body)
- **Spacing**: Responsive values using `clamp()`

## Key Conventions

- Images are base64-encoded data URIs embedded inline — no external image files
- All responsive scaling uses `clamp()` and `vw` units rather than media query breakpoints
- Section-scoped BEM-like class naming: `.hero-*`, `.stats-*`, `.problem-*`, `.voice-*`, `.alt-*`, `.how-*`, `.safety-*`, `.use-case-*`, `.cta-*`
- Scroll animations: add `.fade-up` class to elements; the Intersection Observer adds `.visible` to trigger the CSS transition
