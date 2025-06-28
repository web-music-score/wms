import * as Score from "@tspro/web-music-score";

export function createTiesAndSlursDemo() {
    let doc = new Score.MDocument(Score.StaffKind.Treble);

    doc.setHeader("Ties And Slurs");

    doc.addMeasure()
        .setTimeSignature("4/4")
        .addNote(0, "G4", Score.NoteLength.Quarter, { stem: Score.Stem.Up, slurSpan: 2, slurPos: Score.ArcPos.Below })
        .addNote(0, "A4", Score.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Score.NoteLength.Quarter, { stem: Score.Stem.Down, slurSpan: 2, slurPos: Score.ArcPos.Below })
        .addNote(0, "A4", Score.NoteLength.Quarter, { stem: Score.Stem.Down });

    doc.addMeasure()
        .addNote(0, "G4", Score.NoteLength.Quarter, { stem: Score.Stem.Up, slurSpan: 2, slurPos: Score.ArcPos.Above })
        .addNote(0, "A4", Score.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Score.NoteLength.Quarter, { stem: Score.Stem.Down, slurSpan: 2, slurPos: Score.ArcPos.Above })
        .addNote(0, "A4", Score.NoteLength.Quarter, { stem: Score.Stem.Down });

    doc.addMeasure()
        .addNote(0, "G4", Score.NoteLength.Quarter, { stem: Score.Stem.Up, slurSpan: 2, slurPos: Score.ArcPos.Middle })
        .addNote(0, "A4", Score.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Score.NoteLength.Quarter, { stem: Score.Stem.Down, slurSpan: 2, slurPos: Score.ArcPos.Middle })
        .addNote(0, "A4", Score.NoteLength.Quarter, { stem: Score.Stem.Down });

    doc.addMeasure()
        .addNote(0, "G4", Score.NoteLength.Quarter, { stem: Score.Stem.Up, slurSpan: 2, slurPos: Score.ArcPos.StemTip })
        .addNote(0, "A4", Score.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Score.NoteLength.Quarter, { stem: Score.Stem.Down, slurSpan: 2, slurPos: Score.ArcPos.StemTip })
        .addNote(0, "A4", Score.NoteLength.Quarter, { stem: Score.Stem.Down })
        .endRow();

    doc.addMeasure()
        .setKeySignature("D", Score.ScaleType.Major)
        .setTimeSignature("3/4")
        .addNote(1, "G3", Score.NoteLength.Half, { dotted: true, stem: Score.Stem.Down })
        .addRest(0, Score.NoteLength.Quarter, { pitch: "D5" })
        .addChord(0, ["A4", "B4"], Score.NoteLength.Quarter, { stem: Score.Stem.Up, tieSpan: 2 })
        .addChord(0, ["G4", "B4"], Score.NoteLength.Quarter);

    doc.addMeasure()
        .addNote(1, "D4", Score.NoteLength.Half, { dotted: true, tieSpan: 2, tiePos: Score.ArcPos.Below, stem: Score.Stem.Down })
        .addRest(0, Score.NoteLength.Half, { pitch: "D5" })
        .addChord(0, ["A4", "C#5", "F#5"], Score.NoteLength.Quarter, { tieSpan: 2, stem: Score.Stem.Up });

    doc.addMeasure()
        .addNote(1, "D4", Score.NoteLength.Half, { dotted: true, stem: Score.Stem.Down })
        .addChord(0, ["A4", "C#5", "F#5"], Score.NoteLength.Half, { dotted: true, stem: Score.Stem.Up });

    doc.addMeasure()
        .addNote(0, "D4", Score.NoteLength.Half, { dotted: true, tieSpan: 3 })
        .endRow();

    doc.addMeasure()
        .addNote(0, "D4", Score.NoteLength.Half, { dotted: true })

    doc.addMeasure()
        .addNote(0, "D4", Score.NoteLength.Half, { dotted: true })
        .endRow();

    doc.addMeasure()
        .setKeySignature("E", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .addNote(0, "E4", Score.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "F#4", Score.NoteLength.Eighth)
        .addNote(0, "G#4", Score.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "A4", Score.NoteLength.Eighth)
        .addNote(0, "B4", Score.NoteLength.Eighth, { slurSpan: 4 })
        .addNote(0, "C#5", Score.NoteLength.Eighth)
        .addNote(0, "D#5", Score.NoteLength.Eighth)
        .addNote(0, "E5", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "E4", Score.NoteLength.Eighth, { slurSpan: 8 })
        .addNote(0, "F#4", Score.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "G#4", Score.NoteLength.Eighth)
        .addNote(0, "A4", Score.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "B4", Score.NoteLength.Eighth)
        .addNote(0, "C#5", Score.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "D#5", Score.NoteLength.Eighth)
        .addNote(0, "E5", Score.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .setTimeSignature("3/4")
        .setKeySignature("C", Score.ScaleType.Major)
        .addNote(0, "A4", Score.NoteLength.Half)
        .addNote(0, "E5", Score.NoteLength.Quarter)
        .addNote(1, "A3", Score.NoteLength.Quarter, { stem: Score.Stem.Down, tieSpan: Score.TieLength.Short, tiePos: Score.ArcPos.Below })
        .addNote(1, "E4", Score.NoteLength.Half)

    doc.addMeasure()
        .addNote(0, "A4", Score.NoteLength.Eighth)
        .addNote(0, "E4", Score.NoteLength.Eighth)
        .addNote(0, "A4", Score.NoteLength.Eighth)
        .addNote(0, "B4", Score.NoteLength.Eighth, { tieSpan: Score.TieLength.ToMeasureEnd })
        .addNote(0, "C5", Score.NoteLength.Eighth, { tieSpan: Score.TieLength.ToMeasureEnd })
        .addNote(0, "E5", Score.NoteLength.Eighth, { tieSpan: Score.TieLength.ToMeasureEnd })
        .addNote(1, "A3", Score.NoteLength.Half, { dotted: true, tieSpan: 2, tiePos: Score.ArcPos.Below })

    doc.addMeasure()
        .addNote(0, "A4", Score.NoteLength.Half, { dotted: true })
        .addNote(1, "A3", Score.NoteLength.Half, { dotted: true })

    return doc;
}
