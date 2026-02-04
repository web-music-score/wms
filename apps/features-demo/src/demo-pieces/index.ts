import { createAll } from "web-music-score/pieces";
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
import { createFillWithRestsDemo } from "./fill-with-rests";
import { createStaffConfigGuitarDemo } from "./staff-guitar";
import { createStaffConfigTabDemo } from "./staff-tab";
import { createStaffGroupsDemo } from "./staff-groups";
import { createLyricsDemo } from "./lyrics";
import { createDeprecatedTestsDemo } from "./deprecated-tests";
import * as Score from "web-music-score/score";

export class DemoPieces {
    private static instance?: DemoPieces;

    public static getInstance() {
        if (!this.instance) {
            this.instance = new DemoPieces();
        }
        return this.instance
    }

    static getTitle(doc: Score.MDocument | string | undefined): string {
        return doc instanceof Score.MDocument
            ? (doc.getTitle() ?? "No Title")
            : typeof doc === "string"
                ? doc
                : "No Document";
    }

    private readonly docs: (Score.MDocument | string | undefined)[] = [];

    private constructor() {
        // Add demo pieces
        let pieces: Score.MDocument[] = [...createAll()];

        // Add features demos
        let demos: Score.MDocument[] = [];
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
        demos.push(createFillWithRestsDemo());
        demos.push(createStaffConfigGuitarDemo());
        demos.push(createStaffConfigTabDemo());
        demos.push(createStaffGroupsDemo());
        demos.push(createLyricsDemo());
        demos.push(createDeprecatedTestsDemo());

        // Sort by title
        pieces.sort((a, b) => DemoPieces.getTitle(a).localeCompare(DemoPieces.getTitle(b)));
        demos.sort((a, b) => DemoPieces.getTitle(a).localeCompare(DemoPieces.getTitle(b)));

        this.docs = [
            "--- No Document ---",
            undefined,
            "--- Pieces ---",
            ...pieces,
            "--- Features ---",
            ...demos
        ];
    }

    getDefault(): Score.MDocument {
        return this.docs.find(doc => doc instanceof Score.MDocument)!;
    }

    getDocument(title: string): Score.MDocument | undefined {
        return this.docs.find(doc => DemoPieces.getTitle(doc) === title) as (Score.MDocument | undefined);
    }

    getList(): ReadonlyArray<Score.MDocument | string | undefined> {
        return this.docs;
    }
}
