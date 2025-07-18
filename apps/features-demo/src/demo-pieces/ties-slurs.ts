import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createTiesAndSlursDemo() {
    let doc = new Score.MDocument(Score.StaffPreset.Treble);

    doc.setHeader("Ties And Slurs");

    doc.addMeasure()
        .setTimeSignature("4/4")
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up, slurSpan: 2, slurAnchor: Score.NoteAnchor.Below })
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down, slurSpan: 2, slurAnchor: Score.NoteAnchor.Below })
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down });

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up, slurSpan: 2, slurAnchor: Score.NoteAnchor.Above })
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down, slurSpan: 2, slurAnchor: Score.NoteAnchor.Above })
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down });

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up, slurSpan: 2, slurAnchor: Score.NoteAnchor.Center })
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down, slurSpan: 2, slurAnchor: Score.NoteAnchor.Center })
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down });

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up, slurSpan: 2, slurAnchor: Score.NoteAnchor.StemTip })
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down, slurSpan: 2, slurAnchor: Score.NoteAnchor.StemTip })
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down })
        .endRow();

    doc.addMeasure()
        .setKeySignature("D", Theory.ScaleType.Major)
        .setTimeSignature("3/4")
        .addNote(1, "G3", Theory.NoteLength.Half, { dotted: true, stem: Score.Stem.Down })
        .addRest(0, Theory.NoteLength.Quarter, { pitch: "D5" })
        .addChord(0, ["A4", "B4"], Theory.NoteLength.Quarter, { stem: Score.Stem.Up, tieSpan: 2 })
        .addChord(0, ["G4", "B4"], Theory.NoteLength.Quarter);

    doc.addMeasure()
        .addNote(1, "D4", Theory.NoteLength.Half, { dotted: true, tieSpan: 2, tieAnchor: Score.NoteAnchor.Below, stem: Score.Stem.Down })
        .addRest(0, Theory.NoteLength.Half, { pitch: "D5" })
        .addChord(0, ["A4", "C#5", "F#5"], Theory.NoteLength.Quarter, { tieSpan: 2, stem: Score.Stem.Up });

    doc.addMeasure()
        .addNote(1, "D4", Theory.NoteLength.Half, { dotted: true, stem: Score.Stem.Down })
        .addChord(0, ["A4", "C#5", "F#5"], Theory.NoteLength.Half, { dotted: true, stem: Score.Stem.Up });

    doc.addMeasure()
        .addNote(0, "D4", Theory.NoteLength.Half, { dotted: true, tieSpan: 3 })
        .endRow();

    doc.addMeasure()
        .addNote(0, "D4", Theory.NoteLength.Half, { dotted: true })

    doc.addMeasure()
        .addNote(0, "D4", Theory.NoteLength.Half, { dotted: true })
        .endRow();

    doc.addMeasure()
        .setKeySignature("E", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .addNote(0, "E4", Theory.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "F#4", Theory.NoteLength.Eighth)
        .addNote(0, "G#4", Theory.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "A4", Theory.NoteLength.Eighth)
        .addNote(0, "B4", Theory.NoteLength.Eighth, { slurSpan: 4 })
        .addNote(0, "C#5", Theory.NoteLength.Eighth)
        .addNote(0, "D#5", Theory.NoteLength.Eighth)
        .addNote(0, "E5", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "E4", Theory.NoteLength.Eighth, { slurSpan: 8 })
        .addNote(0, "F#4", Theory.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "G#4", Theory.NoteLength.Eighth)
        .addNote(0, "A4", Theory.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "B4", Theory.NoteLength.Eighth)
        .addNote(0, "C#5", Theory.NoteLength.Eighth, { slurSpan: 2 })
        .addNote(0, "D#5", Theory.NoteLength.Eighth)
        .addNote(0, "E5", Theory.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .setTimeSignature("3/4")
        .setKeySignature("C", Theory.ScaleType.Major)
        .addNote(0, "A4", Theory.NoteLength.Half)
        .addNote(0, "E5", Theory.NoteLength.Quarter)
        .addNote(1, "A3", Theory.NoteLength.Quarter, { stem: Score.Stem.Down, tieSpan: Score.Tie.Short, tieAnchor: Score.NoteAnchor.Below })
        .addNote(1, "E4", Theory.NoteLength.Half)

    doc.addMeasure()
        .addNote(0, "A4", Theory.NoteLength.Eighth)
        .addNote(0, "E4", Theory.NoteLength.Eighth)
        .addNote(0, "A4", Theory.NoteLength.Eighth)
        .addNote(0, "B4", Theory.NoteLength.Eighth, { tieSpan: Score.Tie.MeasureEnd })
        .addNote(0, "C5", Theory.NoteLength.Eighth, { tieSpan: Score.Tie.MeasureEnd })
        .addNote(0, "E5", Theory.NoteLength.Eighth, { tieSpan: Score.Tie.MeasureEnd })
        .addNote(1, "A3", Theory.NoteLength.Half, { dotted: true, tieSpan: 2, tieAnchor: Score.NoteAnchor.Below })

    doc.addMeasure()
        .addNote(0, "A4", Theory.NoteLength.Half, { dotted: true })
        .addNote(1, "A3", Theory.NoteLength.Half, { dotted: true })

    return doc;
}
