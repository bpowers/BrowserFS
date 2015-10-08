/// <reference path="../typings/tsd.d.ts" />

// Shim for Browserify so we can reference tsd.d.ts without
// accidentally referencing it in our *.d.ts files, which
// causes problems for TypeScript projects that depend on
// us.

import * as main from './main';
export = main;
