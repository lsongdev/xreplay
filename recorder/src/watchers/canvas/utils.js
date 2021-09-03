"use strict";
exports.__esModule = true;
exports.isCanvasBlank = exports.detectCanvasContextType = exports.strokesManager = void 0;
function strokesManager(opts) {
    var tasks = Object.create(null);
    var timeouts = Object.create(null);
    function emitData(canvasId) {
        var timeout = timeouts[canvasId];
        clearTimeout(timeout);
        timeouts[canvasId] = 0;
        var calls = tasks[canvasId].slice();
        tasks[canvasId].length = 0;
        opts.fn.call(this, canvasId, calls);
    }
    return function (canvasId, name, args) {
        if (!tasks[canvasId]) {
            tasks[canvasId] = [];
        }
        if (!opts.blockInstances.some(function (instance) { return args instanceof instance; })) {
            tasks[canvasId].push({
                name: name,
                args: args
            });
        }
        if (!timeouts[canvasId]) {
            var timeout = window.setTimeout(function () {
                emitData(canvasId);
            }, opts.wait);
            timeouts[canvasId] = timeout;
        }
    };
}
exports.strokesManager = strokesManager;
function detectCanvasContextType(canvasElement, callback) {
    var canvas = canvasElement;
    if (!canvas.typeWatchers) {
        canvas.typeWatchers = [];
        var original_1 = canvas.getContext;
        canvas.getContext = function (contextId, options) {
            var _this = this;
            canvas.getContext = original_1;
            canvas.typeWatchers.forEach(function (callback) { return callback.call(_this, contextId, options); });
            canvas.typeWatchers.length = 0;
            delete canvas.typeWatchers;
            return original_1.apply(this, arguments);
        };
    }
    canvas.typeWatchers.push(callback);
}
exports.detectCanvasContextType = detectCanvasContextType;
function isCanvasBlank(canvas) {
    var blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    return canvas.toDataURL() === blank.toDataURL();
}
exports.isCanvasBlank = isCanvasBlank;
