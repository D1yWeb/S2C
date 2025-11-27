import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all users (for searching/inviting)
export const searchUsers = query({
  args: {
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { searchQuery, limit = 20 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all users from auth tables
    let users = await ctx.db.query("users").collect();

    // Filter out current user
    users = users.filter((u) => u._id !== userId);

    // Filter by search query if provided
    if (searchQuery && searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      users = users.filter((user) => {
        const email = (user.email || "").toLowerCase();
        const name = (user.name || "").toLowerCase();
        const extractedName = email.split("@")[0] || "";
        return email.includes(queryLower) || name.includes(queryLower) || extractedName.includes(queryLower);
      });
    }

    // Limit results
    if (limit) {
      users = users.slice(0, limit);
    }

    return users.map((user) => ({
      _id: user._id,
      email: user.email || "",
      name: user.name || user.email?.split("@")[0] || "User",
      image: user.image,
    }));
  },
});

// Get team members for a project
export const getProjectTeamMembers = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId && !project.isPublic) {
      throw new Error("Access denied");
    }

    // Get all team members for this project
    const allMembers = await ctx.db
      .query("project_team_members")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .collect();
    
    // Filter for accepted members only (have joinedAt)
    const teamMembers = allMembers.filter((member) => member.joinedAt !== undefined);

    // Get user details for each team member
    const membersWithDetails = await Promise.all(
      teamMembers.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          _id: member._id,
          userId: member.userId,
          projectId: member.projectId,
          role: member.role,
          invitedAt: member.invitedAt,
          joinedAt: member.joinedAt,
          email: user?.email || "",
          name: user?.name || user?.email?.split("@")[0] || "User",
          image: user?.image,
        };
      })
    );

    return membersWithDetails;
  },
});

// Invite a team member to a project
export const inviteTeamMember = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.optional(v.string()), // "viewer" | "editor" | "admin"
  },
  handler: async (ctx, { projectId, userId, role = "editor" }) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    // Check if current user owns the project
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== currentUserId) {
      throw new Error("Only project owner can invite members");
    }

    // Check if user is already a team member
    const existingMember = await ctx.db
      .query("project_team_members")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existingMember) {
      throw new Error("User is already a team member");
    }

    // Don't allow inviting yourself
    if (userId === currentUserId) {
      throw new Error("Cannot invite yourself");
    }

    // Create team member entry (pending invite - no joinedAt yet)
    const teamMemberId = await ctx.db.insert("project_team_members", {
      projectId,
      userId,
      role,
      invitedAt: Date.now(),
      joinedAt: undefined, // Pending until user accepts
    });

    return { teamMemberId };
  },
});

// Get pending invites for current user
export const getPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all team member entries where user is invited but hasn't joined
    const allInvites = await ctx.db
      .query("project_team_members")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    
    // Filter for pending invites (no joinedAt)
    const pendingInvites = allInvites.filter((invite) => !invite.joinedAt);

    // Get project details for each invite
    const invitesWithProjects = await Promise.all(
      pendingInvites.map(async (invite) => {
        const project = await ctx.db.get(invite.projectId);
        if (!project) return null;

        // Get project owner details
        const owner = await ctx.db.get(project.userId);
        
        return {
          _id: invite._id,
          projectId: invite.projectId,
          projectName: project.name,
          projectThumbnail: project.thumbnail,
          role: invite.role,
          invitedAt: invite.invitedAt,
          ownerName: owner?.name || owner?.email?.split("@")[0] || "User",
          ownerEmail: owner?.email || "",
        };
      })
    );

    return invitesWithProjects.filter((invite): invite is NonNullable<typeof invite> => invite !== null);
  },
});

// Accept a team invite
export const acceptInvite = mutation({
  args: {
    teamMemberId: v.id("project_team_members"),
  },
  handler: async (ctx, { teamMemberId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const teamMember = await ctx.db.get(teamMemberId);
    if (!teamMember) throw new Error("Invite not found");
    
    // Check if this invite belongs to the current user
    if (teamMember.userId !== userId) {
      throw new Error("This invite does not belong to you");
    }

    // Check if already accepted
    if (teamMember.joinedAt) {
      throw new Error("Invite already accepted");
    }

    // Update to mark as accepted
    await ctx.db.patch(teamMemberId, {
      joinedAt: Date.now(),
    });

    return { success: true, projectId: teamMember.projectId };
  },
});

// Decline/Remove a team invite
export const declineInvite = mutation({
  args: {
    teamMemberId: v.id("project_team_members"),
  },
  handler: async (ctx, { teamMemberId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const teamMember = await ctx.db.get(teamMemberId);
    if (!teamMember) throw new Error("Invite not found");
    
    // Check if this invite belongs to the current user or if user is project owner
    const project = await ctx.db.get(teamMember.projectId);
    if (!project) throw new Error("Project not found");
    
    if (teamMember.userId !== userId && project.userId !== userId) {
      throw new Error("You don't have permission to decline this invite");
    }

    await ctx.db.delete(teamMemberId);
    return { success: true };
  },
});

// Remove a team member from a project
export const removeTeamMember = mutation({
  args: {
    teamMemberId: v.id("project_team_members"),
  },
  handler: async (ctx, { teamMemberId }) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const teamMember = await ctx.db.get(teamMemberId);
    if (!teamMember) throw new Error("Team member not found");

    // Check if current user owns the project
    const project = await ctx.db.get(teamMember.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== currentUserId) {
      throw new Error("Only project owner can remove members");
    }

    await ctx.db.delete(teamMemberId);
    return { success: true };
  },
});

