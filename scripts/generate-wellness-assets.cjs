#!/usr/bin/env node
/**
 * Generate wellness/health imagery for members-spa using Imagen 4 via CMS API.
 *
 * Usage: node scripts/generate-wellness-assets.js
 *
 * Calls: POST https://cms.creatd.se/api/cms/proxy/gemini
 * Engine: Imagen 4 (imagen-4.0-generate-001)
 * Cost: ~$0.03 per image, ~$0.78 total for 26 images
 */

const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  })
}

const CMS_API_KEY = process.env.CMS_API_KEY
if (!CMS_API_KEY || CMS_API_KEY === 'your-key-here') {
  console.error('ERROR: Set CMS_API_KEY in .env.local first')
  process.exit(1)
}

const CMS_API = 'https://cms.creatd.se/api/cms/proxy/gemini'
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'wellness')

// Brand book style prefix for all prompts
const STYLE = 'Minimalist premium illustration, warm earth tones (copper, brown, olive), dark charcoal background, absolutely no text, no letters, no words, no numbers, no hex codes, no labels, clean composition, masculine sophisticated aesthetic, health and wellness theme'

const ASSETS = [
  // === TIER 1: Pillar Illustrations (small, 1:1) ===
  {
    filename: 'pillar-identity.png',
    prompt: `${STYLE}. A golden compass resting on a mountain summit at sunrise, warm copper and amber light, symbolizing purpose and direction. Minimal, iconic, centered composition.`,
    aspectRatio: '1:1',
    category: 'pillar',
  },
  {
    filename: 'pillar-emotional.png',
    prompt: `${STYLE}. A male silhouette with a calm focused mind, neural pathways glowing in olive-green, emotional intelligence and mental resilience. Minimal, centered, powerful clarity.`,
    aspectRatio: '1:1',
    category: 'pillar',
  },
  {
    filename: 'pillar-physical.png',
    prompt: `${STYLE}. An athletic male figure in powerful running stride, dynamic motion lines, earth brown and copper tones, vitality and physical performance. Minimal, energetic.`,
    aspectRatio: '1:1',
    category: 'pillar',
  },
  {
    filename: 'pillar-connection.png',
    prompt: `${STYLE}. Two male figures standing shoulder to shoulder on a ridge, brotherhood and leadership, warm charcoal and copper tones, connection and trust. Minimal, powerful.`,
    aspectRatio: '1:1',
    category: 'pillar',
  },
  {
    filename: 'pillar-mission.png',
    prompt: `${STYLE}. A single arrow embedded in the center of a target, precise and deliberate, copper and gold tones, mastery and focus. Minimal, iconic, sharp.`,
    aspectRatio: '1:1',
    category: 'pillar',
  },

  // === TIER 1: Stat Card Illustrations (small, 1:1) ===
  {
    filename: 'stat-goals.png',
    prompt: `${STYLE}. An ascending mountain path with small flag checkpoints along the way, warm copper trail on dark background, progress and goal-setting. Minimal, iconic.`,
    aspectRatio: '1:1',
    category: 'stat',
  },
  {
    filename: 'stat-streak.png',
    prompt: `${STYLE}. A stylized flame or ember glowing with momentum energy, warm copper and amber gradient, consistency and daily habit streaks. Minimal, centered, powerful.`,
    aspectRatio: '1:1',
    category: 'stat',
  },
  {
    filename: 'stat-connections.png',
    prompt: `${STYLE}. A network of interconnected nodes forming a constellation pattern, warm copper lines on dark background, community and social connections. Minimal, geometric.`,
    aspectRatio: '1:1',
    category: 'stat',
  },
  {
    filename: 'stat-progress.png',
    prompt: `${STYLE}. An upward growth curve with a sprouting plant along the line, warm copper and green-olive tones, personal growth and development. Minimal, organic.`,
    aspectRatio: '1:1',
    category: 'stat',
  },
  {
    filename: 'stat-active.png',
    prompt: `${STYLE}. A heartbeat pulse line transitioning into an upward trend, warm copper glow, vitality and active health monitoring. Minimal, clean, medical-wellness.`,
    aspectRatio: '1:1',
    category: 'stat',
  },
  {
    filename: 'stat-completed.png',
    prompt: `${STYLE}. A figure standing on a mountain summit with arms raised in achievement, warm copper and amber sunrise behind, completion and success. Minimal, iconic.`,
    aspectRatio: '1:1',
    category: 'stat',
  },

  // === TIER 2: Empty State Illustrations (larger, 4:3) ===
  {
    filename: 'empty-goals.png',
    prompt: `${STYLE}. A winding trail beginning at the viewer's feet, leading toward distant mountains, first step on a journey, warm copper path on dark landscape. Inviting, hopeful, minimal.`,
    aspectRatio: '4:3',
    category: 'empty',
  },
  {
    filename: 'empty-kpis.png',
    prompt: `${STYLE}. An elegant health dashboard outline with empty circular gauges and bar charts, waiting to be filled with data, copper wireframe on dark background. Clean, technical, inviting.`,
    aspectRatio: '4:3',
    category: 'empty',
  },
  {
    filename: 'empty-protocols.png',
    prompt: `${STYLE}. An open leather-bound journal with a daily routine checklist, pen beside it, warm copper and brown tones, structured discipline and daily practice. Elegant, inviting.`,
    aspectRatio: '4:3',
    category: 'empty',
  },
  {
    filename: 'empty-sessions.png',
    prompt: `${STYLE}. Two premium leather chairs facing each other in a warm, intimate setting, coaching conversation space, copper and brown tones, trust and guidance. Elegant, minimal.`,
    aspectRatio: '4:3',
    category: 'empty',
  },
  {
    filename: 'empty-events.png',
    prompt: `${STYLE}. A circle of chairs arranged for a group gathering, warm copper lighting, brotherhood and community, empty seats waiting to be filled. Inviting, warm, minimal.`,
    aspectRatio: '4:3',
    category: 'empty',
  },
  {
    filename: 'empty-accountability.png',
    prompt: `${STYLE}. Two hands in a firm handshake or fist bump, partnership and mutual accountability, warm copper and earth tones, trust and commitment. Powerful, minimal.`,
    aspectRatio: '4:3',
    category: 'empty',
  },

  // === TIER 3: Background Accents (landscape, used at low opacity) ===
  {
    filename: 'bg-physical.png',
    prompt: `${STYLE}. A male runner in powerful stride through a forest trail at golden hour, warm earth tones, motion blur, vitality and physical performance. Atmospheric, cinematic.`,
    aspectRatio: '16:9',
    category: 'background',
  },
  {
    filename: 'bg-emotional.png',
    prompt: `${STYLE}. A calm lake at dawn with morning mist rising, mountains reflected in still water, olive and copper tones, inner peace and emotional clarity. Serene, atmospheric.`,
    aspectRatio: '16:9',
    category: 'background',
  },
  {
    filename: 'bg-mission.png',
    prompt: `${STYLE}. A dramatic mountain peak at sunrise with golden copper light breaking through clouds, achievement and mission mastery. Epic, atmospheric, warm tones.`,
    aspectRatio: '16:9',
    category: 'background',
  },
  {
    filename: 'bg-vitality.png',
    prompt: `${STYLE}. Abstract energy flow and heartbeat waves in warm copper and amber, health vitality visualization, dark background, bio-energy and life force. Dynamic, elegant.`,
    aspectRatio: '16:9',
    category: 'background',
  },
  {
    filename: 'bg-growth.png',
    prompt: `${STYLE}. A strong tree with visible roots growing deep into earth and branches reaching toward copper-tinted sky, personal growth and development. Organic, powerful, warm.`,
    aspectRatio: '16:9',
    category: 'background',
  },
]

async function generateImage(asset, index) {
  const label = `[${index + 1}/${ASSETS.length}] ${asset.filename}`
  console.log(`${label} — generating...`)

  try {
    const response = await fetch(CMS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CMS_API_KEY}`,
      },
      body: JSON.stringify({
        action: 'imagen',
        prompt: asset.prompt,
        aspectRatio: asset.aspectRatio,
        numberOfImages: 1,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`${label} — API error ${response.status}: ${err}`)
      return false
    }

    const result = await response.json()

    if (!result.success || !result.data?.images?.[0]?.base64) {
      console.error(`${label} — no image in response`)
      return false
    }

    const base64 = result.data.images[0].base64
    const buffer = Buffer.from(base64, 'base64')
    const outputPath = path.join(OUTPUT_DIR, asset.filename)
    fs.writeFileSync(outputPath, buffer)

    const sizeKB = (buffer.length / 1024).toFixed(1)
    console.log(`${label} — saved (${sizeKB} KB)`)
    return true
  } catch (err) {
    console.error(`${label} — failed: ${err.message}`)
    return false
  }
}

async function main() {
  console.log(`\n=== CLAIM'N Wellness Asset Generator ===`)
  console.log(`Engine: Imagen 4 via CMS API`)
  console.log(`Output: ${OUTPUT_DIR}`)
  console.log(`Assets: ${ASSETS.length} images`)
  console.log(`Est. cost: $${(ASSETS.length * 0.03).toFixed(2)}\n`)

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  let succeeded = 0
  let failed = 0

  for (let i = 0; i < ASSETS.length; i++) {
    const ok = await generateImage(ASSETS[i], i)
    if (ok) succeeded++
    else failed++

    // Small delay between requests to avoid rate limiting
    if (i < ASSETS.length - 1) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  console.log(`\n=== Generation Complete ===`)
  console.log(`Succeeded: ${succeeded}`)
  console.log(`Failed: ${failed}`)
  console.log(`Est. cost: $${(succeeded * 0.03).toFixed(2)}`)
  console.log(`Output: ${OUTPUT_DIR}\n`)
}

main().catch(console.error)
