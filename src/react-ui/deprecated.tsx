import { warnDeprecated } from "shared-src";
import { WmsControls, WmsControlsProps } from "./wms-controls";
import { WmsView, WmsViewProps } from "./wms-view";


/**
 * Deprecated stuff.
 * Will be removed on major update 7.0.0.
 * 
 * Renamed classes:
 *  - MusicScoreView => WmsView
 *  - PlaybackButtons => WmsControls
 */

/**
 * @deprecated
 * @internal
 */
export interface MusicScoreViewProps extends WmsViewProps { }

/**
 * @deprecated - MusicScoreView is deprecated.  Will be romoved in 7.0.0. Use WmsView instead.
 * @internal
 */
export class MusicScoreView extends WmsView {
    constructor(props: MusicScoreViewProps) {
        super(props);
        warnDeprecated("MusicScoreView is deprecated.  Will be romoved in 7.0.0. Use WmsView instead.");
    }
}

/**
 * @deprecated
 * @internal
 */
export interface PlaybackButtonsProps extends WmsControlsProps { }

/**
 * @deprecated - PlaybackButtons is deprecated.  Will be romoved in 7.0.0. Use WmsControls instead.
 * @internal
 */
export class PlaybackButtons extends WmsControls {
    constructor(props: PlaybackButtonsProps) {
        super(props);
        warnDeprecated("PlaybackButtons is deprecated.  Will be romoved in 7.0.0. Use WmsControls instead.");
    }
}
