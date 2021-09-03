"use strict";
/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.FontWatcher = void 0;
/**
 *
 * Reference and more info:
 * https://github.com/Microsoft/TypeScript/issues/30984
 * https://developer.mozilla.org/en-US/docs/Web/API/FontFace/FontFace
 *
 */
var share_1 = require("@timecat/share");
var watcher_1 = require("../watcher");
var FontWatcher = /** @class */ (function (_super) {
    __extends(FontWatcher, _super);
    function FontWatcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FontWatcher.prototype.init = function () {
        if (this.recordOptions.font) {
            this.interceptAddFont();
        }
    };
    FontWatcher.prototype.interceptAddFont = function () {
        var original = window.FontFace;
        var self = this;
        function FontFace(family, source) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
            // https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
            function ab2str(buffer) {
                var buf = new Uint16Array(buffer);
                var len = buf.byteLength;
                var gap = Math.pow(2, 16) - 1;
                var res = '';
                for (var i = 0; i < len; i += gap) {
                    if (i + gap > len) {
                        gap = len - i;
                    }
                    res += String.fromCharCode.apply(null, buf.subarray(i, i + gap));
                }
                return res;
            }
            var font = new original(family, source);
            self.emitData(share_1.RecordType.FONT, {
                family: family,
                source: typeof source === 'string' ? source : ab2str(source)
            });
            document.fonts.add(font);
        }
        window.FontFace = FontFace;
        this.uninstall(function () {
            window.FontFace = original;
        });
    };
    return FontWatcher;
}(watcher_1.Watcher));
exports.FontWatcher = FontWatcher;
