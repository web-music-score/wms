import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createDynamicsAnnotationDemo() {
    let doc = new Score.MDocument(Score.StaffPreset.GuitarTreble);

    doc.setHeader("Dynamics Annotation");

    doc.addMeasure()
        .setKeySignature("G", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(70)
        .addNote(0, "G3", Theory.NoteLength.Eighth, { stem: Score.Stem.Up }).addAnnotation(Score.Annotation.Dynamics, "ppp")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "pp")
        .addNote(0, "F#4", Theory.NoteLength.Eighth)
        .addNote(0, "E4", Theory.NoteLength.Eighth)
        .addNote(0, "D4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "p")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "mp")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "D4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "m")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "mf")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "f")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "ff")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "fff")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "dim.").addExtension(Infinity)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G4", Theory.NoteLength.Eighth)
        .addNote(0, "F#4", Theory.NoteLength.Eighth)
        .addNote(0, "E4", Theory.NoteLength.Eighth)
        .addNote(0, "D4", Theory.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "ppp")
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "cresc.").addExtension(Infinity)
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
        .addNote(0, "C4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "fff")
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "mf")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "cresc.").addExtension(Theory.NoteLength.Whole)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "F#4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "dim.").addExtension(Theory.NoteLength.Whole)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "dim.").addExtension(Theory.NoteLength.Half)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "E4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "ff");

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "dim.").addExtension(Theory.NoteLength.Half)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "fff")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Eighth);

    doc.addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "pp")
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth).addAnnotation(Score.Annotation.Dynamics, "cresc.").addExtension(Theory.NoteLength.Half)
        .addNote(0, "E4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "C4", Theory.NoteLength.Quarter).addAnnotation(Score.Annotation.Dynamics, "pp");

    return doc;
}
