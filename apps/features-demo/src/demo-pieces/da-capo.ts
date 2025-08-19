import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createDaCapoDemo() {
    return new Score.DocumentBuilder(Score.StaffPreset.Treble)

        .setHeader("Da Capo Navigations")

        .addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("2/4")
        .setTempo(120)
        .addNote(0, "G4", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.Fine)
        .endRow()

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.DC_al_Fine)

        .getDocument();
}
