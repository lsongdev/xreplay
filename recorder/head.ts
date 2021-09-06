
import pkg from 'pkg'
import { ReplayHead } from '../types'
import { getRandomCode, getTime } from '../utils'

export function getHeadData() {
    return {
        href: location.href,
        title: document.title,
        relatedId: getRandomCode(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        beginTime: getTime(),
        version: pkg.version
    } as ReplayHead
}
