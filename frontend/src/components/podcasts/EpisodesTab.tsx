'use client'

import { useCallback, useState } from 'react'
import { AlertCircle, Loader2, RefreshCcw } from 'lucide-react'

import { useDeletePodcastEpisode, usePodcastEpisodes } from '@/lib/hooks/use-podcasts'
import { EpisodeCard } from '@/components/podcasts/EpisodeCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { GeneratePodcastDialog } from '@/components/podcasts/GeneratePodcastDialog'

const STATUS_ORDER: Array<{
  key: 'running' | 'completed' | 'failed' | 'pending'
  title: string
  description?: string
}> = [
  {
    key: 'running',
    title: '正在处理',
    description: '正在生成资产的剧集。',
  },
  {
    key: 'pending',
    title: '排队中 / 待处理',
    description: '已提交的剧集正在等待开始处理。',
  },
  {
    key: 'completed',
    title: '已完成的剧集',
    description: '准备好查看、下载或发布。',
  },
  {
    key: 'failed',
    title: '失败的剧集',
    description: '在生成过程中遇到问题的剧集。',
  },
]

function SummaryBadge({ label, value }: { label: string; value: number }) {
  return (
    <Badge variant="outline" className="font-medium">
      <span className="text-muted-foreground mr-1.5">{label}</span>
      <span className="text-foreground">{value}</span>
    </Badge>
  )
}

export function EpisodesTab() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const {
    episodes,
    statusGroups,
    statusCounts,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePodcastEpisodes()
  const deleteEpisode = useDeletePodcastEpisode()

  const handleRefresh = useCallback(() => {
    void refetch()
  }, [refetch])

  const handleDelete = useCallback(
    (episodeId: string) => deleteEpisode.mutateAsync(episodeId),
    [deleteEpisode]
  )

  const emptyState = !isLoading && episodes.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">剧集概览</h2>
          <p className="text-sm text-muted-foreground">
            监控播客生成任务并查看最终产品。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowGenerateDialog(true)}>
            生成播客
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            刷新
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <SummaryBadge label="总计" value={statusCounts.total} />
        <SummaryBadge label="处理中" value={statusCounts.running} />
        <SummaryBadge label="已完成" value={statusCounts.completed} />
        <SummaryBadge label="失败" value={statusCounts.failed} />
        <SummaryBadge label="待处理" value={statusCounts.pending} />
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>加载剧集失败</AlertTitle>
          <AlertDescription>
            我们无法获取最新的播客剧集。稍后再试。
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载剧集中…
        </div>
      ) : null}

      {emptyState ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            还没有播客剧集。从笔记本或资源聊天界面生成您的第一个。
          </p>
        </div>
      ) : null}

      {STATUS_ORDER.map(({ key, title, description }) => {
        const data = statusGroups[key]
        if (!data || data.length === 0) {
          return null
        }

        return (
          <section key={key} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold leading-tight">{title}</h3>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <Separator />
            <div className="space-y-4">
              {data.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  onDelete={handleDelete}
                  deleting={deleteEpisode.isPending}
                />
              ))}
            </div>
          </section>
        )
      })}

      <GeneratePodcastDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      />
    </div>
  )
}
