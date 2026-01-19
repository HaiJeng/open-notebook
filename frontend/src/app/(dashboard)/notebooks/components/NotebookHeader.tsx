'use client'

import { useState } from 'react'
import { NotebookResponse } from '@/lib/types/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useUpdateNotebook, useDeleteNotebook } from '@/lib/hooks/use-notebooks'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { formatDistanceToNow } from 'date-fns'
import { getDateLocale } from '@/lib/utils/date-locale'
import { InlineEdit } from '@/components/common/InlineEdit'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import {useTranslation} from "@/lib/hooks/use-translation";

interface NotebookHeaderProps {
  notebook: NotebookResponse
}

export function NotebookHeader({ notebook }: NotebookHeaderProps) {
  const { t, language } = useTranslation()
  const dfLocale = getDateLocale(language)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPersonaDialog, setShowPersonaDialog] = useState(false)
  const [personaDraft, setPersonaDraft] = useState(notebook.chat_system_prompt_override || '')

  const updateNotebook = useUpdateNotebook()
  const deleteNotebook = useDeleteNotebook()

  const handleUpdateName = async (name: string) => {
    if (!name || name === notebook.name) return

    await updateNotebook.mutateAsync({
      id: notebook.id,
      data: { name }
    })
  }

  const handleUpdateDescription = async (description: string) => {
    if (description === notebook.description) return

    await updateNotebook.mutateAsync({
      id: notebook.id,
      data: { description: description || undefined }
    })
  }

  const handleArchiveToggle = () => {
    updateNotebook.mutate({
      id: notebook.id,
      data: { archived: !notebook.archived }
    })
  }

  const handleDelete = () => {
    deleteNotebook.mutate(notebook.id)
    setShowDeleteDialog(false)
  }

  const personaPreview = notebook.chat_system_prompt_override
    ? notebook.chat_system_prompt_override.slice(0, 60) +
      (notebook.chat_system_prompt_override.length > 60 ? '…' : '')
    : t.notebooks.personaNotSet

  const handleOpenPersonaDialog = () => {
    setPersonaDraft(notebook.chat_system_prompt_override || '')
    setShowPersonaDialog(true)
  }

  const handleSavePersona = async () => {
    await updateNotebook.mutateAsync({
      id: notebook.id,
      data: {
        chat_system_prompt_override: personaDraft.trim() ? personaDraft : null,
      },
    })
    setShowPersonaDialog(false)
  }

  return (
    <>
      <div className="border-b pb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <InlineEdit
                id="notebook-name"
                name="notebook-name"
                value={notebook.name}
                onSave={handleUpdateName}
                className="text-2xl font-bold"
                inputClassName="text-2xl font-bold"
                placeholder={t.notebooks.namePlaceholder}
              />
              {notebook.archived && (
                <Badge variant="secondary">{t.notebooks.archived}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchiveToggle}
              >
                {notebook.archived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    {t.notebooks.unarchive}
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    {t.notebooks.archive}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.common.delete}
              </Button>
            </div>
          </div>

          <InlineEdit
            id="notebook-description"
            name="notebook-description"
            value={notebook.description || ''}
            onSave={handleUpdateDescription}
            className="text-muted-foreground"
            inputClassName="text-muted-foreground"
            placeholder={t.notebooks.addDescription}
            multiline
            emptyText={t.notebooks.addDescription}
          />

          {/* 对话人格预览 + 编辑按钮 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="truncate max-w-[60%]">
              <span className="font-medium mr-2">{t.notebooks.personaLabel}：</span>
              {personaPreview}
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenPersonaDialog}>
              {t.notebooks.editPersona}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {t.common.created.replace('{time}', formatDistanceToNow(new Date(notebook.created), { addSuffix: true, locale: dfLocale }))} •
            {t.common.updated.replace('{time}', formatDistanceToNow(new Date(notebook.updated), { addSuffix: true, locale: dfLocale }))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t.notebooks.deleteNotebook}
        description={t.notebooks.deleteNotebookDesc.replace('{name}', notebook.name)}
        confirmText={t.common.deleteForever}
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
      {/* 对话人格编辑弹窗 */}
      <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{t.notebooks.editPersonaTitle}</DialogTitle>
            <DialogDescription>
              {t.notebooks.editPersonaDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <MarkdownEditor
              className="border rounded-md"
              value={personaDraft}
              onChange={(value) => setPersonaDraft(value || '')}
              placeholder={t.notebooks.personaPlaceholder}
              height={320}
              preview="live"
              hideToolbar={false}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setShowPersonaDialog(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSavePersona} disabled={updateNotebook.isPending}>
              {updateNotebook.isPending ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}