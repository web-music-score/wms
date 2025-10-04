import * as React from "react";
import { MDocument, MPlaybackButtons } from "@tspro/web-music-score/score";

export enum PlaybackButtonsLayout {
    PlayStopSingle,
    PlayStop,
    PlayPauseStop
}

export interface PlaybackButtonsProps {
    doc: MDocument;
    buttonLayout?: PlaybackButtonsLayout;
    playLabel?: string;
    pauseLabel?: string;
    stopLabel?: string;
}

export interface PlaybackButtonsState {
    controller: MPlaybackButtons;
}

/**
 * Usage:
 * ```ts
 *   // Using with React TSX/JSX
 *   import * as Score from "\@tspro/web-music-score/score";
 *   import * as Pieces from "@tspro/web-music-score/pieces";
 * 
 *   // Create sample musicdocument.
 *   const doc = Pieces.createFrereJacques();
 * 
 *   // Create default playback buttons
 *   <Score.PlaybackButtons doc={doc} />
 * 
 *   // Create playback buttons with custom play, pause and stop labels:
 *   <Score.PlaybackButtons doc={doc} playLabel="⏵" pauseLabel="⏸" stopLabel="⏹" />
 * 
 *   // Create playback buttons with different button layout.
 *   <Score.PlaybackButtons doc={doc} buttonLayout={Score.PlaybackButtonsLayout.PlayStopSingle} />
 * ```
 */
export class PlaybackButtons extends React.Component<PlaybackButtonsProps, PlaybackButtonsState> {

    state: PlaybackButtonsState;

    constructor(props: PlaybackButtonsProps) {
        super(props);

        this.state = {
            controller: new MPlaybackButtons().setDocument(props.doc)
        }
    }

    componentDidUpdate(prevProps: Readonly<PlaybackButtonsProps>): void {
        if (this.props.doc !== prevProps.doc) {
            this.state.controller.setDocument(this.props.doc);
        }
    }

    render() {
        let { buttonLayout, playLabel, pauseLabel, stopLabel } = this.props;
        let { controller } = this.state;

        buttonLayout = buttonLayout ?? PlaybackButtonsLayout.PlayPauseStop;
        playLabel = playLabel ?? "Play";
        pauseLabel = pauseLabel ?? "Pause";
        stopLabel = stopLabel ?? "Stop";

        if (buttonLayout === PlaybackButtonsLayout.PlayStopSingle) {
            return <button className="btn btn-primary" ref={btn => { if (btn) controller.setPlayStopButton(btn, playLabel, stopLabel); }} />;
        }
        else if (buttonLayout === PlaybackButtonsLayout.PlayStop) {
            return <div className="btn-group">
                <button className="btn btn-primary" ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                <button className="btn btn-primary" ref={btn => { if (btn) controller.setStopButton(btn, stopLabel); }} />
            </div>;
        }
        else {
            return <div className="btn-group">
                <button className="btn btn-primary" ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                <button className="btn btn-primary" ref={btn => { if (btn) controller.setPauseButton(btn, pauseLabel); }} />
                <button className="btn btn-primary" ref={btn => { if (btn) controller.setStopButton(btn, stopLabel); }} />
            </div>;
        }
    }
}
