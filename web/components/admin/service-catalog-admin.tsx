"use client";

import Image from "next/image";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GARMENT_AUDIENCES } from "@/lib/garment-audience";
import type { CatalogService, CatalogVariant, ServiceCategory } from "@/lib/service-catalog";

const selectClassName = "h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px]";

async function uploadCatalogImage(file: File) {
  const formData = new FormData();
  formData.set("image", file);
  const response = await fetch("/api/admin/service-catalog-images", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as { imagePath?: string; message?: string };
  if (!response.ok || !data.imagePath) {
    throw new Error(data.message ?? "Unable to upload image.");
  }
  return data.imagePath;
}

function CatalogImage({ path, name }: { path: string; name: string }) {
  return path ? (
    <Image src={path} alt="" width={42} height={42} className="h-10 w-10 object-contain" />
  ) : (
    <span className="flex h-10 w-10 items-center justify-center rounded bg-[#EEF5FF] text-[15px] font-semibold text-[#075DFF]">
      {name.slice(0, 1)}
    </span>
  );
}

function ImageField({ label = "Image" }: { label?: string }) {
  return (
    <label className="block text-[12px] font-medium text-[#31405A]">
      {label}
      <div className="mt-1.5 flex h-10 items-center gap-2 rounded border border-dashed border-[#C8D6E6] bg-[#F8FBFF] px-3">
        <ImagePlus className="h-4 w-4 shrink-0 text-[#075DFF]" />
        <Input
          name="image"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          className="h-auto min-w-0 rounded-none border-0 bg-transparent p-0 text-[11px] shadow-none file:mr-2 file:rounded file:border-0 file:bg-white file:px-2 file:py-1 file:text-[11px] file:font-medium file:text-[#071333]"
        />
      </div>
    </label>
  );
}

function AddCategoryDialog({
  open,
  onOpenChange,
  defaultOrder,
  category,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOrder: number;
  category: ServiceCategory | null;
  onCreated: (category: ServiceCategory) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const form = event.currentTarget;
      const values = new FormData(form);
      const file = values.get("image");
      const imagePath = file instanceof File && file.size > 0
        ? await uploadCatalogImage(file)
        : null;
      const response = await fetch(
        category ? `/api/admin/service-categories/${category.id}` : "/api/admin/service-categories",
        {
        method: category ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          audience: values.get("audience"),
          ...(category ? {} : { imagePath: imagePath ?? "" }),
          ...(category && imagePath ? { imagePath } : {}),
          displayOrder: Number(values.get("displayOrder")),
        }),
        },
      );
      const data = (await response.json()) as { category?: ServiceCategory; message?: string };
      if (!response.ok || !data.category) {
        toast.error(data.message ?? `Unable to ${category ? "update" : "create"} garment`);
        return;
      }
      onCreated(data.category);
      form.reset();
      onOpenChange(false);
      toast.success(category ? "Garment updated" : "Garment created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Unable to ${category ? "update" : "create"} garment`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit Garment" : "Add Garment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-3 p-4">
          <label className="text-[12px] font-medium text-[#31405A]">
            Garment name
            <Input name="name" required maxLength={80} defaultValue={category?.name ?? ""} className="mt-1.5" />
          </label>
          <label className="text-[12px] font-medium text-[#31405A]">
            Group
            <select name="audience" defaultValue={category?.audience ?? "other"} className={`${selectClassName} mt-1.5`}>
              {GARMENT_AUDIENCES.map((audience) => (
                <option key={audience} value={audience}>{audience === "kid" ? "Kid" : audience[0]!.toUpperCase() + audience.slice(1)}</option>
              ))}
            </select>
          </label>
          <ImageField />
          <label className="text-[12px] font-medium text-[#31405A]">
            Order
            <Input name="displayOrder" required min={0} type="number" defaultValue={category?.displayOrder ?? defaultOrder} className="mt-1.5" />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={saving} className="bg-[#075DFF]">{saving ? "Saving..." : category ? "Save" : "Add Garment"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CatalogActions({
  onAddCategory,
  onAddService,
}: {
  onAddCategory: () => void;
  onAddService?: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="outline" onClick={onAddCategory}>
        <Plus />
        Add Garment
      </Button>
      {onAddService ? (
        <Button className="bg-[#075DFF]" onClick={onAddService}>
          <Plus />
          Add Garment Service
        </Button>
      ) : null}
    </div>
  );
}

function AddServiceDialog({
  open,
  onOpenChange,
  categories,
  defaultOrder,
  service,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ServiceCategory[];
  defaultOrder: number;
  service: CatalogService | null;
  onCreated: (service: CatalogService) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const form = event.currentTarget;
      const values = new FormData(form);
      const file = values.get("image");
      const imagePath = file instanceof File && file.size > 0
        ? await uploadCatalogImage(file)
        : null;
      const response = await fetch(
        service ? `/api/admin/catalog-services/${service.id}` : "/api/admin/catalog-services",
        {
        method: service ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: values.get("categoryId"),
          name: values.get("name"),
          ...(service ? {} : { imagePath: imagePath ?? "" }),
          ...(service && imagePath ? { imagePath } : {}),
          unit: values.get("unit"),
          regularPrice: Number(values.get("regularPrice")),
          expressPrice: values.get("expressPrice"),
          turnaround: values.get("turnaround"),
          displayOrder: Number(values.get("displayOrder")),
        }),
        },
      );
      const data = (await response.json()) as { service?: CatalogService; message?: string };
      if (!response.ok || !data.service) {
        toast.error(data.message ?? `Unable to ${service ? "update" : "create"} service`);
        return;
      }
      onCreated(data.service);
      form.reset();
      onOpenChange(false);
      toast.success(service ? "Service updated" : "Service created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Unable to ${service ? "update" : "create"} service`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Garment Service" : "Add Garment Service"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="grid max-h-[75vh] gap-3 overflow-y-auto p-4 sm:grid-cols-2">
          <label className="text-[12px] font-medium text-[#31405A]">
            Garment
            <select name="categoryId" required defaultValue={service?.categoryId ?? ""} className={`${selectClassName} mt-1.5`}>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-[12px] font-medium text-[#31405A]">
            Service name
            <Input name="name" required maxLength={100} defaultValue={service?.name ?? ""} className="mt-1.5" />
          </label>
          <ImageField />
          <label className="text-[12px] font-medium text-[#31405A]">
            Unit
            <select name="unit" defaultValue={service?.unit ?? "piece"} className={`${selectClassName} mt-1.5`}>
              <option value="piece">Per piece</option>
              <option value="kg">Per kg</option>
              <option value="pair">Per pair</option>
              <option value="seat">Per seat</option>
              <option value="sq_ft">Per sq. ft.</option>
              <option value="set">Per set</option>
              <option value="fixed">Fixed price</option>
            </select>
          </label>
          <label className="text-[12px] font-medium text-[#31405A]">
            Regular price
            <Input name="regularPrice" required min={0} step="0.01" type="number" defaultValue={service?.regularPrice ?? 0} className="mt-1.5" />
          </label>
          <label className="text-[12px] font-medium text-[#31405A]">
            Express price
            <Input name="expressPrice" min={0} step="0.01" type="number" defaultValue={service?.expressPrice ?? ""} className="mt-1.5" />
          </label>
          <label className="text-[12px] font-medium text-[#31405A]">
            Turnaround
            <Input name="turnaround" required placeholder="1-2 Days" defaultValue={service?.turnaround ?? ""} className="mt-1.5" />
          </label>
          <label className="text-[12px] font-medium text-[#31405A]">
            Order
            <Input name="displayOrder" required min={0} type="number" defaultValue={service?.displayOrder ?? defaultOrder} className="mt-1.5" />
          </label>
          <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={saving} className="bg-[#075DFF]">{saving ? "Saving..." : service ? "Save" : "Add Service"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPricingDialog({
  variant,
  serviceName,
  onOpenChange,
  onSaved,
}: {
  variant: CatalogVariant | null;
  serviceName: string;
  onOpenChange: (open: boolean) => void;
  onSaved: (variant: CatalogVariant) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!variant) return;
    setSaving(true);
    try {
      const values = new FormData(event.currentTarget);
      const response = await fetch(`/api/admin/catalog-service-variants/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regularPrice: Number(values.get("regularPrice")),
          expressPrice: values.get("expressPrice"),
        }),
      });
      const data = (await response.json()) as { variant?: CatalogVariant; message?: string };
      if (!response.ok || !data.variant) {
        toast.error(data.message ?? "Unable to save price");
        return;
      }
      onSaved(data.variant);
      onOpenChange(false);
      toast.success("Price updated");
    } catch {
      toast.error("Unable to save price");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(variant)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pricing</DialogTitle>
        </DialogHeader>
        {variant ? (
          <form onSubmit={save} className="grid gap-3 p-4">
            <p className="text-[13px] font-medium text-[#071333]">{serviceName} · {variant.name}</p>
            <label className="text-[12px] font-medium text-[#31405A]">
              Regular price
              <Input name="regularPrice" required min={0} step="0.01" type="number" defaultValue={variant.regularPrice} className="mt-1.5" />
            </label>
            <label className="text-[12px] font-medium text-[#31405A]">
              Express price
              <Input name="expressPrice" min={0} step="0.01" type="number" defaultValue={variant.expressPrice ?? ""} className="mt-1.5" />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button disabled={saving} className="bg-[#075DFF]">{saving ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ServiceCategoriesAdmin({ initialCategories }: { initialCategories: ServiceCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

  function openAddCategory() {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  }

  function openEditCategory(category: ServiceCategory) {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  }

  async function toggle(category: ServiceCategory) {
    const response = await fetch(`/api/admin/service-categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !category.isActive }),
    });
    const data = (await response.json()) as { category?: ServiceCategory; message?: string };
    if (!response.ok || !data.category) {
      toast.error(data.message ?? "Unable to update category");
      return;
    }
    setCategories((current) => current.map((item) => item.id === category.id ? data.category! : item));
  }

  async function removeCategory(category: ServiceCategory) {
    if (!window.confirm(`Delete ${category.name}? All services for this garment will also be deleted.`)) return;

    const response = await fetch(`/api/admin/service-categories/${category.id}`, { method: "DELETE" });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(data.message ?? "Unable to delete garment");
      return;
    }
    setCategories((current) => current.filter((item) => item.id !== category.id));
    toast.success("Garment and its services deleted");
  }

  return (
    <div className="space-y-3">
      <CatalogActions onAddCategory={openAddCategory} />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Garment</TableHead><TableHead>Group</TableHead><TableHead>Mobile Order</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {categories.length ? categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell><CatalogImage path={category.imagePath} name={category.name} /></TableCell>
                  <TableCell><p className="font-medium">{category.name}</p><p className="mt-1 text-[11px] text-[#52627A]">{category.slug}</p></TableCell>
                  <TableCell className="capitalize">{category.audience}</TableCell>
                  <TableCell>{category.displayOrder}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Switch checked={category.isActive} onCheckedChange={() => toggle(category)} /><span className="text-[12px]">{category.isActive ? "Shown" : "Hidden"}</span></div></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" aria-label={`Edit ${category.name}`} title="Edit garment" onClick={() => openEditCategory(category)}><Pencil /></Button>
                    <Button size="icon" variant="ghost" className="text-red-600" aria-label={`Delete ${category.name}`} title="Delete garment" onClick={() => void removeCategory(category)}><Trash2 /></Button>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="h-24 text-center text-[#52627A]">No garments found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}
        defaultOrder={categories.length + 1}
        category={editingCategory}
        onCreated={(category) => setCategories((current) => {
          const next = current.some((item) => item.id === category.id)
            ? current.map((item) => item.id === category.id ? category : item)
            : [...current, category];
          return next.sort((a, b) => a.displayOrder - b.displayOrder);
        })}
      />
    </div>
  );
}

export function CatalogServicesAdmin({ initialCategories, initialServices }: { initialCategories: ServiceCategory[]; initialServices: CatalogService[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [services, setServices] = useState(initialServices);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CatalogService | null>(null);

  function openAddService() {
    setEditingService(null);
    setServiceDialogOpen(true);
  }

  function openEditService(service: CatalogService) {
    setEditingService(service);
    setServiceDialogOpen(true);
  }

  async function toggle(service: CatalogService) {
    const response = await fetch(`/api/admin/catalog-services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !service.isActive }),
    });
    const data = (await response.json()) as { service?: CatalogService; message?: string };
    if (!response.ok || !data.service) {
      toast.error(data.message ?? "Unable to update service");
      return;
    }
    setServices((current) => current.map((item) => item.id === service.id ? data.service! : item));
  }

  async function removeService(service: CatalogService) {
    if (!window.confirm(`Delete ${service.name}? Its variants will also be deleted.`)) return;

    const response = await fetch(`/api/admin/catalog-services/${service.id}`, { method: "DELETE" });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(data.message ?? "Unable to delete service");
      return;
    }
    setServices((current) => current.filter((item) => item.id !== service.id));
    toast.success("Service and its variants deleted");
  }

  function addCategory(category: ServiceCategory) {
    setCategories((current) => [...current, category].sort((a, b) => a.displayOrder - b.displayOrder));
  }

  return (
    <div className="space-y-3">
      <CatalogActions onAddCategory={() => setCategoryDialogOpen(true)} onAddService={openAddService} />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Garment</TableHead><TableHead>Unit</TableHead><TableHead>Price</TableHead><TableHead>Turnaround</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {services.length ? services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell><div className="flex items-center gap-3"><CatalogImage path={service.imagePath} name={service.name} /><div><p className="font-medium">{service.name}</p><p className="text-[11px] text-[#52627A]">{service.slug}</p></div></div></TableCell>
                  <TableCell>{service.categoryName}</TableCell>
                  <TableCell>Per {service.unit.replace("_", " ")}</TableCell>
                  <TableCell>₹{service.regularPrice}</TableCell>
                  <TableCell>{service.turnaround}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Switch checked={service.isActive} onCheckedChange={() => toggle(service)} /><span className="text-[12px]">{service.isActive ? "Shown" : "Hidden"}</span></div></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" aria-label={`Edit ${service.name}`} title="Edit service" onClick={() => openEditService(service)}><Pencil /></Button>
                    <Button size="icon" variant="ghost" className="text-red-600" aria-label={`Delete ${service.name}`} title="Delete service" onClick={() => void removeService(service)}><Trash2 /></Button>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={7} className="h-24 text-center text-[#52627A]">No services found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddCategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} defaultOrder={categories.length + 1} category={null} onCreated={addCategory} />
      <AddServiceDialog
        open={serviceDialogOpen}
        onOpenChange={(open) => {
          setServiceDialogOpen(open);
          if (!open) setEditingService(null);
        }}
        categories={categories}
        defaultOrder={services.length + 1}
        service={editingService}
        onCreated={(service) => setServices((current) => {
          const next = current.some((item) => item.id === service.id)
            ? current.map((item) => item.id === service.id ? service : item)
            : [...current, service];
          return next;
        })}
      />
    </div>
  );
}

export function ServicePricingAdmin({ initialCategories, initialServices }: { initialCategories: ServiceCategory[]; initialServices: CatalogService[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [services, setServices] = useState(initialServices);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{ serviceName: string; variant: CatalogVariant } | null>(null);

  function saveVariant(variant: CatalogVariant) {
    setServices((current) => current.map((service) => {
      if (service.id !== variant.serviceId) return service;
      const variants = service.variants.map((item) => item.id === variant.id ? variant : item);
      const first = variants[0];
      return {
        ...service,
        variants,
        ...(first && first.id === variant.id ? {
          unit: first.unit,
          regularPrice: first.regularPrice,
          expressPrice: first.expressPrice,
        } : {}),
      };
    }));
  }

  return (
    <div className="space-y-3">
      <CatalogActions onAddCategory={() => setCategoryDialogOpen(true)} />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Variant</TableHead><TableHead>Unit</TableHead><TableHead>Regular Price</TableHead><TableHead>Express Price</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {services.flatMap((service) => service.variants.map((variant) => ({ service, variant }))).length ? services.flatMap((service) => service.variants.map((variant) => ({ service, variant }))).map(({ service, variant }) => (
                <TableRow key={variant.id}>
                  <TableCell><p className="font-medium">{service.name}</p><p className="text-[11px] text-[#52627A]">{service.categoryName}</p></TableCell>
                  <TableCell>{variant.name}</TableCell>
                  <TableCell>Per {variant.unit.replace("_", " ")}</TableCell>
                  <TableCell>₹{variant.regularPrice}</TableCell>
                  <TableCell>{variant.expressPrice === null ? "—" : `₹${variant.expressPrice}`}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setSelectedVariant({ serviceName: service.name, variant })}><Pencil /><span className="sr-only sm:not-sr-only sm:ml-1">Edit</span></Button></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="h-24 text-center text-[#52627A]">No variants found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddCategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} defaultOrder={categories.length + 1} category={null} onCreated={(category) => setCategories((current) => [...current, category].sort((a, b) => a.displayOrder - b.displayOrder))} />
      <EditPricingDialog variant={selectedVariant?.variant ?? null} serviceName={selectedVariant?.serviceName ?? ""} onOpenChange={(open) => { if (!open) setSelectedVariant(null); }} onSaved={(variant) => { saveVariant(variant); setSelectedVariant(null); }} />
    </div>
  );
}
