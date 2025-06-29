# WebMusicScore

This is a component for viewing and playing music scores/notation.

I am hobbyist programmer and I have some years of classical guitar and music theory studies.

I have been developing this project slowly for several years.
But it is only now published and has not gone through much testing so there might be weird bugs or unexpected issues.

# Install

```sh
npm i @tspro/web-music-score
```

# Library Bundle

This library is bundled to ESM, CJS and UMD formats.

* CJS and UMD bundles are transpiled with Babel for ES5/IE11 compatibility.
* ESM bundle targets modern environments (ES6+).
* No polyfills are included.

While designed for compatibility in mind, the library has not been explicitly tested against specific Node.js or browser versions.

# Usage

## Import Methods
```js
// Import named exports
import * as Score from "@tspro/web-music-score";

// Or import default export
import Score from "@tspro/web-music-score";

// Or use require
const Score = require("@tspro/web-music-score");
```

```html
<!-- Or use in browser via unpkg CDN -->
<script src="https://unpkg.com/@tspro/web-music-score@1"></script>

<canvas id="scoreCanvas"></canvas><br />
<button id="playButton"></button>

<script>
    const Score = window.WebMusicScore;
    // ...
</script>
```

## Create Document

```js
let doc = new Score.MDocument(Score.StaffKind.Treble, 4);
```

First argument can be Treble, TrebleForGuitar, Bass or Grand. TrebleForGuitar is same as Treble but one octave lower.

Second argument is number of measures per row, and can be omitted.

## Set Header

```js
doc.setHeader("Title", "Composer", "Arranger");
doc.setHeader("Title");
```

Any of title, composer and arranger can be omitted/set undefined.

## Add Measure

```js
let m = doc.addMeasure();
```

## End Row

```js
m.endRow();
```

Manually induce row change. Next measure will be added to new row.

## Set Signature

```js
m.setKeySignature("C", Score.ScaleType.Major);
```

Firat argument is scale key note.

Second argument is scale type, which can be Major, NaturalMinor, HarmonicMinor, Ionian, Dorian, Phrygian, Lydian, Mixolydian, 
Aeolian, Locrian, MajorPentatonic, MinorPentatonic, MajorHexatonicBlues, MinorHexatonicBlues or HeptatonicBlues.

```js
m.setTimeSignature("4/4");
```

Time signature can be "2/4", "3/4", "4/4", "6/8" or "9/8".

```js
m.setTempo(80, Score.NoteLength.Quarter, false);
m.setTempo(80);
```

First argument is beats per minute.

Second argument is beat length. Third argument tells if beat length is dotted. Second and third arguments can be omitted.

## Adding Notes and chords

```js
m.addNote(0, "C3", Score.NoteLength.Quarter);
m.addChord(1, ["C3", "E3", "G3", "C4"], Score.NoteLength.Whole);
```

First argument is voice track id and can be 0, 1, 2 or 3.

Second argument is note or list of notes for chord.

Third argument is note length. Note length can be Whole, Half, Quarter, Eighth, Sixteenth, ThirdySecond or SixtyFourth.

## Add Rest

```js    
m.addRest(0, Score.NoteLength.Quarter);
```

First argument is voice track id and can be 0, 1, 2 or 3.

Second argument is rest length. Rest length can be Whole, Half, Quarter, Eighth, Sixteenth, ThirdySecond or SixtyFourth.

## Note And Rest Options

### Doted Note And Rest

```js
m.addNote(0, "C3", Score.NoteLength.Quarter, { dotted: true });
m.addRest(0, Score.NoteLength.Quarter, { dotted: true });
```

### Stem Direction

```js
m.addNote(0, "C3", Score.NoteLength.Quarter, { stem: Stem.Up });
```

Stem  direction can be Auto, Up or Down

### Arpeggio

```js
m.addNote(0, "C3", Score.NoteLength.Quarter, { arpeggio: Arpeggio.Down });
```

Play this column of notes in arpeggio. Arpeggio can be Up or Down.

### Staccato

```js
m.addNote(0, "C3", Score.NoteLength.Quarter, { staccato: true });
```

### Diamond Note Head

```js
m.addNote(0, "C3", Score.NoteLength.Quarter, { diamond: true });
```

### Add Ties And Slurs

```js
m.addNote(0, "C3", Score.NoteLength.Half, { tieSpan: 2, tiePos: Score.ArcPos.Below })
m.addNote(0, "C3", Score.NoteLength.Quarter);
```
    
Adds a tie.

```js
m.addNote(0, "C3", Score.NoteLength.Eight, { slurSpan: 2, slurPos: Score.ArcPos.Below })
m.addNote(0, "D3", Score.NoteLength.Eight);
```

Adds a slur.

ArcPos can be Auto, Above (above note head), Middle (next to note head), Below (below note head), StemTip.

### Add Triplet

```js
doc.addMeasure()
    .addNote(0, "C3", Score.NoteLength.Eight, { triplet: true })
    .addNote(0, "D3", Score.NoteLength.Eight, { triplet: true })
    .addNote(0, "E3", Score.NoteLength.Eight, { triplet: true });
```

Adds triplet between three notes or rest of equal length.

```js
doc.addMeasure()
    .addNote(0, "C3", Score.NoteLength.Eight, { triplet: true })
    .addRest(0, Score.NoteLength.Quarter, { triplet: true });
```

Triplet can also be added between two notes or rest. Other note or rest is double length of the other.

### Rest Pitch

```js
m.addRest(0, Score.NoteLength.Quarter, { pitch: "C3" });
```

Positions rest at the pitch level of note "C3".

### Hide Rest

```js
m.addRest(0, Score.NoteLength.Quarter, { hide: true });
```

Creates invisible rest.

## Add Fermata

```js
m.addNote(0, "C3", Score.NoteLength.Quarter).addFermata(Score.Fermata.AtNote);
m.addRest(0, Score.NoteLength.Quarter).addFermata();
```

Adds fermata anchored to previously added note or rest.

```js
m.addFermata(Score.Fermata.AtMeasureEnd);
```

Adds fermata at measure end.

## Add Navigation

```js
m.addNavigation(Score.Navigation.DC_al_Fine);
```

Adds navigational element to measure.

Available navigations are:

* Navigation.DC\_al\_Fine
* Navigation.DC\_al\_Coda
* Navigation.DS\_al\_Fine
* Navigation.DS\_al\_Coda
* Navigation.Coda
* Navigation.toCoda
* Navigation.Segno
* Navigation.Fine
* Navigation.StartRepeat
* Navigation.EndRepeat
* Navigation.Ending

Navigation.EndRepeat takes optional second argument which is number of repeats. Defaults to 1 if omitted.

```js
m.addNavigation(Score.Navigation.EndRepeat, 2);
```

Navigation.Ending takes variable number of arguments, each is a passage number.

```js
m.addNavigation(Score.Navigation.Ending, 1, 2);
m.addNavigation(Score.Navigation.Ending, 3);
```

## Add Label

```js
m.addChord(0, ["D3", "F3", "A3"], Score.NoteLength.Quarter).addLabel(Score.Label.Chord, "Dm");
```

Available Label types are:

* Label.Note is used to label notes and is positioned below note.
* Label.Chord is used to label chords and is positioned on top.

## Add Annotation

```js
m.addNote(0, "C3", Score.NoteLength.Quarter).addAnnotation(Score.Annotation.Dynamics, "fff");
```

First argument is Annotation, second argument is the annotation text.

Available annotations are:

* Annotation.Dynamics could be for example "fff", "cresc.", "dim.", etc.
* Annotation.Tempo could be for example "accel.", "rit.", "a tempo", etc.

## Add Extension

```js
m.addNote(0, "C3", Score.NoteLength.Quarter).
    addAnnotation(Score.Annotation.Tempo, "accel.").
    addExtension(Score.NoteLength.Whole * 2, true);
```

Adds extension line to element, annotation in this case.

First argument is extension length, of type number. NoteLength values can be used as number, and NoteLength values can be multiplied to set desired extension length.

Second argument is true/false whether extension line is visible. This argument cvan be omitted, extension line is visible by default.

## Queueing

Adding stuff to measures can be queued like this:

```js
doc.addMeasure()
    .addNote(1, "C3", Score.NoteLength.Quarter)
    .addChord(1, ["C3", "E3", "G3"], Score.NoteLength.Quarter).addLabel(Score.Label.Chord, "C")
    .addRest(1, Score.NoteLength.Quarter);
```

## Beams

Beams are detected and added automatically.

## Play Document

```js
Score.Audio.setInstrument(Score.Audio.Instrument.ClassicalGuitar);
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

## Viewing Using React JSX/TSX

```js
// Draw document
<Score.MusicScoreView doc={doc} />

// Add playback buttons
<Score.PlaybackButtons doc={doc} buttonLayout={Score.PlaybackButtonsLayout.PlayStopSingle}/> // Single Play/Stopo button
<Score.PlaybackButtons doc={doc} buttonLayout={Score.PlaybackButtonsLayout.PlayStop}/> // Play and Stop buttons
<Score.PlaybackButtons doc={doc} buttonLayout={Score.PlaybackButtonsLayout.PlayPauseStop}/> // Play, Pause and Stop buttons
```

## Viewing Using Plain JS/TS

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
let c = new Score.PlaybackButtonsController().
    setPlayButton("playButtonId").
    setPauseButton("pauseButtonId").
    setStopButton("stopButtonId").
    setDocument(doc);

// You can also set combined play/stop button.
c.setPlayStopButton("playStopButtonId")

// You can also pass HTMLButtonElement instead of element id.
c.setPlayButton(playButtonElement)
```

## Error Handling

```js
try {
    // Invalid note "C" without octave.
    m.addNote(0, "C", Score.NoteLength.Quarter);        
}
catch(e) {
    // MusicError is raised on errors.
    if(e instanceof Score.MusicError) {
        console.log(e);
    }
}
```
