import * as Score from "web-music-score/score";

export function createNoteArticulationsDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Note Articulations")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("C Major")
        .setTimeSignature("C")
        .setTempo(80)
        .addNote(0, "C4", "4n").addAnnotation("staccato")
        .addNote(0, "E4", "4n").addAnnotation("staccatissimo")
        .addNote(0, "G4", "4n").addAnnotation("spiccato")
        .addNote(0, "C5", "4n").addAnnotation("accent")

        .addMeasure()
        .addNote(0, "C4", "4n").addAnnotation("marcato")
        .addNote(0, "E4", "4n").addAnnotation("tenuto")
        .addNote(0, "G4", "4n").addAnnotation("portato")
        .addNote(0, "C4", "4n").addAnnotation("staccato").addAnnotation("staccatissimo").addAnnotation("spiccato").addAnnotation("accent").addAnnotation("marcato").addAnnotation("tenuto")

        .addMeasure()
        .addNote(0, "C3", "4n").addAnnotation("staccato")
        .addNote(0, "E3", "4n").addAnnotation("staccatissimo")
        .addNote(0, "G3", "4n").addAnnotation("spiccato")
        .addNote(0, "C3", "4n").addAnnotation("accent")

        .addMeasure()
        .addNote(0, "C3", "4n").addAnnotation("marcato")
        .addNote(0, "E3", "4n").addAnnotation("tenuto")
        .addNote(0, "G3", "4n").addAnnotation("portato")
        .addNote(0, "C3", "4n").addAnnotation("staccato").addAnnotation("staccatissimo").addAnnotation("spiccato").addAnnotation("accent").addAnnotation("marcato").addAnnotation("tenuto")

        .getDocument();
}
