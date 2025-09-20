# WebMusicScore

The API Reference, Examples and Demos can be found [here](https://pahkasoft.github.io). The API Reference is not commented but is mostly self explanatory and gives idea of the full API.

## About

This library allows you to view and play music scores (notation) in the browser.

I'm not a professional musician. I began learning classical guitar on my own, 
later taking lessons in classical guitar. I've also studied music theory independently.

This is a work in progress project. Lately there has been improvements that required major
version update. As the project matures there might be less major updates, and more minor
updates and patches.

This version (4.0.0) added support for string note lengths (e.g. "4n", "2..", etc.) and
other typescript enums for shorter code. 

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

### Using `DocumentBuilder`

```js
let doc = new Score.DocumentBuilder()
    .addScoreConfiguration({ type: "staff", clef: "G", isOctavewDown: true })
    .setMeasuresPerRow(4)
    .addMeasure()
    .addNote(1, "C3", "4n")
    .addChord(1, ["C3", "E3", "G3"], "4n").addLabel("chord", "C")
    .addRest(1, "4n")
    // etc.
    .getDEocument();
```

**Hint:**
```js
    // In following examples if the function call begins with dot...
    .addNote(...)

    // ...it means call to the DocumentBuilder object.
    documentBuilder.addNote(...)
```

### Set Score Configuration
Setting score configuration takes place in first measure of next row.

#### Using preset values

For staff presets you can use `Score.StaffPreset` enum values (e.g. `Score.StaffPreset.Treble`)
or corresponding string values (e.g. `"treble"`).

```js
.setScoreConfiguration("treble")         // Staff with treble G-clef.
.setScoreConfiguration("bass")           // Staff with bass F-clef.
.setScoreConfiguration("grand")          // Both treble and bas staves.
.setScoreConfiguration("guitarTreble")   // Same as `Treble` but one octave down.
.setScoreConfiguration("guitarTab")      // Guitar tab only.
.setScoreConfiguration("guitarCombined") // Treble and tab for guitar.
```

#### Using configuration objects
```js
.setScoreConfiguration({ type: "staff", clef: "G"}) // Staff with treble G-clef.
.setScoreConfiguration({ type: "staff", clef: "F"}) // Staff with bass F-clef.
.setScoreConfiguration({
    type: "staff",
    clef: "G",           // G-clef
    isOctaveDown: false, // (optional) octave down
    name: "staff1",      // (optional) staff name
    minNote: "C2",       // (optional) min allowed note
    maxNote: "C6",       // (optional) max allowed note
    voiceIds: [0, 1]     // (optional) only present voices 0 and 1 in this staff
})
.setScoreConfiguration([
    { type: "staff", clef: "G", isGrand: true },
    { type: "staff", clef: "F", isGrand: true }
]) // Grand staff
.setScoreConfiguration([
    { type: "staff", clef: "G", isOctaveDown: true },
    { type: "tab", tuning: "Drop D" }
]) // Staff and tab for guitar, tab with Drop D tuning.
.setScoreConfiguration(
{
    type: "tab",
    name: "tab1",
    tuning: ["E2", "A2", "D3", "G3", "B3", "E4"],
    voiceIds: 4
})
```

### Set Automatic Measures Per Row
```ts
.setMesuresPerRow(4)        // Set 4 measures per row
.setMesuresPerRow(Infinity) // Turn off auto row change (default)
```

### Set Header
```js
.setHeader("Title", "Composer", "Arranger")
.setHeader("Demo Song")
```

### Add Measure
```js
.addMeasure()
```

### End Row
Manually induce row change. Next measure that is added will begin new row.

```js
.endRow()
```

### Set Key Signature
For scale type you can use `Theory.ScaleType` enum values (e.g. `Theory.ScaleType.Major`)
or corresponding string values (e.g. `"Major"`).

```js
.setKeySignature("C", "Major")         // Create C Major scale.
.setKeySignature("A", "Natural Minor") // Create A natural minor scale.
```

- See API Reference for all scale types.

### Set Time Signature
```js
.setTimeSignature("2/4")
.setTimeSignature("3/4")
.setTimeSignature("4/4")
.setTimeSignature("6/8")
.setTimeSignature("9/8")
```

### Set Tempo
```js
.setTempo(100, "4n") // 100 beats per minute, beat length is quarter note.
.setTempo(80, "4n", 2) // 100 beats per minute, beat length is double dotted quarter note.
.setTempo(80, "4..") // 100 beats per minute, beat length is double dotted quarter note.
```

### Add Note
```js
.addNote(0, "C4", "1n")                     // Create whole note "C4"
.addNote(0, "Bb4", "2..")                   // Create double dotted half note "Bb4"
.addNote(0, "C4", "4n", { stem: "up" })     // Stem direction Up (could be also Down)
.addNote(0, "C4", "4n", { staccate: true }) // Show staccato dot and play in short
.addNote(0, "C4", "4n", { diamond: true })  // Show diamond shaped note head
```

### Add Chord
```js
.addChord(1, ["C3", "E3", "G3"], "1n", { arpeggio: "down" }) // Create whole note chord of three notes, played in arpeggio.
```

### Add Rest

```js    
.addRest(0, "16n")               // Add sixteenth rest
.addRest(0, "4.")                // Add dotted quarter rest
.addRest(0, "4n", { staffPos: "D3" }) // Draw this quarter rest at level of "D3" note.
.addRest(0, "4n", { hide: true }) // Invisible rest affects playing
```

### Add Tuplet
This works for any tuplet:
```js
// Example: add triplet
.addTuplet(0, { parts: 3, inTimeOf: 2 }, notes => {
    notes.addNote("G3", "8n")
    notes.addNote("B3", "8n")
    notes.addNote("D4", "8n")
})
```

Triplets can also be created using `triplet` property or string note length:
```js
// Example: add triplet using string note length.
.addNote(0, "G3", "8t")
.addNote(0, "B3", "8t")
.addNote(0, "D4", "8t")
```

### Add Fermata

For fermata you can use `Score.Fermata` enum values (e.g. `Scoore.Fermata.AtNote`)
or corresponding string values (e.g. `"atNote"`).

```js
.addNote(0, "C3", "2n").addFermata("atNote") // Add fermata at note.
.addFermata("atMeasureEnd")                  // Add fermata at measure end.
```

### Add Navigation

For navigation you can use `Score.Navigation` enum values (e.g. `Score.Navigation.DC_al_Fine`)
or corresponding string values (e.g. `"D.C. al Fine"`).

```js
.addNavigation("D.C. al Fine") // Add "D.C. al Fine"
.addNavigation("D.C. al Coda") // Add "D.C. al Coda"
.addNavigation("D.S. al Fine") // Add "D.S. al Fine"
.addNavigation("D.S. al Coda") // Add "D.S. al Coda"
.addNavigation("Coda")         // Add "Coda"
.addNavigation("toCoda")       // Ass "toCoda"
.addNavigation("Segno")        // Add "Segno" symbol
.addNavigation("Fine")         // Add "Fine"
.addNavigation("startRepeat")  // Add repeat sections start position
.addNavigation("endRepeat", 3) // Add repeat sections end position, repeat sectionplayed 3 times
.addNavigation("ending", 1, 2) // Add ending, played on 1st and 2nd run
```

### Add Annotation

Add annotation text anchored to previously added note, chord or rest.

For annotation you can use `Score.Annotation` enum values (e.g. `Score.Annotation.Tempo`)
or corresponding string values (e.g. `"tempo"`).

```js
.addAnnotation("dynamics", "ff")  // Add dynamics annotation text.
.addAnnotation("tempo", "accel.") // Add tempo annotation text.
.addAnnotation("ppp")             // Add annotation text, detect annotation type automatically.
```

### Add Label

Add text label anchored to previously added note, chord or rest.

For label you can use `Score.Label` enum values (e.g. `Score.Label.Chord`)
or corresponding string values (e.g. `"chord"`).

```js
.addLabel("chord", "Am") // Add chord label, positioned above staff by default.
.addLabel("note", "C#5") // Add note label, positioned below staff by default.
```

### Positioning Elements

`addFermata`, `addNavigation`, `addAnnotation` and `addLabel` functions have alternate versions 
`addFermataTo`, `addNavigationTo`, `addAnnotationTo` and `addLabelTo` that contain extra first argument.

```js
.addLabelTo(0, "chord", "Am")        // Add label to top (id 0) staff/tab.
.addLabelTo([0, 1], "chord", "Am")   // Add label to top two (id 0 and 1) staves/tabs.
.addLabelTo("staff1", "chord", "Am") // Add label to named staff/tab/group.
.addLabelTo("grp1", "chord", "Am")   // Add label to named staff/tab/group.

// Create staff groups
.addStaffGroup("grp1", 0, "above")                 // This staff group adds elements above top staff/tab.
.addStaffGroup("grp2", [1], "below")               // This staff group adds elements below second staff/tab from top.
.addStaffGroup("grp3", "tab1", "both")             // This staff group adds elements above and below tab named "tab1".
.addStaffGroup("grp4", ["staff1", "tab1"], "auto") // This staff group uses default location to add element to "staff1" and "tab1".
```

### Add Extension

Adds extension line to previously added label or annotation.

```js
.addExtension(ext => ext.notes("1n", 2))    // Add extension line, length is 2 whole notes
.addExtension(ext => ext.measures(3).hide())      // Add extension line, length is 3 measures, hidden
.addExtension(ext => ext.measures(1).notes("8n")) // Add extension line, length is 1 measure + 1 eigth note
.addExtension(ext => ext.infinity())              // Add extension line, length is as long as possible
.addExtension()                                   // Add extension line, length is as long as possible
```

### Add Connective (tie, slur, slide)

For connective you can use `Score.Connective` enum values (e.g. `Score.Connective.Tie`)
or corresponding string values (e.g. `"tie"`).

For note anchor you can use `Score.NoteAnchor` enum values (e.g. `Score.NoteAnchor.Above`)
or corresponding string values (e.g. `"above"`).


```js
.addConnective("tie")    // Add tie
.addConnective("slur")   // Add slur
.addConnective("slide")  // Add slide
.addConnective("tie", 3) // Add tie with span value (describes how many notes the connective is across).
.addConnective("slur", 2, "above")   // Add slur connected above note.
.addConnective("slur", 2, "below")   // Add slur connected below note.
.addConnective("slur", 2, "center")  // Add slur connected next to note.
.addConnective("slur", 2, "stemTip") // Add slur connected at stem tip.
```

### Guitar Tab

This library has preliminary guitar tab rendering. 

Add notes with `string` property to specify at what string the fret number is rendered in the tab.

```js
.addNote(0, "G3", "8n", { string: 3 })
.addChord(0, ["E4", "C3"], "8n", { string: [1, 5] })
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
