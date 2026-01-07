'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Loader2 } from 'lucide-react'
import { Transformation } from '@/lib/types/transformations'
import { useExecuteTransformation } from '@/lib/hooks/use-transformations'
import { ModelSelector } from '@/components/common/ModelSelector'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TransformationPlaygroundProps {
  transformations: Transformation[] | undefined
  selectedTransformation?: Transformation
}

export function TransformationPlayground({ transformations, selectedTransformation }: TransformationPlaygroundProps) {
  const [selectedId, setSelectedId] = useState(selectedTransformation?.id || '')
  const [inputText, setInputText] = useState('')
  const [modelId, setModelId] = useState('')
  const [output, setOutput] = useState('')
  
  const executeTransformation = useExecuteTransformation()

  const handleExecute = async () => {
    if (!selectedId || !modelId || !inputText.trim()) {
      return
    }

    const result = await executeTransformation.mutateAsync({
      transformation_id: selectedId,
      input_text: inputText,
      model_id: modelId
    })

    setOutput(result.output)
  }

  const canExecute = selectedId && modelId && inputText.trim() && !executeTransformation.isPending

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>操练场</CardTitle>
          <CardDescription>
            在将转换应用于资源之前，先在示例文本上进行测试
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transformation">转换</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="transformation">
                  <SelectValue placeholder="选择转换" />
                </SelectTrigger>
                <SelectContent>
                  {transformations?.map((transformation) => (
                    <SelectItem key={transformation.id} value={transformation.id}>
                      {transformation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ModelSelector
                label="模型"
                modelType="language"
                value={modelId}
                onChange={setModelId}
                placeholder="选择模型"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="input">输入文本</Label>
            <Textarea
              id="input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入一些要转换的文本..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handleExecute}
              disabled={!canExecute}
              size="lg"
            >
              {executeTransformation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  运行中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  运行转换
                </>
              )}
            </Button>
          </div>

          {output && (
            <div className="space-y-2">
              <Label>输出</Label>
              <Card>
                <ScrollArea className="h-[400px]">
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto">
                              <table className="min-w-full border-collapse border border-border">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                          tbody: ({ children }) => <tbody>{children}</tbody>,
                          tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
                          th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
                          td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
                        }}
                      >
                        {output}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}