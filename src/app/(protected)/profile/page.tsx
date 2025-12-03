"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/store";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Save, Check, Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";

const Page = () => {
  const profile = useAppSelector((state) => state.profile);
  const updateName = useMutation(api.user.updateUserName);
  const generateUploadUrl = useMutation(api.user.generateProfileImageUploadUrl);
  const updateProfileImage = useMutation(api.user.updateProfileImage);
  const removeProfileImage = useMutation(api.user.removeProfileImage);
  
  const [name, setName] = useState(profile?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateName({ name: name.trim() });
      toast.success("Profile updated!");
      
      // Reload page to get fresh data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await result.json();

      // Update profile with new image
      await updateProfileImage({ storageId: storageId as Id<"_storage"> });
      
      toast.success("Profile image updated!");
      
      // Reload page to get fresh data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      setPreviewImage(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = async () => {
    setIsUploadingImage(true);
    try {
      await removeProfileImage();
      setPreviewImage(null);
      toast.success("Profile image removed!");
      
      // Reload page to get fresh data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={previewImage || profile.image} />
              <AvatarFallback className="text-2xl">
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <Button
              onClick={handleImageClick}
              disabled={isUploadingImage}
              size="icon"
              className="absolute bottom-3 right-0 rounded-full w-8 h-8 bg-primary hover:bg-primary/90"
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </Button>
            {(profile.image || previewImage) && (
              <Button
                onClick={handleRemoveImage}
                disabled={isUploadingImage}
                size="icon"
                variant="destructive"
                className="absolute bottom-3 left-0 rounded-full w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Your Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click the camera icon to upload a new profile picture (max 5MB)
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] shadow-xl saturate-150">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal details here
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-white/[0.05] border-white/[0.12] text-white"
              />
              <p className="text-xs text-muted-foreground">
                This is how your name will appear in the application
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-white/[0.02] border-white/[0.08] text-white/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={profile.slug || ""}
                disabled
                className="bg-white/[0.02] border-white/[0.08] text-white/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Generated from your display name
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setName(profile.name || "")}
              className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.08] text-white rounded-full"
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || name === profile.name}
              className="backdrop-blur-xl bg-primary hover:bg-primary/90 text-white rounded-full"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.08] mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID:</span>
              <span className="text-foreground font-mono text-xs">{profile.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email Verified:</span>
              <span className="text-foreground">
                {profile.emailVerifiedAtMs ? (
                  <span className="flex items-center gap-1 text-green-400">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  "Not verified"
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Created:</span>
              <span className="text-foreground">
                {new Date(profile.createdAtMs).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;

