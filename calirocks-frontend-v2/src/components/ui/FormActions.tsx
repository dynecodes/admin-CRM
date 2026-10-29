import React from "react";
import { Button } from "flowbite-react";

interface FormActionsProps {
  onCancel: () => void;
  isPending: boolean;
  isEditing: boolean;
  cancelText?: string;
  submitText?: string;
  editText?: string;
  disabled?: boolean;
  className?: string;

  showStatusToggle?: boolean;
  status?: "active" | "archived";
  onStatusToggle?: () => void;

  showDelete?: boolean;
  onDelete?: () => void;
  showSubmit?: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  isPending,
  isEditing,
  cancelText = "Cancel",
  submitText = "Create",
  editText = "Update",
  disabled = false,
  className = "",
  showStatusToggle = false,
  status = "active",
  onStatusToggle,
  showDelete = false,
  onDelete,
  showSubmit = true,
}) => {
  return (
    <div
      className={`flex flex-col gap-3 pt-6 sm:flex-row sm:justify-end sm:gap-4 ${className}`}
    >
      {showDelete && onDelete && (
        <Button
          type="button"
          onClick={onDelete}
          disabled={isPending || disabled}
          color="red"
          className="order-first w-full cursor-pointer sm:order-none sm:w-32"
        >
          Delete
        </Button>
      )}
      {showStatusToggle && onStatusToggle && (
        <Button
          color={status === "active" ? "warning" : "success"}
          onClick={onStatusToggle}
          disabled={isPending || disabled}
          type="button"
          className={`order-first w-full cursor-pointer sm:order-none sm:w-32 ${
            status === "active"
              ? "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300"
              : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-300"
          }`}
        >
          {status === "active" ? "Archive" : "Activate"}
        </Button>
      )}
      <Button
        color="light"
        onClick={onCancel}
        disabled={isPending || disabled}
        type="button"
        className="w-full cursor-pointer sm:w-32"
      >
        {cancelText}
      </Button>
      {showSubmit && (
        <Button
          color="gray"
          type="submit"
          disabled={isPending || disabled}
          className="w-full cursor-pointer sm:w-33"
        >
          {isPending ? "Saving..." : isEditing ? editText : submitText}
        </Button>
      )}
    </div>
  );
};

export default FormActions;
