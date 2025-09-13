import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createStaccatoDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration(Score.StaffPreset.Treble)
        .setHeader("Staccato")

        .addMeasure()
        .setKeySignature("E", Theory.ScaleType.NaturalMinor)
        .setTimeSignature("4/4")
        .addNote(0, "E4", "8n", { staccato: true, stem: Score.Stem.Up })
        .addNote(0, "F#4", "8n", { staccato: true })
        .addNote(0, "G4", "4n", { staccato: true })
        .addNote(0, "B4", "8n", { staccato: true, stem: Score.Stem.Down })
        .addNote(0, "C5", "8n", { staccato: true })
        .addNote(0, "D5", "4n", { staccato: true })

        .addMeasure()
        .addNote(0, "E4", "8n", { stem: Score.Stem.Up })
        .addNote(0, "F#4", "8n")
        .addNote(0, "G4", "4n")
        .addNote(0, "B4", "8n", { stem: Score.Stem.Down })
        .addNote(0, "C5", "8n")
        .addNote(0, "D5", "4n")

        .getDocument();
}
