import * as std from 'qjs:std';
import * as os from 'qjs:os';

const modules = {};

function dirname(path) {
  const i = path.lastIndexOf('/');
  return i < 0 ? '.' : path.slice(0, i);
}

function makeRequire(dir) {
  return function require(name) {
    const path = `${dir}/${name}.js`;
    if (!modules[path]) {
      const module = { exports: {} };
      modules[path] = module;
      const body = std.loadFile(path);
      const fn = std.evalScript(`(function (exports, require, module) {${body}\n})`);
      fn(module.exports, makeRequire(dirname(path)), module);
    }
    return modules[path].exports;
  };
}

globalThis.process = {
  argv: ['qjs', ...scriptArgs],
  stdout: { write: (s) => std.out.puts(s) },
  exit: (code) => std.exit(code),
  hrtime(prev) {
    const us = os.now();
    let s = Math.floor(us / 1e6);
    let ns = (us % 1e6) * 1000;
    if (prev) {
      s -= prev[0];
      ns -= prev[1];
      if (ns < 0) {
        s -= 1;
        ns += 1e9;
      }
    }
    return [s, ns];
  }
};

makeRequire(dirname(scriptArgs[0]))('harness');
