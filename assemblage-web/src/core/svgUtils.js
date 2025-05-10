// svgUtils.js
// Utility for SVG to Path2D conversion

export function svgToPath2D(svgString) {
    const doc = new window.DOMParser().parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return null;
    const p = new Path2D();
    svgEl.querySelectorAll("*").forEach(el => {
        if (["path", "rect", "circle", "ellipse", "polygon", "polyline", "line"].includes(el.tagName)) {
            switch (el.tagName) {
                case "path":
                    p.addPath(new Path2D(el.getAttribute("d")));
                    break;
                case "rect":
                    p.rect(
                        +el.getAttribute("x") || 0,
                        +el.getAttribute("y") || 0,
                        +el.getAttribute("width"),
                        +el.getAttribute("height")
                    );
                    break;
                case "circle":
                    p.moveTo(
                        +el.getAttribute("cx") + +el.getAttribute("r"),
                        +el.getAttribute("cy")
                    );
                    p.arc(
                        +el.getAttribute("cx"),
                        +el.getAttribute("cy"),
                        +el.getAttribute("r"),
                        0,
                        2 * Math.PI
                    );
                    break;
                case "ellipse":
                    p.ellipse(
                        +el.getAttribute("cx"),
                        +el.getAttribute("cy"),
                        +el.getAttribute("rx"),
                        +el.getAttribute("ry"),
                        0, 0, 2 * Math.PI
                    );
                    break;
                case "polygon":
                case "polyline": {
                    const points = el.getAttribute("points").trim().split(/\s+|,/).map(Number);
                    p.moveTo(points[0], points[1]);
                    for (let i = 2; i < points.length; i += 2) {
                        p.lineTo(points[i], points[i + 1]);
                    }
                    if (el.tagName === "polygon") p.closePath();
                    break;
                }
                case "line":
                    p.moveTo(+el.getAttribute("x1"), +el.getAttribute("y1"));
                    p.lineTo(+el.getAttribute("x2"), +el.getAttribute("y2"));
                    break;
            }
        }
    });
    return p;
} 