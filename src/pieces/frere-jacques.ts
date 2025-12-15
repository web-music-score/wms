import { DocumentBuilder, MDocument } from "web-music-score/score";

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
            { type: "staff", clef: "G", voiceId: 0, instrument: "!{Piano" },
            { type: "staff", clef: "F", voiceId: 1, instrument: "!{Piano" }
        ])
        .setMeasuresPerRow(2)

        .addMeasure()
        .setKeySignature("D Major")
        .setTimeSignature("4/4")

        .addNote(0, "D4", "4n", { stem: "up" }).addLyrics(1, "Are", "4n")
        .addNote(0, "E4", "4n").addLyrics(1, "you", "4n")
        .addNote(0, "F#4", "4n").addLyrics(1, "sleep", "4n", { hyphen: "-" })
        .addNote(0, "D4", "4n").addLyrics(1, "ing?", "4n")
        .addRest(1, "1n", { staffPos: "F3" })

        .addMeasure()
        .addNote(0, "D4", "4n").addLyrics(1, "Are", "4n")
        .addNote(0, "E4", "4n").addLyrics(1, "you", "4n")
        .addNote(0, "F#4", "4n").addLyrics(1, "sleep", "4n", { hyphen: "-" })
        .addNote(0, "D4", "4n").addLyrics(1, "ing?", "4n")
        .addRest(1, "1n", { staffPos: "F3" })

        .addMeasure()
        .addNavigation("startRepeat")
        .addNote(0, "F#4", "4n").addLyrics(1, "Bro", "4n", { hyphen: "-" })
        .addNote(0, "G4", "4n").addLyrics(1, "ther", "4n")
        .addNote(0, "A4", "2n").addLyrics(1, "John?", "4n")
        .addNote(1, "D3", "4n", { stem: "down" }).addLyricsTo(1, 1, "Are", "4n")
        .addNote(1, "E3", "4n").addLyricsTo(1, 1, "you", "4n")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "sleep", "4n", { hyphen: "-" })
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "ing?", "4n")

        .addMeasure()
        .addNote(0, "F#4", "4n").addLyrics(1, "Bro", "4n", { hyphen: "-" })
        .addNote(0, "G4", "4n").addLyrics(1, "ther", "4n")
        .addNote(0, "A4", "2n").addLyrics(1, "John?", "4n")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "Are", "4n")
        .addNote(1, "E3", "4n").addLyricsTo(1, 1, "you", "4n")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "sleep", "4n", { hyphen: "-" })
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "ing?", "4n")

        .addMeasure()
        .addNote(0, "A4", "8n").addLyrics(1, "Morn", "8n", { hyphen: "-" })
        .addNote(0, "B4", "8n").addLyrics(1, "ing", "8n")
        .addNote(0, "A4", "8n").addLyrics(1, "bells", "8n")
        .addNote(0, "G4", "8n").addLyrics(1, "are", "8n")
        .addNote(0, "F#4", "4n").addLyrics(1, "ring", "4n", { hyphen: "-" })
        .addNote(0, "D4", "4n").addLyrics(1, "ing!", "4n")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "Bro", "4n", { hyphen: "-" })
        .addNote(1, "G3", "4n").addLyricsTo(1, 1, "ther", "4n")
        .addNote(1, "A3", "2n").addLyricsTo(1, 1, "John?", "2n")

        .addMeasure()
        .addNote(0, "A4", "8n").addLyrics(1, "Morn", "8n", { hyphen: "-" })
        .addNote(0, "B4", "8n").addLyrics(1, "ing", "8n")
        .addNote(0, "A4", "8n").addLyrics(1, "bells", "8n")
        .addNote(0, "G4", "8n").addLyrics(1, "are", "8n")
        .addNote(0, "F#4", "4n").addLyrics(1, "ring", "4n", { hyphen: "-" })
        .addNote(0, "D4", "4n").addLyrics(1, "ing!", "4n")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "Bro", "4n", { hyphen: "-" })
        .addNote(1, "G3", "4n").addLyricsTo(1, 1, "ther", "4n")
        .addNote(1, "A3", "2n").addLyricsTo(1, 1, "John?", "2n")

        .addMeasure()
        .addNote(0, "D4", "4n").addLyrics(1, "Ding", "4n")
        .addChord(0, ["C#4", "A4"], "4n").addLyrics(1, "ding", "4n")
        .addNote(0, "D4", "4n").addLyrics(1, "dong!", "4n")
        .addRest(0, "4n")
        .addNote(1, "A3", "8n").addLyricsTo(1, 1, "Morn", "8n", { hyphen: "-" })
        .addNote(1, "B3", "8n").addLyricsTo(1, 1, "ing", "8n")
        .addNote(1, "A3", "8n").addLyricsTo(1, 1, "bells", "8n")
        .addNote(1, "G3", "8n").addLyricsTo(1, 1, "are", "8n")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "ring", "4n", { hyphen: "-" })
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "ing!", "4n")

        .addMeasure()
        .addNote(0, "D4", "4n").addLyrics(1, "Ding", "4n")
        .addChord(0, ["C#4", "A4"], "4n").addLyrics(1, "ding", "4n")
        .addNote(0, "D4", "4n").addLyrics(1, "dong!", "4n")
        .addRest(0, "4n")
        .addNote(1, "A3", "8n").addLyricsTo(1, 1, "Morn", "8n", { hyphen: "-" })
        .addNote(1, "B3", "8n").addLyricsTo(1, 1, "ing", "8n")
        .addNote(1, "A3", "8n").addLyricsTo(1, 1, "bells", "8n")
        .addNote(1, "G3", "8n").addLyricsTo(1, 1, "are", "8n")
        .addNote(1, "F#3", "4n").addLyricsTo(1, 1, "ring", "4n", { hyphen: "-" })
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "ing!", "4n")

        .addMeasure()
        .setMeasuresPerRow(4)
        .addNote(0, "D4", "4n").addLyrics(1, "Are", "4n")
        .addNote(0, "E4", "4n").addLyrics(1, "you", "4n")
        .addNote(0, "F#4", "4n").addLyrics(1, "sleep", "4n", { hyphen: "-" })
        .addNote(0, "D4", "4n").addLyrics(1, "ing?", "4n")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "Ding", "4n")
        .addChord(1, ["C#3", "A3"], "4n").addLyricsTo(1, 1, "ding", "4n")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "dong!", "4n")
        .addRest(1, "4n")

        .addMeasure()
        .addNavigation("endRepeat")
        .addNote(0, "D4", "4n").addLyrics(1, "Are", "4n")
        .addNote(0, "E4", "4n").addLyrics(1, "you", "4n")
        .addNote(0, "F#4", "4n").addLyrics(1, "sleep", "4n", { hyphen: "-" })
        .addNote(0, "D4", "4n").addLyrics(1, "ing?", "4n")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "Ding", "4n")
        .addChord(1, ["C#3", "A3"], "4n").addLyricsTo(1, 1, "ding", "4n")
        .addNote(1, "D3", "4n").addLyricsTo(1, 1, "dong!", "4n")
        .addRest(1, "4n")

        .addMeasure()
        .addNote(0, "F#4", "4n").addLyrics(1, "YES", "4n")
        .addNote(0, "D4", "4n").addLyrics(1, "I'm", "4n")
        .addNote(0, "F#4", "4n").addLyrics(1, "SLEEP", "4n", { hyphen: "-" })
        .addNote(0, "D4", "4n").addLyrics(1, "ING", "4n")
        .addNote(1, "A3", "4n")
        .addNote(1, "F#3", "4n")
        .addNote(1, "A3", "4n")
        .addNote(1, "F#3", "4n")

        .addMeasure()
        .addNote(0, "A3", "4n").addLyrics(1, "Please", "4n")
        .addNote(0, "C#4", "8n").addLyrics(1, "GO", "8n")
        .addNote(0, "C#4", "8n").addLyrics(1, "A", "8n", { hyphen: "-" })
        .addNote(0, "D4", "2n").addLyrics(1, "WAY!", "4n")
        .addNote(1, "D3", "4n")
        .addNote(1, "E3", "4n")
        .addNote(1, "F#3", "2n")

        .getDocument();
}
