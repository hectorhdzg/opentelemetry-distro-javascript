// Post-build fixups for the CommonJS output.
//
// The ESM build (dist/esm/) works as-is. The CJS build (dist/commonjs/)
// needs two fixups:
//
// 1. A package.json with {"type":"commonjs"} so Node doesn't treat .js
//    files as ESM (the root package.json has "type":"module").
//
// 2. The module-cjs.cts polyfill must replace module.ts in the CJS output,
//    because module.ts uses import.meta.url which is ESM-only.
//
// 3. The Azure Functions instrumentation import must be fixed. The ESM
//    build uses a default import (required because the package is a webpack
//    bundle and Node ESM can't extract named exports). In CJS, the
//    __importDefault helper double-wraps the require result, so we replace
//    it with a direct require + destructure.

const fs = require("fs");
const path = require("path");

const cjsDir = path.join(__dirname, "..", "dist", "commonjs");

// 1. CJS package.json marker
fs.writeFileSync(path.join(cjsDir, "package.json"), '{"type":"commonjs"}\n');

// 2. module.ts → module-cjs.cts polyfill swap
fs.copyFileSync(
  path.join(cjsDir, "shared", "module-cjs.cjs"),
  path.join(cjsDir, "shared", "module.js"),
);

// 3. Fix Azure Functions default-import in CJS output
const handlerPath = path.join(cjsDir, "azureMonitor", "traces", "handler.js");
let handler = fs.readFileSync(handlerPath, "utf8");
// Replace the __importDefault pattern with a direct require
handler = handler.replace(
  /const functions_opentelemetry_instrumentation_1 = __importDefault\(require\("@azure\/functions-opentelemetry-instrumentation"\)\);\s*const \{ AzureFunctionsInstrumentation \} = functions_opentelemetry_instrumentation_1\.default;/,
  'const { AzureFunctionsInstrumentation } = require("@azure/functions-opentelemetry-instrumentation");',
);
fs.writeFileSync(handlerPath, handler);

console.log("CJS fixups applied.");
