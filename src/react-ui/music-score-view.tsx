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
 *   import * as Score from "@tspro/web-music-score/score";
 *   import * as ScoreUI from "@tspro/web-music-score/react-ui";
 *  
 *   // Render function of react component.
 *   render() {
 *       // Create document.
 *       const doc = new Score.DocumentBuilder()
 *           // Build document...
 *           .getDocument();
 * 
 *       return <>
 *          <ScoreUI.MusicScoreView doc={doc} />
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

        return (
            <canvas style={{ position: "relative" }} ref={setCanvas}>
                Your browser does not support the HTML canvas tag.
            </canvas>
        );
    }
}
