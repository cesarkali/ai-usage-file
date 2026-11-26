// A computer without USERPROFILE (macOS, Linux). The engine makes a path
// absolute on the computer running the test, so on Windows '/Users/user'
// arrives as 'C:\Users\user': it is compared without the drive.
import { expect, mock, test } from 'claude-code/testing'

const FILE = '/Users/user/.ai-usage/claude.json'
const unix = (path: string) => path.replace(/^[A-Za-z]:/, '').replaceAll('\\', '/')

test('on macOS and Linux, the file is under HOME', async ($, on) => {
  const texts = new Map<string, string>()
  mock.env(on, { HOME: '/Users/user' })
  on('fs.exists', (_, e) => ({ value: texts.has(e.path) }))
  on('fs.read', (_, e) => {
    const text = texts.get(e.path)
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('fs.write', (_, e) => {
    texts.set(e.path, e.text)
    return { value: undefined }
  })
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.measure({
    context: { window: 200_000 },
    rateLimits: [{ kind: 'seven_day', percentUsed: 7, resetsAt: '2026-01-05T08:00:00Z' }],
    changed: ['rateLimits'],
  })
  expect([...texts.keys()].map(unix)).toEqual([FILE])
  expect([...texts.values()]).toEqual([
    '{"rate_limits":{"seven_day":{"used_percentage":7,"resets_at":1767600000}}}',
  ])
})
