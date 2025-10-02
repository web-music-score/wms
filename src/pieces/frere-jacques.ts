import { DocumentBuilder, MDocument } from "@tspro/web-music-score/score";

/**
 * Create Frere Jacques (round) music piece.<br />
 * <br />
 * Source: https://musescore.com/user/17324226/scores/7296137
 * 
 * @returns - Music document.
 */
export function createFrereJacques(): MDocument {
    return new DocumentBuilder()
        .setHeader("Frère Jacques", "Traditional")
        .setScoreConfiguration([
            { type: "staff", clef: "G", voiceIds: [0] },
            { type: "staff", clef: "F", voiceIds: [1] }
        ])
        .setMeasuresPerRow(2)

        .addMeasure()
        .setKeySignature("D Major")
        .setTimeSignature("4/4")

        .addNote(0, "D4", "4n", { stem: "up" }).addLyrics(1, "4n", "Are")
        .addNote(0, "E4", "4n").addLyrics(1, "4n", "you")
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "sleep -")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "ing?")
        .addRest(1, "1n", { staffPos: "F3" })

        .addMeasure()
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "Are")
        .addNote(0, "E4", "4n").addLyrics(1, "4n", "you")
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "sleep -")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "ing?")
        .addRest(1, "1n", { staffPos: "F3" })

        .addMeasure()
        .addNavigation("startRepeat")
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "Bro -")
        .addNote(0, "G4", "4n").addLyrics(1, "4n", "ther")
        .addNote(0, "A4", "2n").addLyrics(1, "4n", "John?")
        .addNote(1, "D3", "4n", { stem: "down" }).addLyricsTo(1, 1, "4n", "Are")
        .addNote(1, "E3", "4n").addLyricsTo(1, 1, "4n", "you")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "4n", "sleep -")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "4n", "ing?")

        .addMeasure()
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "Bro -")
        .addNote(0, "G4", "4n").addLyrics(1, "4n", "ther")
        .addNote(0, "A4", "2n").addLyrics(1, "4n", "John?")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "4n", "Are")
        .addNote(1, "E3", "4n").addLyricsTo(1, 1, "4n", "you")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "4n", "sleep -")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "4n", "ing?")

        .addMeasure()
        .addNote(0, "A4", "8n").addLyrics(1, "8n", "Morn -")
        .addNote(0, "B4", "8n").addLyrics(1, "8n", "ing")
        .addNote(0, "A4", "8n").addLyrics(1, "8n", "bells")
        .addNote(0, "G4", "8n").addLyrics(1, "8n", "are")
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "ring -")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "ing!")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "4n", "Bro -")
        .addNote(1, "G3", "4n").addLyricsTo(1, 1, "4n", "ther")
        .addNote(1, "A3", "2n").addLyricsTo(1, 1, "2n", "John?")

        .addMeasure()
        .addNote(0, "A4", "8n").addLyrics(1, "8n", "Morn -")
        .addNote(0, "B4", "8n").addLyrics(1, "8n", "ing")
        .addNote(0, "A4", "8n").addLyrics(1, "8n", "bells")
        .addNote(0, "G4", "8n").addLyrics(1, "8n", "are")
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "ring -")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "ing!")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "4n", "Bro -")
        .addNote(1, "G3", "4n").addLyricsTo(1, 1, "4n", "ther")
        .addNote(1, "A3", "2n").addLyricsTo(1, 1, "2n", "John?")

        .addMeasure()
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "Ding")
        .addChord(0, ["C#4", "A4"], "4n").addLyrics(1, "4n", "ding")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "dong!")
        .addRest(0, "4n")
        .addNote(1, "A3", "8n").addLyricsTo(1, 1, "8n", "Morn -")
        .addNote(1, "B3", "8n").addLyricsTo(1, 1, "8n", "ing")
        .addNote(1, "A3", "8n").addLyricsTo(1, 1, "8n", "bells")
        .addNote(1, "G3", "8n").addLyricsTo(1, 1, "8n", "are")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "4n", "ring -")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "4n", "ing!")

        .addMeasure()
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "Ding")
        .addChord(0, ["C#4", "A4"], "4n").addLyrics(1, "4n", "ding")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "dong!")
        .addRest(0, "4n")
        .addNote(1, "A3", "8n").addLyricsTo(1, 1, "8n", "Morn -")
        .addNote(1, "B3", "8n").addLyricsTo(1, 1, "8n", "ing")
        .addNote(1, "A3", "8n").addLyricsTo(1, 1, "8n", "bells")
        .addNote(1, "G3", "8n").addLyricsTo(1, 1, "8n", "are")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "4n", "ring -")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "4n", "ing!")

        .addMeasure()
        .setMeasuresPerRow(4)
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "Are")
        .addNote(0, "E4", "4n").addLyrics(1, "4n", "you")
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "sleep -")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "ing?")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "4n", "Ding")
        .addChord(1, ["C#3", "A3"], "4n").addLyricsTo(1, 1, "4n", "ding")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "4n", "dong!")
        .addRest(1, "4n")

        .addMeasure()
        .addNavigation("endRepeat")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "Are")
        .addNote(0, "E4", "4n").addLyrics(1, "4n", "you")
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "sleep -")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "ing?")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "4n", "Ding")
        .addChord(1, ["C#3", "A3"], "4n").addLyricsTo(1, 1, "4n", "ding")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "4n", "dong!")
        .addRest(1, "4n")

        .addMeasure()
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "YES")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "I'm")
        .addNote(0, "F#4", "4n").addLyrics(1, "4n", "SLEEP-")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "ING")
        .addNote(1, "A3", "4n")
        .addNote(1, "F#3", "4n")
        .addNote(1, "A3", "4n")
        .addNote(1, "F#3", "4n")

        .addMeasure()
        .addNote(0, "A3", "4n").addLyrics(1, "4n", "Please")
        .addNote(0, "C#4", "8n").addLyrics(1, "8n", "GO")
        .addNote(0, "C#4", "8n").addLyrics(1, "8n", "A-")
        .addNote(0, "D4", "2n").addLyrics(1, "4n", "WAY!")
        .addNote(1, "D3", "4n")
        .addNote(1, "E3", "4n")
        .addNote(1, "F#3", "2n")

        .getDocument();
}
