import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { smartResolveDriveFolder } from './api/drive.ts'

const driveApiPlugin = (): Plugin => ({
  name: 'drive-api-middleware',
  configureServer(server) {
    server.middlewares.use('/api/drive', async (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')

      try {
        const url = new URL(req.url || '', 'http://localhost')
        const folderId = url.searchParams.get('folderId')
        const subfolderId = url.searchParams.get('subfolderId') || undefined

        if (!folderId) {
          res.statusCode = 400
          res.end(JSON.stringify({ success: false, error: 'Parameter folderId wajib diisi.' }))
          return
        }

        const result = await smartResolveDriveFolder(folderId, subfolderId)
        res.statusCode = 200
        res.end(JSON.stringify({ success: true, ...result }))
      } catch (err: any) {
        console.error('Local dev drive resolver error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ success: false, error: err.message || 'Gagal memproses folder Google Drive.' }))
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), driveApiPlugin()],
  server: {
    host: true,
    allowedHosts: true,
  },
})
