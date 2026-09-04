/**
 * jsdom doesn't implement the Fetch API, and MSW's Node interceptors need
 * Request/Response/fetch to exist as globals before `msw/node` is imported.
 * These have to be `require`s (not `import`s) and in this exact order: an
 * `import` gets hoisted above this file's own code, so `undici` would load
 * (and read `TextEncoder` off the global) before we'd had a chance to set
 * it. Runs via `setupFiles`, before the test framework and `jest.setup.ts`
 * load.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

export {};

const { TextDecoder, TextEncoder } = require('node:util');

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder, configurable: true, writable: true },
  TextEncoder: { value: TextEncoder, configurable: true, writable: true },
});

const { ReadableStream, TransformStream, WritableStream } = require('node:stream/web');

Object.defineProperties(globalThis, {
  ReadableStream: { value: ReadableStream, configurable: true, writable: true },
  TransformStream: { value: TransformStream, configurable: true, writable: true },
  WritableStream: { value: WritableStream, configurable: true, writable: true },
});

const { Blob, File } = require('node:buffer');
const { fetch, Headers, FormData, Request, Response } = require('undici');

// msw's interceptors patch these at runtime (e.g. to record raw headers),
// so they need to stay configurable/writable, not frozen in place.
Object.defineProperties(globalThis, {
  fetch: { value: fetch, configurable: true, writable: true },
  Blob: { value: Blob, configurable: true, writable: true },
  File: { value: File, configurable: true, writable: true },
  Headers: { value: Headers, configurable: true, writable: true },
  FormData: { value: FormData, configurable: true, writable: true },
  Request: { value: Request, configurable: true, writable: true },
  Response: { value: Response, configurable: true, writable: true },
});

// msw's WebSocket interceptor references BroadcastChannel, which jsdom
// doesn't implement.
const { BroadcastChannel } = require('node:worker_threads');

Object.defineProperty(globalThis, 'BroadcastChannel', {
  value: BroadcastChannel,
  configurable: true,
  writable: true,
});
