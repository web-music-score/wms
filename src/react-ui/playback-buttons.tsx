import * as React from "react";
import { MDocument, MPlaybackButtons } from "web-music-score/score";

export interface PlaybackButtonsProps {
    doc: MDocument;
    singlePlayStop?: boolean;
    playStop?: boolean;
    playPauseStop?: boolean;
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
 *   import * as Score from "web-music-score/score";
 *   import * as ScoreUI from "web-music-score/react-ui";
 * 
 *   // Create document.
 *   const doc = new Score.DocumentBuilder()
 *       // Build document...
 *       .getDocument();
 * 
 *   // Create default playback buttons (play, pause and stop buttons).
 *   <ScoreUI.PlaybackButtons doc={doc} />
 *
 *   // Create playback buttons with single play/stop button.
 *   <ScoreUI.PlaybackButtons doc={doc} singlePlayStop />
 * 
 *   // Create playback buttons with play and stop buttons.
 *   <ScoreUI.PlaybackButtons doc={doc} playStop />
 * 
 *   // Create playback buttons with play, pause and stop buttons.
 *   <ScoreUI.PlaybackButtons doc={doc} playPauseStop />
 * 
 *   // You can also set custom play, pause and stop button labels.
 *   <ScoreUI.PlaybackButtons doc={doc} playLabel="⏵" pauseLabel="⏸" stopLabel="⏹" />
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
        let { singlePlayStop, playStop, playPauseStop, playLabel, pauseLabel, stopLabel } = this.props;
        let { controller } = this.state;

        playLabel ??= "Play";
        pauseLabel ??= "Pause";
        stopLabel ??= "Stop";

        if (singlePlayStop) {
            return (
                <button className="btn btn-primary" ref={btn => { if (btn) controller.setPlayStopButton(btn, playLabel, stopLabel); }} />
            );
        }
        else if (playStop) {
            return (
                <div className="btn-group">
                    <button className="btn btn-primary" ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                    <button className="btn btn-primary" ref={btn => { if (btn) controller.setStopButton(btn, stopLabel); }} />
                </div>
            );
        }
        else { // if(playPauseStop) {
            // Default is playPauseStop
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
