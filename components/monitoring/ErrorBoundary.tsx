'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

export interface ErrorBoundaryFallbackProps {
  error: Error | null
  resetError: () => void
  level: 'page' | 'component' | 'critical'
  errorId: string | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substring(2, 15)
    }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level = 'component' } = this.props
    
    // Report to Sentry with enhanced context
    Sentry.withScope((scope) => {
      scope.setTag('error_boundary_level', level)
      scope.setTag('component_stack', errorInfo.componentStack)
      scope.setContext('error_boundary', {
        level,
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      })
      
      Sentry.captureException(error)
    })

    // Call custom error handler if provided
    onError?.(error, errorInfo)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Component stack:', errorInfo.componentStack)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    })
  }

  override render() {
    if (this.state.hasError) {
      const { fallback: Fallback, level = 'component' } = this.props
      
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            resetError={this.resetError}
            level={level}
            errorId={this.state.errorId}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          level={level}
          errorId={this.state.errorId}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError, level, errorId }: ErrorBoundaryFallbackProps) {
  const isPageLevel = level === 'page'
  const isCritical = level === 'critical'

  if (level === 'component') {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">
            Error en componente
          </span>
        </div>
        <p className="text-sm text-red-700 mb-3">
          Este componente no pudo cargarse correctamente.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={resetError}
          className="text-red-800 border-red-300 hover:bg-red-100"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 ${isCritical ? 'bg-red-50' : ''}`}>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isCritical ? 'bg-red-100' : 'bg-orange-100'
          }`}>
            <AlertTriangle className={`w-8 h-8 ${isCritical ? 'text-red-600' : 'text-orange-600'}`} />
          </div>
          <CardTitle className="text-xl">
            {isCritical ? '¡Error Crítico!' : '¡Oops! Algo salió mal'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {isCritical 
              ? 'Ha ocurrido un error crítico. Por favor, contacta a soporte técnico.'
              : isPageLevel
                ? 'Esta página no pudo cargarse. Nuestro equipo ha sido notificado.'
                : 'Hubo un problema al cargar este contenido.'
            }
          </p>

          <div className="space-y-3">
            <Button 
              onClick={resetError}
              className="w-full"
              variant={isCritical ? "destructive" : "default"}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>

            {isPageLevel && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/client/home'}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Si el problema persiste, contacta a{' '}
              <a 
                href="/support" 
                className="text-primary hover:underline"
              >
                soporte técnico
              </a>
            </p>
            
            {errorId && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Error ID: {errorId}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specialized error boundaries for different parts of the app
export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">
    {children}
  </ErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
)

export const CriticalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="critical">
    {children}
  </ErrorBoundary>
)