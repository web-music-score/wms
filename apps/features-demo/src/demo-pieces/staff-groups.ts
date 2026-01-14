import * as Score from "web-music-score/score";

export function createStaffGroupsDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Staff Groups")
        .setScoreConfiguration([
            { type: "staff", clef: Score.Clef.G, isOctaveDown: true, name: "staff1" },
            { type: "staff", clef: Score.Clef.G, isOctaveDown: true, name: "staff2" }
        ])

        .addStaffGroup("grp1", ["staff1"], "above")
        .addStaffGroup("grp2", ["staff1"], "below")
        .addStaffGroup("grp3", ["staff1"], "both")
        .addStaffGroup("grp4", ["staff2"], "above")
        .addStaffGroup("grp5", ["staff2"], "below")
        .addStaffGroup("grp6", ["staff2"], "both")
        .addStaffGroup("grp7", ["grp1", "grp5"])
        .addStaffGroup("grp8", ["grp2", "grp4"])
        .addStaffGroup("grp9", ["grp1", "grp4"])
        .addStaffGroup("grp10", ["grp2", "grp5"])

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "C4", "4n").addAnnotationTo("grp1", "fermata")
        .addNote(0, "C4", "4n").addAnnotationTo("grp2", "fermata")
        .addNote(0, "C4", "4n").addAnnotationTo("grp3", "fermata")
        .addNote(0, "C4", "4n")

        .addMeasure()
        .addNote(0, "C4", "4n").addAnnotationTo("grp4", "fermata")
        .addNote(0, "C4", "4n").addAnnotationTo("grp5", "fermata")
        .addNote(0, "C4", "4n").addAnnotationTo("grp6", "fermata")
        .addNote(0, "C4", "4n")

        .addMeasure()
        .addNote(0, "C4", "4n").addAnnotationTo("grp7", "fermata")
        .addNote(0, "C4", "4n").addAnnotationTo("grp8", "fermata")
        .addNote(0, "C4", "4n").addAnnotationTo("grp9", "fermata")
        .addNote(0, "C4", "4n").addAnnotationTo("grp10", "fermata")

        .getDocument();
}
