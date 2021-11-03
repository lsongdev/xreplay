import { finder } from '../finder';
import { Watcher } from '../watcher';
import { createFormMonitor } from '../form';

export class FormWatcher extends Watcher {
  install({ context }: any) {
    const { bind, unbind } = createFormMonitor(context, (el: HTMLElement, key: string, value: any) => {
      const selector = finder(el);
      this.report('FORM_ELEMENT', { key, value, selector });
    });
    this.registerUninstall(unbind);
    return bind();
  }
}
