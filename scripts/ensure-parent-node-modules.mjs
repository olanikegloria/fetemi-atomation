/**
 * Turbopack may resolve `@import 'tailwindcss'` from the parent folder (e.g.
 * `Downloads/files (1)/`) where no `node_modules` exists. Create:
 *   parent/node_modules -> fetemi-atomation/node_modules
 * Safe to re-run.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const parentDir = path.resolve(appRoot, '..')
const parentNodeModules = path.join(parentDir, 'node_modules')
const appNodeModules = path.join(appRoot, 'node_modules')
const relativeTarget = path.relative(parentDir, appNodeModules)

try {
  if (!fs.existsSync(appNodeModules)) {
    console.warn('[ensure-parent-node-modules] Missing:', appNodeModules)
    process.exit(0)
  }
  if (fs.existsSync(parentNodeModules)) {
    const st = fs.lstatSync(parentNodeModules)
    if (st.isSymbolicLink()) {
      const cur = fs.readlinkSync(parentNodeModules)
      if (path.resolve(parentDir, cur) === appNodeModules) {
        process.exit(0)
      }
      fs.unlinkSync(parentNodeModules)
    } else {
      console.warn(
        '[ensure-parent-node-modules] Skipping: not a symlink',
        parentNodeModules,
      )
      process.exit(0)
    }
  }
  fs.symlinkSync(relativeTarget, parentNodeModules, 'dir')
  console.log('[ensure-parent-node-modules]', parentNodeModules, '->', relativeTarget)
} catch (e) {
  console.warn('[ensure-parent-node-modules]', e?.message || e)
  process.exit(0)
}
