# Changelog

## [3.2.0] - 2025-09-12
## Added
- Added getter functions to score interface (MDocument, MMeasure, etc.)

## Fixed
- Extension line tip direction.
- Cursor top was always 0 (top of document instead of top of row).
- Pick accidental.

## Changed
- Do not pick note groups, rests and rhythm columns (only visible with multiple staff/tab anyway).

## [3.1.1] - 2025-09-10
## Fixed
- Accept array of staff/tab/group for addFermataTo(), addNavigationTo(), addAnnotationTo() and addLabelTo().
- Better infinite recursion detection for staff groups.

## [3.1.0] - 2025-09-09
## Added
- Staff/TabConfig.name.
- DocumentBuilder.addStaffGroup().
- DocumentBuilder.addFermataTo(), .addNavigationTo(), .addAnnotationTo() and .addLabelTo().

## [3.0.1] - 2025-09-03
## Fixed
- Draw arpeggio curly arrow also to guitar tab.

## [3.0.0] - 2025-08-31
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
