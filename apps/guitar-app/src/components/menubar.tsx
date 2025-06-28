import * as React from "react";
import { Button, Dropdown, Navbar, Row } from "react-bootstrap";
import { GuitarApp, Page } from "guitar-app";
import * as Score from "@tspro/web-music-score";

// Icons I got from https://materialdesignicons.com/
const HomeIcon = <svg style={{ width: "24px", height: "24px" }}>
    <path fill="currentColor" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
</svg>;

const BackIcon = <svg style={{ width: "24px", height: "24px" }}>
    <path fill="currentColor" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
</svg>;

const CheckIcon = <svg style={{ width: "24px", height: "24px" }}>
    <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
</svg>;

export interface MenubarProps {
    app: GuitarApp;
    frontPage?: boolean;
    children?: React.ReactNode;
}

export class Menubar extends React.Component<MenubarProps, {}> {
    constructor(props: MenubarProps) {
        super(props);
    }

    render() {
        let { app, children, frontPage } = this.props;

        let guitarCtx = app.getGuitarContext();

        return (
            <Navbar bg="primary" className="ps-3">
                <Row xs="auto">
                    <Button variant="primary" disabled={frontPage} onClick={() => GuitarApp.back()}>
                        {frontPage ? HomeIcon : BackIcon}
                    </Button>
                    <Dropdown>
                        <Dropdown.Toggle id="dropdown-tuning">Tuning</Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.ItemText><b>{guitarCtx.tuningName}</b></Dropdown.ItemText>
                            <Dropdown.Item href={"#" + Page.ChooseTuning}>{Page.ChooseTuning}</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                        <Dropdown.Toggle id="dropdown-scale">Scale</Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.ItemText><b>{guitarCtx.scale.getScaleName()}</b></Dropdown.ItemText>
                            <Dropdown.Item href={"#" + Page.ChooseScale}>{Page.ChooseScale}</Dropdown.Item>
                            <Dropdown.Item href={"#" + Page.CircleOfFifths}>{Page.CircleOfFifths}</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                        <Dropdown.Toggle id="dropdown-guitars-settings">Guitar Settings</Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Header>Handedness</Dropdown.Header>
                            <Dropdown.Item onClick={() => app.setHandedness("rh")}>
                                Right Handed {guitarCtx.handedness === "rh" ? CheckIcon : undefined}
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => app.setHandedness("lh")}>
                                Left Handed {guitarCtx.handedness === "lh" ? CheckIcon : undefined}
                            </Dropdown.Item>

                            <Dropdown.Divider />

                            <Dropdown.Header>Note Labels</Dropdown.Header>
                            {Score.GuitarNoteLabelList.map(guitarNoteLabel => (
                                <Dropdown.Item key={guitarNoteLabel} onClick={() => app.setGuitarNoteLabel(guitarNoteLabel)}>
                                    {guitarNoteLabel.toString()} {guitarCtx.guitarNoteLabel === guitarNoteLabel ? CheckIcon : undefined}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                        <Dropdown.Toggle id="dropdown-settings">Settings</Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Header>Pitch Notation</Dropdown.Header>
                            {Score.PitchNotationList.map(pitchNotation => (
                                <Dropdown.Item key={pitchNotation} onClick={() => app.setPitchNotation(pitchNotation)}>
                                    {pitchNotation.toString()} {guitarCtx.pitchNotation === pitchNotation ? CheckIcon : undefined}
                                </Dropdown.Item>
                            ))}

                            <Dropdown.Divider />

                            <Dropdown.Header>Instrument</Dropdown.Header>
                            {Score.Audio.InstrumentList.map(instr => (
                                <Dropdown.Item key={instr} onClick={() => app.setInstrument(instr)}>
                                    {Score.Audio.getInstrumentName(instr)} {app.getInstrument() === instr ? CheckIcon : undefined}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                    {children}
                </Row>
            </Navbar>
        );
    }

}
