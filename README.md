# WebMusicScore

The API Reference, Examples and Demos can be found [here](https://pahkasoft.github.io). The API Reference is not commented but is mostly self explanatory and gives idea of the full API.

## About

This library allows you to view and play music scores (notation) in the browser.

I'm not a professional musician. I began learning classical guitar on my own, 
later taking lessons in classical guitar. I've also studied music theory independently.

This is a work in progress project. Expect changes, bugs, or unexpected behavior.

## Version 2 Update

**Breaking:** Version 2 is major update and brought many changes.

* Introduced subpath modules instead of one big main module. There is no main export.
* Theory module had big refactor that affected whole library. Renamed all musical terms that
  were wrong (e.g. pitch => diatonicId, noteId => chromaticId).
* Score module stayed mostly same. Some changes (e.g. enum StaffKind => StaffPreset) but nothing major.
* Classical guitar audio was put into separate module (audio-cg) because it bundles over 1MB of audio
  samples. Also improved default synthesizer audio.
* Numerous small changes/improvements.

Enough changes until next major update!

## Version 3 Update

**Breaking:** Version 3 is another major update and brought some important changes.

* Support score configuration with multiple notation lines (combination of staves and tabs).
* Introduced DocumentBuilder to create scores, removed old way.
* DocumentOptions functionality is replaced using functions addScoreConfiguration() and setMeasuresPerRow() in DocumentBuilder.
* Add ties, slurs and slides using addConnective() in DocumentBuilder. Tie and span options removed from NoteOptions.

## Version 4 Update

**Breiking:** Changes were required by new features. No breaking in document building interface.

* Support for generic tuples with DocumentBuilder.addTuplet().
* Support for multiple dot count.
* String note length (e.g. use "2n" instead of Theory.NoteLength.Half).

## Installation

```sh
npm i @tspro/web-music-score
```

## Import

```js
// Import core module, it does not contain much.
import * as Core from "@tspro/web-music-score/core";

// Import audio module, it can play notes.
import * as Audio from "@tspro/web-music-score/audio";

// Import theory module, it contains all music theory stuff.
import * as Theory from "@tspro/web-music-score/theory";

// Import score module, it contains music score stuff.
import * as Score from "@tspro/web-music-score/score";

// Import react-ui module, it contains all react components.
// React is peer dependency "^18.0.0 || ^19.0.0".
import * as ScoreUI from "@tspro/web-music-score/react-ui";

// Import pieces module, it contains demo songs.
import * as Pieces from "@tspro/web-music-score/pieces";

// You can also use require
const Score = require("@tspro/web-music-score/score");
```

## Browser Script

This is an experimental module that can be used in html page via unpkg CDN.
It declares global variable `WebMusicScore` that contains `Core`, `Audio`, `Theory`, `Score`, 
and `Pieces` as corresponding subpath modules (excluding `react-ui` and `audio-cg`).

```html
<script src="https://unpkg.com/@tspro/web-music-score@3"></script>
<script src="https://unpkg.com/@tspro/web-music-score@4.0.0"></script>
<script src="https://unpkg.com/@tspro/web-music-score@4.0.0/dist/iife/index.global.js"></script>

<!--
    Use one of above. It is recommended to use version number (e.g. @4.0.0 or at least @4).
    This way if somethiong breaks between versions then your web site does not stop working.
-->

<script>
    const { Core, Audio, Theory, Score, Pieces } = window.WebMusicScore;
    // ...
</script>
```

## API

Following is introduction to the main interface by simple examples.

### Create DocumentBuilder

Documents are created using `DocumentBuilder`.

```js
let doc = new Score.DocumentBuilder()
    .addScoreConfiguration({ type: "staff", clef: "G", isOctavewDown: true })
    .setMeasuresPerRow(4)
    .addMeasure()
    .addNote(1, "C3", "4n")
    .addChord(1, ["C3", "E3", "G3"], "4n").addLabel(Score.Label.Chord, "C")
    .addRest(1, "4n")
    // etc.
    .getDEocument();
```

### Set Score Configuration
Setting score configuration takes place in first measure of next row.

#### Using preset values
```js
builder.setScoreConfiguration(Score.StaffPreset.Treble);         // Staff with treble G-clef.
builder.setScoreConfiguration(Score.StaffPreset.Bass);           // Staff with bass F-clef.
builder.setScoreConfiguration(Score.StaffPreset.Grand);          // Both treble and bas staves.
builder.setScoreConfiguration(Score.StaffPreset.GuitarTreble);   // Same as `Treble` but one octave down.
builder.setScoreConfiguration(Score.StaffPreset.GuitarTab);      // Guitar tab only.
builder.setScoreConfiguration(Score.StaffPreset.GuitarCombined); // Treble and tab for guitar.
```

#### Using configuration objects
```js
builder.setScoreConfiguration({ type: "staff", clef: "G"}); // Staff with treble G-clef.
builder.setScoreConfiguration({ type: "staff", clef: "F"}); // Staff with bass F-clef.
builder.setScoreConfiguration({
    type: "staff",
    clef: "G",           // G-clef
    isOctaveDown: false, // (optional) octave down
    name: "staff1",      // (optional) staff name
    minNote: "C2",       // (optional) min allowed note
    maxNote: "C6",       // (optional) max allowed note
    voiceIds: [0, 1]     // (optional) only present voices 0 and 1 in this staff
});
builder.setScoreConfiguration([
    { type: "staff", clef: "G", isGrand: true },
    { type: "staff", clef: "F", isGrand: true }
]); // Grand staff
builder.setScoreConfiguration([
    { type: "staff", clef: "G", isOctaveDown: true },
    { type: "tab", tuning: "Drop D" }
]); // Staff and tab for guitar, tab with Drop D tuning.
builder.setScoreConfiguration(
{
    type: "tab",
    name: "tab1",
    tuning: ["E2", "A2", "D3", "G3", "B3", "E4"],
    voiceIds: 4
});
```

### Set Automatic Measures Per Row
```ts
builder.setMesuresPerRow(4);        // Set 4 measures per row
builder.setMesuresPerRow(Infinity); // Turn off auto row change (default)
```

### Set Header
```js
builder.setHeader("Title", "Composer", "Arranger");
builder.setHeader("Demo Song");
```

### Add Measure
```js
builder.addMeasure();
```

### End Row
Manually induce row change. Next measure that is added will begin new row.

```js
builder.endRow();
```

### Set Key Signature

```js
builder.setKeySignature("A", Theory.ScaleType.NaturalMinor); // Create A minor scale. See API reference for all ScaleTypes.
```

### Set Time Signature
```js
builder.setTimeSignature("2/4");
builder.setTimeSignature("3/4");
builder.setTimeSignature("4/4");
builder.setTimeSignature("6/8");
builder.setTimeSignature("9/8");
```

### Set Tempo
```js
builder.setTempo(100, "4n"); // 100 beats per minute, beat length is quarter note.
builder.setTempo(80, "4n", 2); // 100 beats per minute, beat length is double dotted quarter note.
builder.setTempo(80, "4.."); // 100 beats per minute, beat length is double dotted quarter note.
```

### Add Note
```js
builder.addNote(0, "C4", "1n");                    // Create whole note "C4"
builder.addNote(0, "G#3", "8n", { dotted: true }); // Create dotted eighth note "G#3"
builder.addNote(0, "Bb4", "2..");                  // Create double dotted half note "Bb4"
builder.addNote(0, "C4", "4n", { stem: Score.Stem.Up }); // Stem direction Up (could be also Down)
builder.addNote(0, "C4", "4n", { staccate: true }); // Show staccato dot and play in short
builder.addNote(0, "C4", "4n", { diamond: true }); // Show diamond shaped note head
```

### Add Chord
```js
builder.addChord(1, ["C3", "E3", "G3"], "1n", { arpeggio: Score.Arpeggio.Down }); // Create whole note chord of three notes, played in arpeggio.
```

### Add Rest

```js    
builder.addRest(0, "16n");               // Add sixteenth rest
builder.addRest(0, "4n", { dotted: 3 }); // Add triple dotted quarter rest
builder.addRest(0, "4.");                // Add dotted quarter rest
builder.addRest(0, "4n", { staffPos: "D3" }); // Draw this quarter rest at level of "D3" note.
builder.addRest(0, "4n", { hide: true }); // Invisible rest affects playing
```

### Add Tuplet
This works for any tuplet:
```js
// Example: add triplet
builder.addTuplet(0, { parts: 3, inTimeOf: 2 }, notes => {
    notes.addNote("G3", "8n");
    notes.addNote("B3", "8n");
    notes.addNote("D4", "8n");
});
```

Triplets can also be created using `triplet` property or string note length:
```js
// Example: add triplet using triplet property.
builder.addNote(0, "G3", "8n", { triplet: true });
builder.addNote(0, "B3", "8n", { triplet: true });
builder.addNote(0, "D4", "8n", { triplet: true });

// Example: add triplet using string note length.
builder.addNote(0, "G3", "8t");
builder.addNote(0, "B3", "8t");
builder.addNote(0, "D4", "8t");
```

### Add Fermata

```js
builder.addNote(0, "C3", "2n").addFermata(Score.Fermata.AtNote); // Add fermata at note.
builder.addFermata(Score.Fermata.AtMeasureEnd);                 // Add fermata at measure end.
```

### Add Navigation

```js
builder.addNavigation(Score.Navigation.DC_al_Fine);   // Add "DC_al_Fine"
builder.addNavigation(Score.Navigation.DC_al_Coda);   // Add "DC_al_Coda"
builder.addNavigation(Score.Navigation.DS_al_Fine);   // Add "DS_al_Fine"
builder.addNavigation(Score.Navigation.DS_al_Coda);   // Add "DS_al_Coda"
builder.addNavigation(Score.Navigation.Coda);         // Add "Coda"
builder.addNavigation(Score.Navigation.toCoda);       // Ass "toCoda"
builder.addNavigation(Score.Navigation.Segno);        // Add "Segno" symbol
builder.addNavigation(Score.Navigation.Fine);         // Add "Fine"
builder.addNavigation(Score.Navigation.StartRepeat);  // Add repeat sections start position
builder.addNavigation(Score.Navigation.EndRepeat, 3); // Add repeat sections end position, repeat sectionplayed 3 times
builder.addNavigation(Score.Navigation.Ending, 1, 2); // Add ending, played on 1st and 2nd run
```

### Add Annotation

Add annotation text anchored to previously added note, chord or rest.

```js
builder.addAnnotation(Score.Annotation.Dynamics, "ff");
builder.addAnnotation(Score.Annotation.Tempo, "accel.");
```

### Add Label

Add text label anchored to previously added note, chord or rest.

```js
builder.addLabel(Score.Label.Chord, "Am"); // Positioned above staff. Used to label chords.
builder.addLabel(Score.Label.Note, "C#5"); // Positioned below staff. Used to label notes.
```

### Positioning Elements

`addFermata`, `addNavigation`, `addAnnotation` and `addLabel` functions have alternate versions 
`addFermataTo`, `addNavigationTo`, `addAnnotationTo` and `addLabelTo` that contain extra first argument.

```js
builder.addLabelTo(0, Score.Label.Chord, "Am");        // Add label to top (id 0) staff/tab.
builder.addLabelTo([0, 1], Score.Label.Chord, "Am");   // Add label to top two (id 0 and 1) staves/tabs.
builder.addLabelTo("staff1", Score.Label.Chord, "Am"); // Add label to named staff/tab/group.
builder.addLabelTo("grp1", Score.Label.Chord, "Am");   // Add label to named staff/tab/group.

// Create staff groups
builder.addStaffGroup("grp1", 0, Score.VertocalPosition.Above);                 // This staff group adds elements above top staff/tab.
builder.addStaffGroup("grp2", [1], Score.VertocalPosition.Below);               // This staff group adds elements below second staff/tab from top.
builder.addStaffGroup("grp3", "tab1", Score.VertocalPosition.Both);             // This staff group adds elements above and below tab named "tab1".
builder.addStaffGroup("grp4", ["staff1", "tab1"], Score.VertocalPosition.Auto); // This staff group uses default location to add element to "staff1" and "tab1".
```

### Add Extension

Adds extension line to element, for example to previously added annotation.

```js
builder.addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Theory.NoteLength.Whole * 2);        // Add extension line
builder.addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Theory.NoteLength.Whole * 2, false); // Add hidden extension line
```

### Add Connective (tie, slur, slide)

```js
builder.addConnective(Score.Connetive.Tie);   // Add tie
builder.addConnective(Score.Connetive.Slur);  // Add slur
builder.addConnective(Score.Connetive.Slide); // Add slide
builder.addConnective(Score.Connetive.Tie, 3); // Add tie with span value (describes how many notes the connective is across).
builder.addConnective(Score.Connetive.Slur, 2, Score.NoteAnchor.Above); // Add slur connected above note.
builder.addConnective(Score.Connetive.Slur, 2, Score.NoteAnchor.Below); // Add slur connected below note.
builder.addConnective(Score.Connetive.Slur, 2, Score.NoteAnchor.Center); // Add slur connected next to note.
builder.addConnective(Score.Connetive.Slur, 2, Score.NoteAnchor.StemTip); // Add slur connected at stem tip.
```

### Guitar Tab

This library has preliminary guitar tab rendering. 

Add notes with `string` property to specify at what string the fret number is rendered in the tab.

```js
builder.addNote(0, "G3", "8n", { string: 3 });
builder.addChord(0, ["E4", "C3"], "8n", { string: [1, 5] });
```

### Beams

Beams are detected and added automatically.

### Classical Guitar Audio Module

Default instrument is `Synthesizer`.

`Classical Guitar` is available via `audio-cg` module.
It was included as separate module because it contains over 1MB of audio samples bundled in it.

```js
import { registerClassicalGuitar } from "@tspro/web-music-score/audio-cg";

registerClassicalGuitar();
```

### Play Document

```js
// Simple play
doc.play();

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

### MusicError
```js
try {
    // Do your music stuff
}
catch (e) {
    if(e instanceof Core.MusicError) {
        // There was music error.
    }
}
```

## Compatibility
- This library is bundled to ESM, CJS and IIFE formats.
- Target is to support ES6/ES2015.
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
