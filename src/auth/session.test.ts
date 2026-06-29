/**
 * Unit tests for session.ts (T1: Session store).
 *
 * Covers TC-004, TC-005, TC-006 from spec.md.
 * jsdom provides localStorage; vitest globals are enabled (no imports needed).
 */
import { readSession, writeSession, clearSession } from './session';
import { DEMO_USER, SESSION_KEY } from './constants';

describe('readSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(readSession()).toBeNull();
  });

  it('returns null for non-JSON garbage (TC-006: corrupt session)', () => {
    localStorage.setItem(SESSION_KEY, 'not-json{{{{');
    expect(readSession()).toBeNull();
  });

  it('returns null for valid JSON but wrong shape (missing user.id)', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ version: 1, createdAt: Date.now() }));
    expect(readSession()).toBeNull();
  });

  it('returns null when version does not match (version mismatch)', () => {
    const badVersion = { user: DEMO_USER, createdAt: Date.now(), version: 99 };
    localStorage.setItem(SESSION_KEY, JSON.stringify(badVersion));
    expect(readSession()).toBeNull();
  });

  it('returns a Session for a valid stored entry (TC-004: session restore)', () => {
    const session = writeSession(DEMO_USER);
    const restored = readSession();
    expect(restored).not.toBeNull();
    expect(restored!.user.id).toBe(DEMO_USER.id);
    expect(restored!.user.name).toBe(DEMO_USER.name);
    expect(restored!.version).toBe(1);
    expect(typeof restored!.createdAt).toBe('number');
    // Round-trip: readSession after writeSession returns same shape
    expect(restored).toEqual(session);
  });

  it('never throws even when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('storage unavailable');
    });
    expect(() => readSession()).not.toThrow();
    expect(readSession()).toBeNull();
  });
});

describe('writeSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists a valid session to SESSION_KEY', () => {
    writeSession(DEMO_USER);
    const raw = localStorage.getItem(SESSION_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.user.id).toBe(DEMO_USER.id);
    expect(parsed.version).toBe(1);
  });

  it('returns the Session that was written', () => {
    const session = writeSession(DEMO_USER);
    expect(session.user).toEqual(DEMO_USER);
    expect(session.version).toBe(1);
    expect(typeof session.createdAt).toBe('number');
  });
});

describe('clearSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes SESSION_KEY from localStorage', () => {
    writeSession(DEMO_USER);
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
    clearSession();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('TC-005: leaves other keys untouched (board data survives logout)', () => {
    const BOARD_KEY = 'kanban-demo:board';
    const boardData = JSON.stringify({ columns: [] });
    localStorage.setItem(BOARD_KEY, boardData);
    writeSession(DEMO_USER);

    clearSession();

    // Session is gone
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    // Board data is byte-for-byte unchanged
    expect(localStorage.getItem(BOARD_KEY)).toBe(boardData);
  });

  it('does not throw when SESSION_KEY is already absent', () => {
    expect(() => clearSession()).not.toThrow();
  });
});
