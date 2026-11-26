// Saves your Claude plan usage (the 5-hour and the weekly window) to a small
// JSON file that mods, widgets and status bars can read, in the shape Claude
// Code gives its status line:
//   {"rate_limits":{"five_hour":{"used_percentage":42,"resets_at":1767225600},"seven_day":{...}}}
// The file is ~/.ai-usage/claude.json (on Windows %USERPROFILE%\.ai-usage\claude.json).
// The engine reports the usage after each response (session.measure), and a
// file is written again only when its text changes. Nothing goes online.
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

const USAGE_FOLDER = '.ai-usage'
const USAGE_FILE = 'claude.json'

// Readers that keep a copy of their own, written too when they're installed:
// Mac Island & Dock (a Windhawk mod) reads claude-status_<account SID>.json in
// its storage, compiled on this computer (local@) or from Windhawk's catalog.
const WINDHAWK_STORAGE = 'Windhawk\\Engine\\ModsWritable\\mod-storage'
const MAC_ISLAND_FOLDERS = ['local@mac-island-dock', 'mac-island-dock'] as const

type Window = { used_percentage: number; resets_at?: number }
type Status = { rate_limits: { five_hour?: Window; seven_day?: Window } }

// One window: used from 0 to 100, and when it resets in Unix seconds (the
// engine gives an ISO 8601 date).
export function usageWindow(limit: SessionRateLimit | undefined): Window | undefined {
  if (limit === undefined || !Number.isFinite(limit.percentUsed)) return undefined
  const window: Window = { used_percentage: Math.min(100, Math.max(0, limit.percentUsed)) }
  const resetsAt = limit.resetsAt === undefined ? NaN : Date.parse(limit.resetsAt)
  if (Number.isFinite(resetsAt)) window.resets_at = Math.floor(resetsAt / 1000)
  return window
}

// The files' text, or undefined while the engine has neither window (off a
// subscription, or before a chat's first response): the files then stay as
// they are, keeping the last usage.
export function statusText(limits: readonly SessionRateLimit[]): string | undefined {
  const fiveHour = usageWindow(limits.find(l => l.kind === 'five_hour'))
  const sevenDay = usageWindow(limits.find(l => l.kind === 'seven_day'))
  if (fiveHour === undefined && sevenDay === undefined) return undefined
  const status: Status = { rate_limits: {} }
  if (fiveHour !== undefined) status.rate_limits.five_hour = fiveHour
  if (sevenDay !== undefined) status.rate_limits.seven_day = sevenDay
  return JSON.stringify(status)
}

// ~/.ai-usage/claude.json, or undefined without a home folder.
async function usageFile($: EngineInterface): Promise<string | undefined> {
  const home = (await $.env.get('USERPROFILE')) || (await $.env.get('HOME'))
  if (!home) return undefined
  const sep = home.includes('\\') ? '\\' : '/'
  return [home.replace(/[\\/]+$/, ''), USAGE_FOLDER, USAGE_FILE].join(sep)
}

// The SID of the account running Claude Code, read once per session.
let sid: string | undefined

async function accountSid($: EngineInterface): Promise<string | undefined> {
  if (sid !== undefined) return sid
  const { exitCode, stdout } = await $.process.run(['whoami', '/user', '/fo', 'csv', '/nh'], {
    timeoutMs: 10_000,
  })
  sid = exitCode === 0 ? /S-1-[0-9-]+/.exec(stdout)?.[0] : undefined
  return sid
}

// Mac Island & Dock's copies (Windows only): each of its folders where it
// already made the file, else the first of its folders there is; none when the
// mod isn't installed.
async function macIslandFiles($: EngineInterface): Promise<string[]> {
  const programData = await $.env.get('ProgramData')
  if (programData === undefined || programData === '') return []
  const folders: string[] = []
  for (const folder of MAC_ISLAND_FOLDERS) {
    const path = `${programData}\\${WINDHAWK_STORAGE}\\${folder}`
    if (await $.fs.exists(path)) folders.push(path)
  }
  if (folders.length === 0) return []
  const account = await accountSid($)
  if (account === undefined) return []
  const name = `claude-status_${account}.json`
  const existing: string[] = []
  for (const folder of folders) {
    if (await $.fs.exists(`${folder}\\${name}`)) existing.push(`${folder}\\${name}`)
  }
  return existing.length > 0 ? existing : [`${folders[0]}\\${name}`]
}

// Written over the file in place (never replaced, so a file keeps the
// permissions its reader gave it), and only when the text changed.
async function writeIfChanged($: EngineInterface, file: string, text: string): Promise<void> {
  const current = await $.fs.read(file).catch(() => undefined)
  if (current !== text) await $.fs.write(file, text)
}

async function writeAll($: EngineInterface, text: string): Promise<void> {
  const shared = await usageFile($).catch(() => undefined)
  const copies = await macIslandFiles($).catch(() => [])
  for (const file of shared === undefined ? copies : [shared, ...copies]) {
    try {
      await writeIfChanged($, file, text)
    } catch (error) {
      $.ui.log(`could not write ${file}: ${String(error)}`, { to: 'debug' })
    }
  }
}

export const register: Register = on => {
  on('session.measure', async ($, e, next) => {
    const measured = await next(e)
    const text = statusText(e.rateLimits)
    if (text !== undefined) await writeAll($, text)
    return measured
  })
}
