/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useFolders } from "@/hooks/use-folders";
import { formatDistanceToNow } from "date-fns";
import { Trash2, RotateCcw, Folder, AlertTriangle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";

export const TrashList = () => {
  const user = useAppSelector((state) => state.profile);
  const {
    folders: deletedFolders,
    handleRestoreFolder,
    handlePermanentlyDeleteFolder,
    handleRestoreProject,
    handlePermanentlyDeleteProject,
  } = useFolders(user.id as Id<"users">, true); // Get deleted folders

  // Fetch deleted projects
  const deletedProjects = useQuery(
    api.projects.getUserProjects,
    user?.id
      ? {
          userId: user.id as Id<"users">,
          includeDeleted: true,
        }
      : "skip"
  );

  const [itemToDelete, setItemToDelete] = useState<{
    id: Id<"projects"> | Id<"folders">;
    name: string;
    type: "project" | "folder";
  } | null>(null);

  const confirmPermanentDelete = async () => {
    if (itemToDelete) {
      if (itemToDelete.type === "folder") {
        await handlePermanentlyDeleteFolder(itemToDelete.id as Id<"folders">);
      } else {
        await handlePermanentlyDeleteProject(itemToDelete.id as Id<"projects">);
      }
      setItemToDelete(null);
    }
  };

  const getDaysUntilPermanentDelete = (deletedAt?: number) => {
    if (!deletedAt) return null;
    const now = Date.now();
    const daysSinceDeleted = Math.floor((now - deletedAt) / (1000 * 60 * 60 * 24));
    const daysRemaining = 90 - daysSinceDeleted;
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
            <Trash2 className="h-8 w-8" />
            Trash
          </h1>
          <p className="text-muted-foreground mt-2">
            Items will be permanently deleted after 90 days
          </p>
        </div>
        <Link
          href={`/dashboard/${(user as any)?.slug || user?.name}`}
          className="flex items-center gap-2 backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] saturate-150 hover:bg-white/[0.12] text-white rounded-full px-6 py-2.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      {/* Deleted Folders section */}
      {deletedFolders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Deleted Folders</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {deletedFolders.map((folder) => {
              const daysLeft = getDaysUntilPermanentDelete(folder.deletedAt);
              return (
                <div
                  key={folder._id}
                  className="group relative p-4 rounded-lg backdrop-blur-xl bg-red-500/[0.05] border border-red-500/[0.2] hover:bg-red-500/[0.08] transition-all duration-200 saturate-150 shadow-lg"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Folder className="w-10 h-10 text-red-400/70" />
                    <h3 className="text-sm font-medium text-foreground truncate w-full">
                      {folder.name}
                    </h3>
                    {daysLeft !== null && (
                      <Badge variant="destructive" className="text-xs">
                        {daysLeft} days left
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(folder.deletedAt || 0), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-green-500/20 rounded-full"
                      onClick={() => handleRestoreFolder(folder._id)}
                      title="Restore folder"
                    >
                      <RotateCcw className="h-3 w-3 text-green-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-500/20 rounded-full"
                      onClick={() =>
                        setItemToDelete({
                          id: folder._id,
                          name: folder.name,
                          type: "folder",
                        })
                      }
                      title="Permanently delete"
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deleted Projects section */}
      {deletedProjects && deletedProjects.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Deleted Projects</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {deletedProjects.map((project: any) => {
              const daysLeft = getDaysUntilPermanentDelete(project.deletedAt);
              return (
                <div key={project._id} className="group relative">
                  <div className="space-y-3">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted relative opacity-60">
                      {project.thumbnail ? (
                        <Image
                          src={project.thumbnail}
                          alt={project.name}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Trash2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleRestoreProject(project._id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setItemToDelete({
                                id: project._id,
                                name: project.name,
                                type: "project",
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-foreground text-sm truncate">
                        {project.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(project.deletedAt || 0), {
                            addSuffix: true,
                          })}
                        </p>
                        {daysLeft !== null && (
                          <Badge variant="destructive" className="text-xs">
                            {daysLeft}d
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Empty state */}
      {deletedFolders.length === 0 && (!deletedProjects || deletedProjects.length === 0) && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Trash is empty</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Deleted items will appear here
          </p>
        </div>
      )}

      {/* Permanent delete confirmation dialog */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
      >
        <AlertDialogContent className="backdrop-blur-xl bg-black/90 border border-white/[0.12]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Permanently delete {itemToDelete?.type}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to permanently delete &quot;{itemToDelete?.name}&quot;? This
              action cannot be undone.
              {itemToDelete?.type === "folder" && (
                <span className="block mt-2 text-red-400">
                  ⚠️ All projects in this folder will also be permanently deleted!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] text-white hover:bg-white/[0.12] rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              className="backdrop-blur-xl bg-red-500/80 hover:bg-red-500 text-white border border-red-400/50 rounded-full"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

