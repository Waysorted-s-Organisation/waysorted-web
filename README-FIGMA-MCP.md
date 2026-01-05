Figma MCP Docker proxy

This small proxy exposes an MCP-compatible HTTP endpoint on `http://127.0.0.1:3845/mcp` and forwards requests to the Figma REST API.

Quick start

1. Copy your Figma token into an env file: `tools/figma-mcp/.env` or set the `FIGMA_TOKEN` env var.
2. From repository root run:

```bash
docker-compose up --build
```

3. Configure your `mcp.json` to point to `http://127.0.0.1:3845/mcp` (this repo's workspace `mcp.json` already has such an entry in many setups).

Usage

- You can proxy native Figma endpoints by making requests to `/mcp/<figma-path>` — e.g. `/mcp/v1/files/:file_key`.
- Or POST JSON to `/mcp` with `{ "method":"GET","path":"/v1/files/:file_key", "headers":{}, "body":null }`.

Security

- Do NOT commit your `FIGMA_TOKEN` into the repo. Use `.env` or CI secrets.
