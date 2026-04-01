import { spawnSync } from 'child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'

const cwd = process.cwd()
const args = new Set(process.argv.slice(2))
const requireBun = args.has('--require-bun')
const staticOnly = args.has('--static-only') || args.has('--skip-runtime')

const packageJsonPath = path.join(cwd, 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

const failures = []
const warnings = []
const notes = []

function info(message) {
  console.log(`[smoke-check] ${message}`)
}

function recordFailure(message) {
  failures.push(message)
  console.error(`[smoke-check] FAIL: ${message}`)
}

function recordWarning(message) {
  warnings.push(message)
  console.warn(`[smoke-check] WARN: ${message}`)
}

function recordPass(message) {
  info(`PASS: ${message}`)
}

function check(condition, message) {
  if (condition) {
    recordPass(message)
    return
  }
  recordFailure(message)
}

function checkFileExists(relativePath, message) {
  check(existsSync(path.join(cwd, relativePath)), message)
}

function scanFiles(dir, out) {
  const fullDir = path.join(cwd, dir)
  if (!existsSync(fullDir)) return

  for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
    const relativePath = path.join(dir, entry.name)
    const absolutePath = path.join(cwd, relativePath)

    if (entry.isDirectory()) {
      scanFiles(relativePath, out)
      continue
    }

    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/u.test(entry.name)) {
      out.push(absolutePath)
    }
  }
}

function hasResolvableTarget(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    `${basePath}.json`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx'),
    path.join(basePath, 'index.mjs'),
    path.join(basePath, 'index.cjs'),
  ]

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue
    const stats = statSync(candidate)
    if (stats.isFile()) return true
  }

  const withoutJs = basePath.replace(/\.js$/u, '')
  if (withoutJs !== basePath) {
    return hasResolvableTarget(withoutJs)
  }

  return false
}

function collectMissingRelativeImports() {
  const files = []
  scanFiles('src', files)
  scanFiles('vendor', files)
  scanFiles('shims', files)

  const pattern =
    /(?:import|export)\s+[\s\S]*?from\s+['"](\.\.?\/[^'"]+)['"]|require\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g

  const missing = []
  const seen = new Set()

  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(pattern)) {
      const specifier = match[1] ?? match[2]
      if (!specifier) continue
      const target = path.resolve(path.dirname(file), specifier)
      if (hasResolvableTarget(target)) continue

      const key = `${file} -> ${specifier}`
      if (seen.has(key)) continue
      seen.add(key)
      missing.push({
        file: path.relative(cwd, file),
        specifier,
      })
    }
  }

  return missing.sort((a, b) =>
    `${a.file}:${a.specifier}`.localeCompare(`${b.file}:${b.specifier}`),
  )
}

function runCommand(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    timeout: 120000,
  })
}

function isBunAvailable() {
  const result = runCommand('bun', ['--version'])
  return result.status === 0
}

function runRuntimeChecks() {
  const versionResult = runCommand('bun', ['run', 'version'])
  if (versionResult.status !== 0) {
    recordFailure(
      `bun run version failed with status ${String(versionResult.status)}: ${(
        versionResult.stderr || versionResult.stdout || ''
      ).trim()}`,
    )
  } else {
    const output = `${versionResult.stdout}${versionResult.stderr}`.trim()
    check(
      output.includes(packageJson.version),
      `bun run version prints package version ${packageJson.version}`,
    )
  }

  const helpResult = runCommand('bun', ['run', 'dev', '--help'])
  if (helpResult.status !== 0) {
    recordFailure(
      `bun run dev --help failed with status ${String(helpResult.status)}: ${(
        helpResult.stderr || helpResult.stdout || ''
      ).trim()}`,
    )
    return
  }

  const output = `${helpResult.stdout}${helpResult.stderr}`.trim()
  check(output.length > 0, 'bun run dev --help prints output')

  const looksLikeHelp = ['Usage', 'usage', 'Commands', 'Options'].some(token =>
    output.includes(token),
  )
  check(looksLikeHelp, 'bun run dev --help output looks like CLI help text')
}

info('Running static checks')

checkFileExists('README.md', 'README.md exists')
checkFileExists('LICENSE.md', 'LICENSE.md exists')
checkFileExists('RESTORATION_GAPS.md', 'RESTORATION_GAPS.md exists')
checkFileExists('NATIVE_DEPENDENCIES.md', 'NATIVE_DEPENDENCIES.md exists')
checkFileExists('src/bootstrap-entry.ts', 'src/bootstrap-entry.ts exists')
checkFileExists('src/entrypoints/cli.tsx', 'src/entrypoints/cli.tsx exists')
checkFileExists('src/main.tsx', 'src/main.tsx exists')
checkFileExists('image-processor.node', 'image-processor.node exists in repository root')

check(
  packageJson.scripts?.dev === 'bun run ./src/bootstrap-entry.ts',
  'package.json dev script points at src/bootstrap-entry.ts',
)
check(
  packageJson.scripts?.version === 'bun run ./src/bootstrap-entry.ts --version',
  'package.json version script points at src/bootstrap-entry.ts --version',
)
check(
  typeof packageJson.scripts?.['smoke-check'] === 'string',
  'package.json exposes smoke-check script',
)

const missingImports = collectMissingRelativeImports()
if (missingImports.length > 0) {
  recordFailure(
    `missing relative imports detected: ${missingImports
      .slice(0, 10)
      .map(item => `${item.file} -> ${item.specifier}`)
      .join(', ')}`,
  )
} else {
  recordPass('no missing relative imports under src/, vendor/, or shims/')
}

const optionalNativeBinaries = [
  'audio-capture.node',
  path.join('vendor', 'audio-capture'),
  path.join('vendor', 'modifiers-napi'),
  path.join('vendor', 'url-handler'),
]

for (const relativePath of optionalNativeBinaries) {
  if (existsSync(path.join(cwd, relativePath))) {
    notes.push(`optional native dependency present: ${relativePath}`)
  } else {
    notes.push(`known optional native dependency absent in snapshot: ${relativePath}`)
  }
}

if (!staticOnly) {
  if (isBunAvailable()) {
    info('Running runtime checks with bun')
    runRuntimeChecks()
  } else if (requireBun) {
    recordFailure('bun is required for this smoke check run but is not installed')
  } else {
    recordWarning('bun not found, skipping runtime checks')
  }
} else {
  info('Skipping runtime checks because --static-only was provided')
}

for (const note of notes) {
  info(`NOTE: ${note}`)
}

info(
  `Summary: ${String(failures.length)} failure(s), ${String(warnings.length)} warning(s), ${String(notes.length)} note(s)`,
)

if (failures.length > 0) {
  process.exit(1)
}
