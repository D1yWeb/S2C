'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Check, X, Mail, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'
import { useAppSelector } from '@/redux/store'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface InvitesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const InvitesDialog = ({ open, onOpenChange }: InvitesDialogProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const me = useAppSelector((state) => state.profile)
  const pendingInvites = useQuery(api.team.getPendingInvites)
  const acceptInvite = useMutation(api.team.acceptInvite)
  const declineInvite = useMutation(api.team.declineInvite)

  const handleAccept = async (teamMemberId: Id<'project_team_members'>, projectId: Id<'projects'>) => {
    try {
      await acceptInvite({ teamMemberId })
      toast.success('Invite accepted! Opening project...')
      onOpenChange(false)
      
      // Get user slug from pathname or profile
      const userSlug = me?.slug || me?.name || pathname.split('/')[2]
      router.push(`/dashboard/${userSlug}/canvas?project=${projectId}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept invite'
      toast.error(errorMessage)
    }
  }

  const handleDecline = async (teamMemberId: Id<'project_team_members'>) => {
    try {
      await declineInvite({ teamMemberId })
      toast.success('Invite declined')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to decline invite'
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-black/90 border border-white/[0.12]">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Project Invitations
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {pendingInvites && pendingInvites.length > 0
              ? `You have ${pendingInvites.length} pending invitation${pendingInvites.length > 1 ? 's' : ''}`
              : 'You have no pending invitations'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!pendingInvites || pendingInvites.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No pending invitations</p>
              <p className="text-xs mt-1">When someone invites you to a project, it will appear here</p>
            </div>
          ) : (
            pendingInvites.map((invite) => (
              <div
                key={invite._id}
                className="flex items-center gap-4 p-4 rounded-lg bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.08] transition-colors"
              >
                {/* Project Thumbnail */}
                <div className="flex-shrink-0">
                  {invite.projectThumbnail ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={invite.projectThumbnail}
                        alt={invite.projectName}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Mail className="w-8 h-8 text-primary/50" />
                    </div>
                  )}
                </div>

                {/* Invite Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {invite.projectName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="bg-white/[0.12] text-white text-xs">
                        {invite.ownerName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-white/60 truncate">
                      Invited by {invite.ownerName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(invite.invitedAt), { addSuffix: true })}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary/80">
                      {invite.role}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDecline(invite._id)}
                    className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] text-white hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAccept(invite._id, invite.projectId)}
                    className="backdrop-blur-xl bg-white/[0.12] border border-white/[0.16] text-white hover:bg-white/[0.16]"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

