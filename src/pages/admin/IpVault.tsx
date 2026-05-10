import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { marked } from 'marked'
import { Eye, EyeOff, Plus, Trash2, Key, Clock, Globe, Lock, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ipVaultService } from '@/services/ipVault'
import type { IpDocument } from '@/services/ipVault'

const CATEGORY_COLORS: Record<string, 'orange' | 'gray'> = {
  ALGORITHM: 'orange',
  ARCHITECTURE: 'gray',
  BUSINESS_MODEL: 'orange',
  DESIGN: 'gray',
  ASSET: 'gray',
}

function DocumentCard({ doc, onEdit, onTogglePublish, onDelete }: {
  doc: IpDocument
  onEdit: (doc: IpDocument) => void
  onTogglePublish: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={CATEGORY_COLORS[doc.category] ?? 'gray'}>{doc.category}</Badge>
              {doc.published
                ? <Badge variant="orange"><Globe className="h-3 w-3 mr-1" />{t('ipVault.published')}</Badge>
                : <Badge variant="gray"><Lock className="h-3 w-3 mr-1" />{t('ipVault.draft')}</Badge>
              }
              <span className="text-xs text-gray-400">v{doc.version}</span>
            </div>
            <h3 className="font-semibold text-[#1A1A1A]">{doc.title}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{doc.summary}</p>
            {expanded && (
              <div className="mt-3 border rounded p-3 bg-gray-50 max-h-64 overflow-y-auto">
                <div
                  className="ip-prose"
                  dangerouslySetInnerHTML={{ __html: marked.parse(doc.content) as string }}
                />
              </div>
            )}
            <div className="flex gap-1 mt-2 flex-wrap">
              {doc.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onEdit(doc)}>
              {t('common.edit')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onTogglePublish(doc.id)}
            >
              {doc.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDelete(doc.id)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DocumentDialog({ open, doc, onClose }: {
  open: boolean
  doc: IpDocument | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const isEdit = doc !== null

  const [title, setTitle] = useState(doc?.title ?? '')
  const [slug, setSlug] = useState(doc?.slug ?? '')
  const [category, setCategory] = useState(doc?.category ?? 'ALGORITHM')
  const [summary, setSummary] = useState(doc?.summary ?? '')
  const [content, setContent] = useState(doc?.content ?? '')
  const [tags, setTags] = useState((doc?.tags ?? []).join(', '))
  const [changeNote, setChangeNote] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      if (isEdit) {
        return ipVaultService.update(doc.id, { title, summary, content, tags: tagList, changeNote: changeNote || undefined })
      }
      return ipVaultService.create({ slug, title, category, summary, content, tags: tagList })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ip-vault'] })
      onClose()
    },
  })

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('ipVault.editDocument') : t('ipVault.newDocument')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">{t('ipVault.slug')}</label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-ip-document" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">{t('ipVault.category')}</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={category}
                  onChange={e => setCategory(e.target.value as IpDocument['category'])}
                >
                  {['ALGORITHM', 'ARCHITECTURE', 'BUSINESS_MODEL', 'DESIGN', 'ASSET'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600">{t('ipVault.title')}</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">{t('ipVault.summary')}</label>
            <Textarea rows={3} value={summary} onChange={e => setSummary(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">{t('ipVault.content')} (Markdown)</label>
            <Textarea rows={12} value={content} onChange={e => setContent(e.target.value)} className="font-mono text-xs" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">{t('ipVault.tags')}</label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2, tag3" />
          </div>
          {isEdit && (
            <div>
              <label className="text-xs font-medium text-gray-600">{t('ipVault.changeNote')}</label>
              <Input value={changeNote} onChange={e => setChangeNote(e.target.value)} placeholder={t('ipVault.changeNotePlaceholder')} />
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner /> : t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TokenSection() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [label, setLabel] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['ip-vault-tokens'],
    queryFn: ipVaultService.listTokens,
  })

  const createMutation = useMutation({
    mutationFn: () => ipVaultService.createToken({ label }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ip-vault-tokens'] })
      setLabel('')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => ipVaultService.revokeToken(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ip-vault-tokens'] }),
  })

  const copy = (token: string, id: string) => {
    const url = `${window.location.origin}/vault?token=${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Key className="h-4 w-4" />{t('ipVault.investorAccess')}
      </h3>
      <div className="flex gap-2">
        <Input
          placeholder={t('ipVault.tokenLabel')}
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <Button onClick={() => createMutation.mutate()} disabled={!label || createMutation.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {isLoading ? <Spinner /> : (
        <div className="space-y-2">
          {tokens.map(tok => (
            <Card key={tok.id}>
              <CardContent className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{tok.label}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tok.lastUsedAt ? `${t('ipVault.lastUsed')}: ${new Date(tok.lastUsedAt).toLocaleDateString()}` : t('ipVault.neverUsed')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => copy(tok.token, tok.id)}>
                    {copiedId === tok.id ? t('ipVault.copied') : t('ipVault.copyLink')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => revokeMutation.mutate(tok.id)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function IpVault() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [editDoc, setEditDoc] = useState<IpDocument | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['ip-vault'],
    queryFn: ipVaultService.listAll,
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => ipVaultService.togglePublish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ip-vault'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ipVaultService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ip-vault'] }),
  })

  const openNew = () => { setEditDoc(null); setDialogOpen(true) }
  const openEdit = (doc: IpDocument) => { setEditDoc(doc); setDialogOpen(true) }

  const byCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, IpDocument[]>)

  return (
    <div>
      <Header
        title={t('ipVault.title')}
        subtitle={t('ipVault.subtitle', { count: documents.length })}
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />{t('ipVault.newDocument')}
          </Button>
        }
      />

      <div className="space-y-6">
        <TokenSection />

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            Object.entries(byCategory).map(([cat, docs]) => (
              <div key={cat}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5" />{cat}
                </h2>
                <div className="space-y-2">
                  {docs.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onEdit={openEdit}
                      onTogglePublish={id => publishMutation.mutate(id)}
                      onDelete={id => deleteMutation.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <DocumentDialog
        open={dialogOpen}
        doc={editDoc}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  )
}
