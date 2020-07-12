/**
 * @hidden
 */
let bfsSetImmediate: (cb: Function) => any = (cb: Function) => {
  cb();
};

export default bfsSetImmediate;
