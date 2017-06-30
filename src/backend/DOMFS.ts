import kvfs = require('../generic/key_value_filesystem');
import {default as Stats, FileType} from '../core/node_fs_stats';

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
  constructor(root: Document) {
    super({ store: new DOMFSStore() });
    this.mkdirSync("Testing", FileType.DIRECTORY);
  }
}
