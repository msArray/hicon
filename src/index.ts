import { Hono } from "hono";
import Color from "color";
import { DOMImplementation, XMLSerializer } from "xmldom";
import rough from "roughjs";
import sharp from "sharp";
import { Buffer } from "node:buffer";

const {
  createHash,
} = await import("node:crypto");

const app = new Hono();

app.get("/api/person/:id", async (c) => {
  const id = c.req.param("id");
  const hash = createHash("sha256").update(id).digest("hex");
  const { deg, size, format } = c.req.query();
  const degree = deg ? parseInt(deg) : parseInt(hash.slice(0, 2), 16);
  const ratio = size ? parseInt(size) / 500 : 1;
  const color = Color({ h: degree, s: 46, l: 76 });
  const doc = new DOMImplementation().createDocument(null, null);
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewbox", `0 0 ${500 * ratio} ${500 * ratio}`);
  svg.setAttribute("width", `${500 * ratio}`);
  svg.setAttribute("height", `${500 * ratio}`);
  svg.setAttribute("height", `${500 * ratio}`);
  const rc = (rough as any).svg(svg);

  const bg = rc.rectangle(0, 0, 500 * ratio, 500 * ratio, {
    fill: color.lighten(0.2).hex(),
    fillWeight: 2 * ratio,
    hachureGap: 8 * ratio,
    strokeWidth: 0,
  });

  const person = rc.path(
    "M0 500 500 500C500 400 450 300 350 300a150 150 90 10 0 -200 0C50 300 0 400 0 500Z",
    {
      fill: color.hex(),
      fillWeight: 3 * ratio,
      hachureAngle: 60,
      hachureGap: 8 * ratio,
      stroke: color.darken(0.4).hex(),
    },
  );
  /*
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
    */
  svg.appendChild(bg);
  // svg.appendChild(body);
  // svg.appendChild(head);
  svg.appendChild(person);
  const xml = new XMLSerializer().serializeToString(svg);
  if (format === "png") {
    try {
      const pngBuffer = await sharp(Buffer.from(xml)).png().toBuffer();
      return c.body(new Uint8Array(pngBuffer), 200, {
        "Content-Type": "image/png",
      });
    } catch (e) {
      console.error(e);
      return c.text("500 Server Error", 500);
    }
  }

  if (format === "jpeg" || format === "jpg") {
    try {
      const jpgBuffer = await sharp(Buffer.from(xml)).jpeg().toBuffer();
      return c.body(new Uint8Array(jpgBuffer), 200, {
        "Content-Type": "image/jpeg",
      });
    } catch (e) {
      console.error(e);
      return c.text("500 Server Error", 500);
    }
  }

  if (format === "webp") {
    try {
      const webpBuffer = await sharp(Buffer.from(xml)).webp().toBuffer();
      return c.body(new Uint8Array(webpBuffer), 200, {
        "Content-Type": "image/webp",
      });
    } catch (e) {
      console.error(e);
      return c.text("500 Server Error", 500);
    }
  }

  return c.body(xml, 200, {
    "Content-Type": "image/svg+xml",
  });
});

Deno.serve(app.fetch);
