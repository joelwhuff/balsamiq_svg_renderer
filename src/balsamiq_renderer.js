import { getRGBFromDecimalColor, makeSVGElement } from "./utils.js";
import { ARROW_WIDTH, BORDER_WIDTH, DEFAULT_COLORS } from "./balsamiq_constants.js";

export default class BalsamiqRenderer {
  constructor(svg, fontFamily) {
    this.svg = svg;

    this.fontFamily = fontFamily;

    this.canvasRenderingContext2D = document.createElement("canvas").getContext("2d");
  }

  measureText(text, font) {
    this.canvasRenderingContext2D.font = font;

    return this.canvasRenderingContext2D.measureText(text);
  }

  render(control) {
    let typeID = control.typeID;
    if (typeID in this) {
      this[typeID](control);
    } else {
      console.log(`'${typeID}' control type not implemented`);
    }
  }

  setColor(color, defaultColor) {
    if (color !== undefined) {
      return `rgb(${(color >> 16) & 0xff},${(color >> 8) & 0xff},${color & 0xff})`;
    }

    return `rgb(${defaultColor})`;

    // return color === undefined ? `rgb(${defaultColor})` : getRGBFromDecimalColor()
  }

  //rename
  setFontProperties(control) {
    return {
      style: control.properties?.italic ? "italic" : "normal",
      weight: control.properties?.bold ? "bold" : "normal",
      size: control.properties?.size ? control.properties.size + "px" : "13px",
      family: this.fontFamily,
    };
  }

  drawRectangle(control) {
    return makeSVGElement(
      "rect",
      {
        x: parseInt(control.x) + BORDER_WIDTH / 2,
        y: parseInt(control.y) + BORDER_WIDTH / 2,
        width: parseInt(control.w ?? control.measuredW) - BORDER_WIDTH,
        height: parseInt(control.h ?? control.measuredH) - BORDER_WIDTH,
        fill: this.setColor(control.properties?.color, "255,255,255", control.properties?.backgroundAlpha),
        "fill-opacity": control.properties?.backgroundAlpha ?? 1,
        stroke: this.setColor(control.properties?.borderColor, "0,0,0"),
        "stroke-width": BORDER_WIDTH,
        rx: 2,
      },
      this.svg
    );

    ctx
      .rect(
        parseInt(control.w ?? control.measuredW) - BORDER_WIDTH,
        parseInt(control.h ?? control.measuredH) - BORDER_WIDTH
      )
      .attr({
        x: parseInt(control.x) + BORDER_WIDTH / 2,
        y: parseInt(control.y) + BORDER_WIDTH / 2,
        fill: this.setColor(control.properties?.color, "255,255,255", control.properties?.backgroundAlpha),
        "fill-opacity": control.properties?.backgroundAlpha ?? 1,
        stroke: this.setColor(control.properties?.borderColor, "0,0,0"),
        "stroke-width": BORDER_WIDTH,
        rx: 2,
      });
  }

  addText(control, ctx, align, baseline) {
    let x = parseInt(control.x);
    let y = parseInt(control.y);

    let font = this.setFontProperties(control);
    let textMetrics = this.measureText(
      control.properties.text,
      `${font.style} ${font.weight} ${font.size} ${font.family}`
    );
    // x: parseInt(control.x),
    // y: parseInt(control.y) + actualBoundingBoxAscent + fontBoundingBoxDescent,
    // x: parseInt(control.x) + (control.w ?? control.measuredW) / 2 - width / 2,
    // y: parseInt(control.y) + control.measuredH / 2 + (actualBoundingBoxAscent - fontBoundingBoxDescent) / 2,

    if (align === "center") {
      x += (control.w ?? control.measuredW) / 2 - width / 2;
    } else {
    }

    if (baseline === "top") {
      y += textMetrics.actualBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;
    } else if (baseline === "middle") {
      y += control.measuredH / 2 + (actualBoundingBoxAscent - fontBoundingBoxDescent) / 2;
    } else {
    }

    ctx
      .text((add) => {
        if (control.properties.text.includes("{color:")) {
          let split = control.properties.text.split(/{color:|{color}/);
          split.forEach((str) => {
            if (str.includes("}")) {
              let [color, text] = str.split("}");
              add.tspan(text).fill(`rgb(${DEFAULT_COLORS[color]})`);
            } else {
              add.tspan(str);
            }
          });
        } else {
          add.tspan(control.properties.text);
        }
      })
      .attr({
        x: parseInt(control.x),
        y: parseInt(control.y) + actualBoundingBoxAscent + fontBoundingBoxDescent,
        "font-style": fontProps[0],
        "font-weight": fontProps[1],
        "font-size": fontProps[2],
        "font-family": fontProps[3],
      });
  }

  TextArea(control) {
    this.drawRectangle(control);
    // handle text rendering
  }

  Canvas(control, ctx) {
    this.drawRectangle(control, ctx);
  }

  Label(control) {
    let font = this.setFontProperties(control);
    let { actualBoundingBoxAscent, fontBoundingBoxDescent } = this.measureText(
      control.properties.text,
      `${font.style} ${font.weight} ${font.size} ${font.family}`
    );

    let textElement = makeSVGElement(
      "text",
      {
        x: control.x,
        y: parseInt(control.y) + fontBoundingBoxDescent,
        fill: this.setColor(control.properties?.color, "0,0,0"),
        "font-style": font.style,
        "font-weight": font.weight,
        "font-size": font.size,
        "font-family": font.family,
        "dominant-baseline": "hanging",
      },
      this.svg
    );

    if (control.properties.text.includes("{color:")) {
      let split = control.properties.text.split(/{color:|{color}/);
      split.forEach((str) => {
        if (str.includes("}")) {
          let [color, text] = str.split("}");
          let tspan = makeSVGElement("tspan", { fill: `rgb(${DEFAULT_COLORS[color]})` }, textElement);
          tspan.textContent = text;
        } else {
          let tspan = makeSVGElement("tspan", {}, textElement);
          tspan.textContent = str;
        }
      });
    } else {
      if (control.properties.text === "Internet") {
        let link = makeSVGElement(
          "a",
          { href: "https://www.freeriderhd.com", target: "_blank" },
          textElement
        );
        return (link.textContent = control.properties.text);
      }
      let tspan = makeSVGElement("tspan", {}, textElement);
      tspan.textContent = control.properties.text;
    }
  }

  TextInput(control, ctx) {
    this.drawRectangle(control, ctx);

    let font = this.setFontProperties(control);
    let { width, actualBoundingBoxAscent, fontBoundingBoxDescent } = this.measureText(
      control.properties.text,
      `${font.style} ${font.weight} ${font.size} ${font.family}`
    );

    let textElement = makeSVGElement(
      "text",
      {
        x: parseInt(control.x) + (control.w ?? control.measuredW) / 2 - width / 2,
        y: parseInt(control.y) + control.measuredH / 2,
        fill: this.setColor(control.properties?.textColor, "0,0,0"),
        "font-style": font.style,
        "font-weight": font.weight,
        "font-size": font.size,
        "font-family": font.family,
        "dominant-baseline": "middle",
      },
      this.svg
    );

    if (control.properties.text.includes("{color:")) {
      let split = control.properties.text.split(/{color:|{color}/);
      split.forEach((str) => {
        if (str.includes("}")) {
          let [color, text] = str.split("}");
          let tspan = makeSVGElement("tspan", { fill: `rgb(${DEFAULT_COLORS[color]})` }, textElement);
          tspan.textContent = text;
        } else {
          let tspan = makeSVGElement("tspan", {}, textElement);
          tspan.textContent = str;
        }
      });
    } else {
      let tspan = makeSVGElement("tspan", {}, textElement);
      tspan.textContent = control.properties.text;
    }
  }

  Arrow(control, ctx) {
    let x = parseInt(control.x);
    let y = parseInt(control.y);
    let { p0, p1, p2 } = control.properties;
    let xVector = { x: (p2.x - p0.x) * p1.x, y: (p2.y - p0.y) * p1.x };
    let lineDash;
    if (control.properties?.stroke === "dotted") lineDash = "0.8 12";
    else if (control.properties?.stroke === "dashed") lineDash = "28 46";

    makeSVGElement(
      "path",
      {
        d: `M${x + p0.x} ${y + p0.y}Q${x + p0.x + xVector.x + xVector.y * p1.y * 3.6} ${
          y + p0.y + xVector.y + -xVector.x * p1.y * 3.6
        } ${x + p2.x} ${y + p2.y}`,
        fill: "none",
        stroke: this.setColor(control.properties?.color, "0,0,0"),
        "stroke-width": ARROW_WIDTH,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-dasharray": lineDash,
      },
      this.svg
    );
  }

  Icon(control) {
    let x = parseInt(control.x);
    let y = parseInt(control.y);
    let rad = (control.measuredW - 4) / 2;

    makeSVGElement(
      "circle",
      {
        cx: x + rad,
        cy: y + rad,
        r: rad,
        fill: this.setColor(control.properties?.color, "0,0,0"),
      },
      this.svg
    );

    if (!control.properties.icon.ID.includes("check-circle")) {
      return;
    }

    makeSVGElement(
      "path",
      {
        d: `M${x + 4.5} ${y + rad}L${x + 8.5} ${y + rad + 4} ${x + 15} ${y + rad - 2.5}`,
        fill: "none",
        stroke: "#fff",
        "stroke-width": 3.5,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      this.svg
    );
  }

  HRule(control) {
    let x = parseInt(control.x);
    let y = parseInt(control.y);
    let lineDash;
    if (control.properties?.stroke === "dotted") lineDash = "0.8, 8";
    else if (control.properties?.stroke === "dashed") lineDash = "18, 30";

    makeSVGElement(
      "path",
      {
        d: `M${x} ${y}L${x + parseInt(control.w ?? control.measuredW)} ${y}`,
        fill: "none",
        stroke: this.setColor(control.properties?.color, "0,0,0"),
        "stroke-width": BORDER_WIDTH,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-dasharray": lineDash,
      },
      this.svg
    );
  }

  __group__(control) {
    control.children.controls.control
      .sort((a, b) => {
        return a.zOrder - b.zOrder;
      })
      .forEach((childControl) => {
        childControl.x = parseInt(childControl.x) + parseInt(control.x);
        childControl.y = parseInt(childControl.y) + parseInt(control.y);
        this.render(childControl);
      });
  }
}
