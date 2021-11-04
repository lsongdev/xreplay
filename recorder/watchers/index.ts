import { DOMWatcher } from './dom';
import { FormWatcher } from './form';
import { KeyboardWatcher } from './keyboard';
import { LocationWatcher } from './location';
import { MouseWatcher } from './mouse';
import { ScrollWatcher } from './scroll';
import { WindowWatcher } from './window';

export const allWatchers: any = [
    DOMWatcher,
    FormWatcher,
    MouseWatcher,
    ScrollWatcher,
    WindowWatcher,
    LocationWatcher,
    KeyboardWatcher,
];