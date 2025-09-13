import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createTripletsDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration(Score.StaffPreset.GuitarTreble)
        .setHeader("Triplets")

        .addMeasure()
        .setKeySignature("G", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        //.addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })
        //.addNote(0, "B3", Theory.NoteLength.Eighth, { triplet: true })
        //.addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })
        .addTuplet(0, Theory.Tuplet.Triplet, notes => {
            notes.addNote("G3", Theory.NoteLength.Eighth);
            notes.addNote("B3", Theory.NoteLength.Eighth);
            notes.addNote("D4", Theory.NoteLength.Eighth);
        })

        .addNote(0, "D4", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)

        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "B3", Theory.NoteLength.Quarter)

        .addMeasure()
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
        .endRow()

        .addMeasure()
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
        .endRow()

        .addMeasure()
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
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })

        .addMeasure()
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
        .endRow()

        .addMeasure()
        .setTimeSignature("3/4")
        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Eighth, { triplet: true })

        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Quarter, { triplet: true })

        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })
        .addRest(0, Theory.NoteLength.Quarter, { triplet: true })

        .addRest(0, Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { triplet: true })

        .addRest(0, Theory.NoteLength.Eighth, { triplet: true })
        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .endRow()

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Quarter, { triplet: true })

        .addNote(0, "G3", Theory.NoteLength.Quarter, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Half, { triplet: true })

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Half, { triplet: true })
        .addNote(0, "B3", Theory.NoteLength.Half, { triplet: true })
        .addNote(0, "D4", Theory.NoteLength.Half, { triplet: true })

        .getDocument();
}
