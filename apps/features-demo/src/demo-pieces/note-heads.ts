import * as Score from "@tspro/web-music-score";

export function createNoteHeadsDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTreble);

    doc.setHeader("Note Heads");

    doc.addMeasure()
        .setKeySignature("A", Score.ScaleType.NaturalMinor)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "A3", Score.NoteLength.Whole);

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Half)
        .addNote(0, "B3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Whole, { diamond: true });

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Half, { diamond: true })
        .addNote(0, "B3", Score.NoteLength.Quarter, { diamond: true })
        .addNote(0, "A3", Score.NoteLength.Eighth, { diamond: true })
        .addNote(0, "A3", Score.NoteLength.Eighth, { diamond: true });

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Quarter, { dotted: true })
        .addNote(0, "A3", Score.NoteLength.Quarter, { dotted: true })
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .setKeySignature("D", Score.ScaleType.Major)
        .setTimeSignature("3/4")
        .addNote(0, "D4", Score.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addRest(1, Score.NoteLength.Quarter, { pitch: "D3" })
        .addNote(0, "D3", Score.NoteLength.Quarter, { stem: Score.Stem.Up }) // Stem up... 
        .addNote(1, "D3", Score.NoteLength.Quarter, { stem: Score.Stem.Down }) // ...and down
        .addRest(1, Score.NoteLength.Quarter, { pitch: "B3" });

    doc.addMeasure()
        .setKeySignature("G", Score.ScaleType.Major)
        .setTimeSignature("2/4")
        .addNote(0, "C3", Score.NoteLength.Sixteenth, { stem: Score.Stem.Up })
        .addNote(0, "E4", Score.NoteLength.Sixteenth)
        .addNote(0, "B2", Score.NoteLength.Sixteenth)
        .addNote(0, "D4", Score.NoteLength.Sixteenth)
        .addNote(0, "A2", Score.NoteLength.Sixteenth)
        .addNote(0, "C4", Score.NoteLength.Sixteenth)
        .addNote(0, "G2", Score.NoteLength.Sixteenth)
        .addNote(0, "B3", Score.NoteLength.Sixteenth)
        .addNote(1, "C3", Score.NoteLength.Eighth, { stem: Score.Stem.Down })
        .addNote(1, "B2", Score.NoteLength.Eighth)
        .addNote(1, "A2", Score.NoteLength.Eighth)
        .addNote(1, "G2", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addChord(0, ["C3", "E3", "F#3", "A3", "B3", "C4"], Score.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addChord(0, ["C3", "E3", "F#3", "A3", "B3", "C4"], Score.NoteLength.Quarter, { stem: Score.Stem.Down })

    return doc;
}
