import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'  // Font CSS - Vite processes at build time
import './index.css'
import App from './App.tsx'

// =====================================================
// FONT DEBUG LOGGING - EXTENSIVE
// =====================================================
console.log('='.repeat(60))
console.log('🔤 FONT DEBUG: Starting font diagnostics...')
console.log('='.repeat(60))

// 1. Check if fonts.css was loaded by looking for the CSS variable
const rootStyles = getComputedStyle(document.documentElement)
const neutrafaceVar = rootStyles.getPropertyValue('--font-neutraface').trim()
const playfairVar = rootStyles.getPropertyValue('--font-playfair').trim()
const latoVar = rootStyles.getPropertyValue('--font-lato').trim()

console.log('📋 CSS Variables:')
console.log('  --font-neutraface:', neutrafaceVar || '❌ NOT SET')
console.log('  --font-playfair:', playfairVar || '❌ NOT SET')
console.log('  --font-lato:', latoVar || '❌ NOT SET')

// 2. Check all stylesheets for @font-face rules
console.log('\n📄 Checking stylesheets for @font-face rules:')
try {
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i]
    console.log(`  Sheet ${i}: ${sheet.href || 'inline'}`)
    try {
      const rules = sheet.cssRules || sheet.rules
      if (rules) {
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j]
          if (rule instanceof CSSFontFaceRule) {
            const fontFamily = rule.style.getPropertyValue('font-family')
            const src = rule.style.getPropertyValue('src')
            console.log(`    ✅ @font-face found: ${fontFamily}`)
            console.log(`       src: ${src}`)
          }
        }
      }
    } catch (e) {
      console.log(`    ⚠️ Cannot access rules (CORS): ${(e as Error).message}`)
    }
  }
} catch (e) {
  console.log('  ❌ Error checking stylesheets:', e)
}

// 3. Check document.fonts API
console.log('\n🔍 document.fonts API:')
console.log('  Status:', document.fonts.status)
console.log('  Ready state: Promise available')

// 4. List all fonts in document.fonts
console.log('\n📝 Fonts registered in document.fonts:')
let fontCount = 0
document.fonts.forEach((font) => {
  fontCount++
  console.log(`  ${fontCount}. ${font.family} (${font.weight}, ${font.style}) - Status: ${font.status}`)
})
if (fontCount === 0) {
  console.log('  ⚠️ No fonts registered yet')
}

// 5. Try to check specific fonts
console.log('\n🎯 Checking specific fonts:')
const fontsToCheck = [
  'Neutraface 2 Display',
  '"Neutraface 2 Display"',
  'Playfair Display',
  'Lato',
  'Montserrat',
]

fontsToCheck.forEach((fontName) => {
  const isAvailable = document.fonts.check(`16px ${fontName}`)
  console.log(`  ${fontName}: ${isAvailable ? '✅ Available' : '❌ Not available'}`)
})

// 6. Try to fetch the font file directly
console.log('\n🌐 Testing font file accessibility:')
fetch('/fonts/Neutraface_2.ttf', { method: 'HEAD' })
  .then((response) => {
    console.log(`  /fonts/Neutraface_2.ttf: ${response.ok ? '✅' : '❌'} Status ${response.status}`)
    console.log(`  Content-Type: ${response.headers.get('content-type')}`)
    console.log(`  Content-Length: ${response.headers.get('content-length')} bytes`)
  })
  .catch((error) => {
    console.log(`  ❌ Fetch error: ${error.message}`)
  })

// 7. Monitor font loading
console.log('\n⏳ Waiting for document.fonts.ready...')
document.fonts.ready.then(() => {
  console.log('\n' + '='.repeat(60))
  console.log('✅ document.fonts.ready resolved!')
  console.log('='.repeat(60))

  console.log('\n📝 All loaded fonts:')
  let loadedCount = 0
  document.fonts.forEach((font) => {
    loadedCount++
    console.log(`  ${loadedCount}. ${font.family} (${font.weight}) - ${font.status}`)
  })

  console.log('\n🎯 Final font availability check:')
  fontsToCheck.forEach((fontName) => {
    const isAvailable = document.fonts.check(`16px ${fontName}`)
    console.log(`  ${fontName}: ${isAvailable ? '✅ LOADED' : '❌ NOT LOADED'}`)
  })

  // Check computed style on a test element
  const testEl = document.createElement('div')
  testEl.className = 'font-display'
  testEl.style.visibility = 'hidden'
  testEl.textContent = 'Test'
  document.body.appendChild(testEl)
  const computedFont = getComputedStyle(testEl).fontFamily
  console.log('\n🔬 Computed font-family for .font-display:', computedFont)
  document.body.removeChild(testEl)
})

// 8. Listen for font loading events
document.fonts.addEventListener('loading', () => {
  console.log('📥 Font loading started...')
})

document.fonts.addEventListener('loadingdone', (event) => {
  console.log('📦 Font loading done!', (event as FontFaceSetLoadEvent).fontfaces?.length || 0, 'fonts')
})

document.fonts.addEventListener('loadingerror', (event) => {
  console.log('❌ Font loading error!', event)
})

console.log('\n' + '='.repeat(60))
console.log('🚀 Rendering React app...')
console.log('='.repeat(60))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
