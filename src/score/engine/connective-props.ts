import { Note } from "@tspro/web-music-score/theory";
import { ObjConnective } from "./obj-connective";
import { ObjNoteGroup } from "./obj-note-group";
import { Connective, NoteAnchor, Stem, TieType } from "../pub/types";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjMeasure } from "./obj-measure";
import { ObjNotationLine, ObjStaff, ObjTab } from "./obj-staff-and-tab";
import { Utils } from "@tspro/ts-utils-lib";

export class ConnectiveProps {
    noteGroups: ObjNoteGroup[];
    arcDir: "up" | "down" = "down";

    constructor(readonly connective: Connective, readonly span: number | TieType | `${TieType}`, public noteAnchor: NoteAnchor, startNoteGroup: ObjNoteGroup) {
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

    private computeParams(line: ObjNotationLine) {
        let { stemDir } = this.noteGroups[0];
        let { hasStem } = this.noteGroups[0].rhythmProps;

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
            let staff = line instanceof ObjStaff ? line : undefined;
            let diatonicId = this.noteGroups[0].getDiatonicId(staff);
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
        if (this.noteGroups.length === 0) {
            return;
        }

        this.getStartNoteGroup().collectConnectiveProps();

        let { connective, span } = this;

        this.noteGroups[0].row.getNotationLines().forEach(line => {
            this.computeParams(line);

            if (connective === Connective.Tie) {
                if (Utils.Is.isEnumValue(span, TieType)) {
                    let leftNoteGroup = this.noteGroups[0];
                    for (let noteId = 0; noteId < leftNoteGroup.notes.length; noteId++) {
                        this.createObjConnectiveWithTieType(line, leftNoteGroup, noteId, span);
                    }
                }
                else if (this.noteGroups.length >= 2) {
                    for (let i = 0; i < this.noteGroups.length - 1; i++) {
                        let leftNoteGroup = this.noteGroups[i];
                        let rightNoteGroup = this.noteGroups[i + 1];

                        leftNoteGroup.notes.forEach((leftNote, leftNoteId) => {
                            let rightNoteId = rightNoteGroup.notes.findIndex(rightNote => Note.equals(rightNote, leftNote));
                            if (rightNoteId >= 0) {
                                this.createObjConnective(line, leftNoteGroup, leftNoteId, rightNoteGroup, rightNoteId);
                            }
                        });
                    }
                }
            }
            else if (connective === Connective.Slur) {
                if (typeof span === "number" && span >= 2 && this.noteGroups.length === span) {
                    let leftNoteGroup = this.noteGroups[0];
                    let rightNoteGroup = this.noteGroups[this.noteGroups.length - 1];

                    this.createObjConnective(line, leftNoteGroup, 0, rightNoteGroup, 0);
                }
            }
            else if (connective === Connective.Slide) {
                if (this.noteGroups.length >= 2) {
                    for (let i = 0; i < this.noteGroups.length - 1; i++) {
                        let leftNoteGroup = this.noteGroups[i];
                        let rightNoteGroup = this.noteGroups[i + 1];

                        this.createObjConnective(line, leftNoteGroup, 0, rightNoteGroup, 0);
                    }
                }
            }

        });
    }

    private createObjConnectiveWithTieType(line: ObjNotationLine, leftNoteGroup: ObjNoteGroup, leftNoteId: number, tieType: TieType) {
        if (!leftNoteGroup.enableConnective(line)) {
            return;
        }
        else if (line instanceof ObjStaff) {
            new ObjConnective(this, line, leftNoteGroup.measure, leftNoteGroup, leftNoteId, tieType);
        }
        else if (line instanceof ObjTab) {
            let leftString = leftNoteGroup.getFretNumberString(leftNoteId);

            if (leftString !== undefined) {
                new ObjConnective(this, line, leftNoteGroup.measure, leftNoteGroup, leftNoteId, tieType);
            }
        }
    }

    private createObjConnective(line: ObjNotationLine, leftNoteGroup: ObjNoteGroup, leftNoteId: number, rightNoteGroup: ObjNoteGroup, rightNoteId: number) {
        const addConnective = (measure: ObjMeasure, leftNoteGroup: ObjNoteGroup, leftNoteId: number, rightNoteGroup: ObjNoteGroup, rightNoteId: number) => {
            if (!(leftNoteGroup.enableConnective(line) && rightNoteGroup.enableConnective(line))) {
                return;
            }
            else if (line instanceof ObjStaff) {
                new ObjConnective(this, line, measure, leftNoteGroup, leftNoteId, rightNoteGroup, rightNoteId);
            }
            else if (line instanceof ObjTab) {
                let leftString = leftNoteGroup.getFretNumberString(leftNoteId);
                let rightString = rightNoteGroup.getFretNumberString(rightNoteId);

                if (leftString !== undefined && rightString !== undefined &&
                    (leftString === rightString || this.connective === Connective.Slur)) {
                    new ObjConnective(this, line, measure, leftNoteGroup, leftNoteId, rightNoteGroup, rightNoteId);
                }
            }
        }

        if (leftNoteGroup.measure === rightNoteGroup.measure) {
            addConnective(leftNoteGroup.measure, leftNoteGroup, leftNoteId, rightNoteGroup, rightNoteId);
        }
        else if (leftNoteGroup.measure.getNextMeasure() === rightNoteGroup.measure) {
            addConnective(leftNoteGroup.measure, leftNoteGroup, leftNoteId, rightNoteGroup, rightNoteId);
            addConnective(rightNoteGroup.measure, leftNoteGroup, leftNoteId, rightNoteGroup, rightNoteId);
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Cannot create connective because it is jumping measures.");
        }
    }
}
