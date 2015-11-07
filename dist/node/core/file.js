var api_error_1 = require('./api_error');
var BaseFile = (function () {
    function BaseFile() {
    }
    BaseFile.prototype.sync = function (cb) {
        cb(new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP));
    };
    BaseFile.prototype.syncSync = function () {
        throw new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP);
    };
    BaseFile.prototype.datasync = function (cb) {
        this.sync(cb);
    };
    BaseFile.prototype.datasyncSync = function () {
        return this.syncSync();
    };
    BaseFile.prototype.chown = function (uid, gid, cb) {
        cb(new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP));
    };
    BaseFile.prototype.chownSync = function (uid, gid) {
        throw new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP);
    };
    BaseFile.prototype.chmod = function (mode, cb) {
        cb(new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP));
    };
    BaseFile.prototype.chmodSync = function (mode) {
        throw new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP);
    };
    BaseFile.prototype.utimes = function (atime, mtime, cb) {
        cb(new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP));
    };
    BaseFile.prototype.utimesSync = function (atime, mtime) {
        throw new api_error_1.ApiError(api_error_1.ErrorCode.ENOTSUP);
    };
    return BaseFile;
})();
exports.BaseFile = BaseFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2ZpbGUudHMiXSwibmFtZXMiOlsiQmFzZUZpbGUiLCJCYXNlRmlsZS5jb25zdHJ1Y3RvciIsIkJhc2VGaWxlLnN5bmMiLCJCYXNlRmlsZS5zeW5jU3luYyIsIkJhc2VGaWxlLmRhdGFzeW5jIiwiQmFzZUZpbGUuZGF0YXN5bmNTeW5jIiwiQmFzZUZpbGUuY2hvd24iLCJCYXNlRmlsZS5jaG93blN5bmMiLCJCYXNlRmlsZS5jaG1vZCIsIkJhc2VGaWxlLmNobW9kU3luYyIsIkJhc2VGaWxlLnV0aW1lcyIsIkJhc2VGaWxlLnV0aW1lc1N5bmMiXSwibWFwcGluZ3MiOiJBQUFBLDBCQUFrQyxhQUFhLENBQUMsQ0FBQTtBQWlLaEQ7SUFBQUE7SUErQkFDLENBQUNBO0lBOUJRRCx1QkFBSUEsR0FBWEEsVUFBWUEsRUFBWUE7UUFDdEJFLEVBQUVBLENBQUNBLElBQUlBLG9CQUFRQSxDQUFDQSxxQkFBU0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDdENBLENBQUNBO0lBQ01GLDJCQUFRQSxHQUFmQTtRQUNFRyxNQUFNQSxJQUFJQSxvQkFBUUEsQ0FBQ0EscUJBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO0lBQ3hDQSxDQUFDQTtJQUNNSCwyQkFBUUEsR0FBZkEsVUFBZ0JBLEVBQVlBO1FBQzFCSSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtJQUNoQkEsQ0FBQ0E7SUFDTUosK0JBQVlBLEdBQW5CQTtRQUNFSyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtJQUN6QkEsQ0FBQ0E7SUFDTUwsd0JBQUtBLEdBQVpBLFVBQWFBLEdBQVdBLEVBQUVBLEdBQVdBLEVBQUVBLEVBQVlBO1FBQ2pETSxFQUFFQSxDQUFDQSxJQUFJQSxvQkFBUUEsQ0FBQ0EscUJBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO0lBQ3RDQSxDQUFDQTtJQUNNTiw0QkFBU0EsR0FBaEJBLFVBQWlCQSxHQUFXQSxFQUFFQSxHQUFXQTtRQUN2Q08sTUFBTUEsSUFBSUEsb0JBQVFBLENBQUNBLHFCQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtJQUN4Q0EsQ0FBQ0E7SUFDTVAsd0JBQUtBLEdBQVpBLFVBQWFBLElBQVlBLEVBQUVBLEVBQVlBO1FBQ3JDUSxFQUFFQSxDQUFDQSxJQUFJQSxvQkFBUUEsQ0FBQ0EscUJBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO0lBQ3RDQSxDQUFDQTtJQUNNUiw0QkFBU0EsR0FBaEJBLFVBQWlCQSxJQUFZQTtRQUMzQlMsTUFBTUEsSUFBSUEsb0JBQVFBLENBQUNBLHFCQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtJQUN4Q0EsQ0FBQ0E7SUFDTVQseUJBQU1BLEdBQWJBLFVBQWNBLEtBQWFBLEVBQUVBLEtBQWFBLEVBQUVBLEVBQVlBO1FBQ3REVSxFQUFFQSxDQUFDQSxJQUFJQSxvQkFBUUEsQ0FBQ0EscUJBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO0lBQ3RDQSxDQUFDQTtJQUNNViw2QkFBVUEsR0FBakJBLFVBQWtCQSxLQUFhQSxFQUFFQSxLQUFhQTtRQUM1Q1csTUFBTUEsSUFBSUEsb0JBQVFBLENBQUNBLHFCQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtJQUN4Q0EsQ0FBQ0E7SUFDSFgsZUFBQ0E7QUFBREEsQ0FBQ0EsQUEvQkQsSUErQkM7QUEvQlksZ0JBQVEsV0ErQnBCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0FwaUVycm9yLCBFcnJvckNvZGV9IGZyb20gJy4vYXBpX2Vycm9yJztcbmltcG9ydCBzdGF0cyA9IHJlcXVpcmUoJy4vbm9kZV9mc19zdGF0cycpO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZpbGUge1xuICAvKipcbiAgICogKipDb3JlKio6IEdldCB0aGUgY3VycmVudCBmaWxlIHBvc2l0aW9uLlxuICAgKiBAcmV0dXJuIFtOdW1iZXJdXG4gICAqL1xuICBnZXRQb3MoKTogbnVtYmVyO1xuICAvKipcbiAgICogKipDb3JlKio6IEFzeW5jaHJvbm91cyBgc3RhdGAuXG4gICAqIEBwYXJhbSBbRnVuY3Rpb24oQnJvd3NlckZTLkFwaUVycm9yLCBCcm93c2VyRlMubm9kZS5mcy5TdGF0cyldIGNiXG4gICAqL1xuICBzdGF0KGNiOiAoZXJyOiBBcGlFcnJvciwgc3RhdHM/OiBzdGF0cy5TdGF0cykgPT4gYW55KTogdm9pZDtcbiAgLyoqXG4gICAqICoqQ29yZSoqOiBTeW5jaHJvbm91cyBgc3RhdGAuXG4gICAqIEBwYXJhbSBbRnVuY3Rpb24oQnJvd3NlckZTLkFwaUVycm9yLCBCcm93c2VyRlMubm9kZS5mcy5TdGF0cyldIGNiXG4gICAqL1xuICBzdGF0U3luYygpOiBzdGF0cy5TdGF0cztcbiAgLyoqXG4gICAqICoqQ29yZSoqOiBBc3luY2hyb25vdXMgY2xvc2UuXG4gICAqIEBwYXJhbSBbRnVuY3Rpb24oQnJvd3NlckZTLkFwaUVycm9yKV0gY2JcbiAgICovXG4gIGNsb3NlKGNiOiBGdW5jdGlvbik6IHZvaWQ7XG4gIC8qKlxuICAgKiAqKkNvcmUqKjogU3luY2hyb25vdXMgY2xvc2UuXG4gICAqL1xuICBjbG9zZVN5bmMoKTogdm9pZDtcbiAgLyoqXG4gICAqICoqQ29yZSoqOiBBc3luY2hyb25vdXMgdHJ1bmNhdGUuXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBsZW5cbiAgICogQHBhcmFtIFtGdW5jdGlvbihCcm93c2VyRlMuQXBpRXJyb3IpXSBjYlxuICAgKi9cbiAgdHJ1bmNhdGUobGVuOiBudW1iZXIsIGNiOiBGdW5jdGlvbik6IHZvaWQ7XG4gIC8qKlxuICAgKiAqKkNvcmUqKjogU3luY2hyb25vdXMgdHJ1bmNhdGUuXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBsZW5cbiAgICovXG4gIHRydW5jYXRlU3luYyhsZW46IG51bWJlcik6IHZvaWQ7XG4gIC8qKlxuICAgKiAqKkNvcmUqKjogQXN5bmNocm9ub3VzIHN5bmMuXG4gICAqIEBwYXJhbSBbRnVuY3Rpb24oQnJvd3NlckZTLkFwaUVycm9yKV0gY2JcbiAgICovXG4gIHN5bmMoY2I6IEZ1bmN0aW9uKTogdm9pZDtcbiAgLyoqXG4gICAqICoqQ29yZSoqOiBTeW5jaHJvbm91cyBzeW5jLlxuICAgKi9cbiAgc3luY1N5bmMoKTogdm9pZDtcbiAgLyoqXG4gICAqICoqQ29yZSoqOiBXcml0ZSBidWZmZXIgdG8gdGhlIGZpbGUuXG4gICAqIE5vdGUgdGhhdCBpdCBpcyB1bnNhZmUgdG8gdXNlIGZzLndyaXRlIG11bHRpcGxlIHRpbWVzIG9uIHRoZSBzYW1lIGZpbGVcbiAgICogd2l0aG91dCB3YWl0aW5nIGZvciB0aGUgY2FsbGJhY2suXG4gICAqIEBwYXJhbSBbQnJvd3NlckZTLm5vZGUuQnVmZmVyXSBidWZmZXIgQnVmZmVyIGNvbnRhaW5pbmcgdGhlIGRhdGEgdG8gd3JpdGUgdG9cbiAgICogIHRoZSBmaWxlLlxuICAgKiBAcGFyYW0gW051bWJlcl0gb2Zmc2V0IE9mZnNldCBpbiB0aGUgYnVmZmVyIHRvIHN0YXJ0IHJlYWRpbmcgZGF0YSBmcm9tLlxuICAgKiBAcGFyYW0gW051bWJlcl0gbGVuZ3RoIFRoZSBhbW91bnQgb2YgYnl0ZXMgdG8gd3JpdGUgdG8gdGhlIGZpbGUuXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBwb3NpdGlvbiBPZmZzZXQgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBmaWxlIHdoZXJlIHRoaXNcbiAgICogICBkYXRhIHNob3VsZCBiZSB3cml0dGVuLiBJZiBwb3NpdGlvbiBpcyBudWxsLCB0aGUgZGF0YSB3aWxsIGJlIHdyaXR0ZW4gYXRcbiAgICogICB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICogQHBhcmFtIFtGdW5jdGlvbihCcm93c2VyRlMuQXBpRXJyb3IsIE51bWJlciwgQnJvd3NlckZTLm5vZGUuQnVmZmVyKV1cbiAgICogICBjYiBUaGUgbnVtYmVyIHNwZWNpZmllcyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHdyaXR0ZW4gaW50byB0aGUgZmlsZS5cbiAgICovXG4gIHdyaXRlKGJ1ZmZlcjogTm9kZUJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBwb3NpdGlvbjogbnVtYmVyLCBjYjogKGVycjogQXBpRXJyb3IsIHdyaXR0ZW4/OiBudW1iZXIsIGJ1ZmZlcj86IE5vZGVCdWZmZXIpID0+IGFueSk6IHZvaWQ7XG4gIC8qKlxuICAgKiAqKkNvcmUqKjogV3JpdGUgYnVmZmVyIHRvIHRoZSBmaWxlLlxuICAgKiBOb3RlIHRoYXQgaXQgaXMgdW5zYWZlIHRvIHVzZSBmcy53cml0ZVN5bmMgbXVsdGlwbGUgdGltZXMgb24gdGhlIHNhbWUgZmlsZVxuICAgKiB3aXRob3V0IHdhaXRpbmcgZm9yIGl0IHRvIHJldHVybi5cbiAgICogQHBhcmFtIFtCcm93c2VyRlMubm9kZS5CdWZmZXJdIGJ1ZmZlciBCdWZmZXIgY29udGFpbmluZyB0aGUgZGF0YSB0byB3cml0ZSB0b1xuICAgKiAgdGhlIGZpbGUuXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBvZmZzZXQgT2Zmc2V0IGluIHRoZSBidWZmZXIgdG8gc3RhcnQgcmVhZGluZyBkYXRhIGZyb20uXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBsZW5ndGggVGhlIGFtb3VudCBvZiBieXRlcyB0byB3cml0ZSB0byB0aGUgZmlsZS5cbiAgICogQHBhcmFtIFtOdW1iZXJdIHBvc2l0aW9uIE9mZnNldCBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpbGUgd2hlcmUgdGhpc1xuICAgKiAgIGRhdGEgc2hvdWxkIGJlIHdyaXR0ZW4uIElmIHBvc2l0aW9uIGlzIG51bGwsIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbiBhdFxuICAgKiAgIHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgKiBAcmV0dXJuIFtOdW1iZXJdXG4gICAqL1xuICB3cml0ZVN5bmMoYnVmZmVyOiBOb2RlQnVmZmVyLCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIHBvc2l0aW9uOiBudW1iZXIpOiBudW1iZXI7XG4gIC8qKlxuICAgKiAqKkNvcmUqKjogUmVhZCBkYXRhIGZyb20gdGhlIGZpbGUuXG4gICAqIEBwYXJhbSBbQnJvd3NlckZTLm5vZGUuQnVmZmVyXSBidWZmZXIgVGhlIGJ1ZmZlciB0aGF0IHRoZSBkYXRhIHdpbGwgYmVcbiAgICogICB3cml0dGVuIHRvLlxuICAgKiBAcGFyYW0gW051bWJlcl0gb2Zmc2V0IFRoZSBvZmZzZXQgd2l0aGluIHRoZSBidWZmZXIgd2hlcmUgd3JpdGluZyB3aWxsXG4gICAqICAgc3RhcnQuXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBsZW5ndGggQW4gaW50ZWdlciBzcGVjaWZ5aW5nIHRoZSBudW1iZXIgb2YgYnl0ZXMgdG8gcmVhZC5cbiAgICogQHBhcmFtIFtOdW1iZXJdIHBvc2l0aW9uIEFuIGludGVnZXIgc3BlY2lmeWluZyB3aGVyZSB0byBiZWdpbiByZWFkaW5nIGZyb21cbiAgICogICBpbiB0aGUgZmlsZS4gSWYgcG9zaXRpb24gaXMgbnVsbCwgZGF0YSB3aWxsIGJlIHJlYWQgZnJvbSB0aGUgY3VycmVudCBmaWxlXG4gICAqICAgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBbRnVuY3Rpb24oQnJvd3NlckZTLkFwaUVycm9yLCBOdW1iZXIsIEJyb3dzZXJGUy5ub2RlLkJ1ZmZlcildIGNiIFRoZVxuICAgKiAgIG51bWJlciBpcyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWRcbiAgICovXG4gIHJlYWQoYnVmZmVyOiBOb2RlQnVmZmVyLCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIHBvc2l0aW9uOiBudW1iZXIsIGNiOiAoZXJyOiBBcGlFcnJvciwgYnl0ZXNSZWFkPzogbnVtYmVyLCBidWZmZXI/OiBOb2RlQnVmZmVyKSA9PiB2b2lkKTogdm9pZDtcbiAgLyoqXG4gICAqICoqQ29yZSoqOiBSZWFkIGRhdGEgZnJvbSB0aGUgZmlsZS5cbiAgICogQHBhcmFtIFtCcm93c2VyRlMubm9kZS5CdWZmZXJdIGJ1ZmZlciBUaGUgYnVmZmVyIHRoYXQgdGhlIGRhdGEgd2lsbCBiZVxuICAgKiAgIHdyaXR0ZW4gdG8uXG4gICAqIEBwYXJhbSBbTnVtYmVyXSBvZmZzZXQgVGhlIG9mZnNldCB3aXRoaW4gdGhlIGJ1ZmZlciB3aGVyZSB3cml0aW5nIHdpbGxcbiAgICogICBzdGFydC5cbiAgICogQHBhcmFtIFtOdW1iZXJdIGxlbmd0aCBBbiBpbnRlZ2VyIHNwZWNpZnlpbmcgdGhlIG51bWJlciBvZiBieXRlcyB0byByZWFkLlxuICAgKiBAcGFyYW0gW051bWJlcl0gcG9zaXRpb24gQW4gaW50ZWdlciBzcGVjaWZ5aW5nIHdoZXJlIHRvIGJlZ2luIHJlYWRpbmcgZnJvbVxuICAgKiAgIGluIHRoZSBmaWxlLiBJZiBwb3NpdGlvbiBpcyBudWxsLCBkYXRhIHdpbGwgYmUgcmVhZCBmcm9tIHRoZSBjdXJyZW50IGZpbGVcbiAgICogICBwb3NpdGlvbi5cbiAgICogQHJldHVybiBbTnVtYmVyXVxuICAgKi9cbiAgcmVhZFN5bmMoYnVmZmVyOiBOb2RlQnVmZmVyLCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIHBvc2l0aW9uOiBudW1iZXIpOiBudW1iZXI7XG4gIC8qKlxuICAgKiAqKlN1cHBsZW1lbnRhcnkqKjogQXN5bmNocm9ub3VzIGBkYXRhc3luY2AuXG4gICAqXG4gICAqIERlZmF1bHQgaW1wbGVtZW50YXRpb24gbWFwcyB0byBgc3luY2AuXG4gICAqIEBwYXJhbSBbRnVuY3Rpb24oQnJvd3NlckZTLkFwaUVycm9yKV0gY2JcbiAgICovXG4gIGRhdGFzeW5jKGNiOiBGdW5jdGlvbik6IHZvaWQ7XG4gIC8qKlxuICAgKiAqKlN1cHBsZW1lbnRhcnkqKjogU3luY2hyb25vdXMgYGRhdGFzeW5jYC5cbiAgICpcbiAgICogRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBtYXBzIHRvIGBzeW5jU3luY2AuXG4gICAqL1xuICBkYXRhc3luY1N5bmMoKTogdm9pZDtcbiAgLyoqXG4gICAqICoqT3B0aW9uYWwqKjogQXN5bmNocm9ub3VzIGBjaG93bmAuXG4gICAqIEBwYXJhbSBbTnVtYmVyXSB1aWRcbiAgICogQHBhcmFtIFtOdW1iZXJdIGdpZFxuICAgKiBAcGFyYW0gW0Z1bmN0aW9uKEJyb3dzZXJGUy5BcGlFcnJvcildIGNiXG4gICAqL1xuICBjaG93bih1aWQ6IG51bWJlciwgZ2lkOiBudW1iZXIsIGNiOiBGdW5jdGlvbik6IHZvaWQ7XG4gIC8qKlxuICAgKiAqKk9wdGlvbmFsKio6IFN5bmNocm9ub3VzIGBjaG93bmAuXG4gICAqIEBwYXJhbSBbTnVtYmVyXSB1aWRcbiAgICogQHBhcmFtIFtOdW1iZXJdIGdpZFxuICAgKi9cbiAgY2hvd25TeW5jKHVpZDogbnVtYmVyLCBnaWQ6IG51bWJlcik6IHZvaWQ7XG4gIC8qKlxuICAgKiAqKk9wdGlvbmFsKio6IEFzeW5jaHJvbm91cyBgZmNobW9kYC5cbiAgICogQHBhcmFtIFtOdW1iZXJdIG1vZGVcbiAgICogQHBhcmFtIFtGdW5jdGlvbihCcm93c2VyRlMuQXBpRXJyb3IpXSBjYlxuICAgKi9cbiAgY2htb2QobW9kZTogbnVtYmVyLCBjYjogRnVuY3Rpb24pOiB2b2lkO1xuICAvKipcbiAgICogKipPcHRpb25hbCoqOiBTeW5jaHJvbm91cyBgZmNobW9kYC5cbiAgICogQHBhcmFtIFtOdW1iZXJdIG1vZGVcbiAgICovXG4gIGNobW9kU3luYyhtb2RlOiBudW1iZXIpOiB2b2lkO1xuICAvKipcbiAgICogKipPcHRpb25hbCoqOiBDaGFuZ2UgdGhlIGZpbGUgdGltZXN0YW1wcyBvZiB0aGUgZmlsZS5cbiAgICogQHBhcmFtIFtEYXRlXSBhdGltZVxuICAgKiBAcGFyYW0gW0RhdGVdIG10aW1lXG4gICAqIEBwYXJhbSBbRnVuY3Rpb24oQnJvd3NlckZTLkFwaUVycm9yKV0gY2JcbiAgICovXG4gIHV0aW1lcyhhdGltZTogbnVtYmVyLCBtdGltZTogbnVtYmVyLCBjYjogRnVuY3Rpb24pOiB2b2lkO1xuICAvKipcbiAgICogKipPcHRpb25hbCoqOiBDaGFuZ2UgdGhlIGZpbGUgdGltZXN0YW1wcyBvZiB0aGUgZmlsZS5cbiAgICogQHBhcmFtIFtEYXRlXSBhdGltZVxuICAgKiBAcGFyYW0gW0RhdGVdIG10aW1lXG4gICAqL1xuICB1dGltZXNTeW5jKGF0aW1lOiBudW1iZXIsIG10aW1lOiBudW1iZXIpOiB2b2lkO1xufVxuXG4vKipcbiAqIEJhc2UgY2xhc3MgdGhhdCBjb250YWlucyBzaGFyZWQgaW1wbGVtZW50YXRpb25zIG9mIGZ1bmN0aW9ucyBmb3IgdGhlIGZpbGVcbiAqIG9iamVjdC5cbiAqIEBjbGFzc1xuICovXG5leHBvcnQgY2xhc3MgQmFzZUZpbGUge1xuICBwdWJsaWMgc3luYyhjYjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgICBjYihuZXcgQXBpRXJyb3IoRXJyb3JDb2RlLkVOT1RTVVApKTtcbiAgfVxuICBwdWJsaWMgc3luY1N5bmMoKTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEFwaUVycm9yKEVycm9yQ29kZS5FTk9UU1VQKTtcbiAgfVxuICBwdWJsaWMgZGF0YXN5bmMoY2I6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5zeW5jKGNiKTtcbiAgfVxuICBwdWJsaWMgZGF0YXN5bmNTeW5jKCk6IHZvaWQge1xuICAgIHJldHVybiB0aGlzLnN5bmNTeW5jKCk7XG4gIH1cbiAgcHVibGljIGNob3duKHVpZDogbnVtYmVyLCBnaWQ6IG51bWJlciwgY2I6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgY2IobmV3IEFwaUVycm9yKEVycm9yQ29kZS5FTk9UU1VQKSk7XG4gIH1cbiAgcHVibGljIGNob3duU3luYyh1aWQ6IG51bWJlciwgZ2lkOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgQXBpRXJyb3IoRXJyb3JDb2RlLkVOT1RTVVApO1xuICB9XG4gIHB1YmxpYyBjaG1vZChtb2RlOiBudW1iZXIsIGNiOiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGNiKG5ldyBBcGlFcnJvcihFcnJvckNvZGUuRU5PVFNVUCkpO1xuICB9XG4gIHB1YmxpYyBjaG1vZFN5bmMobW9kZTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEFwaUVycm9yKEVycm9yQ29kZS5FTk9UU1VQKTtcbiAgfVxuICBwdWJsaWMgdXRpbWVzKGF0aW1lOiBudW1iZXIsIG10aW1lOiBudW1iZXIsIGNiOiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGNiKG5ldyBBcGlFcnJvcihFcnJvckNvZGUuRU5PVFNVUCkpO1xuICB9XG4gIHB1YmxpYyB1dGltZXNTeW5jKGF0aW1lOiBudW1iZXIsIG10aW1lOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgQXBpRXJyb3IoRXJyb3JDb2RlLkVOT1RTVVApO1xuICB9XG59XG4iXX0=