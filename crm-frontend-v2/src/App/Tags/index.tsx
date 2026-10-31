// src/App/Tags/index.tsx
import React, { useMemo, useState } from "react";
import AppDataTable from "../../components/ui/AppDataTable";
import { useTags } from "../../hooks/useTags";
import { Tag, TagColor } from "../../types/tag";
import { Button, Badge, Label } from "flowbite-react";
import { HiTag, HiTrash } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import TagEditForm from "../../components/tags/TagEditForm";
import { TextInput } from "../../components/ui/InputsBundle";

const TAG_COLORS: Record<
  TagColor,
  { primary: string; bg: string; label: string; textColor?: string }
> = {
  blue: { primary: "#1976f2", bg: "#e3f2fd", label: "Blue" },
  yellow: { primary: "#f5f117", bg: "#ffffe0", label: "Yellow", textColor: "#1a1a1a" },
  orange: { primary: "#ff9800", bg: "#fff3e0", label: "Orange" },
  purple: { primary: "#9c27b0", bg: "#f3e5f5", label: "Purple" },
};

const COLOR_ORDER: TagColor[] = ["blue", "yellow", "orange", "purple"];

const Tags: React.FC = () => {
  const navigate = useNavigate();
  const { tags, addTag, updateTag, deleteTag } = useTags();

  // ---------- state for new tag ----------
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<TagColor>("blue");
  const [newTagError, setNewTagError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---------- actions ----------
  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      setNewTagError("Please enter a tag name");
      return;
    }

    if (newTagError) return;

    setSubmitting(true);
    setNewTagError("");
    try {
      await addTag({
        tag_name: newTagName.trim(),
        tag_color: newTagColor,
      });
      setNewTagName("");
      setNewTagColor("blue");
    } catch (error) {
      setNewTagError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelNewTag = () => {
    setNewTagName("");
    setNewTagColor("blue");
    setNewTagError("");
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (window.confirm(`Are you sure you want to delete the tag "${tag.tag_name}"?`)) {
      try {
        await deleteTag(tag.id);
      } catch (error) {
        console.error("Failed to delete tag:", error);
      }
    }
  };

  // ---------- table columns ----------
  const columns = useMemo(
    () => [
      {
        name: "Tag",
        selector: (row: Tag) => row.tag_name,
        sortable: true,
        width: "42%",
        cell: (row: Tag) => {
          const colorConfig = TAG_COLORS[row.tag_color as TagColor];
          return (
            <div className="flex items-center">
              <div className="ps-2">
                <Badge
                  style={{
                    backgroundColor: colorConfig.primary,
                    color:
                      row.tag_color === "yellow"
                        ? colorConfig.textColor || "#1a1a1a"
                        : "white",
                  }}
                  className="font-medium text-xs px-2 py-1"
                >
                  {row.tag_name}
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        name: "Customers",
        selector: (row: Tag) => row.customer_count,
        sortable: true,
        width: "20%",
        cell: (row: Tag) =>
          row.customer_count > 0 ? (
            <button
              type="button"
              onClick={() => {
                navigate(`/admin/tags/${row.id}/customers`);
              }}
              className="text-sm text-gray-900 hover:text-gray-500  cursor-pointer"
            >
              {row.customer_count} Customers
            </button>
          ) : (
            <div className="text-sm text-gray-900  hover:text-gray-500  cursor-pointer">0</div>
          ),
      },
      {
        name: "Providers",
        selector: (row: Tag) => row.provider_count,
        sortable: true,
        width: "20%",
        cell: (row: Tag) => (
          <div className="text-sm text-gray-900 hover:text-gray-500  cursor-pointer">{row.provider_count} Team</div>
        ),
      },
      {
        name: "Actions",
        width: "18%",
        ignoreRowClick: true,
        cell: (row: Tag) => (
          <div className="py-2">
            <Button
              size="xs"
              onClick={() => handleDeleteTag(row)}
              color="red"
              className="w-full min-w-[80px] cursor-pointer"
            >
              <HiTrash className="mr-1 h-3 w-3" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const sortOptions = [
    {
      value: "name",
      label: "Name",
      sortFn: (a: Tag, b: Tag) => a.tag_name.localeCompare(b.tag_name),
    },
    {
      value: "newest",
      label: "Newest",
      sortFn: (a: Tag, b: Tag) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
    {
      value: "oldest",
      label: "Oldest",
      sortFn: (a: Tag, b: Tag) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      value: "color",
      label: "Color",
      sortFn: (a: Tag, b: Tag) => {
        const colorOrder: TagColor[] = ["blue", "yellow", "orange", "purple"];
        const colorDiff =
          colorOrder.indexOf(a.tag_color) - colorOrder.indexOf(b.tag_color);
        if (colorDiff === 0) {
          return a.tag_name.localeCompare(b.tag_name);
        }
        return colorDiff;
      },
    },
  ];

  return (
    <div className="px-4 sm:px-5 pb-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex items-center justify-center w-12 h-12 overflow-hidden bg-black rounded-full">
            <HiTag className="w-6 h-6 text-white" />
          </div>
          <div className="font-medium">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">
              Tags ({tags.length})
            </span>
            <div className="text-sm text-gray-500">Create and manage tags</div>
          </div>
        </div>
      </div>

      {/* Create new tag section */}
      <div className="p-4 sm:p-7 bg-white border border-gray-200 rounded-md mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Create New Tag
        </h3>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <Label
              htmlFor="new-tag-name"
              className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium"
            >
              Tag Name
            </Label>
            <TextInput
              id="new-tag-name"
              type="text"
              placeholder="Enter tag name"
              value={newTagName}
              onChange={(e) => {
                setNewTagName(e.target.value);
                if (newTagError) setNewTagError("");
              }}
              maxLength={40}
              className="block w-full px-2.5 py-2 sm:p-2.5 text-xs sm:text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            {newTagError && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">
                {newTagError}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <Label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium">
                Choose Color
              </Label>
              <div className="flex gap-2 sm:gap-3">
                {COLOR_ORDER.map((color) => {
                  const config = TAG_COLORS[color];
                  const isSelected = newTagColor === color;

                  return (
                    <div
                      key={color}
                      className="flex flex-col items-center gap-1 cursor-pointer"
                      onClick={() => setNewTagColor(color)}
                    >
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm ${
                          isSelected
                            ? "ring-2 ring-gray-900 ring-offset-2"
                            : ""
                        }`}
                        style={{ backgroundColor: config.primary }}
                      />
                      <span className="text-xs text-gray-600">
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                color="light"
                onClick={handleCancelNewTag}
                className="cursor-pointer w-full sm:w-32 order-1 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                color="gray"
                onClick={handleAddTag}
                disabled={submitting || !newTagName.trim() || !!newTagError}
                className="cursor-pointer w-full sm:w-32 order-2 sm:order-2"
              >
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tags table */}
      <AppDataTable
        data={tags}
        columns={columns}
        searchPlaceholder="Search tags..."
        searchKeys={["tag_name"]}
        sortOptions={sortOptions}
        defaultSort="name"
        enableInlineEdit
        renderEditForm={(tag: Tag, onSaveInline, onCancelInline) => (
          <TagEditForm
            tag={tag}
            onSave={async (formData) => {
              await updateTag(tag.id, formData);
              onSaveInline(formData);   // collapse row
            }}
            onCancel={onCancelInline}
            onDelete={async () => {
              await deleteTag(tag.id);
              onCancelInline();
            }}
          />
        )}
      />
    </div>
  );
};

export default Tags;
