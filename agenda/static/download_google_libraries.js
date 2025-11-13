{
    let api_key = "";
    const xhr = new XMLHttpRequest();
    xhr.open('GET', "/google_api_key", false);
    xhr.send();
    if(xhr.status == 200) { api_key = xhr.responseText; }

    (g => {
        var h, a, k, p = "The Google Maps JavaScript API";
        var c = "google";
        var l = "importLibrary";
        var q = "__ib__";
        var m = document;
        var b = window;
        
        b = b[c] || (b[c] = {});
        
        var d = b.maps || (b.maps = {});
        var r = new Set;
        var e = new URLSearchParams;
        var u = () => h || (h = new Promise(async (f,n) => {
            await (a = m.createElement("script"));
            e.set("libraries", [...r] + "");
            for(k in g)
                e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
            e.set("callback", c + ".maps." + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => h = n(Error(p + " could not load."));
            a.nonce = m.querySelector("script[nonce]")?.nonce || "";
            m.head.append(a);
        }));
        d[l] ?
            console.warn(p + " only loads once. Ignoring:", g):
            d[l] = (f,...n) => r.add(f) && u().then(() => d[l](f,...n))})({key: api_key, v: "weekly"});
}