import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createDaCapoDemo() {
    let doc = new Score.MDocument(Score.StaffPreset.Treble);

    doc.setHeader("Da Capo Navigations");

    doc.addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("2/4")
        .setTempo(120)
        .addNote(0, "G4", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.Fine)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.DC_al_Fine);

    return doc;
}
