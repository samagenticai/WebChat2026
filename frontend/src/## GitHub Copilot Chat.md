## GitHub Copilot Chat

- Extension: 0.38.1 (prod)
- VS Code: 1.110.0 (0870c2a0c7c0564e7631bfed2675573a94ba4455)
- OS: win32 10.0.19045 x64
- GitHub Account: ahmadmerndev-lab

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 20.207.73.85 (4 ms)
- DNS ipv6 Lookup: Error (4 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (226 ms)
- Node.js https: HTTP 200 (453 ms)
- Node.js fetch: HTTP 200 (127 ms)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.112.22 (78 ms)
- DNS ipv6 Lookup: Error (4 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (9 ms)
- Electron fetch (configured): HTTP 200 (1027 ms)
- Node.js https: HTTP 200 (1004 ms)
- Node.js fetch: HTTP 200 (1057 ms)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: 20.250.119.64 (48 ms)
- DNS ipv6 Lookup: Error (45 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (3 ms)
- Electron fetch (configured): HTTP 200 (540 ms)
- Node.js https: HTTP 200 (640 ms)
- Node.js fetch: HTTP 200 (602 ms)

Connecting to https://mobile.events.data.microsoft.com: HTTP 404 (666 ms)
Connecting to https://dc.services.visualstudio.com: HTTP 404 (1444 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (1104 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (1126 ms)
Connecting to https://default.exp-tas.com: HTTP 400 (598 ms)

Number of system certificates: 344

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).