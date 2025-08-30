# Changelog

## [3.0.0] - 2025-08-30
Major update and brought some important changes.
### ** Breaking Changes **
- Removed old way of creating scores using MDocument, MMeasure, etc. Use DocumentBuilder instead.
- Removed DocumentOptions. Replaced using functions addScoreConfiguration() and setMeasuresPerRow() in DocumentBuilder.
- Tie and slur removed from NoteOptions. Use addConnective() in DocumentBuilder.

## Added
- Score configuration with multiple staves and tabs per row.
- Connective.Slide.
- Draw Connectives in tabs.

## Changed
- Lots of undocumented fixes, changes and improvements.

## [2.0.0] - 2025-07-28
Major update and brought many changes.
### ** Breaking Changes **
- Use subpath modules. There is no main export.
- Refactored musical terms that were wrong (e.g. pitch => diatonicId, noteId => chromaticId).
- Score module stayed mostly same. Some changes (e.g. enum StaffKind => StaffPreset) but nothing major.
- Classical guitar audio was put into separate module (audio-cg) because it bundles over 1MB of audio
  samples. Also improved default synthesizer audio.
- Numerous other unlisted changes/improvements/fixes.

## [1.1.0] - 2025-07-03
### Added
- Preliminary support for rendering guitar tabs.

### Fixed
- Ties/slurs were created multiple times.
- Beams in first measure (upbeat) were not created correctly.
- Quite much refactoring for better code.

## [1.0.0] - 2025-07-03
### Added
- First release.
