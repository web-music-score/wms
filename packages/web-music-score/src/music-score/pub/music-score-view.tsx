import * as React from "react";
import { MDocument, MRenderer } from "./interface";
import { ClickObjectListener, ClickObjectSelector, ClickPitchListener } from "./types";

interface MusicScoreViewProps {
    doc: MDocument;
    onClickPitch?: ClickPitchListener;
    onSelectObject?: ClickObjectSelector;
    onClickObject?: ClickObjectListener;
}

/**
 * Usage:
 * 
 *  import * as Score from "@tspro/web-music-score";
 * 
 *  <Score.MusicScoreView doc={doc} />
 * 
 */
export class MusicScoreView extends React.Component<MusicScoreViewProps, {}> {

    renderer: MRenderer;

    constructor(props: MusicScoreViewProps) {
        super(props);

        this.renderer = new MRenderer();

        this.renderer.setDocument(props.doc);

        if (props.onClickPitch) {
            this.renderer.setClickPitchListener(props.onClickPitch);
        }

        if (props.onSelectObject) {
            this.renderer.setClickObjectSelector(props.onSelectObject);
        }

        if (props.onClickObject) {
            this.renderer.setClickObjectListener(props.onClickObject);
        }
    }

    componentDidUpdate(prevProps: Readonly<MusicScoreViewProps>, prevState: Readonly<{}>): void {
        if (prevProps.doc !== this.props.doc) {
            this.renderer.setDocument(this.props.doc);
            this.renderer.draw();
        }
    }

    render() {
        const setCanvas = (canvas: HTMLCanvasElement | null) => {
            if (canvas) {
                this.renderer.setCanvas(canvas);
                this.renderer.draw();
            }
        }

        return <canvas style={{ position: "relative" }} ref={setCanvas}>Canvas error!</canvas>;
    }
}
