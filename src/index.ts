import { Buffer } from "node:buffer";
import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import Color from "color";
import rough from "roughjs";
import { RoughSVG } from "roughjs/bin/svg.d.ts";
import sharp from "sharp";
import { createSVGWindow } from "svgdom";
import { registerWindow, SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.resize.js";

import { resizePathData } from "./pathResize.ts";

const {
  createHash,
} = await import("node:crypto");

const window = createSVGWindow();
const document = window.document;
registerWindow(window, document);

const app = new Hono();
app.use("/public/*", serveStatic({ root: "./public" }));
app.use(
  "/favicon.ico",
  serveStatic({ root: "./public", path: "./favicon.ico" }),
);

app.get("/api/person/:id", async (c) => {
  const id = c.req.param("id");
  const hash = createHash("sha256").update(id).digest("hex");
  const { deg, size, format } = c.req.query();
  if (deg && isNaN(parseInt(deg))) {
    return c.text("400 Bad Request: deg must be a number", 400);
  }
  if (
    size &&
    (isNaN(parseInt(size)) || parseInt(size) < 1 || parseInt(size) > 1024)
  ) {
    return c.text(
      "400 Bad Request: size must be a number between 1 and 1024",
      400,
    );
  }
  const degree = deg ? parseInt(deg) : parseInt(hash.slice(0, 2), 16);
  const ratio = size ? (Math.min(parseInt(size, 10), 1024) / 500) : 1;
  const color = Color({ h: degree, s: 46, l: 76 });
  const svg = SVG().size(500 * ratio, 500 * ratio);
  const rc = rough.svg(svg.node) as unknown as RoughSVG;

  const bg = rc.rectangle(0, 0, 500 * ratio, 500 * ratio, {
    fill: color.lighten(0.2).hex(),
    fillWeight: 2,
    hachureGap: 8,
    strokeWidth: 0,
  });

  const person = rc.path(
    resizePathData(
      "M0 500 500 500C500 400 450 300 350 300a150 150 90 10 0 -200 0C50 300 0 400 0 500Z",
      ratio,
    ),
    {
      fill: color.hex(),
      fillWeight: 3,
      hachureAngle: 60,
      hachureGap: 8,
      stroke: color.darken(0.4).hex(),
    },
  );
  svg.node.appendChild(bg);
  svg.node.appendChild(person);
  const xml = svg.svg();
  const sharpSvg = sharp(Buffer.from(xml));
  if (format === "png") {
    try {
      const pngBuffer = await sharpSvg.png().toBuffer();
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
      const jpgBuffer = await sharpSvg.jpeg().toBuffer();
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
      const webpBuffer = await sharpSvg.webp().toBuffer();
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
