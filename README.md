# Web Music Score
Web Music Score is a TypeScript/JavaScript music notation web component and player.

📚 Full documentation: [web-music-score.org](https://web-music-score.org)

## Install
```bash
npm install web-music-score
```

## Quick Example
```ts
import * as Score from "web-music-score/score";

const doc = new Score.DocumentBuilder()
    .setScoreConfiguration("guitarTreble")
    .addMeasure()
    .setKeySignature("C Major")
    .setTimeSignature("3/4")
    .addNote(0, "C4", "4n")
    .addNote(0, "E4", "4n")
    .addNote(0, "G4", "4n")
    .endSong()
    .getDocument();

new Score.WmsView().
    setCanvas("scoreCanvasId").
    setDocument(doc).
    draw();

new Score.WmsControls().
    setPlayStopButton("playButtonId").
    setDocument(doc);
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
