import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createStaccatoDemo() {
    let doc = new Score.MDocument(Score.StaffPreset.Treble);

    doc.setHeader("Staccato");

    doc.addMeasure()
        .setKeySignature("E", Theory.ScaleType.NaturalMinor)
        .setTimeSignature("4/4")
        .addNote(0, "E4", Theory.NoteLength.Eighth, { staccato: true, stem: Score.Stem.Up })
        .addNote(0, "F#4", Theory.NoteLength.Eighth, { staccato: true })
        .addNote(0, "G4", Theory.NoteLength.Quarter, { staccato: true })
        .addNote(0, "B4", Theory.NoteLength.Eighth, { staccato: true, stem: Score.Stem.Down })
        .addNote(0, "C5", Theory.NoteLength.Eighth, { staccato: true })
        .addNote(0, "D5", Theory.NoteLength.Quarter, { staccato: true });

    doc.addMeasure()
        .addNote(0, "E4", Theory.NoteLength.Eighth)
        .addNote(0, "F#4", Theory.NoteLength.Eighth)
        .addNote(0, "G4", Theory.NoteLength.Quarter)
        .addNote(0, "B4", Theory.NoteLength.Eighth)
        .addNote(0, "C5", Theory.NoteLength.Eighth)
        .addNote(0, "D5", Theory.NoteLength.Quarter);


    return doc;
}
