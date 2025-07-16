# WebMusicScore

This library allows you to view and play music scores (notation) in the browser.

Note: I'm not a professional musician. I began learning classical guitar on my own, 
later taking lessons in classical guitar. I've also studied music theory independently.

This project has been a slow and steady effort over several years. It's now ready for
public release — though please note that there may still be bugs or unexpected behavior.

## Installation

```sh
npm i @tspro/web-music-score

# React is required for react-ui module.
npm i react
```

## Usage

### Import

Version 2 brough subpath module exports. There is no main export.

```js
// Import core module. This does not contain much.
import * as Core from "@tspro/web-music-score/core";

// Import audio module.
import * as Audio from "@tspro/web-music-score/audio";

// Import module that contains all music theory stuff.
import * as Theory from "@tspro/web-music-score/theory";

// Import music score module.
import * as Score from "@tspro/web-music-score/score";

// Import module for react components.
import * as ScoreUI from "@tspro/web-music-score/react-ui";

// Import demo songs.
import * as Pieces from "@tspro/web-music-score/pieces";

// You can also use require
const Core = require("@tspro/web-music-score/core");

// etc.
```

### Browser Script

This is an experimental module that can be used via unpkg CDN. It declares global variable `WebMusicScore` that contains `Core`, `Audio`, `Theory`, `Score`, and `Pieces`. All modules except react-ui.

```html
<script src="https://unpkg.com/@tspro/web-music-score@2.0.0"></script>

<!-- It is recommended to use version number (e.g. @2 or even exact @2.0.0) -->

<script>
    const { Core, Audio, Theory, Score, Pieces } = window.WebMusicScore;
    // ...
</script>
```

## API

### Create Document

```js
let doc = new Score.MDocument(staffKind: Score.StaffKind, options: Score.DocumentOptions);
```
`staffKind` is  can be:
* `Score.StaffKind.Treble`: Staff with treble (G-) clef.
* `Score.StaffKind.Bass`: Staff with bass (F-) clef.
* `Score.StaffKind.Grand`: Both treble and bas staves.
* `Score.StaffKind.GuitarTreble`: `Treble` but one octave lower.
* `Score.StaffKind.GuitarTab`: Guitar tab only.
* `Score.StaffKind.GuitarTrebleAndTab`: Treble and tab for guitar.

Second argument is optional `DocumentOptions`:
```ts
DocumentOptions = { measuresPerRow?: number, tuning?: string }
```

Default tuning is `"Standard"`. `Theory.TuningNameList` is array of available tuning names.

```js
// Example
let doc = new Score.MDocument(Score.StaffKind.GuitarTrebleAndTab, { tuning: "Drop D" });
```

### Set Header

```js
doc.setHeader(title?: string, composer?: string, arranger?: string);

// Example
doc.setHeader("Demo Song");
```

### Add Measure

```js
let m = doc.addMeasure();
```

### End Row

```js
m.endRow();
```

Manually induce row change. Next measure that is added will start new row.

### Set Signature

```js
m.setKeySignature(keyNote: string, scaleType: Theory.ScaleType);

// Example: Am
m.setKeySignature("A", Theory.ScaleType.Aeolian);
```

`keyNote` is scale key note, e.g. "C" (in "C Major").

 `scaleType` can be
 - `Theory.ScaleType.Major`
 - `Theory.ScaleType.NaturalMinor`
 - `Theory.ScaleType.HarmonicMinor`
 - `Theory.ScaleType.Ionian`
 - `Theory.ScaleType.Dorian`
 - `Theory.ScaleType.Phrygian`
 - `Theory.ScaleType.Lydian`
 - `Theory.ScaleType.Mixolydian`
 - `Theory.ScaleType.Aeolian`
 - `Theory.ScaleType.Locrian`
 - `Theory.ScaleType.MajorPentatonic`
 - `Theory.ScaleType.MinorPentatonic`
 - `Theory.ScaleType.MajorHexatonicBlues`
 - `Theory.ScaleType.MinorHexatonicBlues`
 - `Theory.ScaleType.HeptatonicBlues`

```js
m.setTimeSignature(timeSignature: string);

// Example
m.setTimeSignature("3/4");
```

timeSignature can be:
- `"2/4"`
- `"3/4"`
- `"4/4"`
- `"6/8"`
- `"9/8"`

```js
m.setTempo(beatsPerMinute: number, beatLength?: Theory.NoteLength, dotted?: boolean);

// Example
m.setTempo(100, Theory.NoteLength.Quarter);
```

`beatsPerMinute` is self explanatory.

`beatLength` tells  the length of each beat, e.g. Theory.NoteLength.Quarter.

`dotted` tells if `beatLength` is dotted.

### Add Note Or Chord

```js
m.addNote(voiceId: number, note: string, noteLength: Theory.NoteLength, noteOptions?: Score.NoteOptions);
m.addChord(voiceId: number, notes: string[], noteLength: Theory.NoteLength, noteOptions?: Score.NoteOptions);

// Examples
m.addNote(0, "C4", Theory.NoteLength.Half, { dotted: true });
m.addChord(1, ["C3", "E3", "G3"], Theory.NoteLength.Whole, { arpeggio: Score.Arpeggio.Down });
```

`voiceId` can be `0`, `1`, `2` or `3`.

`note` is note name, e.g. `"G#3"`, `"Db3"`.

`notes`: array of notes `string[]` (e.g. `["C3", "E3"]`)

`noteLength` can be:
* `Theory.NoteLength.Whole`
* `Theory.NoteLength.Half`
* `Theory.NoteLength.Quarter`
* `Theory.NoteLength.Eighth`
* `Theory.NoteLength.Sixteenth`
* `Theory.NoteLength.ThirtySecond`
* `Theory.NoteLength.SixtyFourth`

`noteOptions` is optional object of note options (e.g. `{ dotted: true }`):

| Note option | Type                      |                     |
|-------------|---------------------------|---------------------|
| dotted      | `boolean`                 | Create dotted note. |
| stem        | `Score.Stem.Auto/Up/Down` | Set stem direction. |
| arpeggio    | `Score.Arpeggio.Up/Down` \| `boolean`  | Play column in arpeggio. |
| staccato    | `boolean`               | Play column in staccato. |
| diamond     | `boolean`               | Diamond shaped note head. |
| tieSpan     | `number` \| `TieLength.Short/ToMeasureEnd` | How many notes this tie spans. |
| tiePos      | `Score.ArcPos.Auto/Above/Middle/Below/StemTip` | Tie attach point. |
| slurSpan    | `number`                | How many notes this slur spans. |
| slurPos     | `Score.ArcPos.Auto/Above/Middle/Below/StemTip` | Slur attach point. |
| triplet     | `boolean`               | Set this note part of triplet. |
| string      | `number` \| `number[]`  | String number for guitar tab. Array of string numbers for chord. |

### Add Rest

```js    
m.addRest(voideId: number, restLength: Theory.NoteLength, restOptions?: Score.RestOptions);

// Example
m.addRest(0, Theory.NoteLength.Sixteenth);
```

 `voiceId` can be `0`, `1`, `2` or `3`.

`restLength` is length of rest, similar as noteLength above.

`restOptions` is optional object of rest options (e.g. `{ hide: true }`):

| Rest option | Type         |                     |
|-------------|--------------|---------------------|
| dotted      | `boolean`    | Create dotted rest. |
| pitch       | `string`     | Positions this rest at pitch level (e.g. `"C3"`). |
| hide        | `boolean`    | Add invisible rest. |
| triplet     | `boolean`    | Set this rest part of triplet. |

### Add Fermata

```js
m.addFermata(fermata?: Score.Fermata);

// Example
m.addFermata(Score.Fermata.AtMeasureEnd);
```

`fermata` is typeof `Score.Fermata` and can be:
- `Score.Fermata.AtNote`: Adds fermata anchored to previously added note, chord or rest.
- `Score.Fermata.AtMeasureEnd`: Adds fermata at the end of measure.

### Add Navigation

Add navigational element to measure.

```js
m.addNavigation(navigation: Score.Navigation, ...args?);

// Examples
m.addNavigation(Score.Navigation.StartRepeat);
m.addNavigation(Score.Navigation.EndRepeat, 3);
m.addNavigation(Score.Navigation.Ending, 1, 2);
```

`navigation` can be:
* `Score.Navigation.DC_al_Fine`
* `Score.Navigation.DC_al_Coda`
* `Score.Navigation.DS_al_Fine`
* `Score.Navigation.DS_al_Coda`
* `Score.Navigation.Coda`
* `Score.Navigation.toCoda`
* `Score.Navigation.Segno`
* `Score.Navigation.Fine`
* `Score.Navigation.StartRepeat`
* `Score.Navigation.EndRepeat`
* `Score.Navigation.Ending`

`Score.Navigation.EndRepeat` takes optional second arg which is number of times to repeat (once if omitted).

`Score.Navigation.Ending` takes variable number of number args, each is a passage number.

### Add Label

Add text label anchored to previously added note, chord or rest.

```js
m.addLabel(label: Score.Label, text: string);

// Example
m.addLabel(Score.Label.Chord, "Am);
```

`label` can be:
* `Score.Label.Note`: Used to label notes and is positioned below note.
* `Score.Label.Chord`: Used to label chords and is positioned on top.

### Add Annotation

Add annotation text anchored to previously added note, chord or rest.

```js
m.addAnnotation(annotation: Score.Annotation, text: string);

// Example
m.addAnnotation(Score.Annotation.Tempo, "accel.");
```

`annotation` can be:
* `Score.Annotation.Dynamics`: `text` could be for example `"fff"`, `"cresc."`, `"dim."`, etc.
* `Score.Annotation.Tempo`: `text` could be for example `"accel."`, `"rit."`, `"a tempo"`, etc.

### Add Extension

Adds extension line to element, for example to previously added annotation.

```js
m.addExtension(extensionLength: number, visible?: boolean);

// Example
m.addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Theory.NoteLength.Whole * 2, true);
```

`extensionLength` is `number` but `Theory.NoteLength` values can be used as number and multiplied to set desired extension length.

`visible` sets visibility of extension line, visible by default (if omitted).

### Guitar Tab

This library has preliminary guitar tabs rendering. 
Create document with `Score.StaffKind.GuitarTab` or `Score.StaffKind.GuitarTrebleAndTab`, and specify tuning (defaults to `"Standard"` if omitted).

```js
let doc = new Score.MDocument(Score.StaffKind.GuitarTrebleAndTab, { tuning: "Standard" });
```

Add notes with `{ string: number | number[] }` to specify which string the fret number is rendered in guitar tab.

```js
// Single note
m.addNote(0, "G3", Theory.NoteLength.Eighth, { string: 3 });

// Multi note
m.addChord(0, ["E4", "C3"], Theory.NoteLength.Eighth, { string: [1, 5] });
```

### Queueing

Adding stuff to measures can be queued like this:

```js
doc.addMeasure()
    .addNote(1, "C3", Theory.NoteLength.Quarter)
    .addChord(1, ["C3", "E3", "G3"], Theory.NoteLength.Quarter).addLabel(Score.Label.Chord, "C")
    .addRest(1, Theory.NoteLength.Quarter);
```

### Beams

Beams are detected and added automatically.

### Play Document

```js
Audio.setInstrument(instrument: Audio.Instrument);

// Simple play
doc.play();
```

`instrument` can be:
- `Audio.Instrument.ClassicalGuitar`
- `Audio.Instrument.Synth`

```js
// More playback options:
let player = new MPlayer(doc);

player.play();
player.pause();
player.stop();

MPlayer.stopAll();
```

### Viewing Using React JSX/TSX

```js
// Draw document
<ScoreUI.MusicScoreView doc={doc} />

// Add playback buttons
<ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayStopSingle}/> // Single Play/Stopo button
<ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayStop}/>       // Play and Stop buttons
<ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayPauseStop}/>  // Play, Pause and Stop buttons
```

Bootstrap is used for better visual appearance, but it needs to be installed and loaded.

### Viewing Using Plain JS/TS

```html
<!-- Add canvas -->
<canvas id="canvasId"></canvas>

<!-- Add play button -->
<button id="playButtonId"></button>
<!-- Add pause button -->
<button id="pauseButtonId"></button>
<!-- Add stop button -->
<button id="stopButtonId"></button>
<!-- Or add combined play/stop button -->
<button id="playStopButtonId"></button>
```

```js
// Draw document
let r = new Score.MRenderer().
    setCanvas("canvasId").
    setDocument(doc).
    draw();

// Add playback buttons
let p = new Score.MPlaybackButtons().
    setPlayButton("playButtonId").
    setPauseButton("pauseButtonId").
    setStopButton("stopButtonId").
    setDocument(doc);

// You can also set combined play/stop button.
p.setPlayStopButton("playStopButtonId")

// You can also pass HTMLButtonElement instead of element id.
p.setPlayButton(playButtonElement)
```

### Error Handling

```js
try {
    // Invalid note "C" without octave.
    m.addNote(0, "C", Theory.NoteLength.Quarter);        
}
catch(e) {
    // MusicError is raised on errors.
    if(e instanceof Core.MusicError) {
        console.error(e);
    }
}
```

## Compatibility
- This library is bundled to ESM, CJS and IIFE formats.
- Target is to suppor ES6/ES2015.
- No polyfills are included.

While designed for compatibility in mind, the library has not been explicitly tested against specific Node.js or browser versions.

## Report a Bug

Found a bug or unexpected behavior?

[Please open a new issue.](https://github.com/pahkasoft/issues/issues/new)

You can also suggest a feature or impovement.

Thanks for helping improve the project!

## License

This project is licensed under the [MIT License](https://mit-license.org/).

It also bundles the [Tone.js](https://github.com/Tonejs/Tone.js) library,
which is licensed under the [MIT License](https://opensource.org/license/mit).
