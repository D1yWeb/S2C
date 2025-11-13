import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const runCleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000); // 90 days in milliseconds

    console.log("🧹 [Cleanup] Starting cleanup of items older than 90 days...");

    // Clean up old deleted folders
    const allFolders = await ctx.db.query("folders").collect();
    const foldersToDelete = allFolders.filter(
      (folder) => folder.isDeleted && folder.deletedAt && folder.deletedAt < ninetyDaysAgo
    );

    let cleanedFolders = 0;
    for (const folder of foldersToDelete) {
      // Permanently delete all projects in this folder
      const projectsInFolder = await ctx.db
        .query("projects")
        .withIndex("by_folderId", (q) => q.eq("folderId", folder._id))
        .collect();

      for (const project of projectsInFolder) {
        await ctx.db.delete(project._id);
      }

      // Permanently delete the folder
      await ctx.db.delete(folder._id);
      cleanedFolders++;
      console.log("🗑️ [Cleanup] Folder permanently deleted:", folder._id);
    }

    // Clean up old deleted projects (not in folders)
    const allProjects = await ctx.db.query("projects").collect();
    const projectsToDelete = allProjects.filter(
      (project) => project.isDeleted && project.deletedAt && project.deletedAt < ninetyDaysAgo
    );

    let cleanedProjects = 0;
    for (const project of projectsToDelete) {
      await ctx.db.delete(project._id);
      cleanedProjects++;
      console.log("🗑️ [Cleanup] Project permanently deleted:", project._id);
    }

    console.log(
      `✅ [Cleanup] Cleanup completed: ${cleanedFolders} folders and ${cleanedProjects} projects deleted`
    );

    return { 
      cleanedFolders, 
      cleanedProjects,
      totalCleaned: cleanedFolders + cleanedProjects 
    };
  },
});

