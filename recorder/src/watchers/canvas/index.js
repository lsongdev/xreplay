"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.CanvasWebGLWatcher = exports.Canvas2DWatcher = exports.CanvasSnapshotWatcher = void 0;
var snapshot_1 = require("./snapshot");
__createBinding(exports, snapshot_1, "CanvasSnapshotWatcher");
var _2d_1 = require("./2d");
__createBinding(exports, _2d_1, "Canvas2DWatcher");
var webgl_1 = require("./webgl");
__createBinding(exports, webgl_1, "CanvasWebGLWatcher");
