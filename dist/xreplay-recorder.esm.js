class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    on(type, handler) {
        this.listeners[type] = this.listeners[type] || [];
        this.listeners[type].push(handler);
        return this;
    }
    emit(type, data) {
        for (const fn of this.listeners[type]) {
            fn.call(this, data);
        }
    }
}

class Watcher extends EventEmitter {
    start() { }
    install(options) {
    }
    report(data) {
        return this.emit('data', data);
    }
    registerUninstall(fn) {
        return this.on('uninstall', fn);
    }
    uninstall() {
        const hooks = this.listeners['uninstall'];
        hooks.forEach((fn) => fn());
    }
}

var eventTypes;
(function (eventTypes) {
    eventTypes["input"] = "input";
    eventTypes["change"] = "change";
    eventTypes["focus"] = "focus";
    eventTypes["blur"] = "blur";
})(eventTypes || (eventTypes = {}));
const createHijacking = (context, handleEvent) => {
    const eventListenerOptions = { once: false, passive: true, capture: true };
    function fn(e) {
        const eventType = e.type;
        handleEvent(e.target, eventType);
    }
    for (const type of Object.values(eventTypes)) {
        context.addEventListener(type, fn, eventListenerOptions);
    }
    const hijacking = (key, target) => {
        const descriptor = Object.getOwnPropertyDescriptor(target, key);
        Object.defineProperty(target, key, {
            set(value) {
                setTimeout(() => handleEvent(this, key, value));
                if (descriptor && descriptor.set) {
                    descriptor.set.call(this, value);
                }
            }
        });
    };
    const bind = () => {
        new Map([
            [context.HTMLSelectElement.prototype, 'value'],
            [context.HTMLTextAreaElement.prototype, 'value'],
            [context.HTMLOptionElement.prototype, 'selected']
        ]).forEach((target, key) => hijacking(target, key));
        new Map([
            ['value', context.HTMLInputElement.prototype],
            ['checked', context.HTMLInputElement.prototype]
        ]).forEach((target, key) => hijacking(key, target));
    };
    return bind();
};
function hijackInputs(context) {
    createHijacking(context, (el, key, value) => {
        console.log(el, key, value);
    });
}
class FormElementWatcher extends Watcher {
    install({ context }) {
        hijackInputs(context);
    }
}

const allWatchers = [
    FormElementWatcher,
];

class Recorder extends EventEmitter {
    constructor({ disableWatchers }) {
        super();
        this.options = {
            context: window
        };
        this.watchers = [];
        this.watchers = allWatchers
            .filter((x) => disableWatchers.indexOf(x.name) === -1)
            .map((W) => new W());
        this.install();
    }
    install() {
        const { options, watchers } = this;
        console.log(watchers);
        for (const watcher of watchers) {
            watcher.install(options);
        }
    }
    start() {
        for (const watcher of this.watchers) {
            watcher.start();
        }
    }
}

export { Recorder, Watcher };
//# sourceMappingURL=xreplay-recorder.esm.js.map
