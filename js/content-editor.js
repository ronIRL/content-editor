var activeElement;
var sel = window.getSelection;
var doc = document;
var editor;
var selection = (function () {
    function updateElementSelect(input) {
        activeElement = input;
        doc.querySelector("select#element-type-select").value = activeElement.nodeName;
    }
    function resetRange() {
        var startNode = doc.querySelector("sel-start").nextSibling;
        if (startNode.nodeName.toLowerCase() === "sel-end") {
            startNode = startNode.nextSibling;
        }
        while (startNode.childNodes.length > 0) {
            startNode = startNode.childNodes[0];
        }
        var endNode = doc.querySelector("sel-end").previousSibling;
        while (endNode.childNodes.length > 0) {
            endNode = endNode.childNodes[0];
        }
        var endTextNode = endNode;
        var newRange = doc.createRange();
        newRange.setStart(startNode, 0);
        newRange.setEnd(endNode, endTextNode.length);
        sel().removeAllRanges();
        sel().addRange(newRange);
        var selNodes = doc.querySelectorAll("sel-start, sel-end");
        for (var i = 0; i < selNodes.length; i++) {
            selNodes[i].remove();
        }
    }
    return {
        resetRange: resetRange,
        updateElement: updateElementSelect
    };
})();
var inSelection = false;
var pastSplit = false;
var content = (function () {
    function createContent(abstractChild) {
        function createContentHelper(parents, name, value) {
            if (parents.length === 0) {
                if (name === "#text") {
                    return doc.createTextNode(value);
                }
                else {
                    return doc.createElement(name);
                }
            }
            else {
                var node = doc.createElement(parents[0].name);
                if (parents[0].attrs) {
                    for (var i = 0; i < parents[0].attrs.length; i++) {
                        node.setAttribute(parents[0].attrs[i].name, parents[0].attrs[i].value);
                    }
                }
                node.appendChild(createContentHelper(parents.slice(1, parents.length), name, value));
                return node;
            }
        }
        return createContentHelper(abstractChild.parents, abstractChild.name, abstractChild.value);
    }
    function getInlineElement(node, parents) {
        var list = [];
        if (node.childNodes.length === 0) {
            return [abstractContent.createItem(node, parents)];
        }
        else {
            for (var i = 0; i < node.childNodes.length; i++) {
                var newParent = { name: node.nodeName, attrs: abstractContent.nodeToAttrList(node) };
                list = list.concat(getInlineElement(node.childNodes[i], parents.concat(newParent)));
            }
        }
        return list;
    }
    function getInline(element) {
        var list = [];
        for (var i = 0; i < element.childNodes.length; i++) {
            list = list.concat(getInlineElement(element.childNodes[i], []));
        }
        return list;
    }
    function splitInline(element) {
        function splitInlineElement(node, parents) {
            var result = { left: [], right: [] };
            if (node.childNodes.length === 0) {
                if (node === sel().extentNode) {
                    var textNode = node;
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
                for (var i = 0; i < node.childNodes.length; i++) {
                    var newParent = { name: node.nodeName, attrs: abstractContent.nodeToAttrList(node) };
                    var subResult = void 0;
                    subResult = splitInlineElement(node.childNodes[i], parents.concat(newParent));
                    result.left = result.left.concat(subResult.left);
                    result.right = result.right.concat(subResult.right);
                }
            }
            return result;
        }
        var result = { left: [], right: [] };
        pastSplit = false;
        for (var i = 0; i < element.childNodes.length; i++) {
            if (element.childNodes[i].contains(sel().extentNode)) {
                var subResult = splitInlineElement(element.childNodes[i], []);
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
    function applyInline(value, attrs) {
        function processInlineBlock(element, value, attrs, toggle) {
            if (toggle === void 0) { toggle = false; }
            function processInlineElement(node, value, parents, attrs, toggle) {
                if (toggle === void 0) { toggle = false; }
                function processInlineNode(node, value, parents, left, right, attrs, toggle) {
                    if (toggle === void 0) { toggle = false; }
                    var list = [];
                    if (value === "remove") {
                        value = "";
                        parents = [];
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
                            list = list.concat(abstractContent.createItem(node, parents.concat({ name: value, attrs: attrs }), left, right));
                        }
                        else {
                            list = list.concat(abstractContent.createItem(node, parents, left, right));
                        }
                    }
                    else if (node === sel().anchorNode && node === sel().extentNode) {
                        if (!toggle) {
                            if (value) {
                                list = list.concat([{ name: node.nodeName, parents: parents.concat({ name: value, attrs: attrs }), value: "\u200B" }]);
                            }
                            else {
                                list = list.concat([{ name: node.nodeName, parents: [], value: "\u200B" }]);
                            }
                        }
                        else {
                            var newParents_1 = [];
                            if (parents && parents.length && parents.length > 0) {
                                parents.forEach(function (parent) {
                                    if (parent.name.toLowerCase() !== value && (!attrs || attrs.length == 0 || !abstractContent.sameAttrs(attrs, parent.attrs))) {
                                        newParents_1 = newParents_1.concat(parent);
                                    }
                                });
                            }
                            list = list.concat([{ name: node.nodeName, parents: newParents_1, value: "\u200B" }]);
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
                function getDataStyle(input) {
                    var result;
                    if (input) {
                        input.forEach(function (attr) { if (attr.name == "data-style") {
                            result = attr.value;
                        } });
                    }
                    return result;
                }
                if (node.childNodes.length === 0) {
                    var left = void 0, right = void 0;
                    if (!node.nodeValue || !sel().containsNode(node, true)) {
                        // node does not contain selected text
                        return [abstractContent.createItem(node, parents)];
                    }
                    // node contains selected text
                    if (node === sel().anchorNode && node === sel().extentNode) {
                        left = Math.min(sel().anchorOffset, sel().extentOffset);
                        right = Math.max(sel().anchorOffset, sel().extentOffset);
                    }
                    else if (node === sel().anchorNode) {
                        if (!inSelection) {
                            left = sel().anchorOffset;
                            right = node.nodeValue.length;
                        }
                        else {
                            left = 0;
                            right = sel().anchorOffset;
                        }
                    }
                    else if (node === sel().extentNode) {
                        if (inSelection) {
                            left = 0;
                            right = sel().extentOffset;
                        }
                        else {
                            left = sel().extentOffset;
                            right = node.nodeValue.length;
                        }
                    }
                    else {
                        left = 0;
                        right = node.nodeValue.length;
                    }
                    return processInlineNode(node, value, parents, left, right, attrs, toggle);
                }
                else {
                    var list_1 = [];
                    for (var i = 0; i < node.childNodes.length; i++) {
                        var attrList = abstractContent.nodeToAttrList(node);
                        if (node.nodeName.toLowerCase() !== value || (getDataStyle(attrs) !== getDataStyle(attrList))) {
                            // Node does not match current style
                            list_1 = list_1.concat(processInlineElement(node.childNodes[i], value, parents.concat({ name: node.nodeName, attrs: attrList }), attrs, toggle));
                        }
                        else {
                            // Node matches current style
                            if (sel().containsNode(node, true) && node.nodeName.toLowerCase() === value) {
                                // Node is in selection and node type matches style
                                if (sel().isCollapsed) {
                                    if (!toggle) {
                                        list_1 = list_1.concat(processInlineElement(node.childNodes[i], "", parents.concat({ name: node.nodeName, attrs: attrList }), attrs, toggle));
                                    }
                                    else {
                                        list_1 = list_1.concat(processInlineElement(node.childNodes[i], value, parents.concat({ name: node.nodeName, attrs: attrList }), attrs, toggle));
                                    }
                                }
                                else {
                                    list_1 = list_1.concat(processInlineElement(node.childNodes[i], value, parents, attrs, toggle));
                                }
                            }
                            else {
                                // Node is not in selection, or node type does not match
                                list_1 = list_1.concat(processInlineElement(node.childNodes[i], value, parents.concat({ name: node.nodeName, attrs: attrList }), attrs, toggle));
                            }
                        }
                    }
                    return list_1;
                }
            }
            var list = [];
            for (var i = 0; i < element.childNodes.length; i++) {
                list = list.concat(processInlineElement(element.childNodes[i], value, [], attrs, toggle));
            }
            return list;
        }
        function shouldToggle(value, attrs) {
            function nodeListToArrayNode(input) {
                var result = [];
                for (var index = 0; index < input.length; index++) {
                    result = result.concat(input[index]);
                }
                return result;
            }
            function getSelectedNodes(input) {
                var result = [];
                input.forEach(function (child) {
                    if (child.childNodes.length == 0) {
                        result = result.concat((sel().containsNode(child, true) ? [child] : []));
                    }
                    else {
                        result = result.concat(getSelectedNodes(nodeListToArrayNode(child.childNodes)));
                    }
                });
                return result;
            }
            function styleMatch(element, value, attrs) {
                var dataStyleMatch = (attrs && (attrs.length == 0 || abstractContent.sameAttrs(attrs, abstractContent.nodeToAttrList(element))));
                return (element.nodeName.toLowerCase() === value && (!attrs || dataStyleMatch));
            }
            var result = true;
            var nodeList = getSelectedNodes(nodeListToArrayNode(activeElement.childNodes));
            var matchingElems = [];
            nodeList.forEach(function (node) {
                var elem = node.parentElement;
                var result = false;
                while (elem && !elem.hasAttribute("contenteditable")) {
                    if (styleMatch(elem, value, attrs)) {
                        result = true;
                    }
                    elem = elem.parentElement;
                }
                matchingElems = matchingElems.concat(result);
            });
            matchingElems.forEach(function (bool) { if (!bool) {
                result = false;
            } });
            return result;
        }
        if (activeElement && activeElement.contains(sel().focusNode)) {
            var wasCollapsed = sel().isCollapsed;
            var toggle = (shouldToggle(value, attrs) && value !== "remove");
            inSelection = false;
            var contentList = processInlineBlock(activeElement, value, attrs, toggle);
            activeElement.innerHTML = "";
            contentList.forEach(function (abstractChild) {
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
        create: createContent,
        apply: applyInline,
        get: getInline,
        split: splitInline // element -> pair of abstract node lists
    };
})();
var abstractContent = (function () {
    function createAbstractNode(node, parents, left, right) {
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
        };
    }
    function nodeToAttrList(node) {
        var attrList = [];
        for (var i = 0; i < node.attributes.length; i++) {
            attrList = attrList.concat({ name: node.attributes[i].name, value: node.attributes[i].value });
        }
        return attrList;
    }
    function getAbstractBlock(input) {
        return { block: { name: input.nodeName, attrs: nodeToAttrList(input) }, content: content.get(input) };
    }
    function getAbstractBlocks() {
        var result = [];
        var parentBlock, elem;
        editor = doc.getElementById('content-editor');
        for (var child = 0; child < editor.children.length; child++) {
            result = result.concat(getAbstractBlock(editor.children[child]));
        }
        return result;
    }
    function sameAttrs(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        else {
            for (var x = 0; x < a.length; x++) {
                var result = false;
                for (var y = 0; y < b.length; y++) {
                    if (a[x].name === b[y].name && a[x].value === b[y].value) {
                        result = true;
                    }
                }
                ;
                if (!result)
                    return result;
            }
            ;
            return true;
        }
    }
    return {
        createItem: createAbstractNode,
        nodeToAttrList: nodeToAttrList,
        getBlock: getAbstractBlock,
        getBlocks: getAbstractBlocks,
        sameAttrs: sameAttrs
    };
})();
var keyboard = (function () {
    function enterAction(event) {
        activeElement = event.srcElement;
        if (doc.getElementById('content-editor').contains(activeElement)) {
            block.set(block.split());
            selection.resetRange();
        }
        event.preventDefault();
    }
    function backspaceAction(event) {
        activeElement = event.srcElement;
        var previousElement = activeElement.previousElementSibling;
        if (previousElement) {
            previousElement.innerHTML += "<sel-start></sel-start>\u200B<sel-end></sel-end>";
            previousElement.innerHTML += activeElement.innerHTML;
            activeElement.remove();
            selection.resetRange();
            previousElement.focus();
        }
        else if (activeElement.innerHTML === "") {
            var nextElement = activeElement.nextElementSibling;
            if (nextElement) {
                activeElement.remove();
                nextElement.focus();
            }
        }
        event.preventDefault();
    }
    function keypressAction(event) {
        if (event.code === "Enter") {
            enterAction(event);
        }
        if (event.code === "Backspace" && sel().getRangeAt(0).startOffset == 0 && sel().isCollapsed) {
            backspaceAction(event);
        }
    }
    return {
        action: keypressAction
    };
})();
var block = (function () {
    function makeBlock(input) {
        var newElement;
        newElement = doc.createElement(input.block.name);
        for (var attr = 0; attr < input.block.attrs.length; attr++) {
            newElement.setAttribute(input.block.attrs[attr].name, input.block.attrs[attr].value);
        }
        for (var child = 0; child < input.content.length; child++) {
            newElement.appendChild(content.create(input.content[child]));
        }
        return newElement;
    }
    function setElementType(input) {
        editor = doc.getElementById('content-editor');
        if (activeElement && doc.getElementById('content-editor').contains(activeElement)) {
            var activeContent = content.get(activeElement);
            var activeAttributes = abstractContent.nodeToAttrList(activeElement);
            var newParentBlock = { name: input, attrs: activeAttributes };
            var newBlock = makeBlock({ block: newParentBlock, content: activeContent });
            activeElement.parentElement.replaceChild(newBlock, activeElement);
            activeElement.focus();
        }
    }
    function set(input) {
        editor = doc.getElementById('content-editor');
        editor.innerHTML = "";
        for (var foo = 0; foo < input.length; foo++) {
            var newBlock = doc.createElement(input[foo].block.name);
            for (var bar = 0; bar < input[foo].block.attrs.length; bar++) {
                newBlock.setAttribute(input[foo].block.attrs[bar].name, input[foo].block.attrs[bar].value);
            }
            for (var baz = 0; baz < input[foo].content.length; baz++) {
                newBlock.appendChild(content.create(input[foo].content[baz]));
            }
            editor.appendChild(newBlock);
        }
    }
    function setStyle(name, value) {
        activeElement.style[name] = value;
    }
    function split() {
        var result = [];
        var parentBlock, elem;
        editor = doc.getElementById('content-editor');
        for (var child = 0; child < editor.children.length; child++) {
            elem = editor.children[child];
            parentBlock = { name: elem.nodeName, attrs: abstractContent.nodeToAttrList(elem) };
            if (elem.contains(sel().extentNode)) {
                var splitBlock = content.split(elem);
                var selStartNode = { name: "sel-start", value: "", parents: [] };
                var selEndNode = { name: "sel-end", value: "", parents: [] };
                splitBlock.right = [selStartNode, selEndNode].concat(splitBlock.right);
                result = result.concat({ block: parentBlock, content: splitBlock.left });
                result = result.concat({ block: parentBlock, content: splitBlock.right });
            }
            else {
                result = result.concat({ block: parentBlock, content: content.get(elem) });
            }
        }
        return result;
    }
    function toString() {
        editor = doc.getElementById('content-editor');
        var htmlString = "";
        for (var a = 0; a < editor.children.length; a++) {
            if (a > 0) {
                htmlString += "\n";
            }
            var abstractChildren = content.get(editor.children[a]);
            for (var b = 0; b < abstractChildren.length; b++) {
                for (var c = 0; c < abstractChildren[b].parents.length; c++) {
                    var cleanedAttrs = [];
                    for (var d = 0; d < abstractChildren[b].parents[c].attrs.length; d++) {
                        if (abstractChildren[b].parents[c].attrs[d].name.toLowerCase().slice(0, 5) !== "data-") {
                            cleanedAttrs = cleanedAttrs.concat(abstractChildren[b].parents[c].attrs[d]);
                        }
                    }
                    abstractChildren[b].parents[c].attrs = cleanedAttrs;
                }
            }
            var attrList = abstractContent.nodeToAttrList(editor.children[a]);
            var newAttrList = [];
            for (var e = 0; e < attrList.length; e++) {
                if (!["contenteditable", "onkeydown", "onfocus"].includes(attrList[e].name)) {
                    newAttrList = newAttrList.concat(attrList[e]);
                }
            }
            var elem = makeBlock({ block: { name: editor.children[a].nodeName, attrs: newAttrList }, content: abstractChildren });
            htmlString += elem.outerHTML;
        }
        if (doc.getElementById('output')) {
            doc.getElementById('output').innerText = htmlString;
        }
        return htmlString;
    }
    return {
        create: makeBlock,
        setType: setElementType,
        split: split,
        set: set,
        setStyle: setStyle,
        toString: toString
    };
})();
//# sourceMappingURL=content-editor.js.map