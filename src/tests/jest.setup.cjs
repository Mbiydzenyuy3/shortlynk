// Make jest available as a global for ESM test files
// With --experimental-vm-modules, jest is not auto-injected into ESM module scope,
// but setting it on globalThis here makes it accessible to all test modules.
/* eslint-disable no-undef */
globalThis.jest = jest;
