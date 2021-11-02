import { Watcher } from './watcher';
import { EventEmitter } from './events';
import { allWatchers } from './watchers';

type RecorderOption = {
  disableWatchers: string[]
};

export class Recorder extends EventEmitter {
  options = {
    context: window
  }
  watchers = []
  constructor({ disableWatchers }: RecorderOption) {
    super();
    this.watchers = allWatchers
      .filter((x: any) => disableWatchers.indexOf(x.name) === -1)
      .map((W: any) => new W())
    this.install();
  }
  install() {
    const { options, watchers } = this;
    console.log(watchers);
    for (const watcher of watchers) {
      (watcher as any).install(options);
    }
  }
  start() {
    for (const watcher of this.watchers as any) {
      watcher.start();
    }
  }
}