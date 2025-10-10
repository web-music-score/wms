import * as Pieces from "@tspro/web-music-score/pieces";
import { createNavigationRepeatEndingDemo } from "demo-pieces/navigation-repeats-endings";
import { createNavigationDCAlFineDemo } from "demo-pieces/navigation-DC_al_Fine";
import { createNavigationDCAlCodaDemo } from "demo-pieces/navigation-DC_al_Coda";
import { createNavigationDSAlFineDemo } from "demo-pieces/navigation-DS_al_Fine";
import { createNavigationDSAlCodaDemo } from "demo-pieces/navigation-DS_al_Coda";
import { createBeamsDetectionDemo } from "demo-pieces/beams-detections";
import { createConnectivesDemo } from "demo-pieces/connectives";
import { createFermataDemo } from "demo-pieces/fermata";
import { createNoteOptionsDemo } from "demo-pieces/note-options";
import { createKeySignaturesDemo } from "demo-pieces/key-signatures";
import { createStaffConfigGrandDemo } from "./staff-grand";
import { createBeamsTupletsDemo } from "./beams-tuplets";
import { createAnnotationTempoDemo } from "./annotation-tempo";
import { createAnnotationDynamicsDemo } from "./annotation-dynamics";
import { createCompleteRestsDemo } from "./complete-rests";
import { createStaffConfigGuitarDemo } from "./staff-guitar";
import { createStaffConfigTabDemo } from "./staff-tab";
import { createStaffGroupsDemo } from "./staff-groups";
import { createLyricsDemo } from "./lyrics";
import * as Score from "@tspro/web-music-score/score";

export class DemoPieces {
    private static instance?: DemoPieces;

    public static getInstance() {
        if (!this.instance) {
            this.instance = new DemoPieces();
        }
        return this.instance
    }

    private readonly docs: (Score.MDocument | string)[] = [];

    private constructor() {
        let pieces: Score.MDocument[] = [];
        let demos: Score.MDocument[] = [];

        // Add sample pieces
        pieces.push(Pieces.createGreensleeves());
        pieces.push(Pieces.createAndanteByDiabelli());
        pieces.push(Pieces.createFrereJacques());
        pieces.push(Pieces.createCanonInD());

        // Add features demos
        demos.push(createNavigationRepeatEndingDemo());
        demos.push(createNavigationDCAlFineDemo());
        demos.push(createNavigationDCAlCodaDemo());
        demos.push(createNavigationDSAlFineDemo());
        demos.push(createNavigationDSAlCodaDemo());
        demos.push(createBeamsDetectionDemo());
        demos.push(createBeamsTupletsDemo());
        demos.push(createConnectivesDemo());
        demos.push(createFermataDemo());
        demos.push(createNoteOptionsDemo());
        demos.push(createKeySignaturesDemo());
        demos.push(createStaffConfigGrandDemo());
        demos.push(createAnnotationTempoDemo());
        demos.push(createAnnotationDynamicsDemo());
        demos.push(createCompleteRestsDemo());
        demos.push(createStaffConfigGuitarDemo());
        demos.push(createStaffConfigTabDemo());
        demos.push(createStaffGroupsDemo());
        demos.push(createLyricsDemo());

        // Sort by title
        pieces.sort((a, b) => (a.getTitle() ?? "").localeCompare(b.getTitle() ?? ""));
        demos.sort((a, b) => (a.getTitle() ?? "").localeCompare(b.getTitle() ?? ""));

        this.docs = [
            "--- Pieces ---",
            ...pieces,
            "--- Features ---",
            ...demos
        ];
    }

    getDefault(): Score.MDocument {
        let first = this.docs.find(doc => doc instanceof Score.MDocument);

        if (first instanceof Score.MDocument) {
            return first;
        }
        else {
            throw "No default document available!";
        }
    }

    getDocument(title: string): Score.MDocument | undefined {
        return this.docs.find(doc => doc instanceof Score.MDocument && doc.getTitle() === title) as (Score.MDocument | undefined);
    }

    getList(): ReadonlyArray<Score.MDocument | string> {
        return this.docs;
    }
}
