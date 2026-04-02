/**
 * Lightweight localStorage-backed store with React hook for persistence.
 * Keeps proxy users and whitelisted IPs across page navigations.
 */

import { useSyncExternalStore, useCallback } from 'react'
import {
  proxyUsers as seedUsers,
  whitelistedIps as seedWhitelistedIps,
  billingRecords as seedBillingRecords,
  defaultSettings as seedAccountSettings,
  walletData as seedWalletData,
} from '../data/mockData'

const KEYS = {
  proxyUsers: 'novada_proxy_users',
  whitelistedIps: 'novada_whitelisted_ips',
  billingRecords: 'novada_billing_records',
  accountSettings: 'novada_account_settings',
  walletData: 'novada_wallet_data',
}

const SEEDS = {
  proxyUsers: seedUsers,
  whitelistedIps: seedWhitelistedIps,
  billingRecords: seedBillingRecords,
  accountSettings: seedAccountSettings,
  walletData: seedWalletData,
}

// In-memory cache so every subscriber sees the same reference.
const cache = {}
const listeners = {}

function getListeners(key) {
  if (!listeners[key]) listeners[key] = new Set()
  return listeners[key]
}

function notify(key) {
  getListeners(key).forEach((fn) => fn())
}

function load(key) {
  if (cache[key]) return cache[key]
  try {
    const raw = localStorage.getItem(KEYS[key])
    if (raw) {
      cache[key] = JSON.parse(raw)
      return cache[key]
    }
  } catch { /* ignore */ }
  cache[key] = SEEDS[key]
  return cache[key]
}

function save(key, data) {
  cache[key] = data
  localStorage.setItem(KEYS[key], JSON.stringify(data))
  notify(key)
}

/**
 * React hook – returns [items, setItems] backed by localStorage.
 * @param {'proxyUsers' | 'whitelistedIps' | 'billingRecords' | 'accountSettings' | 'walletData'} key
 */
export function usePersistentList(key) {
  const subscribe = useCallback(
    (cb) => {
      const set = getListeners(key)
      set.add(cb)
      return () => set.delete(cb)
    },
    [key],
  )

  const getSnapshot = useCallback(() => load(key), [key])

  const items = useSyncExternalStore(subscribe, getSnapshot)

  const setItems = useCallback(
    (updater) => {
      const current = load(key)
      const next = typeof updater === 'function' ? updater(current) : updater
      save(key, next)
    },
    [key],
  )

  return [items, setItems]
}

/**
 * Direct (non-hook) read for use outside React components.
 */
export function readList(key) {
  return load(key)
}
