import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createStaffGroupsDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration([
            { type: "staff", clef: Score.Clef.G, isOctaveDown: true, name: "staff1" },
            { type: "staff", clef: Score.Clef.G, isOctaveDown: true, name: "staff2" }
        ])
        .setHeader("Staff Groups")

        .addStaffGroup("grp1", ["staff1"], Score.VerticalPosition.Above)
        .addStaffGroup("grp2", ["staff1"], Score.VerticalPosition.Below)
        .addStaffGroup("grp3", ["staff1"], Score.VerticalPosition.Both)
        .addStaffGroup("grp4", ["staff2"], Score.VerticalPosition.Above)
        .addStaffGroup("grp5", ["staff2"], Score.VerticalPosition.Below)
        .addStaffGroup("grp6", ["staff2"], Score.VerticalPosition.Both)
        .addStaffGroup("grp7", ["grp1", "grp5"])
        .addStaffGroup("grp8", ["grp2", "grp4"])

        .addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "C4", Theory.NoteLength.Quarter).addFermataTo("grp1", Score.Fermata.AtNote)
        .addNote(0, "C4", Theory.NoteLength.Quarter).addFermataTo("grp2", Score.Fermata.AtNote)
        .addNote(0, "C4", Theory.NoteLength.Quarter).addFermataTo("grp3", Score.Fermata.AtNote)
        .addNote(0, "C4", Theory.NoteLength.Quarter)

        .addMeasure()
        .addNote(0, "C4", Theory.NoteLength.Quarter).addFermataTo("grp4", Score.Fermata.AtNote)
        .addNote(0, "C4", Theory.NoteLength.Quarter).addFermataTo("grp5", Score.Fermata.AtNote)
        .addNote(0, "C4", Theory.NoteLength.Quarter).addFermataTo("grp6", Score.Fermata.AtNote)
        .addNote(0, "C4", Theory.NoteLength.Quarter)

        .addMeasure()
        .addNote(0, "C4", Theory.NoteLength.Half).addFermataTo("grp7", Score.Fermata.AtNote)
        .addNote(0, "C4", Theory.NoteLength.Half).addFermataTo("grp8", Score.Fermata.AtNote)

        .getDocument();
}
