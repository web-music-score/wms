import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createTempoAnnotationDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTreble);

    doc.setHeader("Tempo Annotation");

    doc.addMeasure()
        .setKeySignature("G", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(70)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Theory.NoteLength.Half)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "a tempo");

    doc.addMeasure()
        .setTempo(80)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "rit.").addExtension(Theory.NoteLength.Whole)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "D4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "a tempo")
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Infinity, false)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "a tempo")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Theory.NoteLength.Whole * 3)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "F#4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "a tempo")
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Theory.NoteLength.Whole * 2)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "E4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    return doc;
}
