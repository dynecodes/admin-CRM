import * as React from "react";
import CheckboxDropdown, { type CDItem } from "../ui/DropDownButton";

type IdLike = string | number;

export type TypeOfServiceModel = {
  frequencyId: string; 
  categoryId: string; 
  serviceId: string;  
};

export type TypeOfServiceErrors = {
  frequencyId?: string;
  categoryId?: string;
  serviceId?: string;
};

export type CategoryInput = {
  id: IdLike;
  name: string;
  status?: string;
  services?: Array<{ id: IdLike; name: string }>;
};

export type FrequencyInput = {
  id: IdLike;
  name: string;
  discount_value?: number | string;
  discountValue?: number | string;
};

const getId = (x: { id?: IdLike } | undefined) =>
  x?.id != null ? String(x.id) : "";

const firstNonNull = (...vals: any[]) => vals.find((v) => v != null);

const getDiscountPct = (f: FrequencyInput) =>
  Number(firstNonNull(f.discount_value, f.discountValue, 0)) || 0;

type Props = {
  value: TypeOfServiceModel;
  onChange: (next: TypeOfServiceModel) => void;
  className?: string;
  errors?: TypeOfServiceErrors;
  categories: CategoryInput[];
  frequencies: FrequencyInput[];
  hideArchivedCategories?: boolean;
  autoSeedDefaults?: boolean; 
};

const TypeOfServiceSection: React.FC<Props> = ({
  value,
  onChange,
  className,
  errors,
  categories,
  frequencies,
  hideArchivedCategories = true,
  autoSeedDefaults = true,
}) => {
  const catsNorm = React.useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    const filtered = hideArchivedCategories
      ? list.filter((c) => String(c.status ?? "active") !== "archived")
      : list;
    return filtered.map((c) => ({ idStr: getId(c), name: c.name, services: c.services ?? [] }));
  }, [categories, hideArchivedCategories]);

  const freqsNorm = React.useMemo(
    () =>
      (frequencies ?? []).map((f) => ({
        idStr: getId(f),
        name: f.name,
        discountPct: getDiscountPct(f),
      })),
    [frequencies]
  );

  const catToEmbeddedServices = React.useMemo(() => {
    const map = new Map<string, Array<{ idStr: string; name: string }>>();
    catsNorm.forEach((c) => {
      map.set(
        c.idStr,
        (c.services ?? []).map((s) => ({ idStr: String(s.id), name: s.name }))
      );
    });
    return map;
  }, [catsNorm]);

  const svcItems = React.useMemo(() => {
    if (!value.categoryId) return [] as Array<{ value: string; label: string }>;
    const embedded = catToEmbeddedServices.get(value.categoryId) ?? [];
    return embedded.map((s) => ({ value: s.idStr, label: s.name }));
  }, [value.categoryId, catToEmbeddedServices]);

  const freqItems: CDItem[] = React.useMemo(
    () =>
      freqsNorm.map((f) => ({
        value: f.idStr,
        label: f.discountPct ? `${f.name} (${f.discountPct}% off for next booking)` : f.name,
      })),
    [freqsNorm]
  );

  const catItems: CDItem[] = React.useMemo(
    () => catsNorm.map((c) => ({ value: c.idStr, label: c.name })),
    [catsNorm]
  );

  React.useEffect(() => {
    if (!autoSeedDefaults) return;            // <-- only on create
    if (!value.frequencyId && freqItems.length > 0) {
      onChange({ ...value, frequencyId: freqItems[0].value });
    }
    if (!value.categoryId && catItems.length > 0) {
      onChange({ ...value, categoryId: catItems[0].value, serviceId: "" });
    }
  }, [autoSeedDefaults, freqItems.length, catItems.length]);

React.useEffect(() => {
    if (!autoSeedDefaults) return;            // <-- only on create
    if (!value.categoryId) return;
    if (value.serviceId) return;
    if (svcItems.length === 0) return;
    onChange({ ...value, serviceId: svcItems[0].value });
  }, [autoSeedDefaults, value.categoryId, svcItems.length]);

React.useEffect(() => {
    if (!value.serviceId) return;
    const exists = svcItems.some((s) => s.value === value.serviceId);
    // On edit, don't blow away backend's service if it's not in current list
    if (!exists && autoSeedDefaults) onChange({ ...value, serviceId: "" });
  }, [autoSeedDefaults, value.categoryId, svcItems.map((s) => s.value).join("|")]);
  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4">
        <CheckboxDropdown
          label="Frequency"
          items={freqItems}
          values={value.frequencyId ? [value.frequencyId] : []}
          onChange={(next) => onChange({ ...value, frequencyId: next[0] ?? "" })}
          single
          placeholder={freqItems.length ? "Select frequency" : "No frequencies"}
          disabled={freqItems.length === 0}
          errorText={errors?.frequencyId}
        />

        <CheckboxDropdown
          label="Category"
          items={catItems}
          values={value.categoryId ? [value.categoryId] : []}
          onChange={(next) =>
            onChange({ ...value, categoryId: next[0] ?? "", serviceId: "" })
          }
          single
          placeholder={catItems.length ? "Select category" : "No categories"}
          disabled={catItems.length === 0}
          errorText={errors?.categoryId}
        />

        <CheckboxDropdown
          label="Service"
          items={svcItems}
          values={value.serviceId ? [value.serviceId] : []}
          onChange={(next) => onChange({ ...value, serviceId: next[0] ?? "" })}
          single
          placeholder={
            !value.categoryId
              ? "Select a category first"
              : svcItems.length
              ? "Select service"
              : "No services in this category"
          }
          disabled={!value.categoryId || svcItems.length === 0}
          errorText={errors?.serviceId}
        />
      </div>
    </div>
  );
};

export default TypeOfServiceSection;
