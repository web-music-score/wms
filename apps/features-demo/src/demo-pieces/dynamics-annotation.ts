import * as Score from "@tspro/web-music-score";

export function createDynamicsAnnotationDemo() {
    let doc = new Score.MDocument(Score.StaffKind.TrebleForGuitar);

    doc.setHeader("Dynamics Annotation");

    doc.addMeasure()
        .setKeySignature("G", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(70)
        .addNote(0, "G3", Score.NoteLength.Eighth, { stem: Score.Stem.Up }).addAnnotation(Score.Annotation.Dynamics, "ppp")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "pp")
        .addNote(0, "F#4", Score.NoteLength.Eighth)
        .addNote(0, "E4", Score.NoteLength.Eighth)
        .addNote(0, "D4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "p")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "mp")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "D4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "m")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "mf")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "f")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "ff")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "fff")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "dim.").addExtension(Infinity)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G4", Score.NoteLength.Eighth)
        .addNote(0, "F#4", Score.NoteLength.Eighth)
        .addNote(0, "E4", Score.NoteLength.Eighth)
        .addNote(0, "D4", Score.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "ppp")
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "cresc.").addExtension(Infinity)
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
        .addNote(0, "C4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "fff")
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "mf")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "cresc.").addExtension(Score.NoteLength.Whole)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "F#4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "dim.").addExtension(Score.NoteLength.Whole)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "dim.").addExtension(Score.NoteLength.Half)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "E4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "ff");

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "dim.").addExtension(Score.NoteLength.Half)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "fff")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "pp")
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "cresc.").addExtension(Score.NoteLength.Half)
        .addNote(0, "E4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth)
        .addNote(0, "C4", Score.NoteLength.Quarter).addAnnotation(Score.Annotation.Dynamics, "pp");

    return doc;
}
