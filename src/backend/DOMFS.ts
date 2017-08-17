import kvfs = require('../generic/key_value_filesystem');
import {default as Stats, FileType} from '../core/node_fs_stats';
import {FileFlag, ActionType} from '../core/file_flag';
import {ApiError, ErrorCode} from '../core/api_error';
import file = require('../core/file');
import path = require('path');

/**
 * A simple dom key-value store backed by a JavaScript object.
 */
export class DOMFSStore implements kvfs.SyncKeyValueStore, kvfs.SimpleSyncStore {
  private store: { [key: string]: NodeBuffer } = {};
  public name() { return 'domfs'; }
  public clear() { this.store = {}; }

  public beginTransaction(type: string): kvfs.SyncKeyValueRWTransaction {
    return new kvfs.SimpleSyncRWTransaction(this);
  }

  public get(key: string): NodeBuffer {
    return this.store[key];
  }

  public put(key: string, data: NodeBuffer, overwrite: boolean): boolean {
    if (!overwrite && this.store.hasOwnProperty(key)) {
      return false;
    }
    this.store[key] = data;
    return true;
  }

  public del(key: string): void {
    delete this.store[key];
  }
}

/**
 * A simple dom file system backed by an DOMFSStore.
 */
export default class DOMFS extends kvfs.SyncKeyValueFileSystem {
  private root: Node;
  private pathTagNameMap: {[key: string]: {[key: string]: number}} = {};

  constructor() {
    super({ store: new DOMFSStore() });
    this.root = document;
    this.loadDomTree();
  }

  private loadDomTree(): void {
    
    this.bfs(this.root, (node: any) => {
      
      // Create directory
      let basePath: string = this.getPath(node);
      let dirName: string = this.getTagName(node);
      let dirPath: string = this.appendCount(basePath, dirName);
      super.mkdirSync(dirPath, FileType.DIRECTORY);

      // Create children subdirectory
      super.mkdirSync(dirPath + "/children", FileType.DIRECTORY);
      super.mkdirSync(dirPath + "/child-by-id", FileType.DIRECTORY);

      // Create attribute files
      if (node.attributes != null) {
        for (let i: number = 0; i < node.attributes.length; i++) {
          let fname: string = dirPath + "/" + node.attributes[i].name.toLowerCase(); 
          let data: any = node.attributes[i].value;
          super.createFileSync(fname, FileFlag.getFileFlag('w'), 511);
          super.writeFileSync(fname, data, 'utf8', FileFlag.getFileFlag('w'), 511);
        }

        if (node.attributes['id']) {
          let dstpath = path.resolve(dirPath, "../../child-by-id");
          let srcpath = path.relative(dstpath, dirPath);
          super.symlinkSync(srcpath, dstpath + path.sep + node.attributes['id'].value, 'dir');
        }
      }
      // Create innerText file
      if (node.innerText) {
        let fname: string = dirPath + "/innerText";
        let data: any = node.innerText;
        super.createFileSync(fname, FileFlag.getFileFlag('w'), 511);
        super.writeFileSync(fname, data, 'utf8', FileFlag.getFileFlag('w'), 511);
      }
    })
  }

  private bfs(node: any, cb: Function): void {
    let queue: Array<any> = [node];
    let currentNode: any;
    while(queue.length > 0) {
      currentNode = queue.shift();
      cb(currentNode);
      if (!currentNode.children) {
        continue;
      }
      for (let i: number = 0; i < currentNode.children.length; i++) {
         queue.push(currentNode.children[i]);
      }
    }
  }

  private getPath(node: Node): string {
    let path: string = "";
    let parentNode: Node = node.parentNode;
    while(parentNode) {
      path = this.getTagName(parentNode) + "/children/" + path;
      parentNode = parentNode.parentNode;
    }
    return "/" + path;
  }

  private getTagName(node: Node): string {
    let tagName: string = node.nodeName;
    if (tagName[0] == '#') {
      return tagName.toLowerCase().substring(1);
    }
    return tagName.toLowerCase();
  }

  private getTag(t: string): any {
    let nameTokens: Array<string> = t.split('-');
    let name: string = nameTokens[0];
    let count: number = 0;
    if (nameTokens.length > 1) {
      count = parseInt(nameTokens[1]);
    }
    return {"name": name, "id": count};
  }

  private appendCount(dirPath: string, tagName: string): string {
    if (this.pathTagNameMap.hasOwnProperty(dirPath)) {
      if (this.pathTagNameMap[dirPath].hasOwnProperty(tagName)) {
        this.pathTagNameMap[dirPath][tagName]++;
      } else {
        this.pathTagNameMap[dirPath][tagName] = 1;
      }
    } else {
      this.pathTagNameMap[dirPath] = {};
      this.pathTagNameMap[dirPath][tagName] = 1;
    }

    let suffix: string = "";

    if (this.pathTagNameMap[dirPath][tagName] != 1) {
      suffix = "-"+ (this.pathTagNameMap[dirPath][tagName] - 1);
    }

    return dirPath + tagName + suffix;
  }

  private getNode(p: string): Node {
    let currNode: Node = null;
    let pathTokens: Array<string> = p.split('/');
    let isID: boolean = false;
    for (let i: number = 0; i < pathTokens.length; i++) {
      if (pathTokens[i] == '' || pathTokens[i] == 'children') {
        isID = false;
      } else if (pathTokens[i] == 'child-by-id') {
        isID = true;
      } else if (pathTokens[i] == 'document') {
        currNode = this.root;
      } else {
        if (isID) {
          currNode = document.getElementById(pathTokens[i])
          isID = false;
        } else {
          let tag: any = this.getTag(pathTokens[i])
          let currCount: number = 0;
          for(let j = 0; j < currNode.childNodes.length; j++)
          {
            let node: Node = currNode.childNodes[j];
            if (node.nodeType == Node.ELEMENT_NODE && this.getTagName(node) == tag["name"]) {
              if (currCount == tag["id"]) {
                currNode = node;
                break;
              } else {
                currCount++;
              }
            }
          }
        }
      }
    }
    return currNode;
  }

  public supportsSymlinks(): boolean { return true; }

  public renameSync(oldPath: string, newPath: string): void {
    let child: any = this.getNode(path.dirname(oldPath) + path.sep + path.basename(oldPath));
    let oldParent: any = child.parentNode;
    let newParent: any = this.getNode(path.dirname(newPath));
    // Check if tag or attribute
    if (this.getTagName(child) != path.basename(oldPath).toLowerCase()) {
      if (path.basename(oldPath) == 'innerText' && this.getTagName(child) != 'document') {
        newParent.innerText = child.innerText;       
      } else if (path.basename(oldPath) == 'id') {
        // TODO: Discuss what to do?
      } else {
        if (oldParent.hasAttribute(this.getTag(path.basename(oldPath))["name"])) {
          newParent.setAttribute(this.getTag(path.basename(oldPath)["name"]), 
            child.getAttribute(this.getTag(path.basename(oldPath))["name"]));  
        } else {
          // TODO: What error?
        }
      }
    } else {
      oldParent.removeChild(child);
      newParent.appendChild(child);
    }
    super.renameSync(oldPath, newPath);
  }

  public createFileSync(p: string, flag: FileFlag, mode: number): file.File {
    let parent: any = this.getNode(path.dirname(p));
    if (parent) {
      if (path.basename(p) != 'innerText' 
        && this.getTagName(parent) != 'document' 
        && !parent.hasAttribute(this.getTag(path.basename(p))["name"])) {
        parent.setAttribute(this.getTag(path.basename(p))["name"], "");
      } 
    }
    
    return super.createFileSync(p, flag, mode);
  }

  public unlinkSync(p: string): void {
    let parent: Node = this.getNode(path.dirname(p));
    if (parent) {
      let tag: any = this.getTag(path.basename(p));
      let currCount: number = 0;
      for (let i: number = 0; i < parent.childNodes.length; i++) {
        let currNode: Node = parent.childNodes[i];
        if (this.getTagName(currNode) == tag["name"] && currCount == tag["id"]) {
          parent.removeChild(currNode);
          break;
        }
      }  
    }
    super.unlinkSync(p);
  }

  public rmdirSync(p: string): void {
    let child: Node = this.getNode(path.dirname(p) + path.sep + path.basename(p));
    if (child) {
      let parent: Node = child.parentNode;
      parent.removeChild(child);  
    }
    super.rmdirSync(p);
  }

  public mkdirSync(p: string, mode: number): void {
    let parent: Node = this.getNode(path.dirname(p));
    if (parent) {
      let tag: any = this.getTag(path.basename(p));
      let newNode: Node = document.createElement(tag["name"]);
      parent.appendChild(newNode);  
    }
    super.mkdirSync(p, mode);
  }

}
