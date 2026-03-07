import { warnOnce } from "shared-src";
import { WmsControls, WmsControlsProps } from "./wms-controls";
import { WmsView, WmsViewProps } from "./wms-view";


/**
 * Deprecated stuff.
 * Will be removed in future release.
 * 
 * Renamed classes:
 *  - MusicScoreView => WmsView
 *  - PlaybackButtons => WmsControls
 */

/**
 * @deprecated MusicScoreView is deprecated. Will be removed in future release. Use WmsViewProps instead. 
 */
export interface MusicScoreViewProps extends WmsViewProps { }

/**
 * @deprecated MusicScoreView is deprecated. Will be removed in future release. Use WmsView instead.
 */
export class MusicScoreView extends WmsView {
    constructor(props: MusicScoreViewProps) {
        super(props);
        warnOnce("MusicScoreView is deprecated. Will be removed in future release. Use WmsView instead.");
    }
}

/**
 * @deprecated PlaybackButtonProps is deprecated. Will be removed in future release. Use WmsControlProps instead. 
 */
export interface PlaybackButtonsProps extends WmsControlsProps { }

/**
 * @deprecated PlaybackButtons is deprecated. Will be removed in future release. Use WmsControls instead.
 */
export class PlaybackButtons extends WmsControls {
    constructor(props: PlaybackButtonsProps) {
        super(props);
        warnOnce("PlaybackButtons is deprecated. Will be removed in future release. Use WmsControls instead.");
    }
}
