var keyboard = (function () {

  function enterAction(event: any): void {
    activeElement = event.srcElement;
    if (doc.getElementById('content-editor').contains(activeElement)) { 
      block.set(block.split());
      selection.resetRange();
    }
    event.preventDefault();
  }

  function backspaceAction(event: any): void {
    activeElement = event.srcElement;
    var previousElement = <HTMLElement>activeElement.previousElementSibling;
    if (previousElement) {
      previousElement.innerHTML += "<sel-start></sel-start>\u200B<sel-end></sel-end>";
      previousElement.innerHTML += activeElement.innerHTML;
      activeElement.remove();
      selection.resetRange();
      previousElement.focus();
    }
    else if (activeElement.innerHTML === "") {
      var nextElement = <HTMLElement>activeElement.nextElementSibling;
      if (nextElement) {
        activeElement.remove();
        nextElement.focus();
      }
    }
    event.preventDefault();
  }

  function keypressAction(event: any): void {
    if (event.code === "Enter") {
      enterAction(event);
    }
    if (event.code === "Backspace" && sel().getRangeAt(0).startOffset == 0 && sel().isCollapsed) {
      backspaceAction(event);
    }
  }

  return {
    action: keypressAction
  }
})();