'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { UserPlus, Search, X, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

interface TeamMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const TeamMembersDialog = ({ open, onOpenChange }: TeamMembersDialogProps) => {
  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get('project')
  const projectId = projectIdParam ? (projectIdParam as Id<'projects'>) : null
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)

  // Get current project team members
  const teamMembers = useQuery(
    api.team.getProjectTeamMembers,
    projectId ? { projectId } : 'skip'
  )

  // Search for users to invite
  const searchResults = useQuery(
    api.team.searchUsers,
    showAddMember && searchQuery.trim()
      ? { searchQuery: searchQuery.trim(), limit: 10 }
      : 'skip'
  )

  const inviteMember = useMutation(api.team.inviteTeamMember)
  const removeMember = useMutation(api.team.removeTeamMember)

  const handleInvite = async (userId: Id<'users'>) => {
    if (!projectId) {
      toast.error('No project selected')
      return
    }

    try {
      await inviteMember({ projectId, userId })
      toast.success('Team member invited successfully!')
      setSearchQuery('')
      setShowAddMember(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite member'
      toast.error(errorMessage)
    }
  }

  const handleRemove = async (teamMemberId: Id<'project_team_members'>) => {
    try {
      await removeMember({ teamMemberId })
      toast.success('Team member removed successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member'
      toast.error(errorMessage)
    }
  }

  // Check if user is already a team member
  const isAlreadyMember = (userId: Id<'users'>) => {
    return teamMembers?.some((member) => member.userId === userId) || false
  }

  if (!projectId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl backdrop-blur-xl bg-black/90 border border-white/[0.12]">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Team Members</DialogTitle>
            <DialogDescription className="text-white/70">
              Open a project to manage team members
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-black/90 border border-white/[0.12]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-2xl flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Manage who can access and collaborate on this project
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMember(!showAddMember)}
              className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] text-white hover:bg-white/[0.12]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {showAddMember ? 'Cancel' : 'Add Member'}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Add Member Section */}
          {showAddMember && (
            <div className="space-y-3 p-4 rounded-lg bg-white/[0.05] border border-white/[0.12]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-white/50" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/[0.12] border-white/[0.16] text-white placeholder:text-white/50"
                />
              </div>

              {searchQuery.trim() && searchResults && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-white/50 text-center py-4">
                      No users found
                    </p>
                  ) : (
                    searchResults.map((user) => {
                      const alreadyMember = isAlreadyMember(user._id)
                      return (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.image} />
                              <AvatarFallback className="bg-white/[0.12] text-white text-xs">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-white">{user.name}</p>
                              <p className="text-xs text-white/50">{user.email}</p>
                            </div>
                          </div>
                          {alreadyMember ? (
                            <span className="text-xs text-white/50">Already a member</span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInvite(user._id)}
                              className="text-white hover:bg-white/[0.12]"
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Invite
                            </Button>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Team Members List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
              Current Members ({teamMembers?.length || 0})
            </h3>
            {!teamMembers || teamMembers.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No team members yet</p>
                <p className="text-xs mt-1">Add members to collaborate on this project</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.image} />
                        <AvatarFallback className="bg-white/[0.12] text-white">
                          {member.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{member.name}</p>
                        <p className="text-xs text-white/50">{member.email}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {member.role} • Joined {new Date(member.joinedAt || member.invitedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

