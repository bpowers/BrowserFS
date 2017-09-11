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
    let node: any = this.getNode(fd.getPath());
    let buffer: any = fd.getBuffer();
    node.innerText = String.fromCharCode.apply(null, new Uint8Array(buffer.data.buff.buffer));
  }

  public isReadOnly(): boolean { return false; }
  public supportsSynch(): boolean { return true; }
  public supportsLinks(): boolean { return false; }
  public supportsProps(): boolean { return false; }

  /**
   * Private method get tag name and id from given path or node
   */
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
      if (name[0] == '#') {
        name = name.substring(1);
      }
      let count: number = 0;
      let parent: any = node.parentNode;
      if (parent) {
        for (let i: number = 0; i < parent.childNodes.length; i++) {
          let child: any = parent.childNodes[i];
          if (child == node) {
            break;
          }
          if (parent.childNodes[i].nodeName == node.nodeName) {
            count++;
          }
        }
      }
      return {"name": name, "id": count};
    }
  }

  /**
   * Private method get dom node mapping to the given path
   */
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
            if (node.nodeType == Node.ELEMENT_NODE && nodeTag["name"] == tag["name"] && nodeTag["id"] == tag["id"]) {
              currNode = node;
              break;
            }
          }
        }
      }
    }
    return currNode;
  }

  /**
   * Private method check whether the path points to a directory
   */
  private isDir(node: any, p: string, considerSubDirs = true): boolean {
    if (considerSubDirs && path.basename(p) == 'children' || path.basename(p) == 'child-by-id') {
      return this.isDir(node, path.dirname(p));
    }

    let nodeTag = this.getTag(node);
    let pathTag = this.getTag(path.basename(p));
    return nodeTag["name"] == pathTag["name"] && nodeTag["id"] == pathTag["id"];
  }

  /**
   * Private method check whether the path points to an attribute file
   */
  private isAttributeFile(node: any, p: string): boolean {
    return node.hasAttribute(path.basename(p));
  }

  /**
   * Private method check whether the path points to an innerText file
   */
  private isInnerTextFile(p: string): boolean {
    return path.basename(p) == 'innerText';
  }

  /**
   * Private method check whether the path points to a file
   */
  private isFile(node: any, p: string): boolean {
    return this.isAttributeFile(node, p) || this.isInnerTextFile(p);
  }

  /**
   * Private method return data buffer from a given node
   */
  private getDataBuffer(node: any, p: string): Buffer {
    // Return attribute value in case of attribute file
    if (this.isAttributeFile(node, p)) {
      return new Buffer(node.getAttribute(path.basename(p)));
    }

    // Return innerText content in case of innerTextFile
    if (this.isInnerTextFile(p)) {
      return new Buffer(node.innerText);
    }

    // Return empty buffer in case of directory
    if (this.isDir(node, p)) {
      return new Buffer('');
    }

    throw ApiError.ENOENT(p);
  }

  /**
   * Private method to get stats of a file or directory
   */
  private getStats(node: any, p: string, data: Buffer, mode?: number): Stats {
    let currTime = new Date((new Date()).getTime());
    let stats: Stats;
    let fileType: number;
    let size: number;

    if (this.isDir(node, p)) {
      if (!mode) {
        mode = 0x1ff;
      }
      size = 4096;
      fileType = FileType.DIRECTORY;
    } else if (this.isFile(node, p)) {
      if (!mode) {
        mode = 0x1a4;
      }
      size = data.length;
      fileType = FileType.FILE;
    }

    return new Stats(fileType, size, mode, currTime, currTime, currTime);
  }

  /**
   * Create a file
   */
  public createFileSync(p: string, flag: FileFlag, mode: number): file.File {
    let buffer: Buffer = new Buffer('');
    let parent: any = this.getNode(path.dirname(p));

    if (!parent) {
      throw ApiError.ENOENT(path.dirname(p));
    }

    if (!this.isInnerTextFile(p) && !this.isAttributeFile(parent, p) && this.getTag(parent)["name"] != 'document') {
      parent.setAttribute(this.getTag(path.basename(p))["name"], "");
    }

    return new DOMFile(this, parent, p, flag, this.getStats(parent, p, buffer, mode), buffer);
  }

  /**
   * Return stats of a file or directory
   */
  public statSync(p: string, isLstat: boolean): Stats {
    let node: any = this.getNode(p);

    if (!node) {
      throw ApiError.ENOENT(path.dirname(p));
    }

    return this.getStats(node, p, this.getDataBuffer(node, p));
  }
  
  /**
   * Open a file
   */
  public openFileSync(p: string, flag: FileFlag): file.File {
    let node: any = this.getNode(path.dirname(p));

    if (!node) {
      throw ApiError.ENOTDIR(path.dirname(p));
    }

    let data: Buffer = this.getDataBuffer(node, p)
    return new DOMFile(this, node, p, flag, this.getStats(node, p, data), data);
  }

  /**
   * Move a file or directory
   */
  public renameSync(oldPath: string, newPath: string): void {
    let child: any = this.getNode(path.dirname(oldPath) + path.sep + path.basename(oldPath));
    let oldParent: any = child.parentNode;
    let newParent: any = this.getNode(newPath);

    if (this.isInnerTextFile(oldPath)) {
      newParent.innerText = child.innerText;
      child.innerText = "";
    } else if (this.isAttributeFile(child, oldPath)){
      let attribute: string = path.basename(oldPath);
      let value: string = child.getAttribute(attribute);
      child.removeAttribute(attribute);
      newParent.setAttribute(attribute, value);
    } else {
      oldParent.removeChild(child);
      newParent.appendChild(child);
    }
  }

  /**
   * Delete a file
   */
  public unlinkSync(p: string): void {
    let parent: any = this.getNode(path.dirname(p));

    if (!parent) {
      throw ApiError.ENOENT(p);
    }

    if (this.isInnerTextFile(p)) {
      parent.innerText = "";
    } else if (this.isAttributeFile(parent, p)) {
      parent.removeAttribute(name);
    } else {
      throw ApiError.ENOENT(p);  
    }
  }

  /**
   * Delete a directory
   */
  public rmdirSync(p: string): void {
    if (path.basename(p) == 'children' || path.basename(p) == 'child-by-id') {
      return;
    }

    let child: Node = this.getNode(path.dirname(p) + path.sep + path.basename(p));

    if (!child) {
      throw ApiError.ENOENT(p);   
    }

    let parent: Node = child.parentNode;
    parent.removeChild(child);  
  }

  /**
   * Create a directory
   */
  public mkdirSync(p: string, mode: number): void {
    let parent: Node = this.getNode(path.dirname(p));

    if (!parent) {
      throw ApiError.ENOENT(p);
    }

    let tag: any = this.getTag(path.basename(p));
    let newNode: Node = document.createElement(tag["name"]);
    parent.appendChild(newNode);  
  }

  /**
   * Get the names of the files in a directory
   */
  public readdirSync(p: string): string[] {
    let node: any = this.getNode(path.dirname(p) + path.sep + path.basename(p));
    let listDir: string[] = [];

    if (p == '/') {
      listDir.push('document');
    } else if (path.basename(p) == 'children' && this.isDir(node, path.dirname(p), false)) {
      for (let i: number = 0; i < node.children.length; i++) {
        let tag: any = this.getTag(node.children[i]);
        let name: string = tag["name"];
        if (tag["id"]) {
          name = name + "-" + tag["id"];
        }
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
