import { useEffect } from 'react'

/**
 * Publishes the on-screen keyboard height as `--kb` on <html>.
 * On mobile the layout viewport doesn't shrink when the keyboard opens, so a
 * bottom-anchored composer ends up underneath it. Anything that must stay visible
 * adds `var(--kb, 0px)` to its bottom offset.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const apply = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      document.documentElement.style.setProperty('--kb', `${Math.round(inset)}px`)
    }
    apply()
    vv.addEventListener('resize', apply)
    vv.addEventListener('scroll', apply)
    return () => {
      vv.removeEventListener('resize', apply)
      vv.removeEventListener('scroll', apply)
      document.documentElement.style.removeProperty('--kb')
    }
  }, [])
}
