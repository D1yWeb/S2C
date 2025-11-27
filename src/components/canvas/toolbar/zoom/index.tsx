import { Button } from "@/components/ui/button";
import { useInfiniteCanvas } from "@/hooks/use-canvas";
import { setScale } from "@/redux/slice/viewport";
import { ZoomOut, ZoomIn, Keyboard } from "lucide-react";
import React from "react";
import { useDispatch } from "react-redux";

export const ZoomBar = () => {
  const dispatch = useDispatch();
  const { viewport } = useInfiniteCanvas();

  const handleZoomIn = () => {
    const newScale = Math.min(viewport.scale * 1.2, viewport.maxScale);
    dispatch(setScale({ scale: newScale }));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(viewport.scale / 1.2, viewport.minScale);
    dispatch(setScale({ scale: newScale }));
  };

  const handleShortcutsClick = () => {
    // Dispatch a custom event to open shortcuts dialog
    window.dispatchEvent(new CustomEvent('open-shortcuts-dialog'));
  };

  return (
    <div className="col-span-1 flex justify-end items-center gap-2">
      <div className="flex items-center gap-1 backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] rounded-full p-3 saturate-150">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleZoomOut}
          className="w-9 h-9 p-0 rounded-full cursor-pointer hover:bg-white/[0.12] border border-transparent hover:border-white/[0.16] transition-all"
          title="Zoom Out">
          <ZoomOut className="w-4 h-4 text-primary/50" />
        </Button>

        <div className="text-center">
          <span className="text-sm font-mono leading-none text-primary/50">
            {Math.round(viewport.scale * 100)}%
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="w-9 h-9 p-0 rounded-full cursor-pointer hover:bg-white/[0.12] border border-transparent hover:border-white/[0.16] transition-all"
          title="Zoom In">
          <ZoomIn className="w-4 h-4 text-primary/50" />
        </Button>
      </div>
      
      <Button
        variant="ghost"
        size="lg"
        onClick={handleShortcutsClick}
        className="w-9 h-9 p-0 rounded-full cursor-pointer hover:bg-white/[0.12] border border-transparent hover:border-white/[0.16] transition-all backdrop-blur-xl bg-white/[0.08] border-white/[0.12] saturate-150"
        title="Keyboard Shortcuts (?)">
        <Keyboard className="w-4 h-4 text-primary/50" />
      </Button>
    </div>
  );
};
