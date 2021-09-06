
import { AudioRecorder } from './audio-recorder'
import { AudioRecord, AudioStrList, RecordType, WatcherArgs } from '../../types'
import { Watcher } from '../watcher'

export class AudioWatcher extends Watcher<AudioRecord> {
    constructor(options: WatcherArgs<AudioRecord>) {
        super(options)
    }

    protected init() {
        const recorder = new AudioRecorder({
            sampleBits: 8,
            sampleRate: 8000,
            channelCount: 1
        })

        recorder.start()

        this.uninstall(() => {
            recorder.stop()
        })

        this.emitData(RecordType.AUDIO, {
            type: 'opts',
            data: recorder.getOptions()
        })

        recorder.onProgress = audioBase64Data => {
            const data: AudioStrList = {
                encode: 'base64',
                type: 'pcm',
                data: audioBase64Data
            }
            this.emitData(RecordType.AUDIO, data)
        }
    }
}
