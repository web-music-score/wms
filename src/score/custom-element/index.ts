export function registerAllWmsElements() {
    if (typeof window === "undefined" || typeof customElements === "undefined")
        return;

    try {
        import("./wms-view").then(v => v.registerWmsView());
        import("./wms-controls").then(c => c.registerWmsControls());
    }
    catch (e) { }
}
