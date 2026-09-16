const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Stub .wasm imports so expo-sqlite/web/worker.ts bundles without error
const wasmStub = path.join(__dirname, '.wasm-stub.js');
if (!fs.existsSync(wasmStub)) {
  fs.writeFileSync(wasmStub, 'module.exports = { __esModule: true, default: null };\n');
}

const origResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.wasm')) {
    return {
      type: 'sourceFile',
      filePath: wasmStub,
    };
  }
  return origResolveRequest
    ? origResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
