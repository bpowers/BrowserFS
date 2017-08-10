import {FileSystem, BaseFileSystem} from '../core/file_system';
import {ApiError, ErrorCode} from '../core/api_error';
import {FileFlag, ActionType} from '../core/file_flag';
import util = require('../core/util');
import {File} from '../core/file';
import {default as Stats, FileType} from '../core/node_fs_stats';
import {PreloadFile} from '../generic/preload_file';
import LockedFS from '../generic/locked_fs';
import path = require('path');
let deletionLogPath = '/.deletedFiles.log';

/**
 * Given a read-only mode, makes it upper.
 */
function makeModeupper(mode: number): number {
  return 0o222 | mode;
}

function getFlag(f: string): FileFlag {
  return FileFlag.getFileFlag(f);
}

/**
 * Overlays a RO file to make it upper.
 */
class OverlayFile extends PreloadFile<UnlockedOverlayFS> implements File {
  constructor(fs: UnlockedOverlayFS, path: string, flag: FileFlag, stats: Stats, data: Buffer) {
    super(fs, path, flag, stats, data);
  }

  public sync(cb: (e?: ApiError) => void): void {
    if (!this.isDirty()) {
      cb(null);
      return;
    }

    this._fs._syncAsync(this, (err: ApiError) => {
      this.resetDirty();
      cb(err);
    });
  }

  public syncSync(): void {
    if (this.isDirty()) {
      this._fs._syncSync(this);
      this.resetDirty();
    }
  }

  public close(cb: (e?: ApiError) => void): void {
    this.sync(cb);
  }

  public closeSync(): void {
    this.syncSync();
  }
}

/**
 * OverlayFS makes a read-only filesystem upper by storing writes on a second,
 * upper file system. Deletes are persisted via metadata stored on the upper
 * file system.
 */
export class UnlockedOverlayFS extends BaseFileSystem implements FileSystem {
  private _upper: FileSystem;
  private _lower: FileSystem;
  private _isInitialized: boolean = false;
  private _initializeCallbacks: ((e?: ApiError) => void)[] = [];
  private _deletedFiles: {[path: string]: boolean} = {};
  private _deleteLog: File = null;

  constructor(upper: FileSystem, lower: FileSystem) {
    super();
    this._upper = upper;
    this._lower = lower;
    // if (this._upper.isReadOnly()) {
    //   throw new ApiError(ErrorCode.EINVAL, "upper file system must be upper.");
    // }
  }

  private checkInitialized(): void {
    if (!this._isInitialized) {
      throw new ApiError(ErrorCode.EPERM, "OverlayFS is not initialized. Please initialize OverlayFS using its initialize() method before using it.");
    }
  }

  public getOverlayedFileSystems(): { lower: FileSystem; upper: FileSystem; } {
    return {
      lower: this._lower,
      upper: this._upper
    };
  }

  private createParentDirectoriesAsync(p: string, cb: (err?: ApiError)=>void): void {
    let parent = path.dirname(p)
    let toCreate: string[] = [];
    let _this = this;

    this._upper.stat(parent, false, statDone);
    function statDone(err: ApiError, stat?: Stats): void {
      if (err) {
        toCreate.push(parent);
        parent = path.dirname(parent);
        _this._upper.stat(parent, false, statDone);
      } else {
        createParents();
      }
    }

    function createParents(): void {
      if (!toCreate.length) {
        return cb();
      }

      let dir = toCreate.pop();
      _this._lower.stat(dir, false, (err: ApiError, stats?: Stats) => {
        // stop if we couldn't read the dir
        if (!stats) {
          return cb();
        }

        _this._upper.mkdir(dir, stats.mode, (err?: ApiError) => {
          if (err) {
            return cb(err);
          }
          createParents();
        });
      });
    }
  }

  /**
   * With the given path, create the needed parent directories on the upper storage
   * should they not exist. Use modes from the read-only storage.
   */
  private createParentDirectories(p: string): void {
    var parent = path.dirname(p), toCreate: string[] = [];
    while (!this._upper.existsSync(parent)) {
      toCreate.push(parent);
      parent = path.dirname(parent);
    }
    toCreate = toCreate.reverse();

    toCreate.forEach((p: string) => {
      this._upper.mkdirSync(p, this.statSync(p, false).mode);
    });
  }

  public static isAvailable(): boolean {
    return true;
  }

  public _syncAsync(file: PreloadFile<UnlockedOverlayFS>, cb: (err: ApiError)=>void): void {
    this.createParentDirectoriesAsync(file.getPath(), (err?: ApiError) => {
      if (err) {
        return cb(err);
      }
      this._upper.writeFile(file.getPath(), file.getBuffer(), null, getFlag('w'), file.getStats().mode, cb);
    });
  }

  public _syncSync(file: PreloadFile<UnlockedOverlayFS>): void {
    this.createParentDirectories(file.getPath());
    this._upper.writeFileSync(file.getPath(), file.getBuffer(), null, getFlag('w'), file.getStats().mode);
  }

  public getName() {
    return "OverlayFS";
  }

  /**
   * Called once to load up metadata stored on the upper file system.
   */
  public initialize(cb: (err?: ApiError) => void): void {
    const callbackArray = this._initializeCallbacks;

    const end = (e?: ApiError): void => {
      this._isInitialized = !e;
      this._initializeCallbacks = [];
      callbackArray.forEach(((cb) => cb(e)));
    };

    // if we're already initialized, immediately invoke the callback
    if (this._isInitialized) {
      return cb();
    }

    callbackArray.push(cb);
    // The first call to initialize initializes, the rest wait for it to complete.
    if (callbackArray.length !== 1) {
      return;
    }

    // Read deletion log in case of read-write/write-write file systems, process into metadata.
    if (!(this._lower.isReadOnly() && this._upper.isReadOnly())) {
      this._upper.readFile(deletionLogPath, 'utf8', getFlag('r'), (err: ApiError, data?: string) => {
        if (err) {
          // ENOENT === Newly-instantiated file system, and thus empty log.
          if (err.errno !== ErrorCode.ENOENT) {
            return end(err);
          }
        } else {
          data.split('\n').forEach((path: string) => {
            // If the log entry begins w/ 'd', it's a deletion. Otherwise, it's
            // an undeletion.
            // TODO: Clean up log during initialization phase.
            this._deletedFiles[path.slice(1)] = path.slice(0, 1) === 'd';
          });
        }
        // Open up the deletion log for appending.
        this._upper.open(deletionLogPath, getFlag('a'), 0o644, (err: ApiError, fd?: File) => {
          if (!err) {
            this._deleteLog = fd;
          }
          end(err);
        });
      });
    } else {
      return end(null);
    }
  }

  public isReadOnly(): boolean { return true; }
  public supportsSynch(): boolean { return this._lower.supportsSynch() && this._upper.supportsSynch(); }
  public supportsLinks(): boolean { return false; }
  public supportsProps(): boolean { return this._lower.supportsProps() && this._upper.supportsProps(); }

  private deletePath(p: string): void {
    this._deletedFiles[p] = true;
    var buff = new Buffer("d" + p + "\n");
    this._deleteLog.writeSync(buff, 0, buff.length, null);
    this._deleteLog.syncSync();
  }

  private undeletePath(p: string): void {
    if (this._deletedFiles[p]) {
      this._deletedFiles[p] = false;
      var buff = new Buffer("u" + p);
      this._deleteLog.writeSync(buff, 0, buff.length, null);
      this._deleteLog.syncSync();
    }
  }

  public rename(oldPath: string, newPath: string, cb: (err?: ApiError) => void): void {
    this.checkInitialized();
    // nothing to do if paths match
    if (oldPath === newPath) {
      return cb();
    }

    this.stat(oldPath, false, (oldErr: ApiError, oldStats?: Stats) => {
      if (oldErr) {
        return cb(oldErr);
      }

      return this.stat(newPath, false, (newErr: ApiError, newStats?: Stats) => {

        // precondition: both oldPath and newPath exist and are dirs.
        // decreases: |files|
        // Need to move *every file/folder* currently stored on
        // lower to its new location on upper.
        function copyDirContents(files: string[]): void {
          let file = files.shift();
          if (!file) {
            return cb();
          }

          let oldFile = path.resolve(oldPath, file);
          let newFile = path.resolve(newPath, file);

          // Recursion! Should work for any nested files / folders.
          this.rename(oldFile, newFile, (err?: ApiError) => {
            if (err) {
              return cb(err);
            }
            copyDirContents(files);
          });
        }

        let mode = 0o777;

        // from linux's rename(2) manpage: oldpath can specify a
        // directory.  In this case, newpath must either not exist, or
        // it must specify an empty directory.
        if (oldStats.isDirectory()) {
          if (newErr) {
            if (newErr.errno !== ErrorCode.ENOENT) {
              return cb(newErr);
            }

            return this._upper.exists(oldPath, (exists: boolean) => {
              // simple case - both old and new are on the upper layer
              if (exists) {
                return this._upper.rename(oldPath, newPath, cb);
              }

              this._upper.mkdir(newPath, mode, (mkdirErr?: ApiError) => {
                if (mkdirErr) {
                  return cb(mkdirErr);
                }

                this._lower.readdir(oldPath, (err: ApiError, files?: string[]) => {
                  if (err) {
                    return cb();
                  }
                  copyDirContents(files);
                });
              });
            });
          }

          mode = newStats.mode;
          if (!newStats.isDirectory()) {
            return cb(ApiError.ENOTDIR(newPath));
          }

          this.readdir(newPath, (readdirErr: ApiError, files?: string[]) => {
            if (files && files.length) {
              return cb(ApiError.ENOTEMPTY(newPath));
            }

            this._lower.readdir(oldPath, (err: ApiError, files?: string[]) => {
              if (err) {
                return cb();
              }
              copyDirContents(files);
            });
          });
        }

        if (newStats && newStats.isDirectory()) {
          return cb(ApiError.EISDIR(newPath));
        }

        this.readFile(oldPath, null, getFlag('r'), (err: ApiError, data?: any) => {
          if (err) {
            return cb(err);
          }

          return this.writeFile(newPath, data, null, getFlag('w'), oldStats.mode, (err: ApiError) => {
            if (err) {
              return cb(err);
            }
            return this.unlink(oldPath, cb);
          });
        });
      });
    });
  }

  public renameSync(oldPath: string, newPath: string): void {
    this.checkInitialized();
    // Write newPath using oldPath's contents, delete oldPath.
    var oldStats = this.statSync(oldPath, false);
    if (oldStats.isDirectory()) {
      // Optimization: Don't bother moving if old === new.
      if (oldPath === newPath) {
        return;
      }

      var mode = 0o777;
      if (this.existsSync(newPath)) {
        var stats = this.statSync(newPath, false),
          mode = stats.mode;
        if (stats.isDirectory()) {
          if (this.readdirSync(newPath).length > 0) {
            throw ApiError.ENOTEMPTY(newPath);
          }
        } else {
          throw ApiError.ENOTDIR(newPath);
        }
      }

      // Take care of upper first. Move any files there, or create an empty directory
      // if it doesn't exist.
      if (this._upper.existsSync(oldPath)) {
        this._upper.renameSync(oldPath, newPath);
      } else if (!this._upper.existsSync(newPath)) {
        this._upper.mkdirSync(newPath, mode);
      }

      // Need to move *every file/folder* currently stored on lower to its new location
      // on upper.
      if (this._lower.existsSync(oldPath)) {
        this._lower.readdirSync(oldPath).forEach((name) => {
          // Recursion! Should work for any nested files / folders.
          this.renameSync(path.resolve(oldPath, name), path.resolve(newPath, name));
        });
      }
    } else {
      if (this.existsSync(newPath) && this.statSync(newPath, false).isDirectory()) {
        throw ApiError.EISDIR(newPath);
      }

      this.writeFileSync(newPath,
        this.readFileSync(oldPath, null, getFlag('r')), null, getFlag('w'), oldStats.mode);
    }

    if (oldPath !== newPath && this.existsSync(oldPath)) {
      this.unlinkSync(oldPath);
    }
  }

  public stat(p: string, isLstat: boolean,  cb: (err: ApiError, stat?: Stats) => void): void {
    this.checkInitialized();
    this._upper.stat(p, isLstat, (err: ApiError, stat?: Stats) => {
      if (err && err.errno === ErrorCode.ENOENT) {
        if (this._deletedFiles[p]) {
          cb(ApiError.ENOENT(p));
        }
        this._lower.stat(p, isLstat, (err: ApiError, stat?: Stats) => {
          if (stat) {
            // Make the oldStat's mode upper. Preserve the topmost
            // part of the mode, which specifies if it is a file or a
            // directory.
            stat.mode = makeModeupper(stat.mode);
          }
          cb(err, stat);
        });
      } else {
        cb(err, stat);
      }
    });
  }

  public statSync(p: string, isLstat: boolean): Stats {
    this.checkInitialized();
    try {
      return this._upper.statSync(p, isLstat);
    } catch (e) {
      if (this._deletedFiles[p]) {
        throw ApiError.ENOENT(p);
      }
      var oldStat = this._lower.statSync(p, isLstat).clone();
      // Make the oldStat's mode upper. Preserve the topmost part of the
      // mode, which specifies if it is a file or a directory.
      oldStat.mode = makeModeupper(oldStat.mode);
      return oldStat;
    }
  }

  public open(p: string, flag: FileFlag, mode: number, cb: (err: ApiError, fd?: File) => any): void {
    this.checkInitialized();
    this.stat(p, false, (err: ApiError, stats?: Stats) => {
      if (stats) {
        switch (flag.pathExistsAction()) {
        case ActionType.TRUNCATE_FILE:
          return this.createParentDirectoriesAsync(p, (err?: ApiError)=> {
            if (err) {
              return cb(err);
            }
            this._upper.open(p, flag, mode, cb);
          });
        case ActionType.NOP:
          return this._upper.exists(p, (exists: boolean) => {
            if (exists) {
              this._upper.open(p, flag, mode, cb);
            } else {
              // at this point we know the stats object we got is from
              // the lower FS.
              stats.mode = mode;
              this._lower.readFile(p, null, getFlag('r'), (readFileErr: ApiError, data?: any) => {
                if (readFileErr) {
                  return cb(readFileErr);
                }
                if (stats.size === -1) {
                  stats.size = data.length;
                }
                let f = new OverlayFile(this, p, flag, stats, data);
                cb(null, f);
              });
            }
          });
        default:
          return cb(ApiError.EEXIST(p));
        }
      } else {
        switch(flag.pathNotExistsAction()) {
        case ActionType.CREATE_FILE:
          return this.createParentDirectoriesAsync(p, (err?: ApiError) => {
            if (err) {
              return cb(err);
            }
            return this._upper.open(p, flag, mode, cb);
          });
        default:
          return cb(ApiError.ENOENT(p));
        }
      }
    });
  }

  public openSync(p: string, flag: FileFlag, mode: number): File {
    this.checkInitialized();
    if (this.existsSync(p)) {
      switch (flag.pathExistsAction()) {
        case ActionType.TRUNCATE_FILE:
          this.createParentDirectories(p);
          return this._upper.openSync(p, flag, mode);
        case ActionType.NOP:
          if (this._upper.existsSync(p)) {
            return this._upper.openSync(p, flag, mode);
          } else {
            // Create an OverlayFile.
            var buf = this._lower.readFileSync(p, null, getFlag('r'));
            var stats = this._lower.statSync(p, false).clone();
            stats.mode = mode;
            return new OverlayFile(this, p, flag, stats, buf);
          }
        default:
          throw ApiError.EEXIST(p);
      }
    } else {
      switch(flag.pathNotExistsAction()) {
        case ActionType.CREATE_FILE:
          this.createParentDirectories(p);
          return this._upper.openSync(p, flag, mode);
        default:
          throw ApiError.ENOENT(p);
      }
    }
  }

  public unlink(p: string, cb: (err: ApiError) => void): void {
    this.checkInitialized();
    this.exists(p, (exists: boolean) => {
      if (!exists)
        return cb(ApiError.ENOENT(p));

      this._upper.exists(p, (upperExists: boolean) => {
        if (upperExists) {
          return this._upper.unlink(p, (err: ApiError) => {
            if (err) {
              return cb(err);
            }

            this.exists(p, (lowerExists: boolean) => {
              if (lowerExists) {
                this.deletePath(p);
              }
              cb(null);
            });
          });
        } else {
          // if this only exists on the lower FS, add it to the
          // delete map.
          this.deletePath(p);
          cb(null);
        }
      });
    });
  }

  public unlinkSync(p: string): void {
    this.checkInitialized();
    if (this.existsSync(p)) {
      if (this._upper.existsSync(p)) {
        this._upper.unlinkSync(p);
      }

      // if it still exists add to the delete log
      if (this.existsSync(p)) {
        this.deletePath(p);
      }
    } else {
      throw ApiError.ENOENT(p);
    }
  }

  public rmdir(p: string, cb: (err?: ApiError) => void): void {
    this.checkInitialized();

    let rmdirLower = (): void => {
      this.readdir(p, (err: ApiError, files: string[]): void => {
        if (err) {
          return cb(err);
        }

        if (files.length) {
          return cb(ApiError.ENOTEMPTY(p));
        }

        this.deletePath(p);
        cb(null);
      });
    };

    this.exists(p, (exists: boolean) => {
      if (!exists) {
        return cb(ApiError.ENOENT(p));
      }

      this._upper.exists(p, (upperExists: boolean) => {
        if (upperExists) {
          this._upper.rmdir(p, (err: ApiError) => {
            if (err) {
              return cb(err);
            }

            this._lower.exists(p, (lowerExists: boolean) => {
              if (lowerExists) {
                rmdirLower();
              } else {
                cb();
              }
            });
          });
        } else {
          rmdirLower();
        }
      });
    });
  }

  public rmdirSync(p: string): void {
    this.checkInitialized();
    if (this.existsSync(p)) {
      if (this._upper.existsSync(p)) {
        this._upper.rmdirSync(p);
      }
      if (this.existsSync(p)) {
        // Check if directory is empty.
        if (this.readdirSync(p).length > 0) {
          throw ApiError.ENOTEMPTY(p);
        } else {
          this.deletePath(p);
        }
      }
    } else {
      throw ApiError.ENOENT(p);
    }
  }

  public mkdir(p: string, mode: number, cb: (err: ApiError, stat?: Stats) => void): void {
    this.checkInitialized();
    this.exists(p, (exists: boolean) => {
      if (exists) {
        return cb(ApiError.EEXIST(p));
      }

      // The below will throw should any of the parent directories
      // fail to exist on _upper.
      this.createParentDirectoriesAsync(p, (err: ApiError) => {
        if (err) {
          return cb(err);
        }
        this._upper.mkdir(p, mode, cb);
      });
    });
  }

  public mkdirSync(p: string, mode: number): void {
    this.checkInitialized();
    if (this.existsSync(p)) {
      throw ApiError.EEXIST(p);
    } else {
      // The below will throw should any of the parent directories fail to exist
      // on _upper.
      this.createParentDirectories(p);
      this._upper.mkdirSync(p, mode);
    }
  }

  public readdir(p: string, cb: (error: ApiError, files?: string[]) => void): void {
    this.checkInitialized();
    this.stat(p, false, (err: ApiError, dirStats?: Stats) => {
      if (err) {
        return cb(err);
      }

      if (!dirStats.isDirectory()) {
        return cb(ApiError.ENOTDIR(p));
      }

      this._upper.readdir(p, (err: ApiError, wFiles: string[]) => {
        if (err && err.errno !== ErrorCode.ENOENT) {
          return cb(err);
        } else if (err || !wFiles) {
          wFiles = [];
        }

        this._lower.readdir(p, (err: ApiError, rFiles: string[]) => {
          // if the directory doesn't exist on the lower FS set rFiles
          // here to simplify the following code.
          if (err || !rFiles) {
            rFiles = [];
          }

          // Readdir in both, merge, check delete log on each file, return.
          let contents: string[] = wFiles.concat(rFiles);
          let seenMap: {[name: string]: boolean} = {};
          let filtered = contents.filter((fPath: string) => {
            let result = !seenMap[fPath] && !this._deletedFiles[p + "/" + fPath];
            seenMap[fPath] = true;
            return result;
          });

          cb(null, filtered);
        });
      });
    });
  }

  public readdirSync(p: string): string[] {
    this.checkInitialized();
    var dirStats = this.statSync(p, false);
    if (!dirStats.isDirectory()) {
      throw ApiError.ENOTDIR(p);
    }

    // Readdir in both, merge, check delete log on each file, return.
    var contents: string[] = [];
    try {
      contents = contents.concat(this._upper.readdirSync(p));
    } catch (e) {
    }
    try {
      contents = contents.concat(this._lower.readdirSync(p));
    } catch (e) {
    }
    var seenMap: {[name: string]: boolean} = {};
    return contents.filter((fileP: string) => {
      var result = seenMap[fileP] === undefined && this._deletedFiles[p + "/" + fileP] !== true;
      seenMap[fileP] = true;
      return result;
    });
  }

  public exists(p: string, cb: (exists: boolean) => void): void {
    this.checkInitialized();
    this._upper.exists(p, (existsupper: boolean) => {
      if (existsupper) {
        return cb(true);
      }

      this._lower.exists(p, (existslower: boolean) => {
        cb(existslower && this._deletedFiles[p] !== true);
      });
    });
  }

  public existsSync(p: string): boolean {
    this.checkInitialized();
    return this._upper.existsSync(p) || (this._lower.existsSync(p) && this._deletedFiles[p] !== true);
  }

  public chmod(p: string, isLchmod: boolean, mode: number, cb: (error?: ApiError) => void): void {
    this.checkInitialized();
    this.operateOnupperAsync(p, (err?: ApiError) => {
      if (err) {
        return cb(err);
      } else {
        this._upper.chmod(p, isLchmod, mode, cb);
      }
    });
  }

  public chmodSync(p: string, isLchmod: boolean, mode: number): void {
    this.checkInitialized();
    this.operateOnupper(p, () => {
      this._upper.chmodSync(p, isLchmod, mode);
    });
  }

  public chown(p: string, isLchmod: boolean, uid: number, gid: number, cb: (error?: ApiError) => void): void {
    this.checkInitialized();
    this.operateOnupperAsync(p, (err?: ApiError) => {
      if (err) {
        return cb(err);
      } else {
        this._upper.chown(p, isLchmod, uid, gid, cb);
      }
    });
  }

  public chownSync(p: string, isLchown: boolean, uid: number, gid: number): void {
    this.checkInitialized();
    this.operateOnupper(p, () => {
      this._upper.chownSync(p, isLchown, uid, gid);
    });
  }

  public utimes(p: string, atime: Date, mtime: Date, cb: (error?: ApiError) => void): void {
    this.checkInitialized();
    this.operateOnupperAsync(p, (err?: ApiError) => {
      if (err) {
        return cb(err);
      } else {
        this._upper.utimes(p, atime, mtime, cb);
      }
    });
  }

  public utimesSync(p: string, atime: Date, mtime: Date): void {
    this.checkInitialized();
    this.operateOnupper(p, () => {
      this._upper.utimesSync(p, atime, mtime);
    });
  }

  /**
   * Helper function:
   * - Ensures p is on upper before proceeding. Throws an error if it doesn't exist.
   * - Calls f to perform operation on upper.
   */
  private operateOnupper(p: string, f: () => void): void {
    if (this.existsSync(p)) {
      if (!this._upper.existsSync(p)) {
        // File is on lower storage. Copy to upper storage before
        // changing its mode.
        this.copyToupper(p);
      }
      f();
    } else {
      throw ApiError.ENOENT(p);
    }
  }

  private operateOnupperAsync(p: string, cb: (error?: ApiError) => void): void {
    this.exists(p, (exists: boolean) => {
      if (!exists) {
        return cb(ApiError.ENOENT(p));
      }

      this._upper.exists(p, (existsupper: boolean) => {
        if (existsupper) {
          cb();
        } else {
          return this.copyToupperAsync(p, cb);
        }
      });
    });
  }

  /**
   * Copy from lower to upper storage.
   * PRECONDITION: File does not exist on upper storage.
   */
  private copyToupper(p: string): void {
    var pStats = this.statSync(p, false);
    if (pStats.isDirectory()) {
      this._upper.mkdirSync(p, pStats.mode);
    } else {
      this.writeFileSync(p,
        this._lower.readFileSync(p, null, getFlag('r')), null,
        getFlag('w'), this.statSync(p, false).mode);
    }
  }

  private copyToupperAsync(p: string, cb: (err?: ApiError) => void): void {
    this.stat(p, false, (err: ApiError, pStats?: Stats) => {
      if (err) {
        return cb(err);
      }

      if (pStats.isDirectory()) {
        return this._upper.mkdir(p, pStats.mode, cb);
      }

      // need to copy file.
      this._lower.readFile(p, null, getFlag('r'), (err: ApiError, data?: Buffer) => {
        if (err) {
          return cb(err);
        }

        this.writeFile(p, data, null, getFlag('w'), pStats.mode, cb);
      });
    });
  }
}

export default class OverlayFS extends LockedFS<UnlockedOverlayFS> {
	constructor(upper: FileSystem, lower: FileSystem) {
		super(new UnlockedOverlayFS(upper, lower));
	}

	initialize(cb: (err?: ApiError) => void): void {
		super.initialize(cb);
	}

	static isAvailable(): boolean {
		return UnlockedOverlayFS.isAvailable();
	}

	getOverlayedFileSystems(): { lower: FileSystem; upper: FileSystem; } {
		return super.getFSUnlocked().getOverlayedFileSystems();
	}
}
