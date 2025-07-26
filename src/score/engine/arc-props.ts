import { Note } from "@tspro/web-music-score/theory";
import { ObjArc } from "./obj-arc";
import { ObjNoteGroup } from "./obj-note-group";
import { NoteAnchor, SlurSpan, Stem, TieSpan, TieType } from "../pub/types";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export class ArcProps {
    noteGroups: ObjNoteGroup[];
    arcDir: "up" | "down" = "down";

    constructor(readonly arcType: "tie" | "slur", readonly arcSpan: TieSpan | SlurSpan, public arcAnchor: NoteAnchor, startNoteGroup: ObjNoteGroup) {
        this.noteGroups = [startNoteGroup];
    }

    getStartNoteGroup() {
        return this.noteGroups[0];
    }

    startsWith(noteGroup: ObjNoteGroup) {
        return this.noteGroups[0] === noteGroup;
    }

    /**
     * 
     * @param noteGroup -
     * @returns true if noteGroup was added, false if not.
     */
    addNoteGroup(noteGroup: ObjNoteGroup) {
        if (this.arcSpan === TieType.Stub || this.arcSpan === TieType.ToMeasureEnd) {
            // Contains already 1 NoteGroup
            return false;
        }
        else if (this.arcSpan > this.noteGroups.length) {
            this.noteGroups.push(noteGroup);
            return true;
        }
        else {
            return false;
        }
    }

    private computeParams() {
        let stemDir = this.noteGroups[0].stemDir;

        if (this.arcAnchor === NoteAnchor.StemTip) {
            this.arcDir = stemDir === Stem.Up ? "up" : "down";
        }
        else if (this.arcAnchor === NoteAnchor.Auto) {
            this.arcDir = stemDir === Stem.Up ? "down" : "up";

            if (this.noteGroups[0].notes.length > 1) {
                this.arcAnchor = NoteAnchor.Center;
            }
            else if (this.arcDir === "up") {
                this.arcAnchor = NoteAnchor.Above;
            }
            else {
                this.arcAnchor = NoteAnchor.Below;
            }
        }
        else if (this.arcAnchor === NoteAnchor.Center) {
            let { row } = this.noteGroups[0].measure;

            let diatonicId = this.noteGroups[0].ownDiatonicId;
            let staff = row.getStaff(diatonicId);

            this.arcDir = !staff || diatonicId < staff.middleLineDiatonicId ? "down" : "up";
        }
        else if (this.arcAnchor === NoteAnchor.Above) {
            this.arcDir = "up";
        }
        else if (this.arcAnchor === NoteAnchor.Below) {
            this.arcDir = "down";
        }
    }

    removeArcs() {
        this.noteGroups.forEach(n => {
            n.measure.removeArcObjects();
            n.removeArcProps();
        });

        this.noteGroups.length = 1;
    }

    createArcs() {
        this.getStartNoteGroup().collectArcProps();

        this.computeParams();

        let { arcSpan, arcType } = this;

        if (arcType === "tie") {
            if (arcSpan === TieType.Stub || arcSpan === TieType.ToMeasureEnd) {
                let leftNoteGroup = this.noteGroups[0];
                leftNoteGroup.notes.forEach(note => {
                    this.createObjArcWithTieType(leftNoteGroup, note, arcSpan);
                });
            }
            else if (this.noteGroups.length >= 2) {
                for (let i = 0; i < this.noteGroups.length - 1; i++) {
                    let leftNoteGroup = this.noteGroups[i];
                    let rightNoteGroup = this.noteGroups[i + 1];

                    leftNoteGroup.notes.forEach(leftNote => {
                        let rightNote = rightNoteGroup.notes.find(rightNote => Note.equals(rightNote, leftNote));
                        if (rightNote) {
                            this.createObjArc(leftNoteGroup, leftNote, rightNoteGroup, leftNote);
                        }
                    });
                }
            }
        }
        else if (arcType === "slur") {
            if (typeof arcSpan === "number" && arcSpan >= 2 && this.noteGroups.length === arcSpan) {
                let leftNoteGroup = this.noteGroups[0];
                let rightNoteGroup = this.noteGroups[this.noteGroups.length - 1];

                let leftNote = leftNoteGroup.notes[0];
                let rightNote = rightNoteGroup.notes[0];

                this.createObjArc(leftNoteGroup, leftNote, rightNoteGroup, rightNote);
            }
        }
    }

    private createObjArcWithTieType(leftNoteGroup: ObjNoteGroup, leftNote: Note, tieType: TieType) {
        new ObjArc(this, leftNoteGroup.measure, leftNoteGroup, leftNote, tieType);
    }

    private createObjArc(leftNoteGroup: ObjNoteGroup, leftNote: Note, rightNoteGroup: ObjNoteGroup, rightNote: Note) {
        if (leftNoteGroup.measure === rightNoteGroup.measure) {
            new ObjArc(this, leftNoteGroup.measure, leftNoteGroup, leftNote, rightNoteGroup, rightNote);
        }
        else if (leftNoteGroup.measure.getNextMeasure() === rightNoteGroup.measure) {
            new ObjArc(this, leftNoteGroup.measure, leftNoteGroup, leftNote, rightNoteGroup, rightNote);
            new ObjArc(this, rightNoteGroup.measure, leftNoteGroup, leftNote, rightNoteGroup, rightNote);
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Cannot create arc because arc is jumping measures.");
        }
    }
}
