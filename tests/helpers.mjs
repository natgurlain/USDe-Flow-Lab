import ts from "typescript";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import vm from "node:vm";
// Execute the real TypeScript modules through the project's compiler, without
// adding a runtime dependency or teaching Node about application path aliases.
export function loadModule(name, globals = {}) {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const moduleRecord = { exports: {} };
    cache.set(filename, moduleRecord);
    const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText;
    const context = {
      module: moduleRecord,
      exports: moduleRecord.exports,
      require: (path) => load(resolve(dirname(filename), path + ".ts")),
      console,
      Date,
      Map,
      Set,
      Math,
      Number,
      Object,
      Array,
      Promise,
      Error,
      AbortSignal,
      fetch,
      process: { env: {} },
      ...globals,
    };
    vm.runInNewContext(compiled, context, { filename });
    return moduleRecord.exports;
  }
  return load(resolve("src/lib", name + ".ts"));
}
