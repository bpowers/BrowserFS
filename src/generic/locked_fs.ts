import {Mutex} from './mutex';
import {FileSystem, SynchronousFileSystem} from '../core/file_system';
import {ApiError, ErrorCode} from '../core/api_error';
import {FileFlag, ActionType} from '../core/file_flag';
import {default as Stats, FileType} from '../core/node_fs_stats';
import {File} from '../core/file';

// TODO: also implement LockedFile to ensure that operations on files
// also grab the appropriate locks.
/*
export LockedFile<T extends File> implements File {
	private _file: File;
	private _mu: Mutex;

	constructor(mu: Mutex, f: File) {
		this._file = f;
		this._mu = mu;
	}

	getPos(): number;

	stat(cb: (err: ApiError, stats?: Stats) => any): void;

	statSync(): Stats;

	close(cb: Function): void;

	closeSync(): void;

	truncate(len: number, cb: Function): void;

	truncateSync(len: number): void;

	sync(cb: (e?: ApiError) => void): void;

	syncSync(): void;

	write(buffer: NodeBuffer, offset: number, length: number, position: number, cb: (err: ApiError, written?: number, buffer?: NodeBuffer) => any): void;

	writeSync(buffer: NodeBuffer, offset: number, length: number, position: number): number;

	read(buffer: NodeBuffer, offset: number, length: number, position: number, cb: (err: ApiError, bytesRead?: number, buffer?: NodeBuffer) => void): void;

	readSync(buffer: NodeBuffer, offset: number, length: number, position: number): number;

	datasync(cb: (e?: ApiError) => void): void;

	datasyncSync(): void;

	chown(uid: number, gid: number, cb: (e?: ApiError) => void): void;

	chownSync(uid: number, gid: number): void;

	chmod(mode: number, cb: (e?: ApiError) => void): void;

	chmodSync(mode: number): void;

	utimes(atime: Date, mtime: Date, cb: (e?: ApiError) => void): void;

	utimesSync(atime: Date, mtime: Date): void;
}
*/

/// This class serializes access to an underlying async filesystem.
export class LockedFS<T extends FileSystem> implements FileSystem {
	private _fs: T;
	private _mu: Mutex;

	constructor(cls: {new(...args : any[]): T}, ...args: any[]) {
		this._fs = new (Function.prototype.bind.apply(cls, args));
		this._mu = new Mutex();
	}

	initialize(cb: (err?: ApiError) => void): void {
		(<any>this._fs).initialize(cb);
	}

	getName(): string {
		return 'LockedFS<' + this._fs.getName()  + '>';
	}

	diskSpace(p: string, cb: (total: number, free: number) => any): void {
		// FIXME: should this lock?
		this._fs.diskSpace(p, cb);
	}

	isReadOnly(): boolean {
		return this._fs.isReadOnly();
	}

	supportsLinks(): boolean {
		return this._fs.supportsLinks();
	}

	supportsProps(): boolean {
		return this._fs.supportsProps();
	}

	supportsSynch(): boolean {
		return this._fs.supportsSynch();
	}

	rename(oldPath: string, newPath: string, cb: (err?: ApiError) => void): void {
		this._mu.lock(() => {
			this._fs.rename(oldPath, newPath, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	renameSync(oldPath: string, newPath: string): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.renameSync(oldPath, newPath);
	}

	stat(p: string, isLstat: boolean, cb: (err: ApiError, stat?: Stats) => void): void {
		this._mu.lock(() => {
			this._fs.stat(p, isLstat, (err?: ApiError, stat?: Stats) => {
				this._mu.unlock();
				cb(err, stat);
			});
		});
	}

	statSync(p: string, isLstat: boolean): Stats {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.statSync(p, isLstat);
	}

	open(p: string, flag: FileFlag, mode: number, cb: (err: ApiError, fd?: File) => any): void {
		this._mu.lock(() => {
			this._fs.open(p, flag, mode, (err?: ApiError, fd?: File) => {
				this._mu.unlock();
				cb(err, fd);
			});
		});
	}

	openSync(p: string, flag: FileFlag, mode: number): File {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.openSync(p, flag, mode);
	}

	unlink(p: string, cb: Function): void {
		this._mu.lock(() => {
			this._fs.unlink(p, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	unlinkSync(p: string): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.unlinkSync(p);
	}

	rmdir(p: string, cb: Function): void {
		this._mu.lock(() => {
			this._fs.rmdir(p, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	rmdirSync(p: string): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.rmdirSync(p);
	}

	mkdir(p: string, mode: number, cb: Function): void {
		this._mu.lock(() => {
			this._fs.mkdir(p, mode, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	mkdirSync(p: string, mode: number): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.mkdirSync(p, mode);
	}

	readdir(p: string, cb: (err: ApiError, files?: string[]) => void): void {
		this._mu.lock(() => {
			this._fs.readdir(p, (err?: ApiError, files?: string[]) => {
				this._mu.unlock();
				cb(err, files);
			});
		});
	}

	readdirSync(p: string): string[] {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.readdirSync(p);
	}

	exists(p: string, cb: (exists: boolean) => void): void {
		this._mu.lock(() => {
			this._fs.exists(p, (exists: boolean) => {
				this._mu.unlock();
				cb(exists);
			});
		});
	}

	existsSync(p: string): boolean {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.existsSync(p);
	}

	realpath(p: string, cache: {[path: string]: string}, cb: (err: ApiError, resolvedPath?: string) => any): void {
		this._mu.lock(() => {
			this._fs.realpath(p, cache, (err?: ApiError, resolvedPath?: string) => {
				this._mu.unlock();
				cb(err, resolvedPath);
			});
		});
	}

	realpathSync(p: string, cache: {[path: string]: string}): string {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.realpathSync(p, cache);
	}

	truncate(p: string, len: number, cb: Function): void {
		this._mu.lock(() => {
			this._fs.truncate(p, len, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	truncateSync(p: string, len: number): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.truncateSync(p, len);
	}

	readFile(fname: string, encoding: string, flag: FileFlag, cb: (err: ApiError, data?: any) => void): void {
		this._mu.lock(() => {
			this._fs.readFile(fname, encoding, flag, (err?: ApiError, data?: any) => {
				this._mu.unlock();
				cb(err, data);
			});
		});
	}

	readFileSync(fname: string, encoding: string, flag: FileFlag): any {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.readFileSync(fname, encoding, flag);
	}

	writeFile(fname: string, data: any, encoding: string, flag: FileFlag, mode: number, cb: (err: ApiError) => void): void {
		this._mu.lock(() => {
			this._fs.writeFile(fname, data, encoding, flag, mode, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	writeFileSync(fname: string, data: any, encoding: string, flag: FileFlag, mode: number): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.writeFileSync(fname, data, encoding, flag, mode);
	}

	appendFile(fname: string, data: any, encoding: string, flag: FileFlag, mode: number, cb: (err: ApiError) => void): void {
		this._mu.lock(() => {
			this._fs.appendFile(fname, data, encoding, flag, mode, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	appendFileSync(fname: string, data: any, encoding: string, flag: FileFlag, mode: number): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.appendFileSync(fname, data, encoding, flag, mode);
	}

	chmod(p: string, isLchmod: boolean, mode: number, cb: Function): void {
		this._mu.lock(() => {
			this._fs.chmod(p, isLchmod, mode, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	chmodSync(p: string, isLchmod: boolean, mode: number): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.chmodSync(p, isLchmod, mode);
	}

	chown(p: string, isLchown: boolean, uid: number, gid: number, cb: Function): void {
		this._mu.lock(() => {
			this._fs.chown(p, isLchown, uid, gid, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	chownSync(p: string, isLchown: boolean, uid: number, gid: number): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.chownSync(p, isLchown, uid, gid);
	}

	utimes(p: string, atime: Date, mtime: Date, cb: Function): void {
		this._mu.lock(() => {
			this._fs.utimes(p, atime, mtime, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	utimesSync(p: string, atime: Date, mtime: Date): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.utimesSync(p, atime, mtime);
	}

	link(srcpath: string, dstpath: string, cb: Function): void {
		this._mu.lock(() => {
			this._fs.link(srcpath, dstpath, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	linkSync(srcpath: string, dstpath: string): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.linkSync(srcpath, dstpath);
	}

	symlink(srcpath: string, dstpath: string, type: string, cb: Function): void {
		this._mu.lock(() => {
			this._fs.symlink(srcpath, dstpath, type, (err?: ApiError) => {
				this._mu.unlock();
				cb(err);
			});
		});
	}

	symlinkSync(srcpath: string, dstpath: string, type: string): void {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.symlinkSync(srcpath, dstpath, type);
	}

	readlink(p: string, cb: Function): void {
		this._mu.lock(() => {
			this._fs.readlink(p, (err?: ApiError, linkString?: string) => {
				this._mu.unlock();
				cb(err, linkString);
			});
		});
	}

	readlinkSync(p: string): string {
		if (this._mu.isLocked())
			throw new Error('invalid sync call');
		return this._fs.readlinkSync(p);
	}
}
