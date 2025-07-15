import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createDalSegnoDemo() {
    let doc = new Score.MDocument(Score.StaffKind.Treble);

    doc.setHeader("Dal Segno Navigations");

    doc.addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("2/4")
        .setTempo(120)
        .addNote(0, "G4", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.Segno);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.toCoda);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.DS_al_Coda);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.Coda);

    return doc;
}
