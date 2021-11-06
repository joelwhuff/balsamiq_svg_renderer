export function getRGBFromDecimalColor(color) {
  let red = (color >> 16) & 0xff;
  let green = (color >> 8) & 0xff;
  let blue = color & 0xff;
  return `rgb(${red},${green},${blue})`;
}

export function makeSVGElement(type, attributes = {}, parent) {
  let element = document.createElementNS("http://www.w3.org/2000/svg", type);

  for (let prop in attributes) {
    element.setAttribute(prop, attributes[prop]);
  }

  parent && parent.appendChild(element);

  return element;
}
