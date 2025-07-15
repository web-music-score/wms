import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createTripletsDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTreble);

    doc.setHeader("Triplets");

    doc.addMeasure()
        .setKeySignature("G", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "D4", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)

        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "B3", Theory.NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "D4", Theory.NoteLength.Eighth)

        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "A3", Theory.NoteLength.Eighth)

        .addNote(0, "D4", Theory.NoteLength.Sixteenth, { triplet: true, stem: Score.Stem.Down })
        .addNote(0, "C4", Theory.NoteLength.Sixteenth, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Sixteenth, { triplet: true })
        .addNote(0, "A3", Theory.NoteLength.Sixteenth, { triplet: true, stem: Score.Stem.Down })
        .addNote(0, "G3", Theory.NoteLength.Sixteenth, { triplet: true })
        .addNote(0, "F#3", Theory.NoteLength.Sixteenth, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Quarter)
        .endRow();

    doc.addMeasure()
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(1, "G3", Theory.NoteLength.Quarter, { stem: Score.Stem.Down })

        .addNote(1, "G3", Theory.NoteLength.Eighth, { stem: Score.Stem.Down })
        .addNote(1, "G3", Theory.NoteLength.Eighth, { stem: Score.Stem.Down })

        .addNote(1, "G3", Theory.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Down })
        .addNote(1, "G3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(1, "G3", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(1, "G3", Theory.NoteLength.Sixteenth, { stem: Score.Stem.Down })
        .addNote(1, "G3", Theory.NoteLength.Sixteenth, { stem: Score.Stem.Down })
        .addNote(1, "G3", Theory.NoteLength.Sixteenth, { stem: Score.Stem.Down })
        .addNote(1, "G3", Theory.NoteLength.Sixteenth, { stem: Score.Stem.Down })
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Down })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addNote(0, "B3", Theory.NoteLength.Eighth, { triplet: true })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true });

    doc.addMeasure()
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Down })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })

        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Eighth, { triplet: true, stem: Score.Stem.Up })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })

        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .endRow();

    doc.addMeasure()
        .setTimeSignature("3/4")
        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Quarter, { triplet: true })

        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true });

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })
        .addRest(0, Theory.NoteLength.Quarter, { triplet: true })

        .addRest(0, Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })

        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Quarter, { triplet: true })

        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Half, { triplet: true });

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Half, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Half, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Half, { triplet: true });

    return doc;
}
