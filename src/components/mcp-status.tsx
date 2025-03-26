'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getInitializationStatus, getAvailableTools } from '@/services/mcp-client-browser'
import { AlertTriangle, CheckCircle, XCircle, RefreshCcw, Terminal, ChevronUp, ChevronDown } from 'lucide-react'

type DiagnosisResult = {
  timestamp: string;
  environment: string;
  apiKey: {
    exists: boolean;
    valid: boolean;
    error: string | null;
    models?: string[];
  };
  serverFile: {
    exists: boolean;
    executable: boolean;
    path: string | null;
    error: string | null;
    hasConnectWallet?: boolean;
  };
  mcpClient: {
    initialized: boolean;
    error: string | null;
    toolsAvailable?: boolean;
    tools?: Array<{name: string; description: string}>;
  };
}

export function McpStatus() {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Run diagnosis
  const runDiagnosis = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/mcp-diagnosis')
      const data = await response.json()
      setDiagnosis(data)
    } catch (error) {
      console.error('Diagnosis failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Rebuild MCP server
  const rebuildServer = async () => {
    try {
      setRebuilding(true)
      const response = await fetch('/api/mcp-rebuild', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        await runDiagnosis() // Run diagnosis again
      } else {
        console.error('Rebuild failed:', data.error)
      }
    } catch (error) {
      console.error('Error during rebuild process:', error)
    } finally {
      setRebuilding(false)
    }
  }
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(prev => !prev)
  }
  
  // Start or stop polling based on expanded state
  useEffect(() => {
    if (expanded) {
      runDiagnosis()
      intervalRef.current = setInterval(runDiagnosis, 30000) // Poll every 30 seconds when expanded
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [expanded])

  // Run diagnosis on initialization
  useEffect(() => {
    runDiagnosis() // Initial check regardless of expanded state
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Determine overall status based on diagnosis results
  const isHealthy = diagnosis && 
    diagnosis.apiKey.valid && 
    diagnosis.serverFile.exists && 
    diagnosis.serverFile.executable && 
    diagnosis.mcpClient.initialized

  return (
    <Card className="w-full max-w-xs shadow-lg">
      <CardHeader className={`pb-2 cursor-pointer ${expanded ? '' : 'pb-4'}`} onClick={toggleExpanded}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            {isHealthy ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            MCP Diagnosis
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {diagnosis && (
          <CardDescription>
            {expanded ? (
              `Diagnosis time: ${new Date(diagnosis.timestamp).toLocaleTimeString()}`
            ) : (
              isHealthy ? "All systems operational" : "Attention required"
            )}
          </CardDescription>
        )}
      </CardHeader>

      {expanded && diagnosis && (
        <>
          <CardContent className="space-y-4 pt-0">
            {/* API Key Status */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                {diagnosis.apiKey.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                API Key Status
              </h3>
              <div className="text-xs text-muted-foreground">
                {diagnosis.apiKey.exists ? (
                  diagnosis.apiKey.valid ? (
                    <p>API key is valid, available models: {diagnosis.apiKey.models?.join(', ')}</p>
                  ) : (
                    <p className="text-red-500">Invalid API key: {diagnosis.apiKey.error}</p>
                  )
                ) : (
                  <p className="text-red-500">API key not set, please set ANTHROPIC_API_KEY in .env.local</p>
                )}
              </div>
            </div>

            {/* Server File Status */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                {diagnosis.serverFile.exists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                Server File
              </h3>
              <div className="text-xs text-muted-foreground">
                {diagnosis.serverFile.exists ? (
                  <>
                    <p>Server file path: {diagnosis.serverFile.path}</p>
                    <p>Executable: {diagnosis.serverFile.executable ? 'Yes' : 'No'}</p>
                    {diagnosis.serverFile.hasConnectWallet ? (
                      <p className="text-green-500">Includes connect-wallet tool</p>
                    ) : (
                      <p className="text-red-500">connect-wallet tool not found</p>
                    )}
                  </>
                ) : (
                  <p className="text-red-500">
                    Server file does not exist, please run pnpm build:mcp-server command
                  </p>
                )}
                {diagnosis.serverFile.error && (
                  <p className="text-red-500">Error: {diagnosis.serverFile.error}</p>
                )}
              </div>
            </div>

            {/* MCP Client Status */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                {diagnosis.mcpClient.initialized ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                MCP Client
              </h3>
              <div className="text-xs text-muted-foreground">
                {diagnosis.mcpClient.initialized ? (
                  <>
                    <p>MCP client initialized</p>
                    <p>Tools available: {diagnosis.mcpClient.toolsAvailable ? 'Yes' : 'No'}</p>
                    {diagnosis.mcpClient.tools && diagnosis.mcpClient.tools.length > 0 && (
                      <div className="mt-1">
                        <p>Tool list:</p>
                        <ul className="list-disc pl-4">
                          {diagnosis.mcpClient.tools.map((tool, index) => (
                            <li key={index}>
                              <span className="font-medium">{tool.name}</span>: {tool.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-red-500">MCP client not initialized</p>
                )}
                {diagnosis.mcpClient.error && (
                  <p className="text-red-500">Error: {diagnosis.mcpClient.error}</p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                runDiagnosis();
              }}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Diagnosis
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                rebuildServer();
              }}
              disabled={rebuilding}
            >
              <Terminal className="h-4 w-4 mr-2" />
              {rebuilding ? 'Rebuilding...' : 'Rebuild MCP Server'}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
} 