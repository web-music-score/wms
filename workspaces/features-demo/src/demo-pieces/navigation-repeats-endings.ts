import * as Score from "web-music-score/score";

export function createNavigationRepeatEndingDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Navigation: Repeat & Ending")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("A", "Major")
        .setTimeSignature("3/4")
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .addAnnotation("endRepeat", { playCount: 3 })

        .addMeasure()
        .addAnnotation("startRepeat")
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .endRow()

        .addMeasure()
        .addAnnotation("ending", { playNumbers: [1, 2] })
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")

        .addMeasure()
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .addAnnotation("endRepeat")
        .endRow()

        .addMeasure()
        .addAnnotation("ending", { playNumbers: 3 })
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")

        .addMeasure()
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .endRow()

        .addMeasure()
        .addAnnotation("startRepeat")
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")

        .addMeasure()
        .addAnnotation("ending", { playNumbers: 1 })
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .addAnnotation("endRepeat")

        .addMeasure()
        .addAnnotation("ending", { playNumbers: 2 })
        .addNote(0, "A3", "2.")

        .getDocument();
}
