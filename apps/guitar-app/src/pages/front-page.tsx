import * as React from "react";
import { Alert, Container } from "react-bootstrap";
import { TuningScaleInfo, Menubar } from "components";
import { GuitarApp, Page } from "guitar-app";
import { Cookies } from "@tspro/ts-utils-lib";

class AskCookieConsent extends React.Component<{}, { show: boolean }> {
    constructor(props: {}) {
        super(props);
        this.state = { show: Cookies.isConsentPending() }
    }

    render() {
        let onAccept = () => { Cookies.accept(); this.setState({ show: false }); }
        let onDecline = () => { Cookies.decline(); this.setState({ show: false }); }

        return this.state.show ? (
            <div className="alert alert-primary" role="alert">
                <p>
                    This website uses cookies to provide better user experience.
                </p>
                <button className="btn btn-primary m-1" onClick={onAccept}>Accept</button>
                <button className="btn btn-primary m-1" onClick={onDecline}>Decline</button>
            </div>
        ) : null;
    }
}

interface PageLinkProps {
    page: Page;
    children?: React.ReactNode;
}

function PageLink(props: PageLinkProps) {
    return <li>
        <a href={"#" + props.page}>{props.children}</a>
    </li>;
}

interface FrontPageProps {
    app: GuitarApp;
    currentPage: string;
}

interface FrontPageState { }

export class FrontPage extends React.Component<FrontPageProps, FrontPageState> {

    state: FrontPageState;

    constructor(props: FrontPageProps) {
        super(props);
        this.state = {}
    }

    render() {
        let { app, currentPage } = this.props;

        return <>
            <Menubar app={app} frontPage />

            <Container>
                <h1>{Page.FrontPage}</h1>

                <br />

                <AskCookieConsent />

                {currentPage !== Page.FrontPage
                    ? <Alert variant="danger">Page '{currentPage}'' not found!</Alert>
                    : undefined
                }

                <TuningScaleInfo app={app} />

                <h2>Pages</h2>
                <ul>
                    <PageLink page={Page.ChooseTuning}>{Page.ChooseTuning}</PageLink>
                    <PageLink page={Page.ChooseScale}>{Page.ChooseScale}</PageLink>
                    <PageLink page={Page.CircleOfFifths}>{Page.CircleOfFifths}</PageLink>
                    <PageLink page={Page.PlayNotes}>{Page.PlayNotes}</PageLink>
                    <PageLink page={Page.Intervals}>{Page.Intervals}</PageLink>
                    <PageLink page={Page.DiatonicChords}>{Page.DiatonicChords}</PageLink>
                    <PageLink page={Page.GuitarScales}>{Page.GuitarScales}</PageLink>
                    <PageLink page={Page.CAGEDScales}>{Page.CAGEDScales}</PageLink>
                    <PageLink page={Page.WhatChord}>{Page.WhatChord}</PageLink>
                </ul>

                <p>This web page is best viewed on desktop computer.</p>

            </Container>
        </>
    }

}
