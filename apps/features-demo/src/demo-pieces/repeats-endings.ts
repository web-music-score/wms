import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createRepeatsAndEndingsDemo() {
    let doc = new Score.MDocument(Score.StaffPreset.GuitarTreble);

    doc.setHeader("Repeats And Endings");

    doc.addMeasure()
        .setKeySignature("A", Theory.ScaleType.Major)
        .setTimeSignature("3/4")
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.EndRepeat, 3);

    doc.addMeasure()
        .addNavigation(Score.Navigation.StartRepeat)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .endRow();

    doc.addMeasure()
        .addNavigation(Score.Navigation.Ending, 1)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.EndRepeat)
        .endRow();

    doc.addMeasure()
        .addNavigation(Score.Navigation.Ending, 2)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .endRow();

    doc.addMeasure()
        .addNavigation(Score.Navigation.StartRepeat)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half);

    doc.addMeasure()
        .addNavigation(Score.Navigation.Ending, 1)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.EndRepeat);

    doc.addMeasure()
        .addNavigation(Score.Navigation.Ending, 2)
        .addNote(0, "A3", Theory.NoteLength.Half, { dotted: true });

    return doc;
}
