"use strict";
/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
exports.__esModule = true;
exports.Watcher = void 0;
var utils_1 = require("@timecat/utils");
var Watcher = /** @class */ (function () {
    function Watcher(options) {
        this.getNode = function (id) { return utils_1.nodeStore.getNode.call(utils_1.nodeStore, id); };
        this.getNodeId = function (n) { return utils_1.nodeStore.getNodeId.call(utils_1.nodeStore, n); };
        var emit = options.emit, context = options.context, relatedId = options.relatedId, recorder = options.recorder;
        this.options = options;
        this.recorder = recorder;
        this.relatedId = relatedId;
        this.context = context;
        this.recordOptions = context.G_RECORD_OPTIONS || window.G_RECORD_OPTIONS || {};
        this.emit = emit;
        this.init(options);
    }
    Watcher.prototype.init = function (options) { };
    Watcher.prototype.uninstall = function (fn) {
        this.options.listenStore.add(fn);
    };
    Watcher.prototype.emitData = function (type, record, time, callback) {
        if (time === void 0) { time = (0, utils_1.getTime)(); }
        var data = {
            type: type,
            data: record,
            relatedId: this.relatedId,
            time: time
        };
        if (callback) {
            return this.emit(callback(data));
        }
        this.emit(data);
    };
    Watcher.prototype.registerEvent = function (options) {
        var context = options.context, eventTypes = options.eventTypes, handleFn = options.handleFn, listenerOptions = options.listenerOptions, type = options.type, optimizeOptions = options.optimizeOptions, waitTime = options.waitTime;
        var listenerHandle;
        if (type === 'throttle') {
            listenerHandle = (0, utils_1.throttle)(handleFn, waitTime, optimizeOptions);
        }
        else {
            listenerHandle = (0, utils_1.debounce)(handleFn, waitTime, optimizeOptions);
        }
        eventTypes
            .map(function (type) { return function (fn) {
            context.addEventListener(type, fn, listenerOptions);
        }; })
            .forEach(function (handle) { return handle(listenerHandle); });
        this.uninstall(function () {
            eventTypes.forEach(function (type) {
                context.removeEventListener(type, listenerHandle, listenerOptions);
            });
        });
    };
    return Watcher;
}());
exports.Watcher = Watcher;
