const { contextBridge } = require('electron')

// Minimal, safe bridge. Expose only what the renderer genuinely needs.
contextBridge.exposeInMainWorld('droid', {
  platform: process.platform,
  isElectron: true,
})
