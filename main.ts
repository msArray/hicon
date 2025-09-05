import { Hono } from "hono";
import Color from "color";
import { DOMImplementation, XMLSerializer } from "xmldom";
import rough from "roughjs";
const {
  createHash,
} = await import("node:crypto");

const app = new Hono();

app.get("/api/person/:id", (c) => {
  const id = c.req.param("id");
  const hash = createHash("sha256").update(id).digest("hex");
  const { deg, size } = c.req.query();
  const degree = deg ? parseInt(deg) : parseInt(hash.slice(0, 2), 16);
  const ratio = size ? parseInt(size) / 500 : 1;
  const color = Color({ h: degree, s: 46, l: 76 });
  const doc = new DOMImplementation().createDocument(null, null);
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewbox", `0 0 ${500 * ratio} ${500 * ratio}`);
  svg.setAttribute("width", `${500 * ratio}`);
  svg.setAttribute("height", `${500 * ratio}`);
  const rc = rough.svg(svg);

  const bg = rc.rectangle(0, 0, 500 * ratio, 500 * ratio, {
    fill: color.lighten(0.25).hex(),
    fillWeight: 5 * ratio,
    hachureGap: 12 * ratio,
    strokeWidth: 0,
  });

  const body = rc.circle(250 * ratio, 500 * ratio, 400 * ratio, {
    fill: color.hex(),
    fillWeight: 3 * ratio,
    hachureAngle: 60,
    hachureGap: 8 * ratio,
    stroke: color.darken(0.4).hex(),
  });

  const head = rc.circle(250 * ratio, 250 * ratio, 200 * ratio, {
    fill: color.hex(),
    hachureAngle: 60,
    hachureGap: 8 * ratio,
    fillWeight: 3 * ratio,
    stroke: color.darken(0.4).hex(),
  });
  svg.appendChild(bg);
  svg.appendChild(body);
  svg.appendChild(head);
  const xml = new XMLSerializer().serializeToString(svg);
  return c.body(xml, 200, {
    "Content-Type": "image/svg+xml",
  });
});

Deno.serve(app.fetch);
