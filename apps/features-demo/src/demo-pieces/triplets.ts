import * as Score from "@tspro/web-music-score";

export function createTripletsDemo() {
    let doc = new Score.MDocument(Score.StaffKind.TrebleForGuitar);

    doc.setHeader("Triplets");

    doc.addMeasure()
        .setKeySignature("G", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "D4", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)

        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "B3", Score.NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "D4", Score.NoteLength.Eighth)

        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "A3", Score.NoteLength.Eighth)

        .addNote(0, "D4", Score.NoteLength.Sixteenth, { triplet: true, stem: Score.Stem.Down })
        .addNote(0, "C4", Score.NoteLength.Sixteenth, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Sixteenth, { triplet: true })
        .addNote(0, "A3", Score.NoteLength.Sixteenth, { triplet: true, stem: Score.Stem.Down })
        .addNote(0, "G3", Score.NoteLength.Sixteenth, { triplet: true })
        .addNote(0, "F#3", Score.NoteLength.Sixteenth, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Quarter)
        .endRow();

    doc.addMeasure()
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(1, "G3", Score.NoteLength.Quarter, { stem: Score.Stem.Down })

        .addNote(1, "G3", Score.NoteLength.Eighth, { stem: Score.Stem.Down })
        .addNote(1, "G3", Score.NoteLength.Eighth, { stem: Score.Stem.Down })

        .addNote(1, "G3", Score.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Down })
        .addNote(1, "G3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(1, "G3", Score.NoteLength.Eighth, { triplet: true })

        .addNote(1, "G3", Score.NoteLength.Sixteenth, { stem: Score.Stem.Down })
        .addNote(1, "G3", Score.NoteLength.Sixteenth, { stem: Score.Stem.Down })
        .addNote(1, "G3", Score.NoteLength.Sixteenth, { stem: Score.Stem.Down })
        .addNote(1, "G3", Score.NoteLength.Sixteenth, { stem: Score.Stem.Down })
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Down })
        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "B3", Score.NoteLength.Eighth, { triplet: true })
        .addRest(0, Score.NoteLength.Eighth, { triplet: true });

    doc.addMeasure()
        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Down })
        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .addRest(0, Score.NoteLength.Eighth, { triplet: true })

        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addRest(0, Score.NoteLength.Eighth, { triplet: true })

        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .endRow();

    doc.addMeasure()
        .setTimeSignature("3/4")
        .addNote(0, "G3", Score.NoteLength.Quarter, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Eighth, { triplet: true })

        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Quarter, { triplet: true })

        .addNote(0, "G3", Score.NoteLength.Quarter, { triplet: true })
        .addRest(0, Score.NoteLength.Eighth, { triplet: true });

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true })
        .addRest(0, Score.NoteLength.Quarter, { triplet: true })

        .addRest(0, Score.NoteLength.Quarter, { triplet: true })
        .addNote(0, "G3", Score.NoteLength.Eighth, { triplet: true })

        .addRest(0, Score.NoteLength.Eighth, { triplet: true })
        .addNote(0, "G3", Score.NoteLength.Quarter, { triplet: true })
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Quarter, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Quarter, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Quarter, { triplet: true })

        .addNote(0, "G3", Score.NoteLength.Quarter, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Half, { triplet: true });

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Half, { triplet: true })
        .addNote(0, "B3", Score.NoteLength.Half, { triplet: true })
        .addNote(0, "D4", Score.NoteLength.Half, { triplet: true });

    return doc;
}
