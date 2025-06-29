import { NoteLength, ScaleType } from "../music-theory";
import { MDocument } from "../music-score/pub/interface";
import { Arpeggio, Navigation, StaffKind, Stem, Annotation, Label } from "../music-score/pub";

// Greensleeves (https://musescore.com/aaron_dc/scores/6167495)

/** @public */
export function createGreensleeves(): MDocument {
    let doc = new MDocument(StaffKind.TrebleForGuitar);

    doc.setHeader("Greensleeves");

    doc.addMeasure()
        .setKeySignature("C", ScaleType.Major)
        .setTimeSignature("6/8")
        .setTempo(140)
        .addNote(0, "A3", NoteLength.Eighth);

    doc.addMeasure()
        .addNavigation(Navigation.StartRepeat)
        .addNote(0, "C4", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "Am")
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth, { dotted: true })
        .addNote(0, "F4", NoteLength.Sixteenth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "E3", NoteLength.Quarter)
        .addNote(1, "A2", NoteLength.Eighth)
        .addNote(1, "E3", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "G")
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(0, "G3", NoteLength.Eighth, { dotted: true }).addLabel(Label.Chord, "Em")
        .addNote(0, "A3", NoteLength.Sixteenth)
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(1, "G2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "D3", NoteLength.Quarter)
        .addNote(1, "E2", NoteLength.Eighth)
        .addNote(1, "B2", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "C4", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "Am")
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "A3", NoteLength.Eighth, { dotted: true }).addLabel(Label.Chord, "F")
        .addNote(0, "G#3", NoteLength.Sixteenth)
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "E3", NoteLength.Quarter)
        .addNote(1, "F2", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "B3", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "E")
        .addNote(0, "G#3", NoteLength.Eighth)
        .addNote(0, "E3", NoteLength.Quarter)
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(1, "E2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "B2", NoteLength.Quarter)
        .addNote(1, "E2", NoteLength.Eighth)
        .addNote(1, "B2", NoteLength.Quarter)
        .endRow();

    doc.addMeasure()
        .addNote(0, "C4", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "Am")
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth, { dotted: true })
        .addNote(0, "F4", NoteLength.Sixteenth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "E3", NoteLength.Quarter)
        .addNote(1, "A2", NoteLength.Eighth)
        .addNote(1, "E3", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "G")
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(0, "G3", NoteLength.Eighth, { dotted: true }).addLabel(Label.Chord, "Em")
        .addNote(0, "A3", NoteLength.Sixteenth)
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(1, "G2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "D3", NoteLength.Quarter)
        .addNote(1, "E2", NoteLength.Eighth)
        .addNote(1, "B2", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "C4", NoteLength.Eighth, { dotted: true, stem: Stem.Up }).addLabel(Label.Chord, "Am")
        .addNote(0, "B3", NoteLength.Sixteenth)
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "G#3", NoteLength.Eighth, { dotted: true }).addLabel(Label.Chord, "E")
        .addNote(0, "F#3", NoteLength.Sixteenth)
        .addNote(0, "G#3", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "E3", NoteLength.Quarter)
        .addNote(1, "E2", NoteLength.Eighth)
        .addNote(1, "B2", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "A3", NoteLength.Quarter, { dotted: true, stem: Stem.Up }).addLabel(Label.Chord, "Am")
        .addNote(0, "A3", NoteLength.Quarter, { dotted: true })
        .addNote(1, "A2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "E3", NoteLength.Eighth)
        .addNote(1, "C4", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Quarter, { dotted: true })
        .endRow();

    doc.addMeasure()
        .addChord(0, ["C3", "E3", "G3", "C4", "G4"], NoteLength.Quarter, { dotted: true, arpeggio: Arpeggio.Up, stem: Stem.Up }).addLabel(Label.Chord, "C")
        .addNote(0, "G4", NoteLength.Eighth, { dotted: true })
        .addNote(0, "F#4", NoteLength.Sixteenth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addRest(1, NoteLength.Quarter, { dotted: true, hide: true })
        .addNote(1, "C3", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "G3", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "G")
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(0, "G3", NoteLength.Eighth, { dotted: true }).addLabel(Label.Chord, "Em")
        .addNote(0, "A3", NoteLength.Sixteenth)
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(1, "G2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "D3", NoteLength.Quarter)
        .addNote(1, "E2", NoteLength.Eighth)
        .addNote(1, "B2", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "C4", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "Am")
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "A3", NoteLength.Eighth, { dotted: true }).addLabel(Label.Chord, "F")
        .addNote(0, "G#3", NoteLength.Sixteenth)
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "E3", NoteLength.Quarter)
        .addNote(1, "F2", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "B3", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "E")
        .addNote(0, "G#3", NoteLength.Eighth)
        .addNote(0, "E3", NoteLength.Quarter, { dotted: true })
        .addNote(1, "E2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "B2", NoteLength.Quarter)
        .addNote(1, "E2", NoteLength.Eighth)
        .addNote(1, "B2", NoteLength.Eighth)
        .addNote(1, "E3", NoteLength.Eighth)
        .endRow();

    doc.addMeasure()
        .addNote(0, "G4", NoteLength.Quarter, { dotted: true, stem: Stem.Up }).addLabel(Label.Chord, "C")
        .addNote(0, "G4", NoteLength.Eighth, { dotted: true })
        .addNote(0, "F#4", NoteLength.Sixteenth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(1, "C3", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "G3", NoteLength.Eighth)
        .addNote(1, "C4", NoteLength.Eighth)
        .addNote(1, "C3", NoteLength.Eighth)
        .addNote(1, "G3", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Quarter, { stem: Stem.Up }).addLabel(Label.Chord, "G")
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(0, "G3", NoteLength.Eighth, { dotted: true }).addLabel(Label.Chord, "Em")
        .addNote(0, "A3", NoteLength.Sixteenth)
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(1, "G2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "D3", NoteLength.Quarter)
        .addNote(1, "E2", NoteLength.Eighth)
        .addNote(1, "B2", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "C4", NoteLength.Eighth, { dotted: true, stem: Stem.Up }).addLabel(Label.Chord, "Am")
        .addNote(0, "B3", NoteLength.Sixteenth)
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "G#3", NoteLength.Eighth, { dotted: true }).addLabel(Label.Chord, "E")
        .addNote(0, "F#3", NoteLength.Sixteenth)
        .addNote(0, "G#3", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "E3", NoteLength.Quarter)
        .addNote(1, "E2", NoteLength.Eighth)
        .addNote(1, "B2", NoteLength.Quarter);

    doc.addMeasure()
        .addNavigation(Navigation.Ending, 1)
        .addNavigation(Navigation.EndRepeat)
        .addNote(0, "A3", NoteLength.Quarter, { dotted: true, stem: Stem.Up }).addLabel(Label.Chord, "Am")
        .addNote(0, "A3", NoteLength.Quarter)
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "E3", NoteLength.Eighth)
        .addNote(1, "C4", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Quarter, { dotted: true });

    doc.addMeasure()
        .addNavigation(Navigation.Ending, 2)
        .addNote(0, "A3", NoteLength.Quarter, { dotted: true, stem: Stem.Up }).addLabel(Label.Chord, "Am")
        .addNote(0, "A3", NoteLength.Quarter, { dotted: true }).addFermata()
        .addNote(1, "A2", NoteLength.Eighth, { stem: Stem.Down })
        .addNote(1, "E3", NoteLength.Eighth)
        .addNote(1, "C4", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Quarter, { dotted: true });

    return doc;
}
