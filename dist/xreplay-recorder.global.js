var xreplay = (function (exports) {
    'use strict';

    class IWatcher {
    }
    class Watcher extends IWatcher {
    }
    const allWatchers = [];

    class EventEmitter {
        constructor() {
            this.listeners = {};
        }
        on(type, handler) {
            this.listeners = this.listeners[type] || [];
            console.log(this.listeners[type]);
            this.listeners[type].push(handler);
            return this;
        }
    }

    class AbstractRecorder extends EventEmitter {
        constructor() {
            super(...arguments);
            this.watchers = [];
        }
        start() { }
        stop() { }
    }
    class Recorder extends AbstractRecorder {
        constructor({ disableWatchers }) {
            super();
            this.watchers = allWatchers.filter((x) => disableWatchers.indexOf(x.name) === -1);
        }
    }

    exports.Recorder = Recorder;
    exports.Watcher = Watcher;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=xreplay-recorder.global.js.map
