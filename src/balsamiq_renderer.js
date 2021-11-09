import { getRGBFromDecimalColor, makeSVGElement } from "./utils.js";
import { ARROW_WIDTH, BORDER_WIDTH, DEFAULT_COLORS } from "./balsamiq_constants.js";

export default class BalsamiqRenderer {
  constructor(container, fontFamily) {
    this.container = container;

    this.fontFamily = fontFamily;

    this.canvasRenderingContext2D = document.createElement("canvas").getContext("2d");

    this.init();
  }

  init() {
    let defs = makeSVGElement("defs", {}, this.container);

    let radius = 10;
    makeSVGElement("circle", { id: "iconCircle", r: radius }, defs);

    makeSVGElement(
      "path",
      {
        id: "checkmark",
        d: `M${4.5} ${radius}L${8.5} ${radius + 4} ${15} ${radius - 2.5}`,
        fill: "none",
        stroke: "#fff",
        "stroke-width": 3.5,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      defs
    );
  }

  render(control) {
    let typeID = control.typeID;
    if (typeID in this) {
      this[typeID](control);
    } else {
      console.log(`'${typeID}' control type not implemented`);
    }
  }

  parseColor(color, defaultColor) {
    return color === undefined ? `rgb(${defaultColor})` : getRGBFromDecimalColor(color);
  }

  parseFontProperties(control) {
    return {
      style: control.properties?.italic ? "italic" : "normal",
      weight: control.properties?.bold ? "bold" : "normal",
      size: control.properties?.size ? control.properties.size + "px" : "13px",
      family: this.fontFamily,
    };
  }

  drawRectangle(control) {
    makeSVGElement(
      "rect",
      {
        x: parseInt(control.x) + BORDER_WIDTH / 2,
        y: parseInt(control.y) + BORDER_WIDTH / 2,
        width: parseInt(control.w ?? control.measuredW) - BORDER_WIDTH,
        height: parseInt(control.h ?? control.measuredH) - BORDER_WIDTH,
        rx: 2,
        fill: this.parseColor(control.properties?.color, "255,255,255"),
        "fill-opacity": control.properties?.backgroundAlpha ?? 1,
        stroke: this.parseColor(control.properties?.borderColor, "0,0,0"),
        "stroke-width": BORDER_WIDTH,
      },
      this.container
    );
  }

  measureText(text, font) {
    this.canvasRenderingContext2D.font = font;

    return this.canvasRenderingContext2D.measureText(text);
  }

  addText(control, textColor, align) {
    let text = control.properties.text ?? "";
    let x = parseInt(control.x);
    let y = parseInt(control.y);

    let font = this.parseFontProperties(control);
    let textMetrics = this.measureText(text, `${font.style} ${font.weight} ${font.size} ${font.family}`);

    let textX = align === "center" ? x + (control.w ?? control.measuredW) / 2 - textMetrics.width / 2 : x;
    let textY = y + control.measuredH / 2 + textMetrics.actualBoundingBoxAscent / 2;

    let textElement = makeSVGElement(
      "text",
      {
        x: textX,
        y: textY,
        fill: textColor,
        "font-style": font.style,
        "font-weight": font.weight,
        "font-size": font.size,
        "font-family": font.family,
      },
      this.container
    );

    if (!text.includes("{color:")) {
      let tspan = makeSVGElement("tspan", {}, textElement);
      tspan.textContent = text;

      return;
    }

    let split = text.split(/{color:|{color}/);
    split.forEach((str) => {
      if (str.includes("}")) {
        let [color, textPart] = str.split("}");

        if (!color.startsWith("#")) {
          let index = parseInt(color.slice(-1));
          color = isNaN(index) ? DEFAULT_COLORS[color][0] : DEFAULT_COLORS[color][index];
        }

        let tspan = makeSVGElement("tspan", { fill: color }, textElement);
        tspan.textContent = textPart;
      } else {
        let tspan = makeSVGElement("tspan", {}, textElement);
        tspan.textContent = str;
      }
    });
  }

  TextArea(control) {
    this.drawRectangle(control);
  }

  Canvas(control) {
    this.drawRectangle(control);
  }

  Label(control) {
    this.addText(control, this.parseColor(control.properties?.color, "0,0,0"), "left");
  }

  TextInput(control) {
    this.drawRectangle(control);

    this.addText(control, this.parseColor(control.properties?.textColor, "0,0,0"), "center");
  }

  Arrow(control) {
    let x = parseInt(control.x);
    let y = parseInt(control.y);
    let { p0, p1, p2 } = control.properties;

    let lineDash;
    if (control.properties?.stroke === "dotted") lineDash = "0.8 12";
    else if (control.properties?.stroke === "dashed") lineDash = "28 46";

    let xVector = { x: (p2.x - p0.x) * p1.x, y: (p2.y - p0.y) * p1.x };

    makeSVGElement(
      "path",
      {
        d: `M${x + p0.x} ${y + p0.y}Q${x + p0.x + xVector.x + xVector.y * p1.y * 3.6} ${
          y + p0.y + xVector.y + -xVector.x * p1.y * 3.6
        } ${x + p2.x} ${y + p2.y}`,
        fill: "none",
        stroke: this.parseColor(control.properties?.color, "0,0,0"),
        "stroke-width": ARROW_WIDTH,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-dasharray": lineDash,
      },
      this.container
    );
  }

  Icon(control) {
    let x = parseInt(control.x);
    let y = parseInt(control.y);

    makeSVGElement(
      "use",
      {
        href: "#iconCircle",
        x: x + 10,
        y: y + 10,
        fill: this.parseColor(control.properties?.color, "0,0,0"),
      },
      this.container
    );

    if (!control.properties.icon.ID.includes("check-circle")) {
      return;
    }

    makeSVGElement(
      "use",
      {
        href: "#checkmark",
        transform: `translate(${x} ${y})`,
      },
      this.container
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
        stroke: this.parseColor(control.properties?.color, "0,0,0"),
        "stroke-width": BORDER_WIDTH,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-dasharray": lineDash,
      },
      this.container
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
