# Web Music Score
Web Music Score is a TypeScript/JavaScript music notation web component and player.

📚 Full documentation: [web-music-score.org](https://web-music-score.org)

## Install
```bash
npm i web-music-score
```

## Quick Example
Here is a quick TypeScript code snippet how to build a score document.
```ts
import { DocumentBuilder, MDocument } from "web-music-score/score";

export function createGreensleeves(): MDocument {
    return new DocumentBuilder()
        .setScoreConfiguration("guitarTreble")
        .setHeader("Greensleeves")

        .addMeasure()
        .setKeySignature("C Major")
        .setTimeSignature("6/8")
        .setTempo(140)
        .addNote(0, "A3", "8n")

        .addMeasure()
        .addNavigation("startRepeat")
        .addNote(0, "C4", "4n", { stem: "up" })
        .addNote(0, "D4", "8n")
        .addNote(0, "E4", "8.")
        .addNote(0, "F4", "16n")
        .addNote(0, "E4", "8n")
        .addNote(1, "A2", "8n", { stem: "down" })
        .addNote(1, "E3", "4n")
        .addNote(1, "A2", "8n")
        .addNote(1, "E3", "4n")

        // ... and so on ...

        .endSong()

        .getDocument();
}
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
