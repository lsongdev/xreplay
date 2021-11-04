import { Watcher } from "../watcher";

export class DOMWatcher extends Watcher {
  install({ context }: any) {
    const observer = new MutationObserver((records) => {
      // console.log('records', records);
      for (const record of records) {
        const { target, addedNodes, removedNodes, type, attributeName, oldValue } = record
        switch (type) {
          case 'attributes':
            console.log(type, { key: attributeName!, node: target, oldValue });
            break
          case 'characterData':
            console.log(type, target);
            break
          case 'childList':
            console.log(type, addedNodes, removedNodes);
            break
          default:
            break
        }
      }
    });
    observer.observe(context.document.documentElement, {
      attributeOldValue: true,
      attributes: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true
    })
    this.registerUninstall(() => observer.disconnect());
  }
}