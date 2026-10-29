import { useEffect, useRef } from 'react';

export const useDraggableModal = (isOpen: boolean) => {
  const isDraggingRef = useRef(false);
  const positionRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const modalElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      positionRef.current = { x: 0, y: 0 };
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      modalElementRef.current = null;
      return;
    }

    // Find and cache the modal element
    const findModal = () => {
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modal) {
        modalElementRef.current = modal;
        modal.style.transform = 'translate(0px, 0px)';
      }
    };

    const timer = setTimeout(findModal, 50);

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isDragHandle = target.closest('.modal-drag-handle');
      const isButton = target.closest('button');
      
      if (isDragHandle && !isButton && modalElementRef.current) {
        isDraggingRef.current = true;
        dragStartRef.current = {
          x: e.clientX - positionRef.current.x,
          y: e.clientY - positionRef.current.y
        };
        e.preventDefault();
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !modalElementRef.current) return;
      
      e.preventDefault();
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      positionRef.current = { x: newX, y: newY };
      
      // Direct DOM manipulation for smooth dragging
      modalElementRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
      modalElementRef.current.style.transition = 'none';
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isOpen]);

  return {};
};