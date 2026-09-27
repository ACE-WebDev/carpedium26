/*
 * Navbar links into the home page ("home", "about", "sponsors", "contact")
 * land on their section as it is once the animations before it have played
 * — no opening fly-through, no ball falls, no blackouts on the way.
 *
 * The navbar asks with requestJump(). A home page already on screen hears
 * it straight away (onJump); otherwise it is kept until the home page mounts
 * after the navigation, which reads it with peekPendingJump() — the opening
 * too, to skip itself — and clears it with takePendingJump(). It lives in
 * this module rather than the URL so that only in-app navigation skips the
 * opening: a fresh visit or a reload still plays it.
 */

let pending = null;
const listeners = new Set();

export function requestJump(target) {
  if (listeners.size) listeners.forEach((listener) => listener(target));
  else pending = target;
}

export function peekPendingJump() {
  return pending;
}

export function takePendingJump() {
  const target = pending;
  pending = null;
  return target;
}

export function onJump(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
