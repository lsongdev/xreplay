
import { Watcher } from '../watcher'

enum LocationTypes {
  'replaceState' = 'replaceState',
  'pushState' = 'pushState',
  'popstate' = 'popstate',
  'hashchange' = 'hashchange'
}

export const createLocationMonitor = (context: any, fn: any) => {
  const rewrite = (history: any, type: string) => {
    const original = history[type];
    return history[type] = function (this: any) {
      const e = new Event(type);
      original.apply(this, arguments);
      context.dispatchEvent(e);
    }
  };
  const arr: any[] = [];
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
  }
};

export class LocationWatcher extends Watcher {
  install({ context }: any) {
    const { bind, unbind } = createLocationMonitor(context, (e: Event) => {
      const { title } = document;
      const { href, pathname, hash } = context.location;
      this.report('LOCATION', { title, href, path: pathname, hash });
    });
    this.registerUninstall(unbind);
    return bind();
  }
}