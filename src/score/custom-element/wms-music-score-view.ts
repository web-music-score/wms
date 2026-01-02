import * as Score from "web-music-score/score";

class WmsMusicScoreView extends HTMLElement {
    private canvas: HTMLCanvasElement;
    private rc: Score.MRenderContext;

    constructor() {
        super();

        this.canvas = document.createElement("canvas");

        this.rc = new Score.MRenderContext().setCanvas(this.canvas);
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ["doc"];
    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null) {
        if (name === "doc" && value) {
            this.load(value);
        }
    }

    private render() {
        if (!this.contains(this.canvas))
            this.append(this.canvas);

        this.rc.draw();
    }

    private async load(src: string) {
        let doc = new Score.DocumentBuilder()
            .setScoreConfiguration("treble")
            .setTimeSignature("3/4")
            .addNote(0, ["C4", "E4", "G4"], "4n")
            .addMeasure()
            .addChord(0, ["C4", "E4", "G4"], "2.", { arpeggio: true })
            .getDocument();

        this.rc.setDocument(doc);
    }
}

/**
 * Safe registration (VERY IMPORTANT)
 */
export function registerWmsMusicScoreView() {
    if (typeof document === "undefined")
        return;

    if (!customElements.get("wms-music-score-view")) {
        customElements.define(
            "wms-music-score-view",
            WmsMusicScoreView
        );
    }
}
