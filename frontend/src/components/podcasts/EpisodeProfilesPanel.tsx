'use client'

import { useMemo, useState } from 'react'
import { Copy, Edit3, MoreVertical, Trash2, Users } from 'lucide-react'

import { EpisodeProfile, SpeakerProfile } from '@/lib/types/podcasts'
import {
  useDeleteEpisodeProfile,
  useDuplicateEpisodeProfile,
} from '@/lib/hooks/use-podcasts'
import { EpisodeProfileFormDialog } from '@/components/podcasts/forms/EpisodeProfileFormDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface EpisodeProfilesPanelProps {
  episodeProfiles: EpisodeProfile[]
  speakerProfiles: SpeakerProfile[]
  modelOptions: Record<string, string[]>
}

function findSpeakerSummary(
  speakerProfiles: SpeakerProfile[],
  speakerName: string
) {
  return speakerProfiles.find((profile) => profile.name === speakerName)
}

export function EpisodeProfilesPanel({
  episodeProfiles,
  speakerProfiles,
  modelOptions,
}: EpisodeProfilesPanelProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editProfile, setEditProfile] = useState<EpisodeProfile | null>(null)

  const deleteProfile = useDeleteEpisodeProfile()
  const duplicateProfile = useDuplicateEpisodeProfile()

  const sortedProfiles = useMemo(
    () =>
      [...episodeProfiles].sort((a, b) => a.name.localeCompare(b.name, 'en')), 
    [episodeProfiles]
  )

  const disableCreate = speakerProfiles.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">剧集配置</h2>
          <p className="text-sm text-muted-foreground">
            为您的节目定义可重用的生成设置。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={disableCreate}>
          创建配置
        </Button>
      </div>

      {disableCreate ? (
        <p className="rounded-lg border border-dashed bg-amber-50 p-4 text-sm text-amber-900">
          在添加剧集配置之前，请先创建一个演讲者配置。
        </p>
      ) : null}

      {sortedProfiles.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          暂无剧集配置。创建一个以启动播客生成。
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProfiles.map((profile) => {
            const speakerSummary = findSpeakerSummary(
              speakerProfiles,
              profile.speaker_config
            )

            return (
              <Card key={profile.id} className="shadow-sm">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {profile.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {profile.description || '暂无描述。'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditProfile(profile)}
                    >
                      <Edit3 className="mr-2 h-4 w-4" /> 编辑
                    </Button>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={() => duplicateProfile.mutate(profile.id)}
                            disabled={duplicateProfile.isPending}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            复制
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>删除配置？</AlertDialogTitle>
                          <AlertDialogDescription>
                            这将移除“{profile.name}”。现有的剧集将保留其数据，但新剧集将无法再使用此配置。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteProfile.mutate(profile.id)}
                            disabled={deleteProfile.isPending}
                          >
                            {deleteProfile.isPending ? '删除中…' : '删除'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        大纲模型
                      </p>
                      <p className="text-foreground">
                        {profile.outline_provider} / {profile.outline_model}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        转录模型
                      </p>
                      <p className="text-foreground">
                        {profile.transcript_provider} / {profile.transcript_model}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        段落数
                      </p>
                      <p className="text-foreground">{profile.num_segments}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        演讲者配置
                      </p>
                      <div className="flex items-center gap-2 text-foreground">
                        <Users className="h-4 w-4" />
                        <span>{profile.speaker_config}</span>
                        {speakerSummary ? (
                          <Badge variant="outline" className="text-xs">
                            {speakerSummary.tts_provider} / {speakerSummary.tts_model}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {profile.default_briefing ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        默认简报
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {profile.default_briefing}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <EpisodeProfileFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        speakerProfiles={speakerProfiles}
        modelOptions={modelOptions}
      />

      <EpisodeProfileFormDialog
        mode="edit"
        open={Boolean(editProfile)}
        onOpenChange={(open) => {
          if (!open) {
            setEditProfile(null)
          }
        }}
        speakerProfiles={speakerProfiles}
        modelOptions={modelOptions}
        initialData={editProfile ?? undefined}
      />
    </div>
  )
}
