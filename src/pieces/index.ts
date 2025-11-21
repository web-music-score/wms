import { MDocument } from "web-music-score/score";
import { createAndanteByDiabelli } from "./andante-diabelli";
import { createCanonInD } from "./canon-pachelbel";
import { createFrereJacques } from "./frere-jacques";
import { createGreensleeves } from "./greensleeves";

export {
    createAndanteByDiabelli,
    createCanonInD,
    createFrereJacques,
    createGreensleeves,
}

/**
 * Create all music pieces.
 * @returns - Array of music documents containing all available pieces.
 */
export function createAll(): readonly MDocument[] {
    return [
        createAndanteByDiabelli(),
        createCanonInD(),
        createFrereJacques(),
        createGreensleeves(),
    ];
} 
