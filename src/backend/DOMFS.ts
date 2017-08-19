import file_system = require('../core/file_system');
import {ApiError, ErrorCode} from '../core/api_error';
import file_flag = require('../core/file_flag');
import file = require('../core/file');
import {default as Stats, FileType} from '../core/node_fs_stats';
import preload_file = require('../generic/preload_file');
import {FileFlag, ActionType} from '../core/file_flag';
import * as path from 'path';


class DOMFile extends preload_file.PreloadFile<DOMFS> implements file.File {

  private _node: Node;

  constructor(fs: DOMFS, node: Node, path: string, flag: file_flag.FileFlag, stat: Stats, data: Buffer) {
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
export default class DOMFS extends file_system.SynchronousFileSystem {

  private root: Node;

  constructor() {
    super();
    this.root = document;
  }

  public getName(): string {
	 	return "DOMFS";
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

  private getTag(node: any): {[key: string]: any} {
    if (typeof(node) == "string") {
      let nameTokens: Array<string> = node.split('-');
      let name: string = nameTokens[0];
      let count: number = 0;
      if (nameTokens.length > 1) {
        count = parseInt(nameTokens[1]);
        if (isNaN(count)) {
          name = node;
          count = 0;
        }
      }
      return {"name": name, "id": count};
    } else  {
      let name: string = node.nodeName.toLowerCase();
      if (name[0] == '#')
        name = name.substring(1);
      let count: number = 0;
      let parent: any = node.parentNode;
      if (parent) {
        for (let i: number = 0; i < parent.childNodes.length; i++) {
          let child: any = parent.childNodes[i];
          if (child == node)
            break;
          if (parent.childNodes[i].nodeName == node.nodeName)
            count++;
        }
      }
      return {"name": name, "id": count};
    }
  }

  private isDir(node: any, p: string, considerSubDirs = true): boolean {
    if (considerSubDirs && path.basename(p) == 'children' || path.basename(p) == 'child-by-id')
      return this.isDir(node, path.dirname(p));

    let nodeTag = this.getTag(node);
    let pathTag = this.getTag(path.basename(p));
    return nodeTag["name"] == pathTag["name"] && nodeTag["count"] == pathTag["count"];
  }

  private isAttributeFile(node: any, p: string): boolean {
    return node.hasAttribute(path.basename(p));
  }

  private isInnerTextFile(p: string): boolean {
    return path.basename(p) == 'innerText';
  }

  private isFile(node: any, p: string): boolean {
    return this.isAttributeFile(node, p) || this.isInnerTextFile(p);
  }

  private getDataBuffer(node: any, p: string): Buffer {
    if (this.isAttributeFile(node, p))
      return new Buffer(node.getAttribute(path.basename(p)));

    if (this.isInnerTextFile(p))
      return new Buffer(node.innerText);

    if (this.isDir(node, p))
      return new Buffer('');

    throw ApiError.ENOENT(p);
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
          for(let j = 0; j < currNode.childNodes.length; j++)
          {
            let node: Node = currNode.childNodes[j];
            let nodeTag: any = this.getTag(node);
            if (node.nodeType == Node.ELEMENT_NODE
              && nodeTag["name"] == tag["name"]
              && nodeTag["count"] == tag["count"]) {
              currNode = node;
              break;
            }
          }
        }
      }
    }
    return currNode;
  }

  private getStats(node: any, p: string, data: Buffer, mode?: number): Stats {
    let currTime = new Date((new Date()).getTime());
    let stats: Stats;
    let fileType: number;
    let size: number;

    if (this.isDir(node, p)) {
      if (!mode)
        mode = 0x1ff;
      size = 4096;
      fileType = FileType.DIRECTORY;
    } else if (this.isFile(node, p)) {
      if (!mode)
        mode = 0x1a4;
      size = data.length;
      fileType = FileType.FILE;
    }

    return new Stats(fileType, size, mode, currTime, currTime, currTime);
  }

  public createFileSync(p: string, flag: FileFlag, mode: number): file.File {
    let buffer: Buffer = new Buffer('');
    let parent: any = this.getNode(path.dirname(p));

    if (!parent)
      throw ApiError.ENOENT(path.dirname(p));

    if (!this.isInnerTextFile(p) && !this.isAttributeFile(parent, p) && this.getTag(parent)["name"] != 'document')
      parent.setAttribute(this.getTag(path.basename(p))["name"], "");

    return new DOMFile(this, parent, p, flag, this.getStats(parent, p, buffer, mode), buffer);
  }

  public statSync(p: string, isLstat: boolean): Stats {
    let node: any = this.getNode(p);

    if (!node)
      throw ApiError.ENOENT(path.dirname(p));

    return this.getStats(node, p, this.getDataBuffer(node, p));
  }
  
  public openFileSync(p: string, flag: FileFlag): file.File {
    let node: any = this.getNode(path.dirname(p));

    if (!node)
      throw ApiError.ENOTDIR(path.dirname(p));

    let data: Buffer = this.getDataBuffer(node, p)

    return new DOMFile(this, node, p, flag, this.getStats(node, p, data), data);
  }

  public renameSync(oldPath: string, newPath: string): void {
    let child: any = this.getNode(path.dirname(oldPath) + path.sep + path.basename(oldPath));
    let oldParent: any = child.parentNode;
    let newParent: any = this.getNode(path.dirname(newPath));

    if (this.isInnerTextFile(oldPath)) {
      newParent.innerText = child.innerText;
      child.innerText = "";
    } else if (this.isAttributeFile(child, oldPath)){
      let attribute: string = this.getTag(path.basename(oldPath))["name"];
      let value: string = child.getAttribute(attribute);
      child.removeAttribute(attribute);
      newParent.setAttribute(attribute, value);
    } else {
      oldParent.removeChild(child);
      newParent.appendChild(child);
    }
  }

  public unlinkSync(p: string): void {
    let parent: any = this.getNode(path.dirname(p));

    if (!parent)
      throw ApiError.ENOENT(p);

    if (this.isInnerTextFile(p)) {
      parent.innerText = "";
    } else if (this.isAttributeFile(parent, p)) {
      parent.removeAttribute(name);
    } else {
      throw ApiError.ENOENT(p);  
    }
  }

  public rmdirSync(p: string): void {
    if (path.basename(p) == 'children' || path.basename(p) == 'child-by-id')
      return;

    let child: Node = this.getNode(path.dirname(p) + path.sep + path.basename(p));

    if (!child)
      throw ApiError.ENOENT(p);   

    let parent: Node = child.parentNode;
    parent.removeChild(child);  
  }

  public mkdirSync(p: string, mode: number): void {
    let parent: Node = this.getNode(path.dirname(p));

    if (!parent)
      throw ApiError.ENOENT(p);

    let tag: any = this.getTag(path.basename(p));
    let newNode: Node = document.createElement(tag["name"]);
    parent.appendChild(newNode);  
  }

  public readdirSync(p: string): string[] {
    let node: any = this.getNode(path.dirname(p) + path.sep + path.basename(p));
    let listDir: string[] = [];

    if (p == '/') {
      listDir.push('document');
    } else if (path.basename(p) == 'children' && this.isDir(node, path.dirname(p), false)) {
      let tagCountMap: {[key: string]: number} = {};
      for (let i: number = 0; i < node.children.length; i++) {
        let tagName: string = this.getTag(node.children[i])["name"];
        let name = tagName;
        if (tagCountMap.hasOwnProperty(tagName)) {
          name = name + "-" + tagCountMap[tagName];
        } else {
          tagCountMap[tagName] = 0;
        }
        tagCountMap[tagName]++;
        listDir.push(name);
      }
    } else if (path.basename(p) == 'child-by-id' && this.isDir(node, path.dirname(p), false)) {
      for (let i: number = 0; i < node.children.length; i++) {
        if (node.children[i].hasAttribute('id')) {
          listDir.push(node.children[i].getAttribute('id'));  
        }
      }
    } else if (this.isDir(node, p, false)) {
      listDir.push('children');
      listDir.push('child-by-id');
      if (this.getTag(node)["name"] != 'document') {
        for (let i: number = 0; i < node.attributes.length; i++) {
          listDir.push(node.attributes[i].name);
        }
        listDir.push('innerText');
      }
    } else {
      throw ApiError.ENOTDIR(path.dirname(p));
    }

    return listDir;
  }

}
