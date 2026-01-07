'use client'

import { useEffect, useState, useCallback } from 'react'
import { ConnectionError } from '@/lib/types/config'
import { ConnectionErrorOverlay } from '@/components/errors/ConnectionErrorOverlay'
import { getConfig, resetConfig } from '@/lib/config'

interface ConnectionGuardProps {
  children: React.ReactNode
}

export function ConnectionGuard({ children }: ConnectionGuardProps) {
  const [error, setError] = useState<ConnectionError | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  const checkConnection = useCallback(async () => {
    setIsChecking(true)
    setError(null)

    // Reset config cache to force a fresh fetch
    resetConfig()

    try {
      const config = await getConfig()

      // Check if database is offline
      if (config.dbStatus === 'offline') {
        setError({
          type: 'database-offline',
          details: {
            message: 'API 服务器正在运行，但数据库无法访问',
            attemptedUrl: config.apiUrl,
          },
        })
        setIsChecking(false)
        return
      }

      // If we got here, connection is good
      setError(null)
      setIsChecking(false)
    } catch (err) {
      // API is unreachable
      const errorMessage =
        err instanceof Error ? err.message : '发生未知错误'
      const attemptedUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/api/config`
          : undefined

      setError({
        type: 'api-unreachable',
        details: {
          message: '无法连接到 Open Notebook API 服务器',
          technicalMessage: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
          attemptedUrl,
        },
      })
      setIsChecking(false)
    }
  }, [])

  // Check connection on mount
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Add keyboard shortcut for retry (R key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (error && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        checkConnection()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [error, checkConnection])

  // Show overlay if there's an error
  if (error) {
    return <ConnectionErrorOverlay error={error} onRetry={checkConnection} />
  }

  // Show nothing while checking (prevents flash of content)
  if (isChecking) {
    return null
  }

  // Render children if connection is good
  return <>{children}</>
}
