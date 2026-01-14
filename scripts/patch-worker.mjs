/**
 * Patch script for Cloudflare Workers compatibility
 * Fixes setImmediate and other Node.js polyfill issues
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const workerPath = join(process.cwd(), '.open-next', 'worker.js')

if (!existsSync(workerPath)) {
	console.log('⚠️  Worker file not found, skipping patch')
	process.exit(0)
}

let content = readFileSync(workerPath, 'utf-8')

// Fix setImmediate read-only error
if (content.includes('setImmediate')) {
	content = content.replace(
		/globalThis\.setImmediate\s*=\s*setImmediate/g,
		'if (typeof globalThis.setImmediate === "undefined") { globalThis.setImmediate = setImmediate }'
	)
	
	// Also patch any direct assignments
	content = content.replace(
		/global\.setImmediate\s*=\s*setImmediate/g,
		'if (typeof global.setImmediate === "undefined") { global.setImmediate = setImmediate }'
	)
}

// Fix clearImmediate if present
if (content.includes('clearImmediate')) {
	content = content.replace(
		/globalThis\.clearImmediate\s*=\s*clearImmediate/g,
		'if (typeof globalThis.clearImmediate === "undefined") { globalThis.clearImmediate = clearImmediate }'
	)
}

writeFileSync(workerPath, content)
console.log('✅ Worker patched successfully')
