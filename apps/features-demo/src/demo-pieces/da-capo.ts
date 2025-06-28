import * as Score from "@tspro/web-music-score";

export function createDaCapoDemo() {
    let doc = new Score.MDocument(Score.StaffKind.Treble);

    doc.setHeader("Da Capo Navigations");

    doc.addMeasure()
        .setKeySignature("C", Score.ScaleType.Major)
        .setTimeSignature("2/4")
        .setTempo(120)
        .addNote(0, "G4", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Score.NoteLength.Half)
        .addNavigation(Score.Navigation.Fine)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G4", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Score.NoteLength.Half)
        .addNavigation(Score.Navigation.DC_al_Fine);

    return doc;
}
