import { Note } from "@tspro/web-music-score/theory";
import { ObjConnective } from "./obj-connective";
import { ObjNoteGroup } from "./obj-note-group";
import { Connective, ConnectiveSpan, NoteAnchor, SlurSpan, Stem, TieSpan, TieType } from "../pub/types";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export class ConnectiveProps {
    noteGroups: ObjNoteGroup[];
    arcDir: "up" | "down" = "down";

    constructor(readonly connective: Connective, readonly span: ConnectiveSpan, public noteAnchor: NoteAnchor, startNoteGroup: ObjNoteGroup) {
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
        if (this.span === TieType.Stub || this.span === TieType.ToMeasureEnd) {
            // Contains already 1 NoteGroup
            return false;
        }
        else if (this.span > this.noteGroups.length) {
            this.noteGroups.push(noteGroup);
            return true;
        }
        else {
            return false;
        }
    }

    private computeParams() {
        let stemDir = this.noteGroups[0].stemDir;
        let hasStem = this.noteGroups[0].rhythmProps.hasStem;

        if (this.noteAnchor === NoteAnchor.StemTip) {
            this.arcDir = stemDir === Stem.Up ? "up" : "down";
        }
        else if (this.noteAnchor === NoteAnchor.Auto) {
            this.arcDir = stemDir === Stem.Up || !hasStem ? "down" : "up";

            if (this.noteGroups[0].notes.length > 1) {
                this.noteAnchor = NoteAnchor.Center;
            }
            else if (this.connective === Connective.Slide) {
                this.noteAnchor = NoteAnchor.Center;
            }
            else if (this.arcDir === "up") {
                this.noteAnchor = NoteAnchor.Above;
            }
            else {
                this.noteAnchor = NoteAnchor.Below;
            }
        }
        else if (this.noteAnchor === NoteAnchor.Center) {
            let { row } = this.noteGroups[0].measure;

            let diatonicId = this.noteGroups[0].ownDiatonicId;
            let staff = row.getStaff(diatonicId);

            this.arcDir = !staff || diatonicId < staff.middleLineDiatonicId ? "down" : "up";
        }
        else if (this.noteAnchor === NoteAnchor.Above) {
            this.arcDir = "up";
        }
        else if (this.noteAnchor === NoteAnchor.Below) {
            this.arcDir = "down";
        }
    }

    removeConnectives() {
        this.noteGroups.forEach(n => {
            n.measure.removeConnectiveObjects();
            n.removeConnectiveProps();
        });

        this.noteGroups.length = 1;
    }

    createConnectives() {
        this.getStartNoteGroup().collectConnectiveProps();

        this.computeParams();

        let { connective, span } = this;

        if (connective === Connective.Tie) {
            if (span === TieType.Stub || span === TieType.ToMeasureEnd) {
                let leftNoteGroup = this.noteGroups[0];
                leftNoteGroup.notes.forEach(note => {
                    this.createObjConnectiveWithTieType(leftNoteGroup, note, span);
                });
            }
            else if (this.noteGroups.length >= 2) {
                for (let i = 0; i < this.noteGroups.length - 1; i++) {
                    let leftNoteGroup = this.noteGroups[i];
                    let rightNoteGroup = this.noteGroups[i + 1];

                    leftNoteGroup.notes.forEach(leftNote => {
                        let rightNote = rightNoteGroup.notes.find(rightNote => Note.equals(rightNote, leftNote));
                        if (rightNote) {
                            this.createObjConnective(leftNoteGroup, leftNote, rightNoteGroup, rightNote);
                        }
                    });
                }
            }
        }
        else if (connective === Connective.Slur) {
            if (typeof span === "number" && span >= 2 && this.noteGroups.length === span) {
                let leftNoteGroup = this.noteGroups[0];
                let rightNoteGroup = this.noteGroups[this.noteGroups.length - 1];

                let leftNote = leftNoteGroup.notes[0];
                let rightNote = rightNoteGroup.notes[0];

                this.createObjConnective(leftNoteGroup, leftNote, rightNoteGroup, rightNote);
            }
        }
        else if (connective === Connective.Slide) {
            if (this.noteGroups.length >= 2) {
                for (let i = 0; i < this.noteGroups.length - 1; i++) {
                    let leftNoteGroup = this.noteGroups[i];
                    let rightNoteGroup = this.noteGroups[i + 1];

                    let leftNote = leftNoteGroup.notes[0];
                    let rightNote = rightNoteGroup.notes[0];

                    if (leftNote && rightNote) {
                        this.createObjConnective(leftNoteGroup, leftNote, rightNoteGroup, rightNote);
                    }
                }
            }
        }
    }

    private createObjConnectiveWithTieType(leftNoteGroup: ObjNoteGroup, leftNote: Note, tieType: TieType) {
        new ObjConnective(this, leftNoteGroup.measure, leftNoteGroup, leftNote, tieType);
    }

    private createObjConnective(leftNoteGroup: ObjNoteGroup, leftNote: Note, rightNoteGroup: ObjNoteGroup, rightNote: Note) {
        if (leftNoteGroup.measure === rightNoteGroup.measure) {
            new ObjConnective(this, leftNoteGroup.measure, leftNoteGroup, leftNote, rightNoteGroup, rightNote);
        }
        else if (leftNoteGroup.measure.getNextMeasure() === rightNoteGroup.measure) {
            new ObjConnective(this, leftNoteGroup.measure, leftNoteGroup, leftNote, rightNoteGroup, rightNote);
            new ObjConnective(this, rightNoteGroup.measure, leftNoteGroup, leftNote, rightNoteGroup, rightNote);
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Cannot create connective because it is jumping measures.");
        }
    }
}
