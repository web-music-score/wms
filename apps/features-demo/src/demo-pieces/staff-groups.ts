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
        .addNote(0, "C4", "4n").addFermataTo("grp1", "atNote")
        .addNote(0, "C4", "4n").addFermataTo("grp2", "atNote")
        .addNote(0, "C4", "4n").addFermataTo("grp3", "atNote")
        .addNote(0, "C4", "4n")

        .addMeasure()
        .addNote(0, "C4", "4n").addFermataTo("grp4", "atNote")
        .addNote(0, "C4", "4n").addFermataTo("grp5", "atNote")
        .addNote(0, "C4", "4n").addFermataTo("grp6", "atNote")
        .addNote(0, "C4", "4n")

        .addMeasure()
        .addNote(0, "C4", "4n").addFermataTo("grp7", "atNote")
        .addNote(0, "C4", "4n").addFermataTo("grp8", "atNote")
        .addNote(0, "C4", "4n").addFermataTo("grp9", "atNote")
        .addNote(0, "C4", "4n").addFermataTo("grp10", "atNote")

        .getDocument();
}
