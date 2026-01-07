'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { CreateModelRequest, ProviderAvailability } from '@/lib/types/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useCreateModel } from '@/lib/hooks/use-models'
import { Plus } from 'lucide-react'

interface AddModelFormProps {
  modelType: 'language' | 'embedding' | 'text_to_speech' | 'speech_to_text'
  providers: ProviderAvailability
}

export function AddModelForm({ modelType, providers }: AddModelFormProps) {
  const [open, setOpen] = useState(false)
  const createModel = useCreateModel()
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateModelRequest>({
    defaultValues: {
      type: modelType
    }
  })

  // Get available providers that support this model type
  const availableProviders = providers.available.filter(provider =>
    providers.supported_types[provider]?.includes(modelType)
  )

  const onSubmit = async (data: CreateModelRequest) => {
    await createModel.mutateAsync(data)
    reset()
    setOpen(false)
  }

  const getModelTypeName = () => {
    switch (modelType) {
      case 'language': return '语言'
      case 'embedding': return '嵌入'
      case 'text_to_speech': return '文本转语音'
      case 'speech_to_text': return '语音转文本'
      default: return modelType
    }
  }

  const getModelPlaceholder = () => {
    switch (modelType) {
      case 'language':
        return '例如：gpt-5-mini, claude, gemini'
      case 'embedding':
        return '例如：text-embedding-3-small'
      case 'text_to_speech':
        return '例如：tts-gpt-4o-mini-tts, tts-1-hd'
      case 'speech_to_text':
        return '例如：whisper-1'
      default:
        return '输入模型名称'
    }
  }

  if (availableProviders.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        没有可用于 {getModelTypeName()} 模型的提供商
      </div>
    )
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          添加模型
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加 {getModelTypeName()} 模型</DialogTitle>
          <DialogDescription>
            从可用提供商配置新的 {getModelTypeName()} 模型。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="provider">提供商</Label>
            <Select onValueChange={(value) => setValue('provider', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="选择提供商" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    <span className="capitalize">{provider}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.provider && (
              <p className="text-sm text-destructive mt-1">请选择提供商</p>
            )}
          </div>

          <div>
            <Label htmlFor="name">模型名称</Label>
            <Input
              id="name"
              {...register('name', { required: '模型名称是必填项' })}
              placeholder={getModelPlaceholder()}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {modelType === 'language' && watch('provider') === 'azure' &&
                '对于 Azure，请使用部署名称作为模型名称'}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={createModel.isPending}>
              {createModel.isPending ? '正在添加...' : '添加模型'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}