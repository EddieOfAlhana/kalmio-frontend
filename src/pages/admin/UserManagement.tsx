import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { adminService } from '@/services/admin'
import { useAuthStore } from '@/store/auth'

export function UserManagement() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.listUsers,
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) =>
      adminService.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <div>
      <Header
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle', { count: users.length })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <Card key={user.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{user.email}</p>
                  <p className="text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={user.role === 'ADMIN' ? 'orange' : 'gray'}>
                    {user.role}
                  </Badge>
                  {user.id !== currentUserId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={roleMutation.isPending}
                      onClick={() =>
                        roleMutation.mutate({
                          id: user.id,
                          role: user.role === 'ADMIN' ? 'USER' : 'ADMIN',
                        })
                      }
                    >
                      {user.role === 'ADMIN' ? (
                        <><ShieldOff className="h-3.5 w-3.5" /> {t('admin.users.demote')}</>
                      ) : (
                        <><ShieldCheck className="h-3.5 w-3.5" /> {t('admin.users.promote')}</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
