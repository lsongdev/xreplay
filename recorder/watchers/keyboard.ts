import { Watcher } from "../watcher";

export class KeyboardWatcher extends Watcher {
  install({ context }: any) {
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