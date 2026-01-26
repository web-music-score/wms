# Web Music Score
Web Music Score is a TypeScript/JavaScript music notation web component and player.

📚 Full documentation: [web-music-score.org](https://web-music-score.org)

## Install
```bash
npm install web-music-score
```

## Quick Example

Here are simple snippets to give an overview about usage of this lib.

### Create Document

```ts
const doc = new Score.DocumentBuilder()
    .setScoreConfiguration("treble")
    .setKeySignature("C Major")
    .setTimeSignature("3/4")
    .addNote(0, ["C4", "E4", "G4"], "4n")
    .addMeasure()
    .addChord(0, ["C4", "E4", "G4"], "2.", { arpeggio: true })
    .getDocument();
```

### Render With JSX/TSX And React 

```ts
import * as Score from "web-music-score/score";
import * as ReactUI from "web-music-score/react-ui";

function render() {
    return <ReactUI.WmsView doc={doc} />;
}
```

### Render With Custom HTML Element

```html
<script src="https://unpkg.com/web-music-score@6.3.6/dist/iife/index.js"></script>

<wms-view id="viewId"></wms-view>

<script>
    const { Score } = window.WebMusicScore;

    doc.bindElement("viewId");
</script>
```
### Render With Plain JavaScript

```html
<script src="https://unpkg.com/web-music-score@6.3.6/dist/iife/index.js"></script>

<canvas id="canvasId"></canvas><br />

<script>
    const { Score } = window.WebMusicScore;

    new Score.WmsView()
        .setCanvas("canvasId")
        .setDocument(doc)
        .draw();
</script>
```

## Report a Bug
Found a bug or have a feature suggestion?

[Please open an issue!](https://github.com/web-music-score/wms/issues/new/choose)

Thanks for helping improve the project!

## License
This project is licensed under the [MIT License](https://mit-license.org/).

It also bundles the following libraries:
- [Tone.js](https://github.com/Tonejs/Tone.js) — [MIT License](https://opensource.org/license/mit)
- [Color Name to Code](https://github.com/simbo/color-name-to-code) — [MIT License](http://simbo.mit-license.org/)
