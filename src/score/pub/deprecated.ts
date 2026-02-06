import { WmsView } from "./wms-view";
import { WmsControls } from "./wms-controls";
import { MDocument } from "./mobjects";
import { Player } from "./player";
import { PlayStateChangeListener } from "./types";
import { warnDeprecated } from "shared-src";

/**
 * Deprecated stuff.
 * Will be removed in future release.
 * 
 * Renamed classes:
 *  - MRenderContext    => WmsView
 *  - MPlaybackButtons  => WmsControls
 *  - MPlayer           => Player
 */

/**
 * @deprecated MRenderContext is deprecated. Will be removed in future release. Use WmsView instead. 
 */
export class MRenderContext extends WmsView {
    constructor() {
        super();
        warnDeprecated("MRenderContext is deprecated. Will be removed in future release. Use WmsView instead.");
    }
}

/**
 * @deprecated MPlaybackButtons is deprecated. Will be removed in future release. Use WmsControls instead.
 */
export class MPlaybackButtons extends WmsControls {
    constructor() {
        super();
        warnDeprecated("MPlayerButtons is deprecated. Will be removed in future release. Use WmsControls instead.");
    }
}

/**
 * @deprecated MPlayer is deprecated. Will be removed in future release. Use Player instead. 
 */
export class MPlayer extends Player {
    constructor(doc: MDocument, playStateChangeListener?: PlayStateChangeListener) {
        super(doc, playStateChangeListener);
        warnDeprecated("MPlayer is deprecated. Will be removed in future release. Use Player instead.");
    }
}
