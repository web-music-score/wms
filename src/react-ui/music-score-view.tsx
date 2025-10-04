import * as React from "react";
import { MDocument, MRenderer, ScoreEventListener } from "@tspro/web-music-score/score";

export interface MusicScoreViewProps {
    doc: MDocument;
    onScoreEvent?: ScoreEventListener;
}

/**
 * Music score view react component.
 * ```ts
 *   // Using with React TSX/JSX
 *   import * as Score from "@tspro/web-music-score/react";
 *   import * as Pieces from "@tspro/web-music-score/pieces";
 *  
 *   // Render function of react component.
 *   render() {
 *       const doc = Pieces.createFrereJacques();
 * 
 *       return <>
 *          <Score.MusicScoreView doc=\{doc\} />
 *       </>;
 *   }
 * ```
 */
export class MusicScoreView extends React.Component<MusicScoreViewProps, {}> {

    renderer: MRenderer;

    constructor(props: MusicScoreViewProps) {
        super(props);

        this.renderer = new MRenderer();

        this.renderer.setDocument(props.doc);

        if (props.onScoreEvent) {
            this.renderer.setScoreEventListener(props.onScoreEvent);
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
