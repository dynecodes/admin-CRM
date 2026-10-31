import * as React from "react";
import { Textarea } from "flowbite-react";

type Props = React.ComponentProps<typeof Textarea> & {
  maxRows?: number; // visual line limit
};

const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ maxRows = 5, className = "", value, onChange, ...rest }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    React.useImperativeHandle(
      ref,
      () => innerRef.current as HTMLTextAreaElement,
    );

    const [, setIsLocked] = React.useState(false);

    const syncHeight = React.useCallback(() => {
      const el = innerRef.current;
      if (!el) return;

      el.style.height = "auto";
      const styles = window.getComputedStyle(el);

      const lineHeight = parseInt(styles.lineHeight || "20", 10);
      const maxHeight = lineHeight * maxRows;

      if (el.scrollHeight >= maxHeight) {
        el.style.height = `${maxHeight}px`;
        el.style.overflow = "hidden";
        setIsLocked(true);
      } else {
        el.style.height = `${el.scrollHeight}px`;
        el.style.overflow = "hidden";
        setIsLocked(false);
      }
    }, [maxRows]);

    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
      const el = innerRef.current;
      if (!el) return;

      const styles = window.getComputedStyle(el);
      const lineHeight = parseInt(styles.lineHeight || "20", 10);
      const maxHeight = lineHeight * maxRows;

      // If already at max rows, BLOCK MORE INPUT unless deleting
      if (
        el.scrollHeight >= maxHeight &&
        e.target.value.length > (value as string).length
      ) {
        return; // block new characters
      }

      onChange?.(e);

      requestAnimationFrame(syncHeight);
    };

    React.useEffect(() => {
      syncHeight();
    }, [syncHeight, value]);

    return (
      <Textarea
        {...rest}
        ref={innerRef}
        value={value}
        rows={1}
        onChange={handleChange}
        className={`no-scrollbar resize-none ${className}`}
      />
    );
  },
);

AutoGrowTextarea.displayName = "AutoGrowTextarea";

export default AutoGrowTextarea;
