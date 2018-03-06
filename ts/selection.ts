var selection = (function() {

  function updateElementSelect(input: HTMLElement): void {
    activeElement = input;
    (<HTMLInputElement>doc.querySelector("select#element-type-select")).value = activeElement.nodeName;
  }

  function resetRange(): void {
    let startNode = doc.querySelector("sel-start").nextSibling;
    if (startNode.nodeName.toLowerCase() === "sel-end") {
      startNode = startNode.nextSibling;
    }
    while (startNode.childNodes.length > 0) {
      startNode = startNode.childNodes[0];
    }
    let endNode = doc.querySelector("sel-end").previousSibling;
    while (endNode.childNodes.length > 0) {
      endNode = endNode.childNodes[0];
    }
    let endTextNode = <Text>endNode;
    let newRange = doc.createRange();
    newRange.setStart(startNode, 0);
    newRange.setEnd(endNode, endTextNode.length);
    sel().removeAllRanges();
    sel().addRange(newRange);
    let selNodes = doc.querySelectorAll("sel-start, sel-end");
    for (let i = 0; i < selNodes.length; i++) {
      selNodes[i].remove();
    }
  }

  return {
    resetRange: resetRange,
    updateElement: updateElementSelect
  }
})();