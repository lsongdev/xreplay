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
exports.AudioWatcher = void 0;
var audio_recorder_1 = require("./audio-recorder");
var share_1 = require("@timecat/share");
var watcher_1 = require("../watcher");
var AudioWatcher = /** @class */ (function (_super) {
    __extends(AudioWatcher, _super);
    function AudioWatcher(options) {
        return _super.call(this, options) || this;
    }
    AudioWatcher.prototype.init = function () {
        var _this = this;
        var recorder = new audio_recorder_1.AudioRecorder({
            sampleBits: 8,
            sampleRate: 8000,
            channelCount: 1
        });
        recorder.start();
        this.uninstall(function () {
            recorder.stop();
        });
        this.emitData(share_1.RecordType.AUDIO, {
            type: 'opts',
            data: recorder.getOptions()
        });
        recorder.onProgress = function (audioBase64Data) {
            var data = {
                encode: 'base64',
                type: 'pcm',
                data: audioBase64Data
            };
            _this.emitData(share_1.RecordType.AUDIO, data);
        };
    };
    return AudioWatcher;
}(watcher_1.Watcher));
exports.AudioWatcher = AudioWatcher;
