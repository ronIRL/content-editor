var block = (function() {

  function makeBlock(input: abstractBlock): HTMLElement {
    let newElement: HTMLElement;
    newElement = doc.createElement(input.block.name);
    for(let attr = 0; attr < input.block.attrs.length; attr++) {
      newElement.setAttribute(input.block.attrs[attr].name, input.block.attrs[attr].value);
    }
    for (let child = 0; child < input.content.length; child++) {
      newElement.appendChild(content.create(input.content[child]));
    }
    return newElement;
  }

  function setElementType(input: string): void {
    editor = doc.getElementById('content-editor');
    if (activeElement && doc.getElementById('content-editor').contains(activeElement)) {
      let activeContent = content.get(activeElement);
      let activeAttributes = abstractContent.nodeToAttrList(activeElement);
      let newParentBlock: abstractParent = {name: input, attrs: activeAttributes};
      let newBlock = makeBlock({block: newParentBlock, content: activeContent});
      activeElement.parentElement.replaceChild(newBlock, activeElement);
      activeElement.focus();
    }
  }

  function set(input: Array<abstractBlock>): void {
    editor = doc.getElementById('content-editor');
    editor.innerHTML = "";
    for(let foo = 0; foo < input.length; foo++) {
      let newBlock = doc.createElement(input[foo].block.name);
      for(let bar = 0; bar < input[foo].block.attrs.length; bar++) {
        newBlock.setAttribute(input[foo].block.attrs[bar].name, input[foo].block.attrs[bar].value);
      }
      for(let baz = 0; baz < input[foo].content.length; baz++) {
        newBlock.appendChild(content.create(input[foo].content[baz]));
      }
      editor.appendChild(newBlock);
    }
  }

  function setStyle(name: string, value: string): void {
    activeElement.style[<any>name] = value;
  }

  function split(): Array<abstractBlock> {
    let result: Array<abstractBlock> = [];
    let parentBlock: abstractParent, elem: Element;
    editor = doc.getElementById('content-editor');
    for(let child = 0; child < editor.children.length; child++) {
      elem = editor.children[child];
      parentBlock = {name: elem.nodeName, attrs: abstractContent.nodeToAttrList(elem)};
      if (elem.contains(sel().extentNode)) {
        let splitBlock = content.split(elem);
        let selStartNode: abstractNode = {name: "sel-start", value: "", parents: []};
        let selEndNode: abstractNode = {name: "sel-end", value: "", parents: []};
        splitBlock.right = [selStartNode, selEndNode].concat(splitBlock.right);
        result = result.concat({block: parentBlock, content: splitBlock.left});
        result = result.concat({block: parentBlock, content: splitBlock.right});
      }
      else {
        result = result.concat({block: parentBlock, content: content.get(elem)});
      }
    }
    return result;
  }

  function toString(): string {
    editor = doc.getElementById('content-editor');
    let htmlString = "";
    for (let a = 0; a < editor.children.length; a++) {
      if (a > 0) {
        htmlString += "\n";
      }
      let abstractChildren = content.get(editor.children[a]);
      for(let b = 0; b < abstractChildren.length; b++) {
        for(let c = 0; c < abstractChildren[b].parents.length; c++) {
          let cleanedAttrs = <attrObj[]> [];
          for(let d = 0; d < abstractChildren[b].parents[c].attrs.length; d++) {
            if (abstractChildren[b].parents[c].attrs[d].name.toLowerCase().slice(0,5) !== "data-") {
              cleanedAttrs = cleanedAttrs.concat(abstractChildren[b].parents[c].attrs[d]);
            }
          }
          abstractChildren[b].parents[c].attrs = cleanedAttrs;
        }
      }
      let attrList = abstractContent.nodeToAttrList(editor.children[a]);
      let newAttrList = <attrObj[]> [];
      for(let e = 0; e < attrList.length; e++) {
        if (!["contenteditable", "onkeydown", "onfocus"].includes(attrList[e].name)) {
          newAttrList = newAttrList.concat(attrList[e]);
        }
      }
      let elem = makeBlock({block: {name: editor.children[a].nodeName, attrs: newAttrList}, content: abstractChildren});
      htmlString += elem.outerHTML;
    }
    if (doc.getElementById('output')) {
      doc.getElementById('output').innerText = htmlString;
    }
    return htmlString;
  }

  return {
    create: makeBlock, // abstract block -> html element
    setType: setElementType, // string
    split: split, // -> abstract block list
    set: set, // abstract block list
    setStyle: setStyle, // string string
    toString: toString 
  }
})();