import { createFrereJacques as internalCreateFrereJacques } from "./frere-jacques";
import { createGreensleeves as internalCreateGreensleeves } from "./greensleeves";
import { createAndanteByDiabelli as internalCreateAndanteByDiabelli} from "./andante-diabelli";

/** @public */
export namespace SamplePieces {
    export function createFrereJacques() {
        return internalCreateFrereJacques();
    }

    export function createGreensleeves() {
        return internalCreateGreensleeves();
    }

    export function createAndanteByDiabelli() {
        return internalCreateAndanteByDiabelli();
    }
}