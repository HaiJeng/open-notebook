'use client'

import { useState } from 'react'
import { NotebookResponse } from '@/lib/types/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useUpdateNotebook, useDeleteNotebook } from '@/lib/hooks/use-notebooks'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { formatDistanceToNow } from 'date-fns'
import { InlineEdit } from '@/components/common/InlineEdit'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MarkdownEditor } from '@/components/ui/markdown-editor'

interface NotebookHeaderProps {
  notebook: NotebookResponse
}

export function NotebookHeader({ notebook }: NotebookHeaderProps) {
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
    : '未设置（使用默认提示词）'

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
                value={notebook.name}
                onSave={handleUpdateName}
                className="text-2xl font-bold"
                inputClassName="text-2xl font-bold"
                placeholder="笔记本名称"
              />
              {notebook.archived && (
                <Badge variant="secondary">已归档</Badge>
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
                    取消归档
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    归档
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
                删除
              </Button>
            </div>
          </div>
          
          <InlineEdit
            value={notebook.description || ''}
            onSave={handleUpdateDescription}
            className="text-muted-foreground"
            inputClassName="text-muted-foreground"
            placeholder="添加描述..."
            multiline
            emptyText="添加描述..."
          />
          
          {/* 对话人格预览 + 编辑按钮 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="truncate max-w-[60%]">
              <span className="font-medium mr-2">对话人格：</span>
              {personaPreview}
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenPersonaDialog}>
              编辑人格提示词
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            创建于 {formatDistanceToNow(new Date(notebook.created), { addSuffix: true })} • 
            更新于 {formatDistanceToNow(new Date(notebook.updated), { addSuffix: true })}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="删除笔记本"
        description={`您确定要删除“${notebook.name}”吗？此操作无法撤销，并将删除所有资源、笔记和对话会话。`}
        confirmText="永久删除"
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
      {/* 对话人格编辑弹窗 */}
      <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>编辑笔记本对话人格</DialogTitle>
            <DialogDescription>
              定义当前笔记本的对话人格、语气和行为准则。此内容会覆盖默认的系统提示词（支持 Markdown）。
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <MarkdownEditor
              className="border rounded-md"
              value={personaDraft}
              onChange={(value) => setPersonaDraft(value || '')}
              placeholder="例如：&#10;- 你是一位擅长 XX 的小说助手...&#10;- 回答时优先使用中文，保持温和、细致的语气..."
              height={320}
              preview="live"
              hideToolbar={false}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setShowPersonaDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSavePersona} disabled={updateNotebook.isPending}>
              {updateNotebook.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}