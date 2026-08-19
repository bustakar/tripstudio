import { createFileRoute } from '@tanstack/react-router'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/_app/connect')({
  component: ConnectPage,
})

function ConnectPage() {
  const endpoint =
    typeof window === 'undefined'
      ? 'https://tripstudio.cc/mcp'
      : `${window.location.origin}/mcp`
  const [copied, setCopied] = useState(false)
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Connect</h1>
        <p className="text-sm text-muted-foreground">
          Add Trip Studio to an MCP-compatible agent.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>MCP endpoint</CardTitle>
          <CardDescription>
            The agent will open your browser to authorize access.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input readOnly value={endpoint} />
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              void navigator.clipboard
                .writeText(endpoint)
                .then(() => setCopied(true))
            }
          >
            {copied ? <Check /> : <Copy />}
            <span className="sr-only">Copy endpoint</span>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
