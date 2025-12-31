# Changelog
## [6.0.1] - 2025-12-31
### Fixed
- Set rest position in tuplets if rest does not have its own staffPos.

## [6.0.0] - 2025-12-18

**Stable release**

### Changed
- Changed `addLyrics()` argument order to match `addNote()`.

## Fixed
- Draw extension line correctly if stop object is not next row.
- Play tempo/dynamics correctly without extension line.
- DocumentBuidler function argument error string.

## [6.0.0-pre.5] - 2025-12-14
### Changed
- Renamed `completeRests()` to `fillWithRests()`.

### Added
- `DocumentBuilder.repeat()`.

## [6.0.0-pre.4] - 2025-12-08
### Added
- Add package.json to "exports" field in package.json, so that website can get the version it is built with.
- class Paint for score coloring.

## Changed
- Updated ts-utils-lib@2.3.0 with Utils.Dom.injectCss().

## [6.0.0-pre.3] - 2025-11-26
### Fixed
- Empty score did not render at all.

### Added
- Style system detection for "bootstrap", "infima" or "unknown".
- Button group style for infima "ifm-button-group".
- Custom styles "wms-button" and "wms-button-group".

## [6.0.0-pre.2] - 2025-11-26
### Changed
- Removed `.global` from IIFE bundle filename.

## [6.0.0-pre.1] - 2025-11-25
### Fixed
- SSR safety (for Docusaurus) by checking typeof `window` and `document` for `"undefined"`.

## [6.0.0-pre.0] - 2025-11-22
### **Breaking Changes**
- Switching to unscoped package name `web-music-score`.
- Removed all guitar and other stuff (GuitarApp, GuitarContext, circleOfFifths, etc.)
- Removed deprecated/obsolote stuff.

## [5.5.0] - 2025-11-19
### Added
- Coloring document.
- Instrument name starts with "!" (hide name) and "!{" (hide name and left brace).
- Pieces.createAll() to get array of all demo pieces.

### Fixes
- Extension line update: connect to right side element.
- Vertical staff/bar line update on row groups.
- Moved bundled deps to devDeps.

## [5.4.2] - 2025-11-05
## Fixed
- Weird tab rendering bug where sad face appear on canvas.

## [5.4.1] - 2025-11-04
### FIxed
- Lyrics hyphen / extender line y-coord was wrong after previous update.
- Position of vertical curly arepggio line.
- Reserve space for specified layout objects.

## [5.4.0] - 2025-11-03
### Added
- isVoiceId(), isStringNumber() and isVerseNumber().
- Note.isNote().

### Fixed
- Improved note displacement when notes are close to each other.
- If rest is the only symbol in voiceId then draw it in the middle of measure.

### Deprecated
- `Score.DivRect` - Using `AnchoredRect` and `Rect` from `@tspro/ts-utils-lib`.

## [5.3.0] - 2025-10-16
## Added
- MeasureOptions with showNumber property.
- New piece Canon in D by Pachelbel.
- Single value voiceIds in staff/tab config.
- Renamed and deprecated staff/tab config `voiceIds`, use `voiceId` instead.
- Instrument group to staff/tab config, show instrument name and group with left brace.
- Renamed and deprecated `MRenderer`, use `MRenderContext` instead.

## Fixed
- Improved auto stem direction.

## [5.2.0] - 2025-10-10
## Fixed
- Beam not created correctly near tuplet.
- Create beam only if all beam notes are visible.
- Not all beams in group were created.
- play() on empty music document crashed.

## Changed
- Renamed audio-cg iife global name to Audio_CG but also support old name Audio_ClassicalGuitar.

## [5.1.0] - 2025-10-08
## Added
- Audio functions: mute(), unmute() and isMuted().
- Added audio-synth as an own module.
- Added PlaybackButtons properties singlePlayStop, playStop and playPauseStop (deprecated buttonLayout).
- Added grandId property to staff config, deprecated isGrand property.
- Added tab signature (show tempo, measure number and time siganture).
- Draw rhythms above tab.

## Fixed
- Documentation errors.
- Correctly apply NoteOptions.string for each note when using addNote with arrya of notes.
- Incorrect detection upbeat beams.
- Increase beam separation by angle.
- Better tempo position above staff.
- Distance between staff and tab.

## [5.0.0] - 2025-10-05
Major update required to enable independent browser iife instrument modules.

### **Breiking Changes**
- Converted audio instrument modules (currently only audio-cg) independant of main lib.
- Instead of using registerClassicalGuitar() => use import { ClassicalGuitar } and Audio.addInstrument(ClassicalGuitar).
- Renamed Audio.registerInstrument() => Audio.addInstrument().
- Renamed Audio.setInstrument() => Audio.useInstrument().

## [4.2.1] - 2025-10-04
## Fixed
- Error was thrown with dotted rests.

## [4.2.0] - 2025-10-03
## Added
- Add support for lyrics/syllables with alignment and hyphen/extender.
- addNote accepts array of notes to add multiple notes at once.
- 3/8 time signature.

## [4.1.0] - 2025-10-01
## Added
- 4-4 (in adition to 2-2-2-2) beam grouping for 4/4 time signature.
- 12/8 time signature.
- 5/8 time signature and 2-3 and 3-2 beam groupings.
- 7/8 time signature and 2-2-3 and 3-2-2 beam groupings.

## [4.0.1] - 2025-09-28
## Fixed
- Invalid typedoc @params.
- AnotationType was not referenced for typedoc.
- Deprecated misspelled NoteLength.Whole12Dots.

## Changed
- Improved Frere Jacques demo piece.

## Added
- Typedoc comments for all public exports.

## [4.0.0] - 2025-09-24
Another major update was required by new features.

### **Breiking Changes**
- `RhythmProps` had major redesign.
- `DocumentBuilder.addExtension()` was changed.

### Added
- Generic tuples with `DocumentBuilder.addTuplet()`.
- Support multiple dot count.
- Added `NoteLengthProps` to support note lengths.
- Support for "1n", "2n", "4n", etc. string note lengths alongside `NoteLength` enum.
- Support for all other string arguments alongside typescript enums.

**Lots of other undocumented small changes, updates and fixes!**

## [3.2.0] - 2025-09-12
### Added
- Added getter functions to score interface (MDocument, MMeasure, etc.)

### Fixed
- Extension line tip direction.
- Cursor top was always 0 (top of document instead of top of row).
- Pick accidental.

### Changed
- Do not pick note groups, rests and rhythm columns (only visible with multiple staff/tab anyway).

## [3.1.1] - 2025-09-10
### Fixed
- Accept array of staff/tab/group for addFermataTo(), addNavigationTo(), addAnnotationTo() and addLabelTo().
- Better infinite recursion detection for staff groups.

## [3.1.0] - 2025-09-09
### Added
- Staff/TabConfig.name.
- DocumentBuilder.addStaffGroup().
- DocumentBuilder.addFermataTo(), .addNavigationTo(), .addAnnotationTo() and .addLabelTo().

## [3.0.1] - 2025-09-03
### Fixed
- Draw arpeggio curly arrow also to guitar tab.

## [3.0.0] - 2025-08-31
Major update and brought some important changes.
### **Breaking Changes**
- Removed old way of creating scores using MDocument, MMeasure, etc. Use DocumentBuilder instead.
- Removed DocumentOptions. Replaced using functions addScoreConfiguration() and setMeasuresPerRow() in DocumentBuilder.
- Tie and slur removed from NoteOptions. Use addConnective() in DocumentBuilder.

### Added
- Score configuration with multiple staves and tabs per row.
- Connective.Slide.
- Draw Connectives in tabs.

### Changed
- Lots of undocumented fixes, changes and improvements.

## [2.0.0] - 2025-07-28
Major update and brought many changes.
### **Breaking Changes**
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
