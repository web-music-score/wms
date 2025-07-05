import { NoteLength, ScaleType } from "../music-theory";
import { MDocument } from "../music-score/pub/interface";
import { ArcPos, Navigation, Annotation, StaffKind, Stem } from "../music-score/pub";

/** @public */
export function createAndanteByDiabelli(): MDocument {
    let doc = new MDocument(StaffKind.GuitarTreble);

    doc.setHeader("Andante", "A. Diabelli");

    doc.addMeasure()
        .setKeySignature("D", ScaleType.Major)
        .setTimeSignature("3/4")
        .setTempo(80)
        .addRest(0, NoteLength.Eighth, { pitch: "G4" }).addAnnotation(Annotation.Dynamics, "p")
        .addNote(0, "F#4", NoteLength.Eighth, { stem: Stem.Up })
        .addNote(0, "G4", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "F#4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(1, "D3", NoteLength.Half, { dotted: true, stem: Stem.Down });

    doc.addMeasure()
        .addNote(0, "C#4", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "F#4", NoteLength.Eighth)
        .addNote(0, "G4", NoteLength.Quarter)
        .addNote(1, "A2", NoteLength.Half, { dotted: true });

    doc.addMeasure()
        .addRest(0, NoteLength.Eighth, { pitch: "B3" }).addAnnotation(Annotation.Dynamics, "f")
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "G#3", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(0, "C#4", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Half, { dotted: true })
        .endRow();

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "F#4", NoteLength.Eighth)
        .addNote(0, "G4", NoteLength.Eighth)
        .addNote(0, "A4", NoteLength.Quarter)
        .addNote(1, "D3", NoteLength.Half, { dotted: true });

    doc.addMeasure()
        .addRest(0, NoteLength.Eighth, { pitch: "G4" }).addAnnotation(Annotation.Dynamics, "p")
        .addNote(0, "F#4", NoteLength.Eighth)
        .addNote(0, "G4", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "F#4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(1, "D3", NoteLength.Half, { dotted: true });

    doc.addMeasure()
        .addNote(0, "C#4", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "F#4", NoteLength.Eighth)
        .addNote(0, "G4", NoteLength.Quarter)
        .addNote(1, "A2", NoteLength.Half, { dotted: true })
        .endRow();

    doc.addMeasure()
        .addRest(0, NoteLength.Eighth, { pitch: "B3" }).addAnnotation(Annotation.Dynamics, "f")
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "G#3", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(0, "C#4", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Half, { dotted: true });

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Quarter)
        .addRest(1, NoteLength.Quarter, { pitch: "D3" })
        .addNote(0, "D3", NoteLength.Quarter) // Stem up...
        .addNote(1, "D3", NoteLength.Quarter) // ...and down
        .addRest(1, NoteLength.Quarter, { pitch: "B3" })
        .addNavigation(Navigation.EndRepeat);

    doc.addMeasure()
        .addRest(0, NoteLength.Eighth, { pitch: "D4" }).addAnnotation(Annotation.Dynamics, "f")
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "C#4", NoteLength.Eighth)
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(1, "E2", NoteLength.Half, { dotted: true })
        .endRow();

    doc.addMeasure()
        .addNote(0, "C#4", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "F#4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Quarter)
        .addNote(1, "A2", NoteLength.Half, { dotted: true });

    doc.addMeasure()
        .addRest(0, NoteLength.Eighth, { pitch: "B3" }).addAnnotation(Annotation.Dynamics, "p")
        .addNote(0, "E3", NoteLength.Eighth)
        .addNote(0, "D#3", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "E3", NoteLength.Eighth)
        .addNote(0, "F#3", NoteLength.Eighth)
        .addNote(0, "G#3", NoteLength.Eighth)
        .addNote(1, "E2", NoteLength.Half, { dotted: true });

    doc.addMeasure()
        .addNote(0, "A3", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "G#3", NoteLength.Eighth)
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(0, "C#4", NoteLength.Quarter)
        .addNote(1, "A2", NoteLength.Half, { dotted: true })
        .endRow();

    doc.addMeasure()
        .addRest(0, NoteLength.Eighth, { pitch: "G4" }).addAnnotation(Annotation.Dynamics, "f")
        .addNote(0, "G4", NoteLength.Eighth)
        .addNote(0, "A4", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "G4", NoteLength.Eighth)
        .addNote(0, "F#4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Half, { dotted: true });

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "C#4", NoteLength.Eighth)
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "F#4", NoteLength.Quarter)
        .addNote(1, "D3", NoteLength.Half, { dotted: true });

    doc.addMeasure()
        .addRest(0, NoteLength.Eighth, { pitch: "B3" }).addAnnotation(Annotation.Dynamics, "ff")
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "G#3", NoteLength.Eighth, { slurSpan: 2, slurPos: ArcPos.Below })
        .addNote(0, "A3", NoteLength.Eighth)
        .addNote(0, "B3", NoteLength.Eighth)
        .addNote(0, "C#4", NoteLength.Eighth)
        .addNote(1, "A2", NoteLength.Half, { dotted: true });

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Quarter)
        .addRest(1, NoteLength.Quarter, { pitch: "D3" })
        .addNote(0, "D3", NoteLength.Quarter) // Stem up... 
        .addNote(1, "D3", NoteLength.Quarter) // ...and down
        .addRest(1, NoteLength.Quarter, { pitch: "B3" })
        .endSong();

    return doc;
}
