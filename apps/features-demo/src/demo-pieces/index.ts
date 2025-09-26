import { createAndanteByDiabelli, createGreensleeves, createFrereJacques } from "@tspro/web-music-score/pieces";
import { createRepeatsAndEndingsDemo } from "demo-pieces/repeats-endings";
import { createDaCapoDemo } from "demo-pieces/da-capo";
import { createDalSegnoDemo } from "demo-pieces/dal-segno";
import { createBeamDetectionDemo } from "demo-pieces/beam-detections";
import { createConnectivesDemo } from "demo-pieces/connectives";
import { createFermataDemo } from "demo-pieces/fermata";
import { createStaccatoDemo } from "demo-pieces/staccato";
import { createSignatureChangeDemo } from "demo-pieces/signature-change";
import { createGrandStaffDemo } from "./grand-staff";
import { createTupletsDemo } from "./tuplets";
import { createTempoAnnotationDemo } from "./tempo-annotation";
import { createDynamicsAnnotationDemo } from "./dynamics-annotation";
import { createCompleteRestsDemo } from "./complete-rests";
import { createNoteHeadsDemo } from "./note-heads";
import { createGuitarCombinedDemo } from "./guitar-combined";
import { createGuitarTabDemo } from "./guitar-tab";
import { createStaffGroupsDemo } from "./staff-groups";
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
        pieces.push(createGreensleeves());
        pieces.push(createAndanteByDiabelli());
        pieces.push(createFrereJacques());

        // Add features demos
        demos.push(createRepeatsAndEndingsDemo());
        demos.push(createDaCapoDemo());
        demos.push(createDalSegnoDemo());
        demos.push(createBeamDetectionDemo());
        demos.push(createTupletsDemo());
        demos.push(createConnectivesDemo());
        demos.push(createFermataDemo());
        demos.push(createStaccatoDemo());
        demos.push(createSignatureChangeDemo());
        demos.push(createGrandStaffDemo());
        demos.push(createTempoAnnotationDemo());
        demos.push(createDynamicsAnnotationDemo());
        demos.push(createCompleteRestsDemo());
        demos.push(createNoteHeadsDemo());
        demos.push(createGuitarCombinedDemo());
        demos.push(createGuitarTabDemo());
        demos.push(createStaffGroupsDemo());

        // Sort by title
        pieces.sort((a, b) => (a.getTitle() ?? "").localeCompare(b.getTitle() ?? ""));
        demos.sort((a, b) => (a.getTitle() ?? "").localeCompare(b.getTitle() ?? ""));

        this.docs = [
            "--- Sample Pieces ---",
            ...pieces,
            "--- Feature Demos ---",
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
