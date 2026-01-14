'use client'

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreateNotebook } from '@/lib/hooks/use-notebooks'
import { MarkdownEditor } from '../ui/markdown-editor'

const createNotebookSchema = z.object({
  name: z.string().min(1, '名称是必填项'),
  description: z.string().optional(),
  chat_system_prompt_override: z.string().optional(),
})

type CreateNotebookFormData = z.infer<typeof createNotebookSchema>

interface CreateNotebookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateNotebookDialog({ open, onOpenChange }: CreateNotebookDialogProps) {
  const createNotebook = useCreateNotebook()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    control
  } = useForm<CreateNotebookFormData>({
    resolver: zodResolver(createNotebookSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      chat_system_prompt_override: ''
    },
  })

  const closeDialog = () => onOpenChange(false)

  const onSubmit = async (data: CreateNotebookFormData) => {
    await createNotebook.mutateAsync(data)
    closeDialog()
    reset()
  }

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>创建新笔记本</DialogTitle>
          <DialogDescription>
            通过为相关资源和笔记提供专用空间，开始组织您的研究。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notebook-name">名称 *</Label>
            <Input
              id="notebook-name"
              {...register('name')}
              placeholder="输入笔记本名称"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notebook-description">描述</Label>
            <Textarea
              id="notebook-description"
              {...register('description')}
              placeholder="描述此笔记本的目的和范围..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notebook-persona">笔记本人格</Label>
            <Controller
              name="chat_system_prompt_override"
              control={control}
              render={({ field }) => (
                <MarkdownEditor
                  className="border rounded-md"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="描述此笔记本的人格提示词，例如角色、语气、行为准则等（支持 Markdown）..."
                  height={240}
                  preview="live" 
                  hideToolbar={false}
                />
              )}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeDialog}>
              取消
            </Button>
            <Button type="submit" disabled={!isValid || createNotebook.isPending}>
              {createNotebook.isPending ? '正在创建...' : '创建笔记本'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
