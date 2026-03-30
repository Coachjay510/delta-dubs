import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTrial(orgId) {
  const [org,     setOrg]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) { setLoading(false); return }
    supabase
      .from('orgs')
      .select('id, status, tier, trial_started_at')
      .eq('id', orgId)
      .single()
      .then(({ data }) => {
        setOrg(data)
        setLoading(false)
      })
  }, [orgId])

  // ── Compute trial state ──
  const now = Date.now()

  const trialStart = org?.trial_started_at ? new Date(org.trial_started_at).getTime() : null
  const trialEnd   = trialStart ? trialStart + 14 * 24 * 60 * 60 * 1000 : null
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000))) : 0
  const isTrialActive = trialDaysLeft > 0
  const isTrialExpired = trialStart && !isTrialActive

  const isPaid    = org?.status === 'active'
  const isSuspended = org?.status === 'suspended'

  // Can access the app if: paid subscription OR trial still active
  const canAccess = isPaid || isTrialActive

  // Show trial banner if in trial (even if paid — hide when 0 days left)
  const showBanner = isTrialActive && !isPaid

  return {
    org, loading,
    trialDaysLeft, isTrialActive, isTrialExpired,
    isPaid, isSuspended, canAccess, showBanner,
    tier: org?.tier || 'Starter',
  }
}
