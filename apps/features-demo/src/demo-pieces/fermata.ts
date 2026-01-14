import * as Score from "web-music-score/score";

export function createFermataDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Fermata")
        .setScoreConfiguration("bass")

        .addStaffGroup("both", 0, "both")
        .addStaffGroup("above", 0, "above")
        .addStaffGroup("below", 0, "below")

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addNote(0, "C3", "4n")
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addNote(0, "C3", "4n")
        .addAnnotation("articulation", "measureEndFermata")

        .addMeasure()
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addNote(0, "C4", "4n").addAnnotationTo("above", "articulation", "fermata")
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addNote(0, "C3", "4n").addAnnotationTo("below", "articulation", "fermata")

        .addMeasure()
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addRest(0, "4n").addAnnotation("fermata")
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addRest(0, "4n")
        .addAnnotationTo("both", "measureEndFermata")

        .getDocument();
}
