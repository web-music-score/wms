import * as Score from "@tspro/web-music-score/score";

export function createNavigationRepeatEndingDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Navigation: Repeat & Ending")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("A", "Major")
        .setTimeSignature("3/4")
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")

        .addMeasure()
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .addNavigation("endRepeat", 3)

        .addMeasure()
        .addNavigation("startRepeat")
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")

        .addMeasure()
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .endRow()

        .addMeasure()
        .addNavigation("ending", 1)
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")

        .addMeasure()
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")

        .addMeasure()
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .addNavigation("endRepeat")
        .endRow()

        .addMeasure()
        .addNavigation("ending", 2)
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")

        .addMeasure()
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .endRow()

        .addMeasure()
        .addNavigation("startRepeat")
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")

        .addMeasure()
        .addNavigation("ending", 1)
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "2n")
        .addNavigation("endRepeat")

        .addMeasure()
        .addNavigation("ending", 2)
        .addNote(0, "A3", "2.")

        .getDocument();
}
