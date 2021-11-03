
import { FormWatcher } from './form';
import { KeyboardWatcher } from './keyboard';
import { LocationWatcher } from './location';
import { MouseWatcher } from './mouse';
import { ScrollWatcher } from './scroll';

export const allWatchers: any = [
    FormWatcher,
    MouseWatcher,
    ScrollWatcher,
    LocationWatcher,
    KeyboardWatcher,
];