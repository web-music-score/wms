# WebMusicScore

This library allows you to view and play music scores (notation) in the browser.

Note: I'm not a professional musician. I began learning classical guitar on my own, 
later taking lessons in classical guitar. I've also studied music theory independently.

This project has been a slow and steady effort over several years. It's now ready for
public release — though please note that there may still be bugs or unexpected behavior.

## Installation

```sh
npm i @tspro/web-music-score

# React is required, it is peer dependency
npm i react
```

## Usage And API Documentation

### Usage

#### Import
```js
// Import core
import * as Score from "@tspro/web-music-score";

// Import react ui components
import * as ScoreUI from "@tspro/web-music-score/react-ui";

// Import demo pieces
import * as Pieces from "@tspro/web-music-score/pieces";

// you can also use require
const Score = require("@tspro/web-music-score");

// ...
```

#### Browser Script (experimantal)
Use in browser via unpkg CDN.
Browser version is core module, without /react-ui or /pieces subpaths.

```html
<script src="https://unpkg.com/@tspro/web-music-score@2"></script>

<script>
    const Score = window.WebMusicScore;
    // ...
</script>
```

### Create Document

```js
let doc = new Score.MDocument(Score.StaffKind.Treble, { measuresPerRow: 4 });
```

First argument is `StaffKind`:
* `Treble`: Staff with treble (G-) clef.
* `Bass`: Staff with bass (F-) clef.
* `Grand`: Both treble and bas staves.
* `GuitarTreble`: `Treble` but one octave lower.
* `GuitarTab`: Guitar tab only.
* `GuitarTrebleAndTab`: Treble and tab for guitar.

Second argument is optional `DocumentOptions`:
```ts
DocumentOptions = { measuresPerRow?: number, tuning?: string }
```

Default tuning is `"Standard"`. `TuningNameList` is array of available tuning names.

### Set Header

```js
doc.setHeader("Title", "Composer", "Arranger");
doc.setHeader("Title");
```

Any of `title`, `composer` and `arranger` can be omitted/set undefined.

### Add Measure

```js
let m = doc.addMeasure();
```

### End Row

```js
m.endRow();
```

Manually induce row change. Next measure will be added to new row.

### Set Signature

```js
m.setKeySignature("C", Theory.ScaleType.Major);
```

Firat argument is scale key note.

Second argument is `ScaleType`, which can be `Major`, `NaturalMinor`, `HarmonicMinor`, `Ionian`, `Dorian`, `Phrygian`, `Lydian`, `Mixolydian`, 
`Aeolian`, `Locrian`, `MajorPentatonic`, `MinorPentatonic`, `MajorHexatonicBlues`, `MinorHexatonicBlues` or `HeptatonicBlues`.

```js
m.setTimeSignature("4/4");
```

Time signature can be `"2/4"`, `"3/4"`, `"4/4"`, `"6/8"` or `"9/8"`.

```js
m.setTempo(80, Theory.NoteLength.Quarter, false);
m.setTempo(80);
```

First argument is beats per minute.

Second argument is beat length. Third argument tells if beat length is dotted. Second and third arguments can be omitted.

### Add Note Or Chord

```js
m.addNote(voiceId, note, noteLength, noteOptions?);
m.addChord(voiceId, notes, noteLength, noteOptions);
```

* `voiceId`: Voice track id `0`, `1`, `2` or `3`
* `note`: note `string | Note` (e.g. `"C3"`)
* `notes`: array of notes `(string | Note)[]` (e.g. `["C3", "E3"]`)
* `noteLength`: Note length (e.g. `NoteLength.Half`), see below
* `noteOptions`: Optional note otions, see below

Examples:
```js
m.addNote(0, "C3", Theory.NoteLength.Quarter);
m.addChord(1, ["C3", "E3", "G3", "C4"], Theory.NoteLength.Half, { dotted: true });
```

#### NoteLength

* `NoteLength.Whole`
* `NoteLength.Half`
* `NoteLength.Quarter`
* `NoteLength.Eighth`
* `NoteLength.Sixteenth`
* `NoteLength.ThirtySecond`
* `NoteLength.SixtyFourth`

#### NoteOptions

Optional object of note options (e.g. `{ stem: Stem.Up }`):

| Note option | Type                    |                    |
|-------------|-------------------------|--------------------|
| dotted      | `boolean`               | Create dotted note. |
| stem        | `Stem`                  | Set stem direction (`Stem.Auto`/`Up`/`Down`) |
| arpeggio    | `Arpeggio`              | Play column in arpeggio `Arpeggio.Up`/`Down` |
| staccato    | `boolean`               | Play column in staccato. |
| diamond     | `boolean`               | Diamond shaped note head. |
| tieSpan     | `number` \| `TieLength` | How many notes tied, or `TieLength.Short`/`ToMeasureEnd` |
| tiePos      | `ArcPos`                | Tie attach point: `Arc.Auto`/`Above`/`Middle`/`Below`/`StemTip` |
| slurSpan    | `number`                | How many notes slurred. |
| slurPos     | `ArcPos`                | Slur attach point: `Arc.Auto`/`Above`/`Middle`/`Below`/`StemTip` |
| triplet     | `boolean`               | Make this note part of triplet. |
| string      | `number` \| `number[]`  | What string does the note fret number belong to in guitar tab. Array of strings for chord. |

### Add Rest

```js    
m.addRest(voideId, restLength, restOptions?);
```

* `voiceId`: Voice track id `0`, `1`, `2` or `3`.
* `restLength`: Rest length using `NoteLength` (e.g. `NoteLength.Half`), see above.
* `restOptions`: Optional rest otions, see below.

Example:
```js
m.addRest(0, Theory.NoteLength.Quarter);
```

#### RestOptions

Optional object of rest options (e.g. `{ hide: true }`):
| Rest option | Type                   |                    |
|-------------|------------------------|--------------------|
| dotted      | `boolean`              | Create dotted rest |
| pitch       | `string` \| `Note`     | Positions rest at level of note (e.g. `"C3"`) |
| hide        | `boolean`              | Add invisible rest |
| triplet     | `boolean`              | Make this rest part of triplet |

### Add Fermata

```js
m.addNote(0, "C3", Theory.NoteLength.Quarter).addFermata(Score.Fermata.AtNote);
m.addRest(0, Theory.NoteLength.Quarter).addFermata();
```

Adds fermata anchored to previously added note or rest.

```js
m.addFermata(Score.Fermata.AtMeasureEnd);
```

Adds fermata at measure end.

### Add Navigation

```js
m.addNavigation(Score.Navigation.DC_al_Fine);
```

Adds navigational element to measure.

Available navigations are:

* `Navigation.DC_al_Fine`
* `Navigation.DC_al_Coda`
* `Navigation.DS_al_Fine`
* `Navigation.DS_al_Coda`
* `Navigation.Coda`
* `Navigation.toCoda`
* `Navigation.Segno`
* `Navigation.Fine`
* `Navigation.StartRepeat`
* `Navigation.EndRepeat`
* `Navigation.Ending`

`Navigation.EndRepeat` Takes optional second argument which is number of repeats. Defaults to 1 if omitted.

```js
m.addNavigation(Score.Navigation.EndRepeat, 2);
```

`Navigation.Ending` takes variable number of arguments, each is a passage number.

```js
m.addNavigation(Score.Navigation.Ending, 1, 2);
m.addNavigation(Score.Navigation.Ending, 3);
```

### Add Label

```js
m.addChord(0, ["D3", "F3", "A3"], Theory.NoteLength.Quarter).addLabel(Score.Label.Chord, "Dm");
```

Available Label types are:

* `Label.Note` is used to label notes and is positioned below note.
* `Label.Chord` is used to label chords and is positioned on top.

### Add Annotation

```js
m.addNote(0, "C3", Theory.NoteLength.Quarter).addAnnotation(Score.Annotation.Dynamics, "fff");
```

First argument is `Annotation`, second argument is the annotation text.

Available annotations are:

* `Annotation.Dynamics` could be for example `"fff"`, `"cresc."`, `"dim."`, etc.
* `Annotation.Tempo` could be for example `"accel."`, `"rit."`, `"a tempo"`, etc.

### Add Extension

```js
m.addNote(0, "C3", Theory.NoteLength.Quarter).
    addAnnotation(Score.Annotation.Tempo, "accel.").
    addExtension(Theory.NoteLength.Whole * 2, true);
```

Adds extension line to element, annotation in this case.

First argument is extension length, of type number. `NoteLength` values can be used as number, and `NoteLength` values can be multiplied to set desired extension length.

Second argument is `true`/`false` whether extension line is visible. This argument cvan be omitted, extension line is visible by default.

### Guitar Tab

Has preliminary support for rendering guitar tabs. 
Create document with `StaffKind.GuitarTab` or `StaffKind.GuitarTrebleAndTab`, and specify tuning (optional, defaults to Standard tuning):

```js
let doc = new Score.MDocument(Score.StaffKind.GuitarTrebleAndTab, { tuning: "Standard" });
```

Add notes with `string` option to specify which string the fret number is rendered in tab view.

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
Audio.setInstrument(Audio.Instrument.ClassicalGuitar);
```

Sets instrument. Instrument can be ClassicalGuitar or Synth.

```js
doc.play();
```

Plays the document.

```js
let player = new MPlayer(doc);

player.play();
player.pause();
player.stop();

MPlayer.stopAll();
```

More playback methods.

### Viewing Using React JSX/TSX

```js
// Draw document
<ScoreUI.MusicScoreView doc={doc} />

// Add playback buttons
<ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayStopSingle}/> // Single Play/Stopo button
<ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayStop}/> // Play and Stop buttons
<ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayPauseStop}/> // Play, Pause and Stop buttons
```

Bootstrap is used for better visual appearance but you must load it.

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
    if(e instanceof Score.MusicError) {
        console.log(e);
    }
}
```

## Compatibility

This library is bundled to ESM, CJS and UMD formats.

* CJS and UMD bundles are transpiled with Babel for ES5/IE11 compatibility.
* ESM bundle targets modern environments (ES6+).
* Uses ES6 features like Map, etc.
* No polyfills are included.

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
