import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createDalSegnoDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration(Score.StaffPreset.Treble)
        .setHeader("Dal Segno Navigations")

        .addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("2/4")
        .setTempo(120)
        .addNote(0, "G4", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.Segno)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .endRow()

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.toCoda)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .endRow()

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.DS_al_Coda)

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.Coda)

        .getDocument();
}
