'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { EpisodeProfile, SpeakerProfile } from '@/lib/types/podcasts'
import {
  useCreateEpisodeProfile,
  useUpdateEpisodeProfile,
} from '@/lib/hooks/use-podcasts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

const episodeProfileSchema = z.object({
  name: z.string().min(1, '名称是必填项'),
  description: z.string().optional(),
  speaker_config: z.string().min(1, '演讲者配置是必填项'),
  outline_provider: z.string().min(1, '大纲提供商是必填项'),
  outline_model: z.string().min(1, '大纲模型是必填项'),
  transcript_provider: z.string().min(1, '脚本提供商是必填项'),
  transcript_model: z.string().min(1, '脚本模型是必填项'),
  default_briefing: z.string().min(1, '默认简报是必填项'),
  num_segments: z.number()
    .int('必须是整数')
    .min(3, '至少 3 个段落')
    .max(20, '最多 20 个段落'),
})

export type EpisodeProfileFormValues = z.infer<typeof episodeProfileSchema>

interface EpisodeProfileFormDialogProps {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  speakerProfiles: SpeakerProfile[]
  modelOptions: Record<string, string[]>
  initialData?: EpisodeProfile
}

export function EpisodeProfileFormDialog({
  mode,
  open,
  onOpenChange,
  speakerProfiles,
  modelOptions,
  initialData,
}: EpisodeProfileFormDialogProps) {
  const createProfile = useCreateEpisodeProfile()
  const updateProfile = useUpdateEpisodeProfile()

  const providers = useMemo(() => Object.keys(modelOptions), [modelOptions])

  const getDefaults = useCallback((): EpisodeProfileFormValues => {
    const firstSpeaker = speakerProfiles[0]?.name ?? ''
    const firstProvider = providers[0] ?? ''
    const firstModel = firstProvider ? modelOptions[firstProvider]?.[0] ?? '' : ''

    if (initialData) {
      return {
        name: initialData.name,
        description: initialData.description ?? '',
        speaker_config: initialData.speaker_config,
        outline_provider: initialData.outline_provider,
        outline_model: initialData.outline_model,
        transcript_provider: initialData.transcript_provider,
        transcript_model: initialData.transcript_model,
        default_briefing: initialData.default_briefing,
        num_segments: initialData.num_segments,
      }
    }

    return {
      name: '',
      description: '',
      speaker_config: firstSpeaker,
      outline_provider: firstProvider,
      outline_model: firstModel,
      transcript_provider: firstProvider,
      transcript_model: firstModel,
      default_briefing: '',
      num_segments: 5,
    }
  }, [initialData, modelOptions, providers, speakerProfiles])

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EpisodeProfileFormValues>({
    resolver: zodResolver(episodeProfileSchema),
    defaultValues: getDefaults(),
  })

  const outlineProvider = watch('outline_provider')
  const outlineModel = watch('outline_model')
  const transcriptProvider = watch('transcript_provider')
  const transcriptModel = watch('transcript_model')
  const availableOutlineModels = modelOptions[outlineProvider] ?? []
  const availableTranscriptModels = modelOptions[transcriptProvider] ?? []

  useEffect(() => {
    if (!open) {
      return
    }
    reset(getDefaults())
  }, [open, reset, getDefaults])

  useEffect(() => {
    if (!outlineProvider) {
      return
    }
    const models = modelOptions[outlineProvider] ?? []
    if (models.length === 0) {
      setValue('outline_model', '')
      return
    }
    if (!models.includes(outlineModel)) {
      setValue('outline_model', models[0])
    }
  }, [outlineProvider, outlineModel, modelOptions, setValue])

  useEffect(() => {
    if (!transcriptProvider) {
      return
    }
    const models = modelOptions[transcriptProvider] ?? []
    if (models.length === 0) {
      setValue('transcript_model', '')
      return
    }
    if (!models.includes(transcriptModel)) {
      setValue('transcript_model', models[0])
    }
  }, [transcriptProvider, transcriptModel, modelOptions, setValue])

  const onSubmit = async (values: EpisodeProfileFormValues) => {
    const payload = {
      ...values,
      description: values.description ?? '',
    }

    if (mode === 'create') {
      await createProfile.mutateAsync(payload)
    } else if (initialData) {
      await updateProfile.mutateAsync({
        profileId: initialData.id,
        payload,
      })
    }

    onOpenChange(false)
  }

  const isSubmitting = createProfile.isPending || updateProfile.isPending
  const disableSubmit =
    isSubmitting || speakerProfiles.length === 0 || providers.length === 0
  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '编辑剧集模板' : '创建剧集模板'}
          </DialogTitle>
          <DialogDescription>
            定义剧集的生成方式以及它们默认使用的演讲者配置。
          </DialogDescription>
        </DialogHeader>

        {speakerProfiles.length === 0 ? (
          <Alert className="bg-amber-50 text-amber-900">
            <AlertTitle>没有可用的演讲者模板</AlertTitle>
            <AlertDescription>
              在配置剧集模板之前，请先创建一个演讲者模板。
            </AlertDescription>
          </Alert>
        ) : null}

        {providers.length === 0 ? (
          <Alert className="bg-amber-50 text-amber-900">
            <AlertTitle>没有可用的语言模型</AlertTitle>
            <AlertDescription>
              在“模型”部分添加语言模型，以配置大纲和脚本生成。
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">模板名称 *</Label>
              <Input id="name" placeholder="技术讨论" {...register('name')} />
              {errors.name ? (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="num_segments">段落数量 *</Label>
              <Input
                id="num_segments"
                type="number"
                min={3}
                max={20}
                {...register('num_segments', { valueAsNumber: true })}
              />
              {errors.num_segments ? (
                <p className="text-xs text-red-600">{errors.num_segments.message}</p>
              ) : null}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="简要说明何时使用此模板"
                {...register('description')}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                演讲者配置
              </h3>
              <Separator className="mt-2" />
            </div>
            <Controller
              control={control}
              name="speaker_config"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>演讲者模板 *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择演讲者模板" />
                    </SelectTrigger>
                    <SelectContent>
                      {speakerProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.name}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.speaker_config ? (
                    <p className="text-xs text-red-600">
                      {errors.speaker_config.message}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                大纲生成
              </h3>
              <Separator className="mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={control}
                name="outline_provider"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>提供商 *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择提供商" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            <span className="capitalize">{provider}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.outline_provider ? (
                      <p className="text-xs text-red-600">
                        {errors.outline_provider.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="outline_model"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>模型 *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOutlineModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.outline_model ? (
                      <p className="text-xs text-red-600">
                        {errors.outline_model.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                脚本生成
              </h3>
              <Separator className="mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={control}
                name="transcript_provider"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>提供商 *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择提供商" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            <span className="capitalize">{provider}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.transcript_provider ? (
                      <p className="text-xs text-red-600">
                        {errors.transcript_provider.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="transcript_model"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>模型 *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTranscriptModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.transcript_model ? (
                      <p className="text-xs text-red-600">
                        {errors.transcript_model.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_briefing">默认简报 *</Label>
            <Textarea
              id="default_briefing"
              rows={6}
              placeholder="概述此剧集格式的结构、语气和目标"
              {...register('default_briefing')}
            />
            {errors.default_briefing ? (
              <p className="text-xs text-red-600">
                {errors.default_briefing.message}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={disableSubmit}>
              {isSubmitting
                ? isEdit
                  ? '正在保存...'
                  : '正在创建...'
                : isEdit
                  ? '保存更改'
                  : '创建模板'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
