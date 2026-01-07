'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useSettings, useUpdateSettings } from '@/lib/hooks/use-settings'
import { useEffect, useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'

const settingsSchema = z.object({
  default_content_processing_engine_doc: z.enum(['auto', 'docling', 'simple']).optional(),
  default_content_processing_engine_url: z.enum(['auto', 'firecrawl', 'jina', 'simple']).optional(),
  default_embedding_option: z.enum(['ask', 'always', 'never']).optional(),
  auto_delete_files: z.enum(['yes', 'no']).optional(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export function SettingsForm() {
  const { data: settings, isLoading, error } = useSettings()
  const updateSettings = useUpdateSettings()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [hasResetForm, setHasResetForm] = useState(false)
  
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      default_content_processing_engine_doc: undefined,
      default_content_processing_engine_url: undefined,
      default_embedding_option: undefined,
      auto_delete_files: undefined,
    }
  })


  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    if (settings && settings.default_content_processing_engine_doc && !hasResetForm) {
      const formData = {
        default_content_processing_engine_doc: settings.default_content_processing_engine_doc as 'auto' | 'docling' | 'simple',
        default_content_processing_engine_url: settings.default_content_processing_engine_url as 'auto' | 'firecrawl' | 'jina' | 'simple',
        default_embedding_option: settings.default_embedding_option as 'ask' | 'always' | 'never',
        auto_delete_files: settings.auto_delete_files as 'yes' | 'no',
      }
      reset(formData)
      setHasResetForm(true)
    }
  }, [hasResetForm, reset, settings])

  const onSubmit = async (data: SettingsFormData) => {
    await updateSettings.mutateAsync(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>加载设置失败</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : '发生了意外错误。'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>内容处理</CardTitle>
          <CardDescription>
            配置文档和 URL 的处理方式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="doc_engine">文档处理引擎</Label>
            <Controller
              name="default_content_processing_engine_doc"
              control={control}
              render={({ field }) => (
                <Select
                  key={field.value}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={field.disabled || isLoading}
                >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择文档处理引擎" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">自动 (推荐)</SelectItem>
                      <SelectItem value="docling">Docling</SelectItem>
                      <SelectItem value="simple">简单</SelectItem>
                    </SelectContent>
                  </Select>
              )}
            />
            <Collapsible open={expandedSections.doc} onOpenChange={() => toggleSection('doc')}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSections.doc ? 'rotate-180' : ''}`} />
                帮我选择
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
                <p>• <strong>Docling</strong> 稍慢，但更准确，特别是如果文档包含表格和图像。</p>
                <p>• <strong>简单</strong> 将提取文档中的任何内容而不进行格式化。对于简单文档来说没问题，但在复杂文档中会损失质量。</p>
                <p>• <strong>自动 (推荐)</strong> 将尝试通过 Docling 处理，并默认回退到简单。</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="url_engine">URL 处理引擎</Label>
            <Controller
              name="default_content_processing_engine_url"
              control={control}
              render={({ field }) => (
                <Select
                  key={field.value}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={field.disabled || isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择 URL 处理引擎" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动 (推荐)</SelectItem>
                    <SelectItem value="firecrawl">Firecrawl</SelectItem>
                    <SelectItem value="jina">Jina</SelectItem>
                    <SelectItem value="simple">简单</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Collapsible open={expandedSections.url} onOpenChange={() => toggleSection('url')}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSections.url ? 'rotate-180' : ''}`} />
                帮我选择
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
                <p>• <strong>Firecrawl</strong> 是一项付费服务（有免费层级），且功能非常强大。</p>
                <p>• <strong>Jina</strong> 也是一个不错的选择，同样有免费层级。</p>
                <p>• <strong>简单</strong> 将使用基础的 HTTP 提取，在基于 JavaScript 的网站上会丢失内容。</p>
                <p>• <strong>自动 (推荐)</strong> 将尝试使用 Firecrawl（如果提供 API 密钥）。然后，它将使用 Jina 直到达到限制（或者如果您设置了 API 密钥，它将继续使用 Jina）。当上述选项都不可用时，它将回退到简单。</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>嵌入与搜索</CardTitle>
          <CardDescription>
            配置搜索和嵌入选项
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="embedding">默认嵌入选项</Label>
            <Controller
              name="default_embedding_option"
              control={control}
              render={({ field }) => (
                <Select
                  key={field.value}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={field.disabled || isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择嵌入选项" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ask">询问</SelectItem>
                    <SelectItem value="always">总是</SelectItem>
                    <SelectItem value="never">从不</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Collapsible open={expandedSections.embedding} onOpenChange={() => toggleSection('embedding')}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSections.embedding ? 'rotate-180' : ''}`} />
                帮我选择
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
                <p>对内容进行嵌入将使您和您的 AI 代理更容易找到它。如果您正在运行本地嵌入模型（例如 Ollama），您无需担心成本，只需嵌入所有内容即可。对于在线提供商，仅当您处理大量内容（例如每天数百份文档）时，才需要谨慎处理。</p>
                <p>• 如果您正在运行本地嵌入模型，或者您的内容量不是很大，请选择<strong>总是</strong></p>
                <p>• 如果您想每次都自行决定，请选择<strong>询问</strong></p>
                <p>• 如果您不在乎向量搜索或者没有嵌入提供商，请选择<strong>从不</strong>。</p>
                <p>作为参考，OpenAI 的 text-embedding-3-small 每 100 万个 token 的成本约为 0.02 美元——这大约是地球维基百科页面的 30 倍。使用 Gemini API，Text Embedding 004 是免费的，速率限制为每分钟 1500 个请求。</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>文件管理</CardTitle>
          <CardDescription>
            配置文件处理和存储选项
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="auto_delete">自动删除文件</Label>
            <Controller
              name="auto_delete_files"
              control={control}
              render={({ field }) => (
                <Select
                  key={field.value}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={field.disabled || isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择自动删除选项" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">是</SelectItem>
                    <SelectItem value="no">否</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Collapsible open={expandedSections.files} onOpenChange={() => toggleSection('files')}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSections.files ? 'rotate-180' : ''}`} />
                帮我选择
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
                <p>一旦您的文件上传并处理完毕，就不再需要它们了。大多数用户应允许 Open Notebook 自动从上传文件夹中删除上传的文件。只有在您将笔记本作为这些文件的主要存储位置时才选择<strong>否</strong>（您根本不应该这样做）。此选项很快将被弃用，转而采用始终下载文件的方式。</p>
                <p>• 选择<strong>是</strong>（推荐）以在处理后自动删除上传的文件</p>
                <p>• 仅当您需要保留上传文件夹中的原始文件时，才选择<strong>否</strong></p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!isDirty || updateSettings.isPending}
        >
          {updateSettings.isPending ? '正在保存...' : '保存设置'}
        </Button>
      </div>
    </form>
  )
}
