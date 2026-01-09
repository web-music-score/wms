import { WmsView } from "./wms-view";
import { WmsControls } from "./wms-controls";
import { MDocument } from "./mobjects";
import { Player } from "./player";
import { PlayStateChangeListener } from "./types";
import { warnDeprecated } from "shared-src";

/**
 * Deprecated stuff.
 * Will be removed on major update 7.0.0.
 * 
 * Renamed classes:
 *  - MRenderContext    => WmsView
 *  - MPlaybackButtons  => WmsControls
 *  - MPlayer           => Player
 */

/**
 * @deprecated - MRenderContext is deprecated. Will be romoved in 7.0.0. Use WmsView instead.
 * @internal
 */
export class MRenderContext extends WmsView {
    constructor() {
        super();
        warnDeprecated("MRenderContext is deprecated.  Will be romoved in 7.0.0. Use WmsView instead.");
    }
}

/**
 * @deprecated - MPlayerButtons is deprecated. Will be romoved in 7.0.0. Use WmsControls instead.
 * @internal
 */
export class MPlaybackButtons extends WmsControls {
    constructor() {
        super();
        warnDeprecated("MPlayerButtons is deprecated.  Will be romoved in 7.0.0. Use WmsControls instead.");
    }
}

/**
 * @deprecated - Use Player instead. Will be romoved in 7.0.0. Use WmsControls instead.
 * @internal
 */
export class MPlayer extends Player {
    constructor(doc: MDocument, playStateChangeListener?: PlayStateChangeListener) {
        super(doc, playStateChangeListener);
        warnDeprecated("MPlayer is deprecated.  Will be romoved in next major update. Use Player instead.");
    }
}
