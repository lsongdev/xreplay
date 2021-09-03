"use strict";
/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.watchers = exports.baseWatchers = void 0;
var dom_1 = require("./dom");
var form_element_1 = require("./form-element");
var location_1 = require("./location");
var mouse_1 = require("./mouse");
var scroll_1 = require("./scroll");
var window_1 = require("./window");
var canvas_1 = require("./canvas");
var terminate_1 = require("./terminate");
var font_1 = require("./font");
exports.baseWatchers = {
    DOMWatcher: dom_1.DOMWatcher,
    FormElementWatcher: form_element_1.FormElementWatcher,
    MouseWatcher: mouse_1.MouseWatcher,
    ScrollWatcher: scroll_1.ScrollWatcher
};
exports.watchers = __assign(__assign({ LocationWatcher: location_1.LocationWatcher }, exports.baseWatchers), { WindowWatcher: window_1.WindowWatcher, CanvasSnapshotWatcher: canvas_1.CanvasSnapshotWatcher, Canvas2DWatcher: canvas_1.Canvas2DWatcher, CanvasWebGLWatcher: canvas_1.CanvasWebGLWatcher, FontWatcher: font_1.FontWatcher, TerminateWatcher: terminate_1.TerminateWatcher });
