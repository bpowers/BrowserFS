import file_system = require('../core/file_system');
import {ApiError, ErrorCode} from '../core/api_error';
import file_flag = require('../core/file_flag');
import file = require('../core/file');
import Stats from '../core/node_fs_stats';
import preload_file = require('../generic/preload_file');
import {FileFlag, ActionType} from '../core/file_flag';
import * as path from 'path';


class DOMFile extends preload_file.PreloadFile<DOMFS2> implements file.File {

  private _node: Node;

  constructor(fs: DOMFS2, node: Node, path: string, flag: file_flag.FileFlag, stat: Stats, data: Buffer) {
    super(fs, path, flag, stat, data);
    this._node = node;
  }

  public syncSync(): void {
    if (this.isDirty()) {
      this._fs._syncSync(this);
      this.resetDirty();
    }
  }

  public closeSync(): void {
    this.syncSync();
  }
}

/**
 * A simple dom file system backed by an DOMFSStore.
 */
export default class DOMFS2 extends file_system.SynchronousFileSystem {

  private root: Node;

  constructor() {
    super();
    this.root = document;
  }

  public getName(): string {
	 	return "DOMFS2";
  }

  public static isAvailable(): boolean {
    return true;
  }

  public _syncSync(fd: preload_file.PreloadFile<any>) {
    
  }

  public isReadOnly(): boolean { return false; }
  public supportsSynch(): boolean { return true; }
  public supportsLinks(): boolean { return false; }
  public supportsProps(): boolean { return false; }

  private getData(node: any, name: string): Buffer {
    if (node.hasAttribute(name) || name == "innerText") {
      return new Buffer(node.getAttribute(name))
    } else {
      return undefined;
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

  private getNode(p: string): Node {
    let currNode: Node = this.root;
    let pathTokens: Array<string> = p.split('/');
    let isID: boolean = false;
    for (let i: number = 0; i < pathTokens.length; i++) {
      if (pathTokens[i] == '' || pathTokens[i] == 'children') {
        isID = false;
      } else if (pathTokens[i] == 'child-by-id') {
        isID = true;
      } else if (pathTokens[i] == 'document' ) {
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

  public createFileSync(p: string, flag: FileFlag, mode: number): file.File {
    let parent: any = this.getNode(path.dirname(p));
    if (parent) {
      if (path.basename(p) != 'innerText' 
        && this.getTagName(parent) != 'document' 
        && !parent.hasAttribute(this.getTag(path.basename(p))["name"])) {
        parent.setAttribute(this.getTag(path.basename(p))["name"], "");
      } 
    }
    // create an empty buffer for the new file
    let buffer: Buffer = new Buffer('');
    return new DOMFile(this, parent, p, flag, Stats.fromBuffer(buffer), buffer);
  }

  public statSync(p: string, isLstat: boolean): Stats {
    let node = this.getNode(p);
    if (!node) {
      throw ApiError.ENOENT(p);
    }

    let data = this.getData(node, path.basename(p));
    if (data === undefined) {
      throw ApiError.ENOENT(p);
    }
    
    return Stats.fromBuffer(data);
  }
  
  public openFileSync(p: string, flag: FileFlag): file.File {
    let node: any = this.getNode(path.dirname(p));
    if (!node) {
      throw ApiError.ENOTDIR(path.dirname(p));
    }
    let data = this.getData(node, path.basename(p));
    if (data === undefined) {
      throw ApiError.ENOENT(p);
    }
    return new DOMFile(this, node, p, flag, Stats.fromBuffer(data), data);
  }

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
  }

  public rmdirSync(p: string): void {
    let child: Node = this.getNode(path.dirname(p) + path.sep + path.basename(p));
    if (child) {
      let parent: Node = child.parentNode;
      parent.removeChild(child);  
    }
  }

  public mkdirSync(p: string, mode: number): void {
    let parent: Node = this.getNode(path.dirname(p));
    if (parent) {
      let tag: any = this.getTag(path.basename(p));
      let newNode: Node = document.createElement(tag["name"]);
      parent.appendChild(newNode);  
    }
  }

  public readdirSync(p: string): string[] {
    return null;
  }

}
