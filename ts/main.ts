var activeElement: HTMLElement;
var sel = window.getSelection;
var doc = document;
var editor: HTMLElement;

interface attrObj {
  name: string,
  value: string
}

interface abstractParent {
  name: string,
  attrs: Array<attrObj>
}

interface abstractNode {
  name: string,
  value: string,
  parents: Array<abstractParent>
}

interface abstractBlock {
  block: abstractParent,
  content: Array<abstractNode>
}

interface splitContent {
  left: Array<abstractNode>,
  right: Array<abstractNode>
}