import * as React from "react";
import { MDocument, MPlaybackButtons } from "@tspro/web-music-score/score";

export enum PlaybackButtonsLayout {
    PlayStopSingle = "playStopSingle",
    PlayStop = "playStop",
    PlayPauseStop = "playPauseStop"
}

export interface PlaybackButtonsProps {
    doc: MDocument;
    buttonLayout?: PlaybackButtonsLayout | `${PlaybackButtonsLayout}`;
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
 *   import * as Score from "@tspro/web-music-score/score";
 *   import * as ScoreUI from "@tspro/web-music-score/react-ui";
 * 
 *   // Create document.
 *   const doc = new Score.DocumentBuilder()
 *       // Build document...
 *       .getDocument();
 * 
 *   // Create default playback buttons.
 *   <ScoreUI.PlaybackButtons doc={doc} />
 * 
 *   // Create playback buttons with custom play, pause and stop labels.
 *   <ScoreUI.PlaybackButtons doc={doc} playLabel="⏵" pauseLabel="⏸" stopLabel="⏹" />
 * 
 *   // Create playback buttons with different button layout.
 *   <ScoreUI.PlaybackButtons doc={doc} buttonLayout={Score.PlaybackButtonsLayout.PlayStopSingle} />
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

        playLabel ??= "Play";
        pauseLabel ??= "Pause";
        stopLabel ??= "Stop";

        switch (buttonLayout) {
            case PlaybackButtonsLayout.PlayStopSingle:
                return (
                    <button className="btn btn-primary" ref={btn => { if (btn) controller.setPlayStopButton(btn, playLabel, stopLabel); }} />
                );
            case PlaybackButtonsLayout.PlayStop:
                return (
                    <div className="btn-group">
                        <button className="btn btn-primary" ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                        <button className="btn btn-primary" ref={btn => { if (btn) controller.setStopButton(btn, stopLabel); }} />
                    </div>
                );
            case PlaybackButtonsLayout.PlayPauseStop:
            default:
                return (
                    <div className="btn-group">
                        <button className="btn btn-primary" ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                        <button className="btn btn-primary" ref={btn => { if (btn) controller.setPauseButton(btn, pauseLabel); }} />
                        <button className="btn btn-primary" ref={btn => { if (btn) controller.setStopButton(btn, stopLabel); }} />
                    </div>
                );
        }
    }
}
