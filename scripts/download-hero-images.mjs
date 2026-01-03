#!/usr/bin/env node

/**
 * Hero Images Downloader
 * 
 * Downloads hero portrait images from URLs defined in hero-images.manifest.json
 * 
 * Usage:
 *   node scripts/download-hero-images.mjs [options]
 * 
 * Options:
 *   --force    Re-download existing images
 *   --dry-run  Show what would be downloaded without actually downloading
 *   --help     Show this help message
 */

import { readFile, writeFile, access, mkdir } from 'fs/promises'
import { createWriteStream } from 'fs'
import { dirname, join, extname } from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_DIR = join(__dirname, '..')
const MANIFEST_PATH = join(ROOT_DIR, 'hero-images.manifest.json')
const OUTPUT_DIR = join(ROOT_DIR, 'public', 'hero-images')

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  force: args.includes('--force'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help')
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function showHelp() {
  console.log(`
Hero Images Downloader

Downloads hero portrait images from URLs defined in hero-images.manifest.json

Usage:
  npm run download:hero-images [-- options]
  node scripts/download-hero-images.mjs [options]

Options:
  --force    Re-download existing images (overwrites existing files)
  --dry-run  Show what would be downloaded without actually downloading
  --help     Show this help message

Examples:
  npm run download:hero-images
  npm run download:hero-images -- --force
  npm run download:hero-images -- --dry-run

Notes:
  - Add image URLs to hero-images.manifest.json before running
  - Supported formats: .webp, .png, .jpg, .jpeg, .gif
  - Images are saved to public/hero-images/
`)
}

/**
 * Check if a file exists
 */
async function fileExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Get file extension from URL
 */
function getExtFromUrl(url) {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const ext = extname(pathname).toLowerCase()
    
    // Validate extension
    const validExts = ['.webp', '.png', '.jpg', '.jpeg', '.gif']
    if (validExts.includes(ext)) {
      return ext === '.jpeg' ? '.jpg' : ext
    }
    
    // Default to .png if extension is not recognized
    return '.png'
  } catch {
    return '.png'
  }
}

/**
 * Download a single image
 */
async function downloadImage(url, outputPath) {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  // Check content type
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.startsWith('image/')) {
    throw new Error(`Invalid content type: ${contentType}`)
  }
  
  // Write to file
  const fileStream = createWriteStream(outputPath)
  await pipeline(response.body, fileStream)
}

/**
 * Main function
 */
async function main() {
  if (options.help) {
    showHelp()
    process.exit(0)
  }

  log('\n🎮 Hero Images Downloader\n', 'cyan')

  // Check if manifest exists
  if (!await fileExists(MANIFEST_PATH)) {
    log('❌ Manifest file not found: hero-images.manifest.json', 'red')
    log('   Create the manifest file first with hero URLs.', 'dim')
    process.exit(1)
  }

  // Load manifest
  let manifest
  try {
    const content = await readFile(MANIFEST_PATH, 'utf-8')
    manifest = JSON.parse(content)
  } catch (err) {
    log(`❌ Failed to parse manifest: ${err.message}`, 'red')
    process.exit(1)
  }

  const heroes = manifest.heroes || []
  
  if (heroes.length === 0) {
    log('⚠️  No heroes found in manifest', 'yellow')
    process.exit(0)
  }

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true })

  // Stats
  let downloaded = 0
  let skipped = 0
  let failed = 0
  let noUrl = 0

  log(`📋 Processing ${heroes.length} heroes...\n`)

  for (const hero of heroes) {
    const { name, slug, url } = hero

    // Skip if no URL
    if (!url) {
      noUrl++
      log(`   ⏭️  ${name} (${slug}) - no URL`, 'dim')
      continue
    }

    // Determine output path
    const ext = getExtFromUrl(url)
    const outputPath = join(OUTPUT_DIR, `${slug}${ext}`)

    // Check if already exists
    if (!options.force && await fileExists(outputPath)) {
      skipped++
      log(`   ✓  ${name} (${slug}) - already exists`, 'dim')
      continue
    }

    // Dry run mode
    if (options.dryRun) {
      log(`   📥 ${name} (${slug}) - would download from ${url}`, 'cyan')
      downloaded++
      continue
    }

    // Download
    try {
      process.stdout.write(`   📥 ${name} (${slug})...`)
      await downloadImage(url, outputPath)
      downloaded++
      console.log(` ${colors.green}✓${colors.reset}`)
    } catch (err) {
      failed++
      console.log(` ${colors.red}✗ ${err.message}${colors.reset}`)
    }
  }

  // Summary
  log('\n📊 Summary:', 'cyan')
  log(`   ${options.dryRun ? 'Would download' : 'Downloaded'}: ${downloaded}`, downloaded > 0 ? 'green' : 'dim')
  log(`   Skipped (existing): ${skipped}`, skipped > 0 ? 'yellow' : 'dim')
  log(`   No URL provided: ${noUrl}`, noUrl > 0 ? 'yellow' : 'dim')
  if (failed > 0) {
    log(`   Failed: ${failed}`, 'red')
  }
  log('')

  if (noUrl > 0) {
    log('💡 Tip: Add image URLs to hero-images.manifest.json to download portraits.', 'yellow')
    log('   You can find hero portraits on fan sites or the official HotS wiki.\n', 'dim')
  }
}

// Run
main().catch(err => {
  log(`\n❌ Unexpected error: ${err.message}`, 'red')
  process.exit(1)
})
