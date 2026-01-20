export function registerAllWmsElements() {
    if (typeof window === "undefined" || typeof customElements === "undefined")
        return;

    try {
        import("./wms-view").then(v => v.registerWmsViewHTMLElement());
        import("./wms-controls").then(c => c.registerWmsControlsHTMLElement());
    }
    catch (e) { }
}
