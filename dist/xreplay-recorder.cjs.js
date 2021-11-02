'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
//# sourceMappingURL=xreplay-recorder.cjs.js.map
