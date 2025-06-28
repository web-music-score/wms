import * as Score from "@tspro/web-music-score";

export function createTempoAnnotationDemo() {
    let doc = new Score.MDocument(Score.StaffKind.TrebleForGuitar);

    doc.setHeader("Tempo Annotation");

    doc.addMeasure()
        .setKeySignature("G", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(70)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Score.NoteLength.Half)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "a tempo");

    doc.addMeasure()
        .setTempo(80)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "rit.").addExtension(Score.NoteLength.Whole)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "D4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "a tempo")
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Infinity, false)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "a tempo")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Score.NoteLength.Whole * 3)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "F#4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "a tempo")
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Tempo, "accel.").addExtension(Score.NoteLength.Whole * 2)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "E4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    return doc;
}
