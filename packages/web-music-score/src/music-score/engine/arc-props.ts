import { ObjArc } from "./obj-arc";
import { ObjNoteGroup } from "./obj-note-group";
import { Note } from "../../music-theory/note";
import { ArcPos, Stem, TieLength } from "../pub/types";
import { Assert } from "@tspro/ts-utils-lib";

export class ArcProps {
    noteGroups: ObjNoteGroup[];
    arcDir: "up" | "down" = "down";

    constructor(readonly arcType: "tie" | "slur", readonly arcSpan: number | TieLength, public arcPos: ArcPos, startNoteGroup: ObjNoteGroup) {
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
        if (this.arcSpan === TieLength.Short || this.arcSpan === TieLength.ToMeasureEnd) {
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

        if (this.arcPos === ArcPos.StemTip) {
            this.arcDir = stemDir === Stem.Up ? "up" : "down";
        }
        else if (this.arcPos === ArcPos.Auto) {
            this.arcDir = stemDir === Stem.Up ? "down" : "up";

            if (this.noteGroups[0].notes.length > 1) {
                this.arcPos = ArcPos.Middle;
            }
            else if (this.arcDir === "up") {
                this.arcPos = ArcPos.Above;
            }
            else {
                this.arcPos = ArcPos.Below;
            }
        }
        else if (this.arcPos === ArcPos.Middle) {
            let { row } = this.noteGroups[0].measure;

            let notePitch = this.noteGroups[0].ownAvgPitch;
            let staff = row.getStaff(notePitch);

            this.arcDir = !staff || notePitch < staff.middleLinePitch ? "down" : "up";
        }
        else if (this.arcPos === ArcPos.Above) {
            this.arcDir = "up";
        }
        else if (this.arcPos === ArcPos.Below) {
            this.arcDir = "down";
        }
    }

    removeArcs() {
        this.noteGroups.length = 1;

        this.noteGroups.forEach(n => {
            n.measure.removeArcObjects();
            n.removeArcProps();
        });
    }

    createArcs() {
        this.getStartNoteGroup().collectArcProps();

        this.computeParams();

        let { arcSpan, arcType } = this;

        if (arcType === "tie") {
            if (arcSpan === TieLength.Short || arcSpan === TieLength.ToMeasureEnd) {
                let leftNoteGroup = this.noteGroups[0];
                leftNoteGroup.notes.forEach(note => {
                    this.createObjArcWithTieLength(leftNoteGroup, note, arcSpan);
                });
            }
            else if (this.noteGroups.length >= 2) {
                for (let i = 0; i < this.noteGroups.length - 1; i++) {
                    let leftNoteGroup = this.noteGroups[i];
                    let rightNoteGroup = this.noteGroups[i + 1];

                    leftNoteGroup.notes.forEach(leftNote => {
                        let rightNote = rightNoteGroup.notes.find(rightNote => rightNote.equals(leftNote));
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

    private createObjArcWithTieLength(leftNoteGroup: ObjNoteGroup, leftNote: Note, tieLength: TieLength) {
        new ObjArc(this, leftNoteGroup.measure, leftNoteGroup, leftNote, tieLength);
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
            Assert.interrupt("Cannot create arc because arc is jumping measures.");
        }
    }
}
