'use client'

import { useMemo } from 'react'
import { AlertCircle, Lightbulb, Loader2 } from 'lucide-react'

import { EpisodeProfilesPanel } from '@/components/podcasts/EpisodeProfilesPanel'
import { SpeakerProfilesPanel } from '@/components/podcasts/SpeakerProfilesPanel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useEpisodeProfiles, useSpeakerProfiles } from '@/lib/hooks/use-podcasts'
import { useModels } from '@/lib/hooks/use-models'
import { Model } from '@/lib/types/models'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

function modelsByProvider(models: Model[], type: Model['type']) {
  return models
    .filter((model) => model.type === type)
    .reduce<Record<string, string[]>>((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = []
      }
      acc[model.provider].push(model.name)
      return acc
    }, {})
}

export function TemplatesTab() {
  const {
    episodeProfiles,
    isLoading: loadingEpisodeProfiles,
    error: episodeProfilesError,
  } = useEpisodeProfiles()

  const {
    speakerProfiles,
    usage,
    isLoading: loadingSpeakerProfiles,
    error: speakerProfilesError,
  } = useSpeakerProfiles(episodeProfiles)

  const {
    data: models = [],
    isLoading: loadingModels,
    error: modelsError,
  } = useModels()

  const languageModelOptions = useMemo(
    () => modelsByProvider(models, 'language'),
    [models]
  )
  const ttsModelOptions = useMemo(
    () => modelsByProvider(models, 'text_to_speech'),
    [models]
  )

  const isLoading = loadingEpisodeProfiles || loadingSpeakerProfiles || loadingModels
  const hasError = episodeProfilesError || speakerProfilesError || modelsError

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">模板工作区</h2>
        <p className="text-sm text-muted-foreground">
          构建可重用的剧集和演讲者配置，以快速制作播客。
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem 
          value="overview" 
          className="overflow-hidden rounded-xl border border-border bg-muted/40 px-4"
        >
          <AccordionTrigger className="gap-2 py-4 text-left text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              模板如何驱动播客生成
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            <div className="space-y-4">
              <p className="text-muted-foreground/90">
                模板将播客工作流程分为两个可重用的构建块。在生成新剧集时可以混合和匹配它们。
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-foreground">剧集模板设置格式</h4>
                <ul className="list-disc space-y-1 pl-5">
                  <li>概述段落数量和故事流程</li>
                  <li>选择用于简报、大纲和脚本编写的语言模型</li>
                  <li>存储默认简报，以便每集都以一致的语气开始</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-foreground">演讲者模板赋予声音生命</h4>
                <ul className="list-disc space-y-1 pl-5">
                  <li>选择文本转语音提供商和模型</li>
                  <li>捕捉每个演讲者的个性、背景故事和发音注释</li>
                  <li>在不同的剧集格式中重用相同的主持人或嘉宾声音</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-foreground">推荐的工作流程</h4>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>为所需的每个声音创建演讲者模板</li>
                  <li>构建引用这些演讲者名称的剧集模板</li>
                  <li>通过选择适合故事的剧集模板来生成播客</li>
                </ol>
                <p className="text-xs text-muted-foreground/80">
                  剧集模板通过名称引用演讲者模板，因此从演讲者开始可以避免后续缺少声音分配。
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {hasError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>加载模板数据失败</AlertTitle>
          <AlertDescription>
            请确保 API 正在运行并重试。某些部分可能不完整。
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载模板中…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <SpeakerProfilesPanel
            speakerProfiles={speakerProfiles}
            usage={usage}
            modelOptions={ttsModelOptions}
          />
          <EpisodeProfilesPanel
            episodeProfiles={episodeProfiles}
            speakerProfiles={speakerProfiles}
            modelOptions={languageModelOptions}
          />
        </div>
      )}
    </div>
  )
}
