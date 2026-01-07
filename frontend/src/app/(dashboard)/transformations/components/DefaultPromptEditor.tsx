'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Settings } from 'lucide-react'
import { useDefaultPrompt, useUpdateDefaultPrompt } from '@/lib/hooks/use-transformations'

export function DefaultPromptEditor() {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const { data: defaultPrompt, isLoading } = useDefaultPrompt()
  const updateDefaultPrompt = useUpdateDefaultPrompt()

  useEffect(() => {
    if (defaultPrompt) {
      setPrompt(defaultPrompt.transformation_instructions || '')
    }
  }, [defaultPrompt])

  const handleSave = () => {
    updateDefaultPrompt.mutate({ transformation_instructions: prompt })
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <div className="text-left">
                  <CardTitle className="text-lg">默认转换提示词</CardTitle>
                  <CardDescription>
                    这将添加到您所有的转换提示词中
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入您的默认转换指令..."
              className="min-h-[200px] font-mono text-sm"
              disabled={isLoading}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={isLoading || updateDefaultPrompt.isPending}
              >
                保存
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}