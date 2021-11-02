import { EventEmitter } from "./events"

export class Watcher extends EventEmitter {
  start(){}
  install(options: any) {

  }
  report(data: any) {
    return this.emit('data', data);
  }
  registerUninstall(fn: any) {
    return this.on('uninstall', fn);
  }
  uninstall() {
    const hooks = this.listeners['uninstall'];
    hooks.forEach((fn: any) => fn());
  }
}