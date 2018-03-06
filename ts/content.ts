var inSelection = false;
var pastSplit = false;

var content = (function () {

  function createContent(abstractChild: abstractNode): Node {

    function createContentHelper(parents: Array<abstractParent>, name: string, value: string): Node {
      if (parents.length === 0) {
        if (name === "#text") {
          return doc.createTextNode(value);
        }
        else {
          return doc.createElement(name);
        }
      }
      else {
        let node = doc.createElement(parents[0].name);
        if (parents[0].attrs) {
          for (let i = 0; i < parents[0].attrs.length; i++) {
            node.setAttribute(parents[0].attrs[i].name, parents[0].attrs[i].value);
          }
        }
        node.appendChild(createContentHelper(parents.slice(1, parents.length), name, value));
        return node;
      }
    }

    return createContentHelper(abstractChild.parents, abstractChild.name, abstractChild.value);
  }

  function getInlineElement(node: Node, parents: Array<abstractParent>): Array<abstractNode> {
    let list: Array<abstractNode> = [];
    if (node.childNodes.length === 0) {
      return [abstractContent.createItem(node, parents)];
    }
    else {
      for (let i = 0; i < node.childNodes.length; i++) {
        let newParent: abstractParent = {name: node.nodeName, attrs: abstractContent.nodeToAttrList(node)};
        list = list.concat(getInlineElement(node.childNodes[i], parents.concat(newParent)));
      }
    }
    return list;
  }

  function getInline(element: Element): Array<abstractNode> {
    let list: Array<abstractNode> = [];
    for(let i = 0; i < element.childNodes.length; i++) {
      list = list.concat(getInlineElement(element.childNodes[i], []));
    }
    return list;
  }

  function splitInline(element: Element): splitContent {

    function splitInlineElement(node: Node, parents: Array<abstractParent>): splitContent {
      let result: splitContent = {left: [], right: []};
      if (node.childNodes.length === 0) {
        if (node === sel().extentNode) {
          let textNode = <Text>node;
          result.left = [abstractContent.createItem(node, parents, 0, sel().extentOffset)];
          result.right = [abstractContent.createItem(node, parents, sel().extentOffset, textNode.length)];
          pastSplit = true;
        }
        else if (!pastSplit) {
          result.left = [abstractContent.createItem(node, parents)];
        }
        else {
          result.right = [abstractContent.createItem(node, parents)];
        }
      }
      else {
        for (let i = 0; i < node.childNodes.length; i++) {
          let newParent: abstractParent = {name: node.nodeName, attrs: abstractContent.nodeToAttrList(node)};
          let subResult: splitContent;
          subResult = splitInlineElement(node.childNodes[i], parents.concat(newParent));
          result.left = result.left.concat(subResult.left);
          result.right = result.right.concat(subResult.right);
        }
      }
      return result;
    }

    let result: splitContent = {left: [], right: []};
    pastSplit = false;
    for(let i = 0; i < element.childNodes.length; i++) {
      if (element.childNodes[i].contains(sel().extentNode)) {
        let subResult = splitInlineElement(element.childNodes[i], []);
        result.left = result.left.concat(subResult.left);
        result.right = result.right.concat(subResult.right);
      }
      else if (!pastSplit) {
        result.left = result.left.concat(getInlineElement(element.childNodes[i], []));
      }
      else {
        result.right = result.right.concat(getInlineElement(element.childNodes[i], []));
      }
    }
    return result;
  }

  /*
  function sameParents(a: Array<abstractParent>, b: Array<abstractParent>): boolean {
    let result = true;
    if (!a || !b) {
      result = (!a && !b);
    }
    else if (a.length !== b.length) {
      result = false;
    }
    else {
      for(let x = 0; x < a.length; x++) {
        if (a[x].name !== b[x].name || abstractContent.sameAttrs(a[x].attrs, b[x].attrs)) {
          result = false;
        }
      }
    }
    return result;
  }

  function simplifyInline(input: Array<abstractNode>): Array<abstractNode> {
    let result = <abstractNode[]> [];
    let node: abstractNode;
    for(let count = 0; count < input.length; count++) {
      if (!node) {
        node = input[count];
      }
      else {
        if (node.name === input[count].name && sameParents(node.parents, input[count].parents)) {
          node.value = node.value + input[count].value;
        }
        else {
          result = result.concat(node);
          node = input[count];
        }
      }
    }
    if (node) {
      result = result.concat(node);
    }
    return result;
  }
  */
  function applyInline(value: string, attrs: Array<attrObj>): void {

    function processInlineBlock(element: HTMLElement, value: string, attrs: Array<attrObj>, toggle = false): Array<abstractNode> {

      function processInlineElement(node: Node, value: string, parents: Array<abstractParent>, attrs: Array<attrObj>, toggle = false): Array<abstractNode> {

        function processInlineNode(node: Node, value: string, parents: Array<abstractParent>, left: number, right: number, attrs: Array<attrObj>, toggle = false): Array<abstractNode> {
          let list: Array<abstractNode> = [];
          if (value === "remove") {
            value = "";
            parents = <abstractParent[]> [];
          }
          if (toggle && !sel().isCollapsed) {
            value = "";
          }
          if (left > 0) {
            list = list.concat(abstractContent.createItem(node, parents, 0, left));
          }
          if ((node === sel().anchorNode || node === sel().extentNode) && !inSelection) {
            list = list.concat(abstractContent.createItem(doc.createElement("sel-start"), []));
          }
          if (right > left) {
            if (value.length > 0) {
              list = list.concat(abstractContent.createItem(node, parents.concat({name: value, attrs: attrs}), left, right));
            }
            else {
              list = list.concat(abstractContent.createItem(node, parents, left, right));
            }
          }
          else if (node === sel().anchorNode && node === sel().extentNode) {
            if (!toggle) {
              if (value) {
                list = list.concat([{name: node.nodeName, parents: parents.concat({name: value, attrs: attrs}), value: "\u200B"}]);
              }
              else {
                list = list.concat([{name: node.nodeName, parents: [], value: "\u200B"}]);
              }
            }
            else {
              let newParents = <abstractParent[]> [];
              if (parents && parents.length && parents.length > 0) {
                parents.forEach(parent => {
                  if (parent.name.toLowerCase() !== value && (!attrs || attrs.length == 0 || !abstractContent.sameAttrs(attrs, parent.attrs))) {
                    newParents = newParents.concat(parent);
                  }
                });
              }
              list = list.concat([{name: node.nodeName, parents: newParents, value: "\u200B"}]);
            }
          }
          if (((node === sel().anchorNode || node === sel().extentNode) && inSelection) ||
               (node === sel().anchorNode && node === sel().extentNode)) {
            list = list.concat(abstractContent.createItem(doc.createElement("sel-end"), []));
          }
          if (node.nodeValue.length > right) {
            list = list.concat(abstractContent.createItem(node, parents, right, node.nodeValue.length));
          }
          if (node === sel().anchorNode || node === sel().extentNode) {
            inSelection = !inSelection;
          }
          return list;
        }

        function getDataStyle(input: Array<attrObj>): string {
          let result: string;
          if (input) {
            input.forEach(attr => {if (attr.name == "data-style") {result = attr.value;}});
          }
          return result;
        }
      
        if (node.childNodes.length === 0) {
          let left: number, right: number;
          if (!node.nodeValue || !sel().containsNode(node, true)) {
            // node does not contain selected text
            return [abstractContent.createItem(node, parents)];
          }
          // node contains selected text
          if (node === sel().anchorNode && node === sel().extentNode) {
            left  = Math.min(sel().anchorOffset, sel().extentOffset);
            right = Math.max(sel().anchorOffset, sel().extentOffset);
          }
          else if (node === sel().anchorNode) {
            if (!inSelection) { // sel is forwards
              left  = sel().anchorOffset;
              right = node.nodeValue.length;
            }
            else { // sel is backwards
              left  = 0;
              right = sel().anchorOffset;
            }
          }
          else if (node === sel().extentNode) {
            if (inSelection) { // sel is forwards
              left  = 0;
              right = sel().extentOffset;
            }
            else { // sel is backwards
              left  = sel().extentOffset;
              right = node.nodeValue.length;
            }
          }
          else {
            left  = 0;
            right = node.nodeValue.length;
          }
          return processInlineNode(node, value, parents, left, right, attrs, toggle);
        }
        else {
          let list: Array<abstractNode> = [];
          for (let i = 0; i < node.childNodes.length; i++) {
            let attrList = abstractContent.nodeToAttrList(node);
            if (node.nodeName.toLowerCase() !== value || (getDataStyle(attrs) !== getDataStyle(attrList))) {
              // Node does not match current style
              list = list.concat(processInlineElement(node.childNodes[i], value, parents.concat({name: node.nodeName, attrs: attrList}), attrs, toggle));
            }
            else {
              // Node matches current style
              if (sel().containsNode(node, true) && node.nodeName.toLowerCase() === value) {
                // Node is in selection and node type matches style
                if (sel().isCollapsed) {
                  if (!toggle) {
                    list = list.concat(processInlineElement(node.childNodes[i], "", parents.concat({name: node.nodeName, attrs: attrList}), attrs, toggle));
                  }
                  else {
                    list = list.concat(processInlineElement(node.childNodes[i], value, parents.concat({name: node.nodeName, attrs: attrList}), attrs, toggle));
                  }
                }
                else {
                  list = list.concat(processInlineElement(node.childNodes[i], value, parents, attrs, toggle));
                }
              }
              else {
                // Node is not in selection, or node type does not match
                list = list.concat(processInlineElement(node.childNodes[i], value, parents.concat({name: node.nodeName, attrs: attrList}), attrs, toggle));
              }
            }
          }
          return list;
        }
      }

      let list: Array<abstractNode> = [];
      for(let i = 0; i < element.childNodes.length; i++) {
        list = list.concat(processInlineElement(element.childNodes[i], value, [], attrs, toggle));
      }
      return list;
    }

    function shouldToggle(value: string, attrs: Array<attrObj>): boolean {

      function nodeListToArrayNode(input: NodeList): Array<Node> {
        let result = <Node[]> [];
        for(let index = 0; index < input.length; index++) {
          result = result.concat(input[index]);
        }
        return result;
      }

      function getSelectedNodes(input: Array<Node>): Array<Node> {
        let result = <Node[]> [];
        input.forEach(child => {
          if (child.childNodes.length == 0) {
            result = result.concat((sel().containsNode(child, true) ? [child] : []));
          }
          else {
            result = result.concat(getSelectedNodes(nodeListToArrayNode(child.childNodes)));
          }
        });
        return result;
      }

      function styleMatch(element: Element, value: string, attrs: Array<attrObj>): boolean {
        let dataStyleMatch = (attrs && (attrs.length == 0 || abstractContent.sameAttrs(attrs, abstractContent.nodeToAttrList(element))));
        return (element.nodeName.toLowerCase() === value && (!attrs || dataStyleMatch));
      }
  
      let result = true;
      let nodeList = getSelectedNodes(nodeListToArrayNode(activeElement.childNodes));
      let matchingElems = <boolean[]> [];
      nodeList.forEach(node => {
        let elem = node.parentElement;
        let result = false;
        while (elem && !elem.hasAttribute("contenteditable")) {
          if (styleMatch(elem, value, attrs)) {
            result = true;
          }
          elem = elem.parentElement;
        }
        matchingElems = matchingElems.concat(result);
      });
      matchingElems.forEach(bool => {if (!bool) {result = false;}})
      return result;
    }

    if (activeElement && activeElement.contains(sel().focusNode)) {
      let wasCollapsed = sel().isCollapsed;
      let toggle = (shouldToggle(value, attrs) && value !== "remove");
      inSelection = false;
      let contentList = processInlineBlock(activeElement, value, attrs, toggle);
      activeElement.innerHTML = "";
      contentList.forEach(function(abstractChild) {
        activeElement.appendChild(createContent(abstractChild));
      });
      selection.resetRange();
      if (wasCollapsed) {
        sel().collapse(sel().extentNode, sel().extentOffset);
      }
      activeElement.normalize();
      activeElement.focus();
    }
  }

  return {
    create: createContent, // abstract node -> node
    apply: applyInline, // value, attr obj
    get: getInline, // element -> abstract node list
    split: splitInline // element -> pair of abstract node lists
  }
})();