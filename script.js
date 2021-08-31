// Initialisierung, damit Methode "start" aufgerufen wird, sobald der Browser die Seite geladen hat
window.onload = start;



// Variablen für Canvas und den 2D Canvas Context
var canvas;             // Canvas
var ctx;                // Canvas 2D Rendering Context



// Definition der Reihenfolge, in welcher die einzelnen Segmete gemalt werden sollen
// String      name:           Name des Elements
// Number      essential:      Prozentchance der Generierung mit 0 <= x <= 1
// String      color:          Name der zu nutzenden Farbvariable ("none" meint kein Zusammenhang zu anderen Farben)
var types = [{
        name: "hair",
        essential: 1,
        color: "hair"
    },
    {
        name: "neck",
        essential: 1,
        color: "none"
    },
    {
        name: "chin",
        essential: 1,
        color: "skin"
    },
    {
        name: "forehead",
        essential: 1,
        color: "skin"
    },
    {
        name: "ear",
        essential: 1,
        color: "ear"
    },
    // {
    //     name: "face",
    //     essential: 1,
    //     color: "face"
    // },
    {
        name: "bangs",
        essential: 1,
        color: "hair"
    }
];



// Definition der Farbvariablen mit zugehörigem Namen
// Boolean     default:        Gibt an, ob Farbe nicht generiert werden soll da sie in "value" vorgegeben ist
// String      value:          Generierter/Gesetzter Farbwert (null = noch nicht generiert)
var colors = {
    "skin": {
        value: null
    },
    "ear": {
        value: null
    },
    "hair": {
        value: null
    },
    // "face": {
    //     default: true,
    //     value: "#000000"
    // }
};



// Definition der Zitate als Liste
var quotes = [
    "Recognize yourself?", 
    "What's the value of your look?", 
    "Selling for $69 Million!", 
    "Selfmade.", 
    "More than 0's and 1's?", 
    "Create and consume.", 
    "Buying yourself!", 
    "Made by algorithms.",
    "Who are you?",
    "Creating media's influence.",
    "Digital identity.",
    "Self-represen-tation.",
    "Machinic creation.",
    "Future of art?",
    "Individu-ality.",
    "I'm not a robot!",
    "Artificial.",
    "Infinite Combi-nations.",
    "(N)one in 7 Billion.",
    "Create. trade. innovate.",
    "Virtual mirror.",
    "Cryptic.",
    "Unique."
];



// Weitere Variablen
var loaded = 0;             // Anzahl geladener Bilder
var loadedImages = [];      // Vorgelandene Bilder
var latestChroma;           // Generierte Farbpalette als Liste
var usedChromas = 0;        // Bereits verbrauchte/reservierte Farbwerte fürs Einfärben
var drawn = false;          // Initialer Malvorgang geschehen
var lastQuote = -1;         // Speicherung des letzten Zitats



// Start des Tools
function start() {
    // Lade den Canvas aus HTML in Variablen
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    // Generiere die erste Person
    randomPerson();
}



// Generiere eine zufällige Person
function randomPerson() {
    // Setze Variablen zurück und blende HTML Elemente aus
    drawn = false;
    getEle("canvas").style.opacity = "0";
    getEle("colors").innerHTML = "";
    usedChromas = 0;

    loaded = 0;
    loadedImages = [];
    getEle("images").innerHTML = "";

    // Durchlaufe Typen und erstelle Liste mit benötigten Elementen anhand des "essential"-Wertes
    var essential = [];
    types.forEach((ele, ind) => {
        var r = Math.random();
        if (r <= ele.essential) {
            essential.push(ind);
        }

        Object.keys(colors).forEach(el => {
            var e = colors[el];
            if (!e.default) {
                e.value = null;
            }
        })
    })

    // Überprüfe, wie viele verschiedene Farbwerte für die Farbpalette benötigt werden
    var i = 0;
    var needed = [];
    essential.forEach(el => {
        var ele = types[el];
        if (ele.color != "face") {
            if (ele.color != "none" && !needed.includes(ele.color)) {
                needed.push(ele.color);
            } else if (ele.color == "none") {
                needed.push(i);
                i++;
            }
        }
    })

    // Generiere Farbpalette anhand zweier zufälliger HEX-Werte, erhelle die Farbe und generiere bei zu geringem Kontrast bis zu 25x neue Palette
    var valid = false;
    var rerolled = 0;

    while (!valid && rerolled < 25) {
        var newValid = true;
        latestChroma = chroma.scale([randomHex(), randomHex()])
            .mode('rgb').colors(needed.length);
        latestChroma.forEach((ele, ind) => {
            latestChroma[ind] = chroma(ele).brighten(1.2).hex();
        });
        latestChroma.push(chroma(hexToComplimentary(latestChroma[0])).darken(0.3).hex());
        for (var j = 0; j < latestChroma.length; j++) {
            for (var k = j + 1; k < latestChroma.length; k++) {
                var diff = chroma.deltaE(latestChroma[j], latestChroma[k]);
                if (diff < 7) {
                    newValid = false;
                }
            }
        }
        if (newValid) {
            valid = true;
        } else {
            console.log("Rerolling colors " + (rerolled + 1));
            rerolled++;
        }
    }

    // latestChroma.forEach(ele => {
    //     var d = document.createElement("div");
    //     d.setAttribute("class", "color");
    //     d.style.background = ele;
    //     d.innerHTML = ele;
    // })

    // Selektiere Farben aus Farbpalette für vorher definierteFarbvariablen
    types.forEach((ele, ind) => {
        Object.keys(colors).forEach(el => {
            var e = colors[el];
            if (!e.default && e.value == null) {
                console.log(latestChroma, usedChromas)
                e.value = latestChroma[usedChromas];
                usedChromas++;
            }
        })
    })

    // Säubere den Canvas, bevor neu gemalt werden kann
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Durchlaufe Typen einzeln und lade zufällig passendes Bild, falls sie mit "essential" ausgewählt wurden
    types.forEach((ele, ind) => {
        if (essential.includes(ind)) {
            // Erstelle ein neues HTML-Bildobjekt und setze ID zum Wiederfinden
            var img = new Image();
            loadedImages.push(`${ele.name}`);
            img.id = `${ele.name}`;

            // EventListener: Sobald das Bild geladen wurde, wird "loaded" erhöht und bei vollständigem Laden aller Bilder weitergemacht
            img.onload = () => {
                loaded++;
                if (loaded == essential.length) {
                    types.forEach(e => {
                        if (e.color.startsWith("#")) {
                            e.color = "none";
                        }
                    })
                    allLoaded();
                    drawn = true;
                }
            }

            // Setze zufälliges Bild aus dem aktuellen Typen als Bildquelle
            var rand = Math.floor(Math.random() * baseTypes[ele.name].length);
            img.src = `data:image/png;base64,` + baseTypes[ele.name][rand];

            // Erstelle Elemente der Seitenleiste in HTML
            var d = document.createElement("div");
            d.innerHTML = img.outerHTML + `<div class="tag"><h1 class="tag-main">${ele.name}</h1><h1 class="tag-count">${rand + 1} / ${baseTypes[ele.name].length}</h1></div>`;
            d.id = `${ele.name}-cont`;
            d.setAttribute("class", "image-container");

            // EventListener: Sobald die Maus über das Element hovert, wird nur dieses Element gemalt
            d.addEventListener("mouseenter", () => {
                console.log(ele.name);
                allLoaded(ele.name, "#aa00ff");
            })
            d.addEventListener("mouseleave", () => {
                allLoaded();
            })

            // Füge Elemente der Seitenleiste hinzu
            getEle("images").appendChild(d);
        }
    })
}



// Wird ausgeführt, sobald alle benötigten Bilder geladen wurden oder beim Hover über einzelne Teilelemente
function allLoaded(element, color) {
    // Leere den Canvas vor dem Zeichnen, falls nur einzelnes Element gemalt werden soll
    console.log(types, colors);
    ctx.clearRect(0, 0, 800, 800);

    var wait = null;
    var usedCols = 0;

    // Durchlaufe alle gelandenen Bilder und male diese auf separate Canvas, um sie individuell einfärben zu können
    loadedImages.forEach((ele, ind) => {
        var img = getEle(ele);
        var d = getEle(ele + "-cont");

        // Erstelle neuen temporären Canvas und male das Bild auf diesen
        var nc = document.createElement("canvas");
        nc.width = 800;
        nc.height = 800;
        var nctx = nc.getContext("2d");
        nctx.drawImage(img, 0, 0, 800, 800);

        // Durchlaufe alle Typen und Farben, um den Canvas in der passenden Farbe einzufärben
        var t = null;
        types.forEach(el => {
            if (img.id == el.name) t = el;
        })

        if (t.color == "none" && !t.color.startsWith("#")) {
            // Falls keine Farbevariable und keine Farbe festgelegt ist, nehme nächste verfügbare Farbe der Farbpalette zum Einfärben
            t.color = latestChroma[usedCols + usedChromas];
            console.log(t.color, usedCols, usedChromas);
            d.style.borderLeftColor = t.color;
            d.style.backgroundColor = chroma(t.color).alpha(0.25);
            setAllPixels(nctx, t.color);
            usedCols++;
        } else if (t.color.startsWith("#")) {
            // Falls bereits eine Farbe gesetzt ist, wähle diese zum Einfärben
            d.style.borderLeftColor = t.color;
            d.style.backgroundColor = chroma(t.color).alpha(0.25);
            setAllPixels(nctx, t.color);
        } else {
            // Falls eine Farbvariable festgeegt ist, wähle den Farbwert dieser zum Einfärben
            d.style.borderLeftColor = colors[t.color].value;
            d.style.backgroundColor = chroma(colors[t.color].value).alpha(0.25);
            setAllPixels(nctx, colors[t.color].value);
        }

        // Entscheide, ob alle oder ein bestimmtes Element gezeichnet werden sollen
        if (element != undefined) {
            if (img.id == element) {
                // Falls gewünschtes Element durchlaufen wird, speichere dieses und ändere die Hierarchie
                wait = img;
            } else {
                // Falls nicht gewünschtes Element gefunden ist, male aktuelles Element als Umriss
                setAllPixels(nctx, chroma.mix(hexToComplimentary(latestChroma[0]), "#1a1a19", 0.8));
                ctx.drawImage(nc, 0, 0, 800, 800);
            }
        } else {
            // Falls alle Elemente gezeichnet werden sollen, bemale den Canvas
            ctx.drawImage(nc, 0, 0, 800, 800);
        }
    })

    // Färbe das einzelne Element und bemale den Canvas mit diesem, falls es hervorgehoben werden soll
    if (wait != null) {
        var img = wait;

        // Erstelle neuen temporären Canvas und male das Bild auf diesen
        var nc = document.createElement("canvas");
        nc.width = 800;
        nc.height = 800;
        var nctx = nc.getContext("2d");
        nctx.drawImage(img, 0, 0, 800, 800);

        // Durchlaufe erneut alle Typen und Farben, um das Element in der passenden Farbe einzufärben
        var t = null;
        types.forEach(el => {
            if (img.id == el.name) t = el;
        })

        // Suche erneut die passende Farbe des Elements um es mit dieser einzufärben
        if (t.color == "none" && !t.color.startsWith("#")) {
            t.color = randomHex();
            setAllPixels(nctx, t.color);
        } else if (t.color.startsWith("#")) {
            setAllPixels(nctx, t.color);
        } else {
            setAllPixels(nctx, colors[t.color].value);
        }

        // Male das einzelne Objekt als letztes der Hierarchie auf den Canvas
        ctx.drawImage(nc, 0, 0, 800, 800);
    }

    // Generiere die komplementäre Hintergrundfarbe zur ersten Farbe der Farbpalette und dunkle diese ab
    var overallColor = chroma(hexToComplimentary(latestChroma[0])).darken(0.3);

    // Färbe HTML Elemente mit dieser Akzentfarbe ein
    getEle("canvas").style.backgroundColor = overallColor + "80";
    getEle("button-generate").style.backgroundColor = overallColor + "80";

    // Entscheide anhand der Akzentfarbe durch Kontrastberechnung, ob der "Generate"-Button im HTML weiße oder graue Schrift benötigt
    var con = chroma.contrast("white", chroma.mix(overallColor, "#1a1a19", 0.5));
    if (con <= 2.5) {
        getEle("button-generate").style.color = "#1a1a19";
    } else {
        getEle("button-generate").style.color = "white";
    }

    // Falls es sich um den initialen Zyklus handelt, generiere neues Zitat und füge es dem HTML hinzu
    if (!drawn) {
        // Generiere ein neues Zitat, welches nicht dem zuletzt verwendeten entspricht
        var fq = lastQuote;
        while(fq == lastQuote) {
            fq = Math.floor(Math.random() * quotes.length);
        }
        lastQuote = fq;
        var q = quotes[fq];

        // Ersetze das Zitat im HTML und generiere eine zufällige Position und Ausrichtung
        getEle("quote").innerText = q;

        var side = Math.random() > 0.5 ? "right" : "left";
        var vide = Math.random() > 0.5 ? "top" : "bottom";
        var align = "left";
        if (side == "left") {
            var cordX = Math.floor(Math.random() * 520) - 120;
            align = "right";
        } else {
            var cordX = Math.floor(Math.random() * 460) - 60;
            align = "left";
        }

        var cordY = Math.floor(Math.random() * 300) + 50;

        getEle("quote").setAttribute("style", `${side}: ${cordX}px; ${vide}: ${cordY}px; text-align: ${align}`);
    }

    // Blende den Canvas final wieder ein
    getEle("canvas").style.opacity = "1";
}



// Durchlaufe sämtliche Pixel eines Canvas Rendering Context und färbe diese in eine gegebene Farbe ein
function setAllPixels(can, hex) {
    // Wandle HEX in RGB um
    var rgb = hexToRgb(hex);

    // Lade die Farbwerte des Pixels in eine Variable und setze Zähler
    var d = can.getImageData(0, 0, 800, 800);
    var count = 0;

    // Durchlaufe für jeden Pixel in x und y Dimension den Canvas
    for (var x = 0; x < 800; x++) {
        for (var y = 0; y < 800; y++) {
            // Setze den Farbwert und erhöhe den Zähler dabei jeweils um 1
            d.data[count++] = rgb.r;
            d.data[count++] = rgb.g;
            d.data[count++] = rgb.b;
            // Behalte den Alphawert des Pixels bei
            d.data[count++] = d.data[count - 1];
        }
    }

    // Säubere den Canvas und male die neuen Farbwerte
    can.clearRect(0, 0, 800, 800);
    can.putImageData(d, 0, 0, 0, 0, 800, 800);
}



// Wandle einen gegebenen HEX-Farbwert in RGB um
function hexToRgb(hex) {
    // RegEx um HEX in drei einzelne Hexadezimalwerte zu splitten
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    // Konvertierung der Farbwerte von Hexadezimal in Deizmal
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}



// Generiere einen zufälligen HEX-Farbwert
function randomHex() {
    // RegEx ersetzt in #000000 alle Nullen zu einer zufälligen Zahl in Hexadezimal
    return "#000000".replace(/0/g, function () {
        return (~~(Math.random() * 16)).toString(16);
    });
}



// Füge eine führende Null zu einer gegebenen Zahl hinzu
function extendZero(num) {
    return num < 10 ? "0" + num : "" + num;
}



// Shorthand um HTML Elemente per ID zurückzugeben
function getEle(id) {
    return document.getElementById(id);
}



// Berechne die Komplementärfarbe zu einem gegebenen HEX-Farbwert
function hexToComplimentary(hex) {
    // Wandle HEX in RGB um
    var rgb = 'rgb(' + (hex = hex.replace('#', '')).match(new RegExp('(.{' + hex.length / 3 + '})', 'g')).map(function (l) {
        return parseInt(hex.length % 2 ? l + l : l, 16);
    }).join(',') + ')';

    // Wähle die einzelnen Farbelemente des RGBs aus
    rgb = rgb.replace(/[^\d,]/g, '').split(',');

    var r = rgb[0],
        g = rgb[1],
        b = rgb[2];

    // Wandle RGB in HSL um
    r /= 255.0;
    g /= 255.0;
    b /= 255.0;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2.0;

    if (max == min) {
        h = s = 0;
    } else {
        var d = max - min;
        s = (l > 0.5 ? d / (2.0 - max - min) : d / (max + min));

        if (max == r && g >= b) {
            h = 1.0472 * (g - b) / d;
        } else if (max == r && g < b) {
            h = 1.0472 * (g - b) / d + 6.2832;
        } else if (max == g) {
            h = 1.0472 * (b - r) / d + 2.0944;
        } else if (max == b) {
            h = 1.0472 * (r - g) / d + 4.1888;
        }
    }

    h = h / 6.2832 * 360.0 + 0;

    // Verschiebe Farbton zur gegenüberliegenden Seite des Farbrads und wandle den Wert in [0-1] um
    h += 180;
    if (h > 360) {
        h -= 360;
    }
    h /= 360;

    // Wandle HSL zurück in RGB um
    if (s === 0) {
        r = g = b = l;
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);

    // Wandle RGB zurück in HEX um
    rgb = b | (g << 8) | (r << 16);
    return "#" + (0x1000000 | rgb).toString(16).substring(1);
}