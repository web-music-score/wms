import * as Score from "@tspro/web-music-score";

export function createBeamDetectionDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTreble);

    doc.setHeader("Beam Detection");

    doc.addMeasure()
        .setKeySignature("G", Score.ScaleType.Major)
        .setTimeSignature("2/4")
        .setTempo(80)
        .addNote(0, "G3", Score.NoteLength.Quarter)
        .addNote(0, "G3", Score.NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Quarter)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Quarter)
        .addNote(0, "G3", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addRest(0, Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addRest(0, Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth, { dotted: true })
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.Eighth, { dotted: true });

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.ThirtySecond)
        .addNote(0, "G3", Score.NoteLength.ThirtySecond)
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.ThirtySecond)
        .addNote(0, "G3", Score.NoteLength.ThirtySecond)
        .endRow();

    // Test different time signatures

    doc.addMeasure()
        .setTimeSignature("2/4")
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth);

    doc.addMeasure()
        .setTimeSignature("3/4")
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth);

    doc.addMeasure()
        .setTimeSignature("4/4")
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth);

    doc.addMeasure()
        .setTimeSignature("6/8")
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth);

    doc.addMeasure()
        .setTimeSignature("9/8")
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .endRow();

    // Test beams fail cases

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.ThirtySecond)
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.ThirtySecond)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.ThirtySecond)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.ThirtySecond)
        .addNote(0, "G3", Score.NoteLength.Sixteenth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth, { dotted: true })
        .addNote(0, "G3", Score.NoteLength.Eighth, { dotted: true })
        .addNote(0, "G3", Score.NoteLength.Sixteenth)
        .addNote(0, "G3", Score.NoteLength.Sixteenth);

    return doc;
}
