import kvfs = require('../generic/key_value_filesystem');
import {default as Stats, FileType} from '../core/node_fs_stats';
import {FileFlag, ActionType} from '../core/file_flag';
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
    
    this.bfs(this.root, (node: Node) => {
      
      // Create directory
      let basePath: string = this.getPath(node);
      let dirName: string = this.getTagName(node);
      let dirPath: string = this.appendCount(basePath, dirName);
      this.mkdirSync(dirPath, FileType.DIRECTORY);

      // Create children subdirectory
      this.mkdirSync(dirPath + "/children", FileType.DIRECTORY);
      this.mkdirSync(dirPath + "/child-by-id", FileType.DIRECTORY);

      // Create attribute files
      if (node.attributes != null) {
        for (let i: number = 0; i < node.attributes.length; i++) {
          let fname: string = dirPath + "/" + node.attributes[i].name.toLowerCase(); 
          let data: any = node.attributes[i].value;
          this.createFileSync(fname, FileFlag.getFileFlag('w'), 511);
          this.writeFileSync(fname, data, 'utf8', FileFlag.getFileFlag('w'), 511);
        }

        if (node.attributes['id']) {
          let dstpath = path.resolve(dirPath, "../../child-by-id");
          let srcpath = path.relative(dstpath, dirPath);
          this.symlinkSync(srcpath, dstpath + path.sep + node.attributes['id'].value, 'dir');
        }
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

  public supportsSymlinks(): boolean { return true; }

  public renameSync(oldPath: string, newPath: string): void {
    //TODO: Add logic to edit the DOM tree
    super.renameSync(oldPath, newPath);
  }

  public createFileSync(p: string, flag: FileFlag, mode: number): file.File {
    //TODO: Add logic to edit the DOM tree
    return super.createFileSync(p, flag, mode);
  }

  public unlinkSync(p: string): void {
    //TODO: Add logic to edit the DOM tree
    super.unlinkSync(p);
  }

  public rmdirSync(p: string): void {
    //TODO: Add logic to edit the DOM tree
    super.rmdirSync(p);
  }

  public mkdirSync(p: string, mode: number): void {
    //TODO: Add logic to edit the DOM tree
    super.mkdirSync(p, mode);
  }

}
