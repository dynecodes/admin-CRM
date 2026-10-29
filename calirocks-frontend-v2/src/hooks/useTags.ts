import * as React from "react";
import usePrivateService from "./Auth/usePrivateService";
import type { Tag, TagFormData, TagColor } from "../types/tag";

/* ---------------- helpers ---------------- */

const VALID_COLORS: TagColor[] = ["blue", "yellow", "orange", "purple"];

function normalizeColor(color: any): TagColor {
  if (VALID_COLORS.includes(color)) return color as TagColor;
  const lower = String(color ?? "").toLowerCase();
  const found = VALID_COLORS.find((c) => c === lower);
  return (found ?? "blue") as TagColor;
}

function mapApiToTag(row: any): Tag {
  const created = row.created_at ?? row.createdAt;
  const updated = row.updated_at ?? row.updatedAt;

  return {
    id: Number(row.id),
    tag_name: String(row.tag_name ?? row.tagName ?? "").trim(),
    tag_color: normalizeColor(row.tag_color ?? row.tagColor),
    customer_count: Number(row.customer_count ?? row.customerCount ?? 0),
    provider_count: Number(row.provider_count ?? row.providerCount ?? 0),
    created_at: created ? new Date(created).toISOString() : new Date().toISOString(),
    updated_at: updated ? new Date(updated).toISOString() : new Date().toISOString(),
  };
}

/* ---------------- validation ---------------- */

const validateTag = (data: TagFormData) => {
  const name = data.tag_name?.trim() ?? "";

  if (!name || name.length < 2) {
    throw new Error("Tag name must be at least 2 characters");
  }
  if (name.length > 40) {
    throw new Error("Tag name must not exceed 40 characters");
  }
};

/* ---------------- hook ---------------- */

export const useTags = () => {
  const api = usePrivateService();
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTags = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/tags");
      const raw = res.data?.data ?? res.data ?? [];
      const list: Tag[] = raw.map(mapApiToTag);
      setTags(list);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to fetch tags";
      setError(msg);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const addTag = React.useCallback(
    async (tagData: TagFormData): Promise<Tag> => {
      setLoading(true);
      setError(null);
      try {
        validateTag(tagData);

        const payload = {
          tag_name: tagData.tag_name.trim(),
          tag_color: tagData.tag_color,
        };

        const res = await api.post("/tags", payload);
        const created = mapApiToTag(res.data?.data ?? res.data);
        // put newest first
        setTags((prev) => [created, ...prev]);
        return created;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to create tag";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const updateTag = React.useCallback(
    async (id: number, tagData: TagFormData): Promise<Tag> => {
      setLoading(true);
      setError(null);
      try {
        validateTag(tagData);

        const payload = {
          tag_name: tagData.tag_name.trim(),
          tag_color: tagData.tag_color,
        };

        const res = await api.put(`/tags/${id}`, payload);
        const updated = mapApiToTag(res.data?.data ?? res.data);
        setTags((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to update tag";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const deleteTag = React.useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`/tags/${id}`);
        setTags((prev) => prev.filter((t) => t.id !== id));
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "Failed to delete tag";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  return {
    tags,
    loading,
    error,
    fetchTags,
    addTag,
    updateTag,
    deleteTag,
  };
};
