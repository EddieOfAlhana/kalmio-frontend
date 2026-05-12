import { useQuery } from '@tanstack/react-query'
import { pointsService } from '@/services/points'

export function usePoints() {
  return useQuery({
    queryKey: ['points'],
    queryFn: pointsService.getMyPoints,
    staleTime: 30_000,
  })
}
