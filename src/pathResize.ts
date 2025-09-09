import { absolutize, parsePath, serialize } from "path-data-parser";

function resizePathData(pathData: string, scale: number): string {
  const segments = parsePath(pathData);
  segments.forEach((segment) => {
    segment.data.forEach((value, index) => {
      segment.data[index] = value * scale;
    });
  });

  const absoluteSegments = absolutize(segments);
  const outputPath = serialize(absoluteSegments);
  return outputPath;
}

export { resizePathData };
