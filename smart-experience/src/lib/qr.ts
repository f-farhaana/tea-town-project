import QRCode from 'qrcode'
import { appUrl } from './config'
import type { BranchId, WifiConfig } from './types'

/** HTTPS destination for a QR code or NFC tag (NFC: write as an NDEF URI record). */
export const branchUrl = (b: BranchId, base = appUrl()) => `${base}/?branch=${b}`
const esc = (s: string) => s.replace(/([\;,:"])/g, '\\$1')
export const wifiString = (w: WifiConfig) => `WIFI:T:${w.security};S:${esc(w.ssid)};${w.security === 'nopass' ? '' : `P:${esc(w.password)};`};`
const opts = { margin: 1, errorCorrectionLevel: 'M' as const, color: { dark: '#0B0B0B', light: '#FFFFFF' } }
export const qrPng = (text: string, width = 768) => QRCode.toDataURL(text, { ...opts, width })
export const qrSvg = (text: string) => QRCode.toString(text, { ...opts, type: 'svg' })
