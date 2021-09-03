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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.AudioRecorder = void 0;
var utils_1 = require("@timecat/utils");
var AudioRecorder = /** @class */ (function () {
    function AudioRecorder(opts) {
        if (opts === void 0) { opts = AudioRecorder.defaultRecordOptions; }
        this.setOptions(opts);
    }
    AudioRecorder.prototype.getOptions = function () {
        return this.opts;
    };
    AudioRecorder.prototype.setOptions = function (opts) {
        if (opts === void 0) { opts = AudioRecorder.defaultRecordOptions; }
        this.opts = __assign(__assign({}, this.opts), opts);
    };
    AudioRecorder.prototype.beginRecord = function () {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.opts.sampleRate });
        this.mediaNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        var createScript = this.audioContext.createScriptProcessor;
        this.processNode = createScript.call(this.audioContext, 4096, this.opts.channelCount, this.opts.channelCount);
        this.processNode.connect(this.audioContext.destination);
        this.processNode.onaudioprocess = onAudioProcess.bind(this);
        function onAudioProcess(event) {
            var inputBuffer = event.inputBuffer;
            // 1 channel, temporarily
            var audioBuffer_0 = inputBuffer.getChannelData(0).slice();
            if (this.onProgress) {
                var data = [(0, utils_1.float32ArrayToBase64)(audioBuffer_0)];
                this.onProgress(data);
            }
        }
        this.mediaNode.connect(this.processNode);
    };
    AudioRecorder.prototype.initRecorder = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        window.navigator.mediaDevices
                            .getUserMedia({
                            audio: {
                                sampleRate: _this.opts.sampleRate,
                                channelCount: _this.opts.channelCount,
                                echoCancellation: true,
                                autoGainControl: true,
                                noiseSuppression: false,
                                latency: 0
                            }
                        })
                            .then(function (mediaStream) { return resolve(mediaStream); })["catch"](function (err) { return reject(err); });
                    })];
            });
        });
    };
    AudioRecorder.prototype.start = function (opts) {
        if (opts === void 0) { opts = AudioRecorder.defaultRecordOptions; }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.setOptions(opts);
                        _a = this;
                        return [4 /*yield*/, this.initRecorder()];
                    case 1:
                        _a.mediaStream = _b.sent();
                        this.mediaStream && this.beginRecord();
                        return [2 /*return*/];
                }
            });
        });
    };
    AudioRecorder.prototype.stop = function () {
        this.mediaStream && this.mediaStream.getAudioTracks()[0].stop();
        this.processNode && this.processNode.disconnect();
        this.mediaNode && this.mediaNode.disconnect();
    };
    AudioRecorder.prototype.pause = function () { };
    AudioRecorder.prototype.resume = function () { };
    AudioRecorder.defaultRecordOptions = {
        sampleBits: 8,
        sampleRate: 48000,
        channelCount: 1
    };
    return AudioRecorder;
}());
exports.AudioRecorder = AudioRecorder;
