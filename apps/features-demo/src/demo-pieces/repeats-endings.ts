import * as Score from "@tspro/web-music-score";

export function createRepeatsAndEndingsDemo() {
    let doc = new Score.MDocument(Score.StaffKind.TrebleForGuitar);

    doc.setHeader("Repeats And Endings");

    doc.addMeasure()
        .setKeySignature("A", Score.ScaleType.Major)
        .setTimeSignature("3/4")
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half)
        .addNavigation(Score.Navigation.EndRepeat, 2);

    doc.addMeasure()
        .addNavigation(Score.Navigation.StartRepeat)
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half)
        .endRow();

    doc.addMeasure()
        .addNavigation(Score.Navigation.Ending, 1)
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half)
        .addNavigation(Score.Navigation.EndRepeat)
        .endRow();

    doc.addMeasure()
        .addNavigation(Score.Navigation.Ending, 2)
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half)
        .endRow();

    doc.addMeasure()
        .addNavigation(Score.Navigation.StartRepeat)
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half);

    doc.addMeasure()
        .addNavigation(Score.Navigation.Ending, 1)
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Half)
        .addNavigation(Score.Navigation.EndRepeat);

    doc.addMeasure()
        .addNavigation(Score.Navigation.Ending, 2)
        .addNote(0, "A3", Score.NoteLength.Half, { dotted: true });

    return doc;
}
