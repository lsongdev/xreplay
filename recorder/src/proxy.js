"use strict";
exports.__esModule = true;
exports.removeProxies = exports.proxyCreateCanvasElement = void 0;
var utils_1 = require("@timecat/utils");
var listeners = [];
function proxyCreateElement(callback) {
    listeners.push(callback);
    var originalCreateElement = document.createElement;
    if (!(0, utils_1.isNativeFunction)(originalCreateElement)) {
        return;
    }
    this.uninstall(function () {
        document.createElement = originalCreateElement;
    });
    document.createElement = function (tagName, options) {
        var ret = originalCreateElement.call(this, tagName, options);
        if (options !== false) {
            listeners.forEach(function (listener) { return listener(ret); });
        }
        return ret;
    };
}
function proxyCreateCanvasElement(callback) {
    var fn = function (element) {
        if (element.tagName === 'CANVAS') {
            callback(element);
        }
    };
    proxyCreateElement.call(this, fn);
}
exports.proxyCreateCanvasElement = proxyCreateCanvasElement;
function removeProxies() {
    listeners.length = 0;
}
exports.removeProxies = removeProxies;
