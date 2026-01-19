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
import { useTranslation } from '@/lib/hooks/use-translation'

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
  const { t } = useTranslation()
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
          <DialogTitle>{t.notebooks.createNew}</DialogTitle>
          <DialogDescription>
            {t.notebooks.createNewDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notebook-name">{t.common.name || 'Name'} *</Label>
            <Input
              id="notebook-name"
              {...register('name')}
              placeholder={t.notebooks.namePlaceholder}
              autoComplete="off"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notebook-description">{t.common.description}</Label>
            <Textarea
              id="notebook-description"
              {...register('description')}
              placeholder={t.notebooks.descPlaceholder}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notebook-persona">{t.notebooks.personaLabel}</Label>
            <Controller
              name="chat_system_prompt_override"
              control={control}
              render={({ field }) => (
                <MarkdownEditor
                  className="border rounded-md"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t.notebooks.personaPlaceholder}
                  height={240}
                  preview="live" 
                  hideToolbar={false}
                />
              )}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeDialog}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!isValid || createNotebook.isPending}>
              {createNotebook.isPending ? t.common.creating : t.notebooks.createNew}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
