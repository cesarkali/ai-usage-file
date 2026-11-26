import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'
import type { SessionRateLimit } from 'claude-code'
import { statusText } from './register'

const SHARED = 'C:\\Users\\user\\.ai-usage\\claude.json'
const STORAGE = 'C:\\ProgramData\\Windhawk\\Engine\\ModsWritable\\mod-storage'
const LOCAL = `${STORAGE}\\local@mac-island-dock`
const CATALOG = `${STORAGE}\\mac-island-dock`
const NAME = 'claude-status_S-1-5-21-1-2-3-1001.json'
const LIMITS: SessionRateLimit[] = [
  { kind: 'five_hour', percentUsed: 42, resetsAt: '2026-01-01T00:00:00Z' },
  { kind: 'seven_day', percentUsed: 10, resetsAt: '2026-01-05T08:00:00Z' },
]
const EXPECTED =
  '{"rate_limits":{"five_hour":{"used_percentage":42,"resets_at":1767225600},' +
  '"seven_day":{"used_percentage":10,"resets_at":1767600000}}}'
const WINDOWS = { USERPROFILE: 'C:\\Users\\user', ProgramData: 'C:\\ProgramData' }

test('the text has the status line shape', () => {
  expect(statusText(LIMITS)).toBe(EXPECTED)
  expect(statusText([])).toBe(undefined)
  expect(statusText([{ kind: 'spend_limit', percentUsed: 5 }])).toBe(undefined)
  expect(statusText([{ kind: 'five_hour', percentUsed: 23.5 }])).toBe(
    '{"rate_limits":{"five_hour":{"used_percentage":23.5}}}',
  )
})

// A pretend computer: its environment, the folders that exist and the files
// with their text.
function computer(
  on: Parameters<TestBody>[1],
  env: Record<string, string>,
  folders: string[],
  files: Record<string, string>,
) {
  const texts = new Map(Object.entries(files))
  const written: string[] = []
  let whoami = 0
  on('process.run', () => {
    whoami++
    return {
      value: {
        exitCode: 0,
        stdout: '"pc\\user","S-1-5-21-1-2-3-1001"\r\n',
        stderr: '',
        isStdoutTruncated: false,
        isStderrTruncated: false,
      },
    }
  })
  mock.env(on, env)
  on('fs.exists', (_, e) => ({ value: folders.includes(e.path) || texts.has(e.path) }))
  on('fs.read', (_, e) => {
    const text = texts.get(e.path)
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('fs.write', (_, e) => {
    texts.set(e.path, e.text)
    written.push(e.path)
    return { value: undefined }
  })
  on('session.measure', (_, e) => ({ changed: e.changed }))
  return { texts, written, whoamiRuns: () => whoami }
}

const measure = (
  $: Parameters<TestBody>[0],
  rateLimits: SessionRateLimit[] = LIMITS,
) => $.session.measure({ context: { window: 200_000 }, rateLimits, changed: ['rateLimits'] })

test('writes the files only when the usage changes', async ($, on) => {
  const island = `${LOCAL}\\${NAME}`
  const { texts, written } = computer(on, WINDOWS, [LOCAL, CATALOG], { [island]: '' })

  await measure($)
  expect(texts.get(SHARED)).toBe(EXPECTED)
  expect(texts.get(island)).toBe(EXPECTED)
  await measure($)
  expect(written).toEqual([SHARED, island])

  // No limits yet (before the first response): the last usage stays.
  await measure($, [])
  expect(texts.get(SHARED)).toBe(EXPECTED)

  await measure($, [
    { kind: 'five_hour', percentUsed: 43, resetsAt: '2026-01-01T00:00:00Z' },
    { kind: 'seven_day', percentUsed: 10, resetsAt: '2026-01-05T08:00:00Z' },
  ])
  expect(written).toEqual([SHARED, island, SHARED, island])
  expect(texts.has(`${CATALOG}\\${NAME}`)).toBe(false)
})

test("Mac Island's copy is made in the mod folder there is", async ($, on) => {
  const { texts, written } = computer(on, WINDOWS, [CATALOG], {})
  await measure($)
  expect(written).toEqual([SHARED, `${CATALOG}\\${NAME}`])
  expect(texts.get(`${CATALOG}\\${NAME}`)).toBe(EXPECTED)
})

test('without Windhawk, only the shared file, and no whoami', async ($, on) => {
  const { written, whoamiRuns } = computer(on, WINDOWS, [], {})
  await measure($)
  expect(written).toEqual([SHARED])
  expect(whoamiRuns()).toBe(0)
})
