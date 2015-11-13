/// <reference path="../../../typings/tsd.d.ts" />
import BrowserFS = require("../../../src/main");
import {WorkerFileSystem} from "../../../src/backend/Worker";
import inmemfs_factory = require('./inmemory_factory');

// Construct an in-memory file system,
inmemfs_factory((name, objs) => {
  BrowserFS.initialize(objs[0]);
  // Listen for API requests.
  WorkerFileSystem.attachRemoteListener(<Worker> <any> self);
  // Tell the main thread that we are ready.
  (<Worker> <any> self).postMessage("Ready");
});

