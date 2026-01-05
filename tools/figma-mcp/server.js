import express from 'express'
import morgan from 'morgan'

const app = express()
app.use(morgan('tiny'))
app.use(express.raw({ type: '*/*', limit: '20mb' }))

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || ''

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Figma MCP proxy running' })
})

app.all('/mcp', async (req, res) => {
  try {
    const raw = req.body && req.body.length ? req.body.toString() : ''
    let payload = null
    try { payload = raw ? JSON.parse(raw) : null } catch (e) { payload = null }

    if (!payload || !payload.path) {
      return res.status(400).json({
        error: 'When POSTing to /mcp include JSON {"method","path","headers","body"}'
      })
    }

    const method = payload.method || 'GET'
    const url = `https://api.figma.com${payload.path}`
    const headers = Object.assign({}, payload.headers || {})

    // Use X-Figma-Token for PATs
    if (!headers['authorization'] && !headers['x-figma-token']) {
      headers['x-figma-token'] = FIGMA_TOKEN
    }

    let fetchOptions = { method, headers }
    if (payload.body != null) {
      const bodyToSend = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body)
      headers['content-type'] = headers['content-type'] || 'application/json'
      fetchOptions.body = bodyToSend
    }

    console.log(`[Proxy] Requesting ${url} with method ${method}`);
    console.log('[Proxy] Headers:', JSON.stringify(headers));

    const resp = await fetch(url, fetchOptions)
    console.log(`[Proxy] Response status: ${resp.status}`);
    const text = await resp.text()
    console.log(`[Proxy] Response body prefix: ${text.substring(0, 100)}`);

    const respHeaders = {}
    resp.headers.forEach((v, k) => (respHeaders[k] = v))
    res.status(resp.status).set(respHeaders).send(text)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
})

app.all('/mcp/*', async (req, res) => {
  try {
    const target = `https://api.figma.com${req.originalUrl.replace(/^\/mcp/, '')}`
    const headers = { ...req.headers }
    delete headers.host

    // Use X-Figma-Token for PATs
    if (!headers['authorization'] && !headers['x-figma-token']) {
      headers['x-figma-token'] = FIGMA_TOKEN
    }

    let fetchOptions = { method: req.method, headers }
    const body = req.body && req.body.length ? req.body : undefined
    if (body) {
      fetchOptions.body = body
    }

    const resp = await fetch(target, fetchOptions)

    res.status(resp.status)
    resp.headers.forEach((v, k) => res.setHeader(k, v))
    const arr = await resp.arrayBuffer()
    res.send(Buffer.from(arr))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
})

const port = process.env.PORT || 3845
app.listen(port, () => console.log(`Figma MCP proxy listening on ${port}`))
