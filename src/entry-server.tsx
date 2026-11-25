import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import App from './App'
import { routes, notFoundMeta, absUrl, defaultOg } from './config/routes'

export { routes, notFoundMeta, absUrl, defaultOg }

export async function render(url: string) {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
  let html = ''
  for await (const chunk of prelude as unknown as AsyncIterable<Buffer>) html += chunk.toString()
  return html
}
