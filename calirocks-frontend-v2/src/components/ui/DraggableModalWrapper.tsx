import React, { useEffect, useRef, useState } from "react";

type DraggableModalWrapperProps = {
  children: React.ReactNode;
  /** When true, wrapper resets to (0,0) on open (centered by parent flex) */
  isOpen: boolean;
  /** CSS selector for the drag handle. Default: '[data-drag-handle]' */
  handleSelector?: string;
  /** Optional class for the outer draggable container */
  className?: string;
};

const DraggableModalWrapper: React.FC<DraggableModalWrapperProps> = ({
  children,
  isOpen,
  handleSelector = "[data-drag-handle]",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Center on open
  useEffect(() => {
    if (isOpen) setPosition({ x: 0, y: 0 });
  }, [isOpen]);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;

    // Only start dragging if user grabbed the handle
    const handle = el.querySelector(handleSelector);
    if (!handle) return;

    if (!(handle as HTMLElement).contains(e.target as Node)) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const onUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? "none" : "transform 0.2s ease",
        cursor: isDragging ? "grabbing" : "default",
      }}
      className={className}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
};

export default DraggableModalWrapper;
