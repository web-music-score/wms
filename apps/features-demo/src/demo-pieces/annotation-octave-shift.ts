import * as Score from "web-music-score/score";

export function createAnnotationOctaveShiftDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Annotation: Octave Shift")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("G", "Major")
        .setTimeSignature("4/4")
        .setTempo(120)
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")

        .addMeasure()
        .addNote(0, "G3", "4n").addAnnotation("8va")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")

        .addMeasure()
        .addNote(0, "G3", "4n").addAnnotation("8vb")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        
        .addMeasure()
        .addNote(0, "G3", "4n").addAnnotation("loco")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .endRow()

        .addMeasure()
        .addNote(0, "G3", "4n").addAnnotation("8va").addExtension(ext => ext.notes("4n", 2))
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")

        .addMeasure()
        .addNote(0, "G3", "4n").addAnnotation("8vb").addExtension(ext => ext.notes("4n", 2))
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")

        .getDocument();
}
