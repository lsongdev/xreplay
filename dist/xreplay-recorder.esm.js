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
        console.log(type, data);
        for (const fn of this.listeners[type] || []) {
            fn.call(this, data);
        }
    }
}

function debounce(func, waitMilliseconds, options = {
    isImmediate: false,
    isTrailing: false
}) {
    let timeoutId;
    return function (...args) {
        const context = this;
        const doLater = function () {
            timeoutId = undefined;
            if (!options.isImmediate || options.isTrailing) {
                func.apply(context, args);
            }
        };
        const shouldCallNow = options.isImmediate && timeoutId === undefined;
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(doLater, waitMilliseconds);
        if (shouldCallNow) {
            func.apply(context, args);
        }
    };
}
function throttle(func, wait, options = {}) {
    let context;
    let args;
    let result;
    let timeout = null;
    let previous = 0;
    const later = function () {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout)
            context = args = null;
    };
    return function () {
        const now = Date.now();
        if (!previous && options.leading === false)
            previous = now;
        const remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout)
                context = args = null;
        }
        else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
}
class Watcher extends EventEmitter {
    constructor() {
        super(...arguments);
        this.running = false;
    }
    start() {
        this.running = true;
    }
    stop() {
        this.running = false;
    }
    install(options) {
        throw new Error();
    }
    report(type, data) {
        if (!this.running)
            return;
        const timestamp = Date.now();
        return this.emit('record', { type, data, timestamp });
    }
    registerUninstall(fn) {
        return this.on('uninstall', fn);
    }
    uninstall() {
        const hooks = this.listeners['uninstall'];
        hooks.forEach((fn) => fn());
    }
    registerEvent(options) {
        const { context, eventTypes, handleFn, listenerOptions, type, optimizeOptions, waitTime } = options;
        let listenerHandle;
        switch (type) {
            case 'debounce':
                listenerHandle = debounce;
                break;
            case 'throttle':
                listenerHandle = throttle;
                break;
        }
        eventTypes
            .map(type => (fn) => {
            context.addEventListener(type, fn, listenerOptions);
        })
            .forEach(handle => handle(listenerHandle(handleFn, waitTime, optimizeOptions)));
        this.registerUninstall(() => {
            eventTypes.forEach(type => {
                context.removeEventListener(type, listenerHandle, listenerOptions);
            });
        });
    }
}

var Limit;
(function (Limit) {
    Limit[Limit["All"] = 0] = "All";
    Limit[Limit["Two"] = 1] = "Two";
    Limit[Limit["One"] = 2] = "One";
})(Limit || (Limit = {}));
let config;
let rootDocument;
function finder(input, options) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
        console.error(input);
        throw new Error(`Can't generate CSS selector for non-element node type.`);
    }
    if ("html" === input.tagName.toLowerCase()) {
        return "html";
    }
    const defaults = {
        root: document.body,
        idName: (name) => true,
        className: (name) => true,
        tagName: (name) => true,
        attr: (name, value) => false,
        seedMinLength: 1,
        optimizedMinLength: 2,
        threshold: 1000,
        maxNumberOfTries: 10000,
    };
    config = Object.assign(Object.assign({}, defaults), options);
    rootDocument = findRootDocument(config.root, defaults);
    let path = bottomUpSearch(input, Limit.All, () => bottomUpSearch(input, Limit.Two, () => bottomUpSearch(input, Limit.One)));
    if (path) {
        const optimized = sort(optimize(path, input));
        if (optimized.length > 0) {
            path = optimized[0];
        }
        return selector(path);
    }
    else {
        throw new Error(`Selector was not found.`);
    }
}
function findRootDocument(rootNode, defaults) {
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
        return rootNode;
    }
    if (rootNode === defaults.root) {
        return rootNode.ownerDocument;
    }
    return rootNode;
}
function bottomUpSearch(input, limit, fallback) {
    let path = null;
    let stack = [];
    let current = input;
    let i = 0;
    while (current && current !== config.root.parentElement) {
        let level = maybe(id(current)) ||
            maybe(...attr(current)) ||
            maybe(...classNames(current)) ||
            maybe(tagName(current)) || [any()];
        const nth = index(current);
        if (limit === Limit.All) {
            if (nth) {
                level = level.concat(level.filter(dispensableNth).map((node) => nthChild(node, nth)));
            }
        }
        else if (limit === Limit.Two) {
            level = level.slice(0, 1);
            if (nth) {
                level = level.concat(level.filter(dispensableNth).map((node) => nthChild(node, nth)));
            }
        }
        else if (limit === Limit.One) {
            const [node] = (level = level.slice(0, 1));
            if (nth && dispensableNth(node)) {
                level = [nthChild(node, nth)];
            }
        }
        for (let node of level) {
            node.level = i;
        }
        stack.push(level);
        if (stack.length >= config.seedMinLength) {
            path = findUniquePath(stack, fallback);
            if (path) {
                break;
            }
        }
        current = current.parentElement;
        i++;
    }
    if (!path) {
        path = findUniquePath(stack, fallback);
    }
    return path;
}
function findUniquePath(stack, fallback) {
    const paths = sort(combinations(stack));
    if (paths.length > config.threshold) {
        return fallback ? fallback() : null;
    }
    for (let candidate of paths) {
        if (unique(candidate)) {
            return candidate;
        }
    }
    return null;
}
function selector(path) {
    let node = path[0];
    let query = node.name;
    for (let i = 1; i < path.length; i++) {
        const level = path[i].level || 0;
        if (node.level === level - 1) {
            query = `${path[i].name} > ${query}`;
        }
        else {
            query = `${path[i].name} ${query}`;
        }
        node = path[i];
    }
    return query;
}
function penalty(path) {
    return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0);
}
function unique(path) {
    switch (rootDocument.querySelectorAll(selector(path)).length) {
        case 0:
            throw new Error(`Can't select any node with this selector: ${selector(path)}`);
        case 1:
            return true;
        default:
            return false;
    }
}
function id(input) {
    const elementId = input.getAttribute("id");
    if (elementId && config.idName(elementId)) {
        return {
            name: "#" + cssesc(elementId, { isIdentifier: true }),
            penalty: 0,
        };
    }
    return null;
}
function attr(input) {
    const attrs = Array.from(input.attributes).filter((attr) => config.attr(attr.name, attr.value));
    return attrs.map((attr) => ({
        name: "[" +
            cssesc(attr.name, { isIdentifier: true }) +
            '="' +
            cssesc(attr.value) +
            '"]',
        penalty: 0.5,
    }));
}
function classNames(input) {
    const names = Array.from(input.classList).filter(config.className);
    return names.map((name) => ({
        name: "." + cssesc(name, { isIdentifier: true }),
        penalty: 1,
    }));
}
function tagName(input) {
    const name = input.tagName.toLowerCase();
    if (config.tagName(name)) {
        return {
            name,
            penalty: 2,
        };
    }
    return null;
}
function any() {
    return {
        name: "*",
        penalty: 3,
    };
}
function index(input) {
    const parent = input.parentNode;
    if (!parent) {
        return null;
    }
    let child = parent.firstChild;
    if (!child) {
        return null;
    }
    let i = 0;
    while (child) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            i++;
        }
        if (child === input) {
            break;
        }
        child = child.nextSibling;
    }
    return i;
}
function nthChild(node, i) {
    return {
        name: node.name + `:nth-child(${i})`,
        penalty: node.penalty + 1,
    };
}
function dispensableNth(node) {
    return node.name !== "html" && !node.name.startsWith("#");
}
function maybe(...level) {
    const list = level.filter(notEmpty);
    if (list.length > 0) {
        return list;
    }
    return null;
}
function notEmpty(value) {
    return value !== null && value !== undefined;
}
function* combinations(stack, path = []) {
    if (stack.length > 0) {
        for (let node of stack[0]) {
            yield* combinations(stack.slice(1, stack.length), path.concat(node));
        }
    }
    else {
        yield path;
    }
}
function sort(paths) {
    return Array.from(paths).sort((a, b) => penalty(a) - penalty(b));
}
function* optimize(path, input, scope = {
    counter: 0,
    visited: new Map(),
}) {
    if (path.length > 2 && path.length > config.optimizedMinLength) {
        for (let i = 1; i < path.length - 1; i++) {
            if (scope.counter > config.maxNumberOfTries) {
                return;
            }
            scope.counter += 1;
            const newPath = [...path];
            newPath.splice(i, 1);
            const newPathKey = selector(newPath);
            if (scope.visited.has(newPathKey)) {
                return;
            }
            if (unique(newPath) && same(newPath, input)) {
                yield newPath;
                scope.visited.set(newPathKey, true);
                yield* optimize(newPath, input, scope);
            }
        }
    }
}
function same(path, input) {
    return rootDocument.querySelector(selector(path)) === input;
}
const regexAnySingleEscape = /[ -,\.\/:-@\[-\^`\{-~]/;
const regexSingleEscape = /[ -,\.\/:-@\[\]\^`\{-~]/;
const regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;
const defaultOptions = {
    escapeEverything: false,
    isIdentifier: false,
    quotes: "single",
    wrap: false,
};
function cssesc(string, opt = {}) {
    const options = Object.assign(Object.assign({}, defaultOptions), opt);
    if (options.quotes != "single" && options.quotes != "double") {
        options.quotes = "single";
    }
    const quote = options.quotes == "double" ? '"' : "'";
    const isIdentifier = options.isIdentifier;
    const firstChar = string.charAt(0);
    let output = "";
    let counter = 0;
    const length = string.length;
    while (counter < length) {
        const character = string.charAt(counter++);
        let codePoint = character.charCodeAt(0);
        let value = void 0;
        if (codePoint < 0x20 || codePoint > 0x7e) {
            if (codePoint >= 0xd800 && codePoint <= 0xdbff && counter < length) {
                const extra = string.charCodeAt(counter++);
                if ((extra & 0xfc00) == 0xdc00) {
                    codePoint = ((codePoint & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                }
                else {
                    counter--;
                }
            }
            value = "\\" + codePoint.toString(16).toUpperCase() + " ";
        }
        else {
            if (options.escapeEverything) {
                if (regexAnySingleEscape.test(character)) {
                    value = "\\" + character;
                }
                else {
                    value = "\\" + codePoint.toString(16).toUpperCase() + " ";
                }
            }
            else if (/[\t\n\f\r\x0B]/.test(character)) {
                value = "\\" + codePoint.toString(16).toUpperCase() + " ";
            }
            else if (character == "\\" ||
                (!isIdentifier &&
                    ((character == '"' && quote == character) ||
                        (character == "'" && quote == character))) ||
                (isIdentifier && regexSingleEscape.test(character))) {
                value = "\\" + character;
            }
            else {
                value = character;
            }
        }
        output += value;
    }
    if (isIdentifier) {
        if (/^-[-\d]/.test(output)) {
            output = "\\-" + output.slice(1);
        }
        else if (/\d/.test(firstChar)) {
            output = "\\3" + firstChar + " " + output.slice(1);
        }
    }
    output = output.replace(regexExcessiveSpaces, function ($0, $1, $2) {
        if ($1 && $1.length % 2) {
            return $0;
        }
        return ($1 || "") + $2;
    });
    if (!isIdentifier && options.wrap) {
        return quote + output + quote;
    }
    return output;
}

var eventTypes;
(function (eventTypes) {
    eventTypes["input"] = "input";
    eventTypes["change"] = "change";
    eventTypes["focus"] = "focus";
    eventTypes["blur"] = "blur";
})(eventTypes || (eventTypes = {}));
const createFormMonitor = (context, handleEvent) => {
    const eventListenerOptions = { once: false, passive: true, capture: true };
    function fn(e) {
        const { type: eventType } = e;
        const target = e.target;
        let key = '', value;
        switch (eventType) {
            case eventTypes.focus:
                key = 'focus';
                break;
            case eventTypes.blur:
                key = 'blur';
                break;
            case eventTypes.input:
            case eventTypes.change:
                key = 'value';
                const inputType = target.getAttribute('type') || 'text';
                if (inputType === 'checkbox' || inputType === 'radio') {
                    if (eventType === 'input')
                        return;
                    key = 'checked';
                }
                value = target[key];
                break;
        }
        if (target.nodeType === Node.ELEMENT_NODE) {
            handleEvent(target, key, value);
        }
    }
    const arr = [];
    for (const type of Object.values(eventTypes)) {
        context.addEventListener(type, fn, eventListenerOptions);
        arr.push(() => context.removeEventListener(type, fn, eventListenerOptions));
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
        arr.push(() => Object.defineProperty(target, key, descriptor));
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
    return {
        bind,
        hijacking,
        unbind: () => arr.map(fn => fn())
    };
};

class FormWatcher extends Watcher {
    install({ context }) {
        const { bind, unbind } = createFormMonitor(context, (el, key, value) => {
            const selector = finder(el);
            this.report('FORM_ELEMENT', { key, value, selector });
        });
        this.registerUninstall(unbind);
        return bind();
    }
}

class KeyboardWatcher extends Watcher {
    install({ context }) {
        this.registerEvent({
            context,
            eventTypes: ['keypress'],
            listenerOptions: { capture: true },
            type: 'throttle',
            waitTime: 100,
            optimizeOptions: {},
            handleFn: (e) => {
                const { key, code, ctrlKey, shiftKey, altKey, metaKey, repeat, location, target } = e;
                this.report('KEYBOARD', { key, code, ctrlKey, shiftKey, altKey, metaKey, repeat, target });
            }
        });
    }
}

var LocationTypes;
(function (LocationTypes) {
    LocationTypes["replaceState"] = "replaceState";
    LocationTypes["pushState"] = "pushState";
    LocationTypes["popstate"] = "popstate";
    LocationTypes["hashchange"] = "hashchange";
})(LocationTypes || (LocationTypes = {}));
const createLocationMonitor = (context, fn) => {
    const rewrite = (history, type) => {
        const original = history[type];
        return history[type] = function () {
            const e = new Event(type);
            original.apply(this, arguments);
            context.dispatchEvent(e);
        };
    };
    const arr = [];
    const bind = () => {
        rewrite(context.history, 'pushState');
        rewrite(context.history, 'replaceState');
        const types = Object.values(LocationTypes);
        types.forEach(type => {
            context.addEventListener(type, fn);
            arr.push(() => context.removeEventListener(type, fn));
        });
    };
    return {
        bind,
        unbind: () => arr.map(fn => fn())
    };
};
class LocationWatcher extends Watcher {
    install({ context }) {
        const { bind, unbind } = createLocationMonitor(context, (e) => {
            const { title } = document;
            const { href, pathname, hash } = context.location;
            this.report('LOCATION', { title, href, path: pathname, hash });
        });
        this.registerUninstall(unbind);
        return bind();
    }
}

class MouseWatcher extends Watcher {
    install({ context }) {
        this.registerEvent({
            context,
            eventTypes: ['mousemove'],
            type: 'throttle',
            waitTime: 300,
            listenerOptions: {},
            optimizeOptions: {
                trailing: true,
                leading: true
            },
            handleFn: (e) => {
                const { offsetX: x, offsetY: y } = e;
                this.report('MOUSE', { type: 'MOVE', x, y });
            },
        });
        this.registerEvent({
            context,
            eventTypes: ['click'],
            type: 'throttle',
            waitTime: 300,
            listenerOptions: {},
            handleFn: (e) => {
                const { offsetX: x, offsetY: y, target } = e;
                const selector = finder(target);
                this.report('MOUSE', { type: 'CLICK', x, y, selector });
            }
        });
    }
}

class ScrollWatcher extends Watcher {
    install({ context }) {
        context.document;
        this.registerEvent({
            context,
            type: 'throttle',
            eventTypes: ['scroll'],
            listenerOptions: { capture: true },
            optimizeOptions: {},
            waitTime: 100,
            handleFn: (e) => {
                console.log('scroll', e);
            }
        });
    }
}

const allWatchers = [
    FormWatcher,
    MouseWatcher,
    ScrollWatcher,
    LocationWatcher,
    KeyboardWatcher,
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
        const report = (data) => this.emit('report', data);
        for (const watcher of watchers) {
            watcher.on('report', report);
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
