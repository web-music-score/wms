import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createRepeatsAndEndingsDemo() {
    return new Score.DocumentBuilder(Score.StaffPreset.GuitarTreble)

        .setHeader("Repeats And Endings")

        .addMeasure()
        .setKeySignature("A", Theory.ScaleType.Major)
        .setTimeSignature("3/4")
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.EndRepeat, 3)

        .addMeasure()
        .addNavigation(Score.Navigation.StartRepeat)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .endRow()

        .addMeasure()
        .addNavigation(Score.Navigation.Ending, 1)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.EndRepeat)
        .endRow()

        .addMeasure()
        .addNavigation(Score.Navigation.Ending, 2)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .endRow()

        .addMeasure()
        .addNavigation(Score.Navigation.StartRepeat)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)

        .addMeasure()
        .addNavigation(Score.Navigation.Ending, 1)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Half)
        .addNavigation(Score.Navigation.EndRepeat)

        .addMeasure()
        .addNavigation(Score.Navigation.Ending, 2)
        .addNote(0, "A3", Theory.NoteLength.Half, { dotted: true })

        .getDocument();
}
