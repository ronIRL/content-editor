var abstractContent = (function () {

  function createAbstractNode(node: Node, parents: Array<abstractParent>, left?: number, right?: number): abstractNode {
    if (node.nodeValue && left === undefined) {
      left = 0;
    }
    if (node.nodeValue && right === undefined) {
      right = node.nodeValue.length;
    }
    return {
      name: node.nodeName,
      parents: parents,
      value: (node.nodeValue ? node.nodeValue.slice(left, right) : "")
    }
  }

  function nodeToAttrList(node: Node): Array<attrObj> {
    let attrList: Array<attrObj> = [];
    for(let i = 0; i < node.attributes.length; i++) {
      attrList = attrList.concat({name: node.attributes[i].name, value: node.attributes[i].value});
    }
    return attrList;
  }

  function getAbstractBlock(input: Element): abstractBlock {
    return {block: {name: input.nodeName, attrs: nodeToAttrList(input)}, content: content.get(input)};
  }

  function getAbstractBlocks(): Array<abstractBlock> {
    let result: Array<abstractBlock> = [];
    let parentBlock: abstractParent, elem: Element;
    editor = doc.getElementById('content-editor');
    for(let child = 0; child < editor.children.length; child++) {
      result = result.concat(getAbstractBlock(editor.children[child]));
    }
    return result;
  }

  function sameAttrs(a: Array<attrObj>, b: Array<attrObj>) {
    if (a.length !== b.length) {
      return false;
    }
    else {
      for(let x = 0; x < a.length; x++) {
        let result = false;
        for(let y = 0; y < b.length; y++) {
          if (a[x].name === b[y].name && a[x].value === b[y].value) {
            result = true;
          }
        };
        if (!result) return result;
      };
      return true;
    }
  }

  return {
    createItem: createAbstractNode,
    nodeToAttrList: nodeToAttrList,
    getBlock: getAbstractBlock,
    getBlocks: getAbstractBlocks,
    sameAttrs: sameAttrs
  }
})();