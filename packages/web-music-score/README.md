# Web Music Score

Web component for viewing and playing music scores/notation.

# Install

    npm i @tspro/web-music-score

# Library Bundle

This library is bundled to ESM, CJS and UMD formats.

* CJS and UMD bundles are transpiled with Babel for ES5/IE11 compatibility.
* ESM bundle targets modern environments (ES6+).
* No polyfills are included.

While designed for compatibility in mind, the library has not been explicitly tested against specific Node.js or browser versions.

# Usage

## Import

    import * as Score from "@tspro/web-music-score";

## Create Document

    let doc = new Score.MDocument(Score.StaffKind.Treble, 4);

First argument can be Treble, TrebleForGuitar, Bass or Grand. TrebleForGuitar is same as Treble but one octave lower.

Second argument is number of measures per row, and can be omitted.

## Set Header

    doc.setHeader("Title", "Composer", "Arranger");
    doc.setHeader("Title");

Any of title, composer and arranger can be omitted/set undefined.

## Add Measure

    let m = doc.addMeasure();

## End Row

    m.endRow();

Manually induce row change. Next measure will be added to new row.

## Set Signature

    m.setKeySignature("C", Score.ScaleType.Major);

Firat argument is scale key note.

Second argument is scale type, which can be Major, NaturalMinor, HarmonicMinor, Ionian, Dorian, Phrygian, Lydian, Mixolydian, 
Aeolian, Locrian, MajorPentatonic, MinorPentatonic, MajorHexatonicBlues, MinorHexatonicBlues or HeptatonicBlues.

    m.setTimeSignature("4/4");

Time signature can be "2/4", "3/4", "4/4", "6/8" or "9/8".

    m.setTempo(80, Score.NoteLength.Quarter, false);
    m.setTempo(80);
    
First argument is beats per minute.

Second argument is beat length. Third argument tells if beat length is dotted. Second and third arguments can be omitted.

## Adding Notes and chords

    m.addNote(0, "C3", Score.NoteLength.Quarter);
    m.addChord(1, ["C3", "E3", "G3", "C4"], Score.NoteLength.Whole);

First argument is voice track id and can be 0, 1, 2 or 3.

Second argument is note or list of notes for chord.

Third argument is note length. Note length can be Whole, Half, Quarter, Eighth, Sixteenth, ThirdySecond or SixtyFourth.

## Add Rest
    
    m.addRest(0, Score.NoteLength.Quarter);

First argument is voice track id and can be 0, 1, 2 or 3.

Second argument is rest length. Rest length can be Whole, Half, Quarter, Eighth, Sixteenth, ThirdySecond or SixtyFourth.

## Note And Rest Options

### Doted Note And Rest

    m.addNote(0, "C3", Score.NoteLength.Quarter, { dotted: true });
    m.addRest(0, Score.NoteLength.Quarter, { dotted: true });

### Stem Direction

    m.addNote(0, "C3", Score.NoteLength.Quarter, { stem: Stem.Up });

Stem  direction can be Auto, Up or Down

### Arpeggio

    m.addNote(0, "C3", Score.NoteLength.Quarter, { arpeggio: Arpeggio.Down });

Play this column of notes in arpeggio. Arpeggio can be Up or Down.

### Staccato

    m.addNote(0, "C3", Score.NoteLength.Quarter, { staccato: true });

### Diamond Note Head

    m.addNote(0, "C3", Score.NoteLength.Quarter, { diamond: true });

### Add Ties And Slurs

    m.addNote(0, "C3", Score.NoteLength.Half, { tieSpan: 2, tiePos: Score.ArcPos.Below })
    m.addNote(0, "C3", Score.NoteLength.Quarter);
    
Adds a tie.

    m.addNote(0, "C3", Score.NoteLength.Eight, { slurSpan: 2, slurPos: Score.ArcPos.Below })
    m.addNote(0, "D3", Score.NoteLength.Eight);
    
Adds a slur.

ArcPos can be Auto, Above (above note head), Middle (next to note head), Below (below note head), StemTip.

### Add Triplet

    doc.addMeasure()
        .addNote(0, "C3", Score.NoteLength.Eight, { triplet: true })
        .addNote(0, "D3", Score.NoteLength.Eight, { triplet: true })
        .addNote(0, "E3", Score.NoteLength.Eight, { triplet: true });

Adds triplet between three notes or rest of equal length.

    doc.addMeasure()
        .addNote(0, "C3", Score.NoteLength.Eight, { triplet: true })
        .addRest(0, Score.NoteLength.Quarter, { triplet: true });

Triplet can also be added between two notes or rest. Other note or rest is double length of the other.

### Rest Pitch

    m.addRest(0, Score.NoteLength.Quarter, { pitch: "C3" });

Positions rest at the pitch level of note "C3".

### Hide Rest

    m.addRest(0, Score.NoteLength.Quarter, { hide: true });

Creates invisible rest.

## Add Fermata

    m.addNote(0, "C3", Score.NoteLength.Quarter).addFermata(Score.Fermata.AtNote);
    m.addRest(0, Score.NoteLength.Quarter).addFermata();

Adds fermata anchored to previously added note or rest.

    m.addFermata(Score.Fermata.AtMeasureEnd);

Adds fermata at measure end.

## Add Navigation

    m.addNavigation(Score.Navigation.DC_al_Fine);

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

    m.addNavigation(Score.Navigation.EndRepeat, 2);

Navigation.Ending takes variable number of arguments, each is a passage number.

    m.addNavigation(Score.Navigation.Ending, 1, 2);
    m.addNavigation(Score.Navigation.Ending, 3);

## Add Label

    m.addChord(0, ["D3", "F3", "A3"], Score.NoteLength.Quarter).addLabel(Score.Label.Chord, "Dm");
    
Available Label types are:

* Label.Note is used to label notes and is positioned below note.
* Label.Chord is used to label chords and is positioned on top.

## Add Annotation

    m.addNote(0, "C3", Score.NoteLength.Quarter).addAnnotation(Score.Annotation.Dynamics, "fff");

First argument is Annotation, second argument is the annotation text.

Available annotations are:

* Annotation.Dynamics could be for example "fff", "cresc.", "dim.", etc.
* Annotation.Tempo could be for example "accel.", "rit.", "a tempo", etc.

## Add Extension

    m.addNote(0, "C3", Score.NoteLength.Quarter).
      addAnnotation(Score.Annotation.Tempo, "accel.").
      addExtension(Score.NoteLength.Whole * 2, true);

Adds extension line to element, annotation in this case.

First argument is extension length, of type number. NoteLength values can be used as number, and NoteLength values can be multiplied to set desired extension length.

Second argument is true/false whether extension line is visible. This argument cvan be omitted, extension line is visible by default.

## Queueing

Adding stuff to measures can be queued like this:

    doc.addMeasure()
        .addNote(1, "C3", Score.NoteLength.Quarter)
        .addChord(1, ["C3", "E3", "G3"], Score.NoteLength.Quarter).addLabel(Score.Label.Chord, "C")
        .addRest(1, Score.NoteLength.Quarter);

## Beams

Beams are detected and added automatically.

## Play Document

    Score.Audio.setInstrument(Score.Audio.Instrument.ClassicalGuitar);

Sets instrument. Instrument can be ClassicalGuitar or Synth.

    doc.play();

Plays the document.

    let player = new MPlayer(doc);

    player.play();
    player.pause();
    player.stop();

    MPlayer.stopAll();

More playback methods.

## Draw And Playback Buttons Using React JSX

    <Score.MusicScoreView doc={doc} />

Draws document.

    <Score.PlaybackButtons doc={doc} buttonLayout={Score.PlaybackButtonsLayout.PlayPauseStop}/>

Add playback buttons. Available buttons layout are PlayStopSingle, PlayStop, PlayPauseStop.

## Draw And Playback Buttons Without React JSX

    new Score.MRenderer().
        setCanvas("canvasId").
        setDocument(doc).
        draw();

Draws document to canvas element.

    new Score.PlaybackButtonsController().
        setPlayStopButton("playStopButtonId").
        setDocument(doc);

Add playback buttons. Following buttons can be added.

    setPlayButton("playButtonId)
    setPauseButton("pauseButtonId")
    setStopButton(stopButtonElement)
    setPlayStopButton(playStopButtonElement)

Argument can be either button id string or HTMLButtonElement.

## Error Handling

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


