import { useEffect, useState } from 'react'
import { qrPng } from '../lib/qr'

export function QrImage({ text, size = 200, alt = 'QR code' }: { text: string; size?: number; alt?: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => { let on = true; qrPng(text, size * 2).then((u) => on && setSrc(u)); return () => { on = false } }, [text, size])
  return src ? <img src={src} alt={alt} width={size} height={size} /> : <div style={{ width: size, height: size }} className="animate-pulse bg-black/10" />
}
