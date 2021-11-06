import BalsamiqRenderer from "./balsamiq_renderer.js";
import { makeSVGElement } from "./utils.js";

/**
 * @param {Object} data - Wireframe JSON data
 * @param {number} padding - Padding for the canvas. Defaults to 10 to prevent items from clipping off the edge of the canvas
 * @param {string} fontFamily - Defaults to "balsamiq"
 * @returns {SVGElement} SVG element
 */
export default function wireframeJSONToSVG({ mockup }, padding = 10, fontFamily = "balsamiq") {
  let x = mockup.measuredW - mockup.mockupW - padding / 2;
  let y = mockup.measuredH - mockup.mockupH - padding / 2;
  let width = parseInt(mockup.mockupW) + padding;
  let height = parseInt(mockup.mockupH) + padding;

  let svg = makeSVGElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink",
    viewBox: `${x} ${y} ${width} ${height}`,
  });

  let renderer = new BalsamiqRenderer(svg, fontFamily);

  mockup.controls.control
    .sort((a, b) => {
      return a.zOrder - b.zOrder;
    })
    .forEach((control) => {
      renderer.render(control);
    });

  return svg;
}
