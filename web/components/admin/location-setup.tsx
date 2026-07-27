"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  Building2,
  Ruler,
  MapPinned,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SetupCity, SetupState } from "@/lib/locations";
import type { SetupRole } from "@/lib/roles";
import type {
  SetupInventoryCategory,
  SetupInventoryUnit,
} from "@/lib/inventory-setup";
import { cn } from "@/lib/utils";

type Tab = "states" | "cities" | "roles" | "categories" | "units";
type DialogMode = "state" | "city" | "role" | "category" | "unit" | null;
type ApiResult = {
  message?: string;
  state?: SetupState;
  city?: SetupCity;
};

async function readResult(response: Response) {
  return (await response.json()) as ApiResult;
}

export function LocationSetup({
  initialStates,
  initialCities,
  initialRoles,
  initialInventoryCategories,
  initialInventoryUnits,
}: {
  initialStates: SetupState[];
  initialCities: SetupCity[];
  initialRoles: SetupRole[];
  initialInventoryCategories: SetupInventoryCategory[];
  initialInventoryUnits: SetupInventoryUnit[];
}) {
  const [tab, setTab] = useState<Tab>("states");
  const [states, setStates] = useState(initialStates);
  const [cities, setCities] = useState(initialCities);
  const [roles, setRoles] = useState(initialRoles);
  const [inventoryCategories, setInventoryCategories] = useState(initialInventoryCategories);
  const [inventoryUnits, setInventoryUnits] = useState(initialInventoryUnits);
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [stateName, setStateName] = useState("");
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [cityName, setCityName] = useState("");
  const [cityStateId, setCityStateId] = useState(initialStates[0]?.id ?? "");
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [inventorySetupName, setInventorySetupName] = useState("");
  const [categoryUnitTypeId, setCategoryUnitTypeId] = useState(
    initialInventoryUnits.find((unit) => unit.isActive)?.id ?? "",
  );
  const [editingInventorySetupId, setEditingInventorySetupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const filteredStates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? states.filter((state) => state.name.toLowerCase().includes(query))
      : states;
  }, [search, states]);

  const filteredCities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? cities.filter(
          (city) =>
            city.name.toLowerCase().includes(query) ||
            city.stateName.toLowerCase().includes(query),
        )
      : cities;
  }, [cities, search]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? roles.filter(
          (role) =>
            role.name.toLowerCase().includes(query) ||
            role.description.toLowerCase().includes(query),
        )
      : roles;
  }, [search, roles]);

  const filteredInventoryCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? inventoryCategories.filter((category) =>
          category.name.toLowerCase().includes(query) ||
          category.unitTypeName.toLowerCase().includes(query))
      : inventoryCategories;
  }, [inventoryCategories, search]);

  const filteredInventoryUnits = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? inventoryUnits.filter((unit) => unit.name.toLowerCase().includes(query))
      : inventoryUnits;
  }, [inventoryUnits, search]);

  function openAddDialog() {
    if (tab === "categories" || tab === "units") {
      setEditingInventorySetupId(null);
      setInventorySetupName("");
      setCategoryUnitTypeId(inventoryUnits.find((unit) => unit.isActive)?.id ?? "");
      setDialogMode(tab === "categories" ? "category" : "unit");
      return;
    }
    if (tab === "states") {
      setEditingStateId(null);
      setStateName("");
      setDialogMode("state");
      return;
    }

    if (tab === "roles") {
      setEditingRoleId(null);
      setRoleName("");
      setRoleDescription("");
      setDialogMode("role");
      return;
    }

    setEditingCityId(null);
    setEditingRoleId(null);
    setCityName("");
    setCityStateId(states[0]?.id ?? "");
    setDialogMode("city");
  }

  function closeDialog() {
    if (saving) return;
    setDialogMode(null);
    setEditingStateId(null);
    setEditingCityId(null);
    setEditingRoleId(null);
    setEditingInventorySetupId(null);
  }

  async function submitState(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        editingStateId
          ? `/api/settings/states/${editingStateId}`
          : "/api/settings/states",
        {
          method: editingStateId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: stateName }),
        },
      );
      const data = await readResult(response);

      if (!response.ok || !data.state) {
        toast.error(data.message ?? "Unable to save state.");
        return;
      }

      const savedState = data.state;
      if (editingStateId) {
        setStates((current) =>
          current
            .map((state) => (state.id === savedState.id ? savedState : state))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setCities((current) =>
          current.map((city) =>
            city.stateId === savedState.id
              ? { ...city, stateName: savedState.name }
              : city,
          ),
        );
        toast.success("State updated");
      } else {
        setStates((current) =>
          [...current, savedState].sort((a, b) => a.name.localeCompare(b.name)),
        );
        if (!cityStateId) setCityStateId(savedState.id);
        toast.success("State added");
      }

      setDialogMode(null);
      setEditingStateId(null);
      setStateName("");
    } catch {
      toast.error("Unable to save state right now.");
    } finally {
      setSaving(false);
    }
  }

  async function submitCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const previousCity = cities.find((city) => city.id === editingCityId);
      const response = await fetch(
        editingCityId
          ? `/api/settings/cities/${editingCityId}`
          : "/api/settings/cities",
        {
          method: editingCityId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cityName, stateId: cityStateId }),
        },
      );
      const data = await readResult(response);

      if (!response.ok || !data.city) {
        toast.error(data.message ?? "Unable to save city.");
        return;
      }

      const savedCity = data.city;
      if (editingCityId) {
        setCities((current) =>
          current
            .map((city) => (city.id === savedCity.id ? savedCity : city))
            .sort(
              (a, b) =>
                a.stateName.localeCompare(b.stateName) ||
                a.name.localeCompare(b.name),
            ),
        );
        if (previousCity && previousCity.stateId !== savedCity.stateId) {
          setStates((current) =>
            current.map((state) => {
              if (state.id === previousCity.stateId) {
                return { ...state, cityCount: Math.max(0, state.cityCount - 1) };
              }
              if (state.id === savedCity.stateId) {
                return { ...state, cityCount: state.cityCount + 1 };
              }
              return state;
            }),
          );
        }
        toast.success("City updated");
      } else {
        setCities((current) =>
          [...current, savedCity].sort(
            (a, b) =>
              a.stateName.localeCompare(b.stateName) ||
              a.name.localeCompare(b.name),
          ),
        );
        setStates((current) =>
          current.map((state) =>
            state.id === savedCity.stateId
              ? { ...state, cityCount: state.cityCount + 1 }
              : state,
          ),
        );
        toast.success("City added");
      }

      setDialogMode(null);
      setEditingCityId(null);
      setCityName("");
    } catch {
      toast.error("Unable to save city right now.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteState(state: SetupState) {
    if (!window.confirm(`Delete ${state.name}?`)) return;
    setDeletingId(`state-${state.id}`);

    try {
      const response = await fetch(`/api/settings/states/${state.id}`, {
        method: "DELETE",
      });
      const data = await readResult(response);
      if (!response.ok) {
        toast.error(data.message ?? "Unable to delete state.");
        return;
      }

      const remaining = states.filter((item) => item.id !== state.id);
      setStates(remaining);
      if (cityStateId === state.id) setCityStateId(remaining[0]?.id ?? "");
      toast.success("State deleted");
    } catch {
      toast.error("Unable to delete state right now.");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleStateStatus(state: SetupState) {
    setUpdatingStatusId(`state-${state.id}`);

    try {
      const response = await fetch(`/api/settings/states/${state.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !state.isActive }),
      });
      const data = await readResult(response);

      if (!response.ok || !data.state) {
        toast.error(data.message ?? "Unable to change state status.");
        return;
      }

      const savedState = data.state;
      setStates((current) =>
        current.map((item) => (item.id === savedState.id ? savedState : item)),
      );
      toast.success(savedState.isActive ? "State active" : "State inactive");
    } catch {
      toast.error("Unable to change state status right now.");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function toggleCityStatus(city: SetupCity) {
    setUpdatingStatusId(`city-${city.id}`);

    try {
      const response = await fetch(`/api/settings/cities/${city.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !city.isActive }),
      });
      const data = await readResult(response);

      if (!response.ok || !data.city) {
        toast.error(data.message ?? "Unable to change city status.");
        return;
      }

      const savedCity = data.city;
      setCities((current) =>
        current.map((item) => (item.id === savedCity.id ? savedCity : item)),
      );
      toast.success(savedCity.isActive ? "City active" : "City inactive");
    } catch {
      toast.error("Unable to change city status right now.");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function deleteCity(city: SetupCity) {
    if (!window.confirm(`Delete ${city.name}?`)) return;
    setDeletingId(`city-${city.id}`);

    try {
      const response = await fetch(`/api/settings/cities/${city.id}`, {
        method: "DELETE",
      });
      const data = await readResult(response);
      if (!response.ok) {
        toast.error(data.message ?? "Unable to delete city.");
        return;
      }

      setCities((current) => current.filter((item) => item.id !== city.id));
      setStates((current) =>
        current.map((state) =>
          state.id === city.stateId
            ? { ...state, cityCount: Math.max(0, state.cityCount - 1) }
            : state,
        ),
      );
      toast.success("City deleted");
    } catch {
      toast.error("Unable to delete city right now.");
    } finally {
      setDeletingId(null);
    }
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editingRoleId ? `/api/settings/roles/${editingRoleId}` : "/api/settings/roles", {
        method: editingRoleId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName, description: roleDescription }),
      });
      const data = (await response.json()) as { role?: SetupRole; message?: string };
      if (!response.ok || !data.role) { toast.error(data.message ?? "Unable to save role."); return; }
      setRoles((current) => editingRoleId
        ? current.map((item) => item.id === data.role!.id ? data.role! : item)
        : [...current, data.role!].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(editingRoleId ? "Role updated" : "Role created");
      closeDialog();
    } catch { toast.error("Unable to save role right now."); }
    finally { setSaving(false); }
  }

  async function toggleRole(role: SetupRole) {
    const response = await fetch(`/api/settings/roles/${role.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !role.isActive }) });
    const data = (await response.json()) as { role?: SetupRole; message?: string };
    if (!response.ok || !data.role) { toast.error(data.message ?? "Unable to change role status."); return; }
    setRoles((current) => current.map((item) => item.id === role.id ? data.role! : item));
  }

  async function removeRole(role: SetupRole) {
    if (!window.confirm(`Delete ${role.name}?`)) return;
    const response = await fetch(`/api/settings/roles/${role.id}`, { method: "DELETE" });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) { toast.error(data.message ?? "Unable to delete role."); return; }
    setRoles((current) => current.filter((item) => item.id !== role.id));
    toast.success("Role deleted");
  }

  async function saveInventorySetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isCategory = dialogMode === "category";
    const basePath = isCategory
      ? "/api/settings/inventory-categories"
      : "/api/settings/inventory-units";
    const previousCategory = isCategory
      ? inventoryCategories.find((item) => item.id === editingInventorySetupId)
      : undefined;
    setSaving(true);
    try {
      const response = await fetch(
        editingInventorySetupId ? `${basePath}/${editingInventorySetupId}` : basePath,
        {
          method: editingInventorySetupId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: inventorySetupName,
            ...(isCategory ? { unitTypeId: categoryUnitTypeId } : {}),
          }),
        },
      );
      const data = await response.json() as {
        category?: SetupInventoryCategory;
        unit?: SetupInventoryUnit;
        message?: string;
      };
      if (!response.ok || (isCategory ? !data.category : !data.unit)) {
        toast.error(data.message ?? `Unable to save ${isCategory ? "category" : "unit type"}.`);
        return;
      }

      if (isCategory && data.category) {
        const saved = data.category;
        setInventoryCategories((current) => editingInventorySetupId
          ? current.map((item) => item.id === saved.id ? saved : item)
          : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
        setInventoryUnits((current) => current.map((unit) => {
          if (previousCategory && previousCategory.unitTypeId !== saved.unitTypeId &&
              unit.id === previousCategory.unitTypeId) {
            return { ...unit, categoryCount: Math.max(0, unit.categoryCount - 1) };
          }
          if ((!previousCategory || previousCategory.unitTypeId !== saved.unitTypeId) &&
              unit.id === saved.unitTypeId) {
            return { ...unit, categoryCount: unit.categoryCount + 1 };
          }
          return unit;
        }));
      } else if (data.unit) {
        const saved = data.unit;
        setInventoryUnits((current) => editingInventorySetupId
          ? current.map((item) => item.id === saved.id ? saved : item)
          : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
        setInventoryCategories((current) => current.map((category) =>
          category.unitTypeId === saved.id
            ? { ...category, unitTypeName: saved.name }
            : category));
      }

      toast.success(`${isCategory ? "Category" : "Unit type"} ${editingInventorySetupId ? "updated" : "added"}`);
      closeDialog();
    } catch {
      toast.error(`Unable to save ${isCategory ? "category" : "unit type"} right now.`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleInventorySetupStatus(
    type: "category" | "unit",
    item: SetupInventoryCategory | SetupInventoryUnit,
  ) {
    const key = `${type}-${item.id}`;
    const isActive = item.isActive;
    setUpdatingStatusId(key);
    try {
      const response = await fetch(
        `/api/settings/inventory-${type === "category" ? "categories" : "units"}/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !isActive }),
        },
      );
      const data = await response.json() as {
        category?: SetupInventoryCategory;
        unit?: SetupInventoryUnit;
        message?: string;
      };
      if (!response.ok) {
        toast.error(data.message ?? "Unable to change status.");
        return;
      }
      if (type === "category" && data.category) {
        setInventoryCategories((current) => current.map((category) =>
          category.id === data.category!.id ? data.category! : category));
      } else if (type === "unit" && data.unit) {
        setInventoryUnits((current) => current.map((unit) =>
          unit.id === data.unit!.id ? data.unit! : unit));
      }
      toast.success(`${type === "category" ? "Category" : "Unit type"} ${isActive ? "inactive" : "active"}`);
    } catch {
      toast.error("Unable to change status right now.");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function removeInventorySetup(
    type: "category" | "unit",
    item: SetupInventoryCategory | SetupInventoryUnit,
  ) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    const key = `${type}-${item.id}`;
    setDeletingId(key);
    try {
      const response = await fetch(
        `/api/settings/inventory-${type === "category" ? "categories" : "units"}/${item.id}`,
        { method: "DELETE" },
      );
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Unable to delete.");
        return;
      }
      if (type === "category") {
        const category = item as SetupInventoryCategory;
        setInventoryCategories((current) => current.filter((entry) => entry.id !== item.id));
        setInventoryUnits((current) => current.map((unit) =>
          unit.id === category.unitTypeId
            ? { ...unit, categoryCount: Math.max(0, unit.categoryCount - 1) }
            : unit));
      } else {
        const remaining = inventoryUnits.filter((entry) => entry.id !== item.id);
        setInventoryUnits(remaining);
        if (categoryUnitTypeId === item.id) {
          setCategoryUnitTypeId(remaining.find((unit) => unit.isActive)?.id ?? "");
        }
      }
      toast.success(`${type === "category" ? "Category" : "Unit type"} deleted`);
    } catch {
      toast.error("Unable to delete right now.");
    } finally {
      setDeletingId(null);
    }
  }

  const visibleCount =
    tab === "states"
      ? filteredStates.length
      : tab === "cities"
        ? filteredCities.length
        : tab === "roles"
          ? filteredRoles.length
          : tab === "categories"
            ? filteredInventoryCategories.length
            : filteredInventoryUnits.length;

  return (
    <div className="pb-6">
      <div className="sticky top-[66px] z-20 -mx-5 flex flex-nowrap items-center justify-between gap-2 border-b border-[#E7EDF5] bg-[#FBFDFF]/95 px-5 py-3 backdrop-blur-xl">
        <div
          className="inline-flex h-[38px] max-w-[calc(100vw-160px)] overflow-x-auto rounded border border-[#DCE6F2] bg-white p-1 md:max-w-none"
          role="tablist"
          aria-label="Basic setup"
        >
          <TabButton
            active={tab === "states"}
            icon={MapPinned}
            label="States"
            onClick={() => {
              setTab("states");
              setSearch("");
            }}
          />
          <TabButton
            active={tab === "cities"}
            icon={Building2}
            label="Cities"
            onClick={() => {
              setTab("cities");
              setSearch("");
            }}
          />
          <TabButton
            active={tab === "roles"}
            icon={ShieldCheck}
            label="Roles"
            onClick={() => {
              setTab("roles");
              setSearch("");
            }}
          />
          <TabButton
            active={tab === "categories"}
            icon={Tags}
            label="Categories"
            onClick={() => {
              setTab("categories");
              setSearch("");
            }}
          />
          <TabButton
            active={tab === "units"}
            icon={Ruler}
            label="Unit Types"
            onClick={() => {
              setTab("units");
              setSearch("");
            }}
          />
        </div>
        <Button className="h-[34px] min-w-[110px] shrink-0" onClick={openAddDialog}>
          <Plus />
          Add {tab === "states"
            ? "State"
            : tab === "cities"
              ? "City"
              : tab === "roles"
                ? "Role"
                : tab === "categories"
                  ? "Category"
                  : "Unit Type"}
        </Button>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex-col gap-3 space-y-0 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            {tab === "states" ? (
              <MapPinned className="h-5 w-5 text-[#075DFF]" />
            ) : tab === "cities" ? (
              <Building2 className="h-5 w-5 text-[#075DFF]" />
            ) : tab === "roles" ? (
              <ShieldCheck className="h-5 w-5 text-[#075DFF]" />
            ) : tab === "categories" ? (
              <Tags className="h-5 w-5 text-[#075DFF]" />
            ) : (
              <Ruler className="h-5 w-5 text-[#075DFF]" />
            )}
            <CardTitle>
              {tab === "states"
                ? "States"
                : tab === "cities"
                  ? "Cities"
                  : tab === "roles"
                    ? "Roles"
                    : tab === "categories"
                      ? "Categories"
                      : "Unit Types"}
            </CardTitle>
            <Badge variant="secondary">{visibleCount}</Badge>
          </div>
          <div className="relative w-full md:w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718198]" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                tab === "states"
                  ? "Search states"
                  : tab === "cities"
                    ? "Search cities or states"
                    : tab === "roles"
                      ? "Search roles"
                      : tab === "categories"
                        ? "Search categories or units"
                        : "Search unit types"
              }
              className="h-[34px] pl-9 shadow-none"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          {tab === "roles" ? (
            <RoleTable
              roles={filteredRoles}
              searching={Boolean(search.trim())}
              onEdit={(role) => { setEditingRoleId(role.id); setRoleName(role.name); setRoleDescription(role.description); setDialogMode("role"); }}
              onDelete={(role) => void removeRole(role)}
              onToggle={(role) => void toggleRole(role)}
            />
          ) : tab === "categories" || tab === "units" ? (
            <InventorySetupTable
              type={tab === "categories" ? "category" : "unit"}
              categories={filteredInventoryCategories}
              units={filteredInventoryUnits}
              searching={Boolean(search.trim())}
              deletingId={deletingId}
              updatingStatusId={updatingStatusId}
              onEditCategory={(category) => {
                setEditingInventorySetupId(category.id);
                setInventorySetupName(category.name);
                setCategoryUnitTypeId(category.unitTypeId);
                setDialogMode("category");
              }}
              onEditUnit={(unit) => {
                setEditingInventorySetupId(unit.id);
                setInventorySetupName(unit.name);
                setDialogMode("unit");
              }}
              onDeleteCategory={(category) => void removeInventorySetup("category", category)}
              onDeleteUnit={(unit) => void removeInventorySetup("unit", unit)}
              onToggleCategory={(category) => void toggleInventorySetupStatus("category", category)}
              onToggleUnit={(unit) => void toggleInventorySetupStatus("unit", unit)}
            />
          ) : (
            <LocationTable
              tab={tab}
              states={filteredStates}
              cities={filteredCities}
              searching={Boolean(search.trim())}
              deletingId={deletingId}
              updatingStatusId={updatingStatusId}
              onEditState={(state) => {
                setEditingStateId(state.id);
                setStateName(state.name);
                setDialogMode("state");
              }}
              onDeleteState={(state) => void deleteState(state)}
              onToggleState={(state) => void toggleStateStatus(state)}
              onEditCity={(city) => {
                setEditingCityId(city.id);
                setCityName(city.name);
                setCityStateId(city.stateId);
                setDialogMode("city");
              }}
              onDeleteCity={(city) => void deleteCity(city)}
              onToggleCity={(city) => void toggleCityStatus(city)}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          {dialogMode === "state" ? (
            <LocationDialogForm
              mode="state"
              editing={Boolean(editingStateId)}
              name={stateName}
              onNameChange={setStateName}
              saving={saving}
              onSubmit={submitState}
              onCancel={closeDialog}
            />
          ) : null}
          {dialogMode === "city" ? (
            <LocationDialogForm
              mode="city"
              editing={Boolean(editingCityId)}
              name={cityName}
              onNameChange={setCityName}
              states={states}
              stateId={cityStateId}
              onStateChange={setCityStateId}
              saving={saving}
              onSubmit={submitCity}
              onCancel={closeDialog}
            />
          ) : null}
          {dialogMode === "role" ? (
            <RoleDialogForm editing={Boolean(editingRoleId)} name={roleName} description={roleDescription} onNameChange={setRoleName} onDescriptionChange={setRoleDescription} saving={saving} onSubmit={saveRole} onCancel={closeDialog} />
          ) : null}
          {dialogMode === "category" || dialogMode === "unit" ? (
            <InventorySetupDialogForm
              type={dialogMode}
              editing={Boolean(editingInventorySetupId)}
              name={inventorySetupName}
              onNameChange={setInventorySetupName}
              unitTypeId={categoryUnitTypeId}
              onUnitTypeChange={setCategoryUnitTypeId}
              units={inventoryUnits}
              saving={saving}
              onSubmit={saveInventorySetup}
              onCancel={closeDialog}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof MapPinned;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex h-[28px] min-w-[96px] items-center justify-center gap-2 rounded px-2 text-[13px] font-medium transition-colors sm:min-w-[112px] sm:px-3",
        active
          ? "bg-[#075DFF] text-white"
          : "text-[#385071] hover:bg-[#F3F7FC]",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function RoleDialogForm({
  editing, name, description, onNameChange, onDescriptionChange, saving, onSubmit, onCancel,
}: {
  editing: boolean; name: string; description: string; onNameChange: (value: string) => void; onDescriptionChange: (value: string) => void; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <DialogHeader><DialogTitle>{editing ? "Edit Role" : "Add Role"}</DialogTitle></DialogHeader>
      <div className="space-y-4 p-4">
        <label className="block space-y-1.5"><span className="text-xs font-medium text-[#31405A]">Role name <span className="text-red-500">*</span></span><Input value={name} onChange={(event) => onNameChange(event.target.value)} required maxLength={100} autoFocus /></label>
        <label className="block space-y-1.5"><span className="text-xs font-medium text-[#31405A]">Description</span><textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} maxLength={300} className="min-h-[82px] w-full resize-y rounded border border-[#DCE6F2] px-3 py-2 text-sm outline-none focus:border-[#075DFF]" /></label>
        <div className="flex justify-end gap-2 border-t border-[#E7EDF5] pt-4"><Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Role"}</Button></div>
      </div>
    </form>
  );
}

function RoleTable({
  roles,
  searching,
  onEdit,
  onDelete,
  onToggle,
}: {
  roles: SetupRole[];
  searching: boolean;
  onEdit: (role: SetupRole) => void;
  onDelete: (role: SetupRole) => void;
  onToggle: (role: SetupRole) => void;
}) {
  if (roles.length === 0) {
    return <EmptyState icon={ShieldCheck} label={searching ? "No matching roles" : "No roles yet"} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Role</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[96px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.name}>
            <TableCell className="font-medium text-[#071333]">{role.name}</TableCell>
            <TableCell className="text-[#52627A]">{role.description}</TableCell>
            <TableCell><Switch checked={role.isActive} onCheckedChange={() => onToggle(role)} aria-label={`Mark ${role.name} ${role.isActive ? "inactive" : "active"}`} />
            </TableCell>
            <TableCell><RowActions name={role.name} deleting={false} onEdit={() => onEdit(role)} onDelete={() => onDelete(role)} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function InventorySetupDialogForm({
  type,
  editing,
  name,
  onNameChange,
  unitTypeId,
  onUnitTypeChange,
  units,
  saving,
  onSubmit,
  onCancel,
}: {
  type: "category" | "unit";
  editing: boolean;
  name: string;
  onNameChange: (value: string) => void;
  unitTypeId: string;
  onUnitTypeChange: (value: string) => void;
  units: SetupInventoryUnit[];
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const isCategory = type === "category";
  const label = isCategory ? "Category" : "Unit Type";
  return (
    <form onSubmit={onSubmit}>
      <DialogHeader>
        {isCategory
          ? <Tags className="h-5 w-5 text-[#075DFF]" />
          : <Ruler className="h-5 w-5 text-[#075DFF]" />}
        <DialogTitle>{editing ? `Edit ${label}` : `Add ${label}`}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 p-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#31405A]">
            {label} Name <span className="text-red-500">*</span>
          </span>
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            minLength={2}
            maxLength={isCategory ? 100 : 50}
            autoFocus
          />
        </label>
        {isCategory ? (
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#31405A]">
              Unit Type <span className="text-red-500">*</span>
            </span>
            <select
              value={unitTypeId}
              onChange={(event) => onUnitTypeChange(event.target.value)}
              required
              className="h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-sm text-[#071333] outline-none focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20"
            >
              <option value="" disabled>Select unit type</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id} disabled={!unit.isActive}>
                  {unit.name}{unit.isActive ? "" : " (Inactive)"}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-[#E7EDF5] pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving || (isCategory && !unitTypeId)}>
            {editing ? <Save /> : <Plus />}
            {saving ? "Saving..." : editing ? "Update" : `Add ${label}`}
          </Button>
        </div>
      </div>
    </form>
  );
}

function InventorySetupTable({
  type,
  categories,
  units,
  searching,
  deletingId,
  updatingStatusId,
  onEditCategory,
  onEditUnit,
  onDeleteCategory,
  onDeleteUnit,
  onToggleCategory,
  onToggleUnit,
}: {
  type: "category" | "unit";
  categories: SetupInventoryCategory[];
  units: SetupInventoryUnit[];
  searching: boolean;
  deletingId: string | null;
  updatingStatusId: string | null;
  onEditCategory: (category: SetupInventoryCategory) => void;
  onEditUnit: (unit: SetupInventoryUnit) => void;
  onDeleteCategory: (category: SetupInventoryCategory) => void;
  onDeleteUnit: (unit: SetupInventoryUnit) => void;
  onToggleCategory: (category: SetupInventoryCategory) => void;
  onToggleUnit: (unit: SetupInventoryUnit) => void;
}) {
  const empty = type === "category" ? categories.length === 0 : units.length === 0;
  if (empty) {
    return (
      <EmptyState
        icon={type === "category" ? Tags : Ruler}
        label={searching ? "No matching results" : `No ${type === "category" ? "categories" : "unit types"} yet`}
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[72px]">No.</TableHead>
          <TableHead>{type === "category" ? "Category" : "Unit Type"}</TableHead>
          <TableHead>{type === "category" ? "Linked Unit Type" : "Categories"}</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[96px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {type === "category"
          ? categories.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell className="text-[#718198]">{index + 1}</TableCell>
                <TableCell className="font-medium text-[#071333]">{category.name}</TableCell>
                <TableCell className="text-[#52627A]">{category.unitTypeName}</TableCell>
                <TableCell>
                  <Switch
                    checked={category.isActive}
                    disabled={updatingStatusId === `category-${category.id}`}
                    onCheckedChange={() => onToggleCategory(category)}
                    aria-label={`Mark ${category.name} ${category.isActive ? "inactive" : "active"}`}
                  />
                </TableCell>
                <TableCell>
                  <RowActions
                    name={category.name}
                    deleting={deletingId === `category-${category.id}`}
                    onEdit={() => onEditCategory(category)}
                    onDelete={() => onDeleteCategory(category)}
                  />
                </TableCell>
              </TableRow>
            ))
          : units.map((unit, index) => (
              <TableRow key={unit.id}>
                <TableCell className="text-[#718198]">{index + 1}</TableCell>
                <TableCell className="font-medium text-[#071333]">{unit.name}</TableCell>
                <TableCell><Badge variant="outline">{unit.categoryCount}</Badge></TableCell>
                <TableCell>
                  <Switch
                    checked={unit.isActive}
                    disabled={updatingStatusId === `unit-${unit.id}`}
                    onCheckedChange={() => onToggleUnit(unit)}
                    aria-label={`Mark ${unit.name} ${unit.isActive ? "inactive" : "active"}`}
                  />
                </TableCell>
                <TableCell>
                  <RowActions
                    name={unit.name}
                    deleting={deletingId === `unit-${unit.id}`}
                    onEdit={() => onEditUnit(unit)}
                    onDelete={() => onDeleteUnit(unit)}
                  />
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}

function LocationTable({
  tab,
  states,
  cities,
  searching,
  deletingId,
  updatingStatusId,
  onEditState,
  onDeleteState,
  onToggleState,
  onEditCity,
  onDeleteCity,
  onToggleCity,
}: {
  tab: Tab;
  states: SetupState[];
  cities: SetupCity[];
  searching: boolean;
  deletingId: string | null;
  updatingStatusId: string | null;
  onEditState: (state: SetupState) => void;
  onDeleteState: (state: SetupState) => void;
  onToggleState: (state: SetupState) => void;
  onEditCity: (city: SetupCity) => void;
  onDeleteCity: (city: SetupCity) => void;
  onToggleCity: (city: SetupCity) => void;
}) {
  const isEmpty = tab === "states" ? states.length === 0 : cities.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={tab === "states" ? MapPinned : Building2}
        label={searching ? "No matching results" : `No ${tab} yet`}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[72px]">No.</TableHead>
          <TableHead>{tab === "states" ? "State" : "City"}</TableHead>
          <TableHead>{tab === "states" ? "Cities" : "State"}</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[96px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tab === "states"
          ? states.map((state, index) => (
              <TableRow key={state.id}>
                <TableCell className="text-[#718198]">{index + 1}</TableCell>
                <TableCell className="font-medium text-[#071333]">
                  {state.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{state.cityCount}</Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={state.isActive}
                    disabled={updatingStatusId === `state-${state.id}`}
                    onCheckedChange={() => onToggleState(state)}
                    aria-label={`Mark ${state.name} ${state.isActive ? "inactive" : "active"}`}
                    title={`Mark ${state.isActive ? "inactive" : "active"}`}
                  />
                </TableCell>
                <TableCell>
                  <RowActions
                    name={state.name}
                    deleting={deletingId === `state-${state.id}`}
                    onEdit={() => onEditState(state)}
                    onDelete={() => onDeleteState(state)}
                  />
                </TableCell>
              </TableRow>
            ))
          : cities.map((city, index) => (
              <TableRow key={city.id}>
                <TableCell className="text-[#718198]">{index + 1}</TableCell>
                <TableCell className="font-medium text-[#071333]">
                  {city.name}
                </TableCell>
                <TableCell className="text-[#52627A]">{city.stateName}</TableCell>
                <TableCell>
                  <Switch
                    checked={city.isActive}
                    disabled={updatingStatusId === `city-${city.id}`}
                    onCheckedChange={() => onToggleCity(city)}
                    aria-label={`Mark ${city.name} ${city.isActive ? "inactive" : "active"}`}
                    title={`Mark ${city.isActive ? "inactive" : "active"}`}
                  />
                </TableCell>
                <TableCell>
                  <RowActions
                    name={city.name}
                    deleting={deletingId === `city-${city.id}`}
                    onEdit={() => onEditCity(city)}
                    onDelete={() => onDeleteCity(city)}
                  />
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}

function RowActions({
  name,
  deleting,
  onEdit,
  onDelete,
}: {
  name: string;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#52627A] hover:text-[#075DFF]"
        aria-label={`Edit ${name}`}
        title={`Edit ${name}`}
        onClick={onEdit}
      >
        <Pencil />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
        aria-label={`Delete ${name}`}
        title={`Delete ${name}`}
        disabled={deleting}
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function LocationDialogForm({
  mode,
  editing,
  name,
  onNameChange,
  states = [],
  stateId = "",
  onStateChange,
  saving,
  onSubmit,
  onCancel,
}: {
  mode: "state" | "city";
  editing: boolean;
  name: string;
  onNameChange: (name: string) => void;
  states?: SetupState[];
  stateId?: string;
  onStateChange?: (stateId: string) => void;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const label = mode === "state" ? "State" : "City";

  return (
    <>
      <DialogHeader>
        {mode === "state" ? (
          <MapPinned className="h-5 w-5 text-[#075DFF]" />
        ) : (
          <Building2 className="h-5 w-5 text-[#075DFF]" />
        )}
        <DialogTitle>{editing ? `Edit ${label}` : `Add ${label}`}</DialogTitle>
      </DialogHeader>
      <form className="space-y-4 p-4" onSubmit={onSubmit}>
        {mode === "city" ? (
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#31405A]">
              State <span className="text-red-500">*</span>
            </span>
            <select
              value={stateId}
              onChange={(event) => onStateChange?.(event.target.value)}
              required
              className="h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-sm text-[#071333] outline-none focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20"
            >
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#31405A]">
            {label} Name <span className="text-red-500">*</span>
          </span>
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder={mode === "state" ? "Karnataka" : "Bengaluru"}
            autoFocus
          />
        </label>
        <div className="flex justify-end gap-2 border-t border-[#E7EDF5] pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button disabled={saving || (mode === "city" && !stateId)}>
            {editing ? <Save /> : <Plus />}
            {saving ? "Saving..." : editing ? "Update" : `Add ${label}`}
          </Button>
        </div>
      </form>
    </>
  );
}

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: typeof MapPinned;
  label: string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded bg-[#EEF5FF] text-[#075DFF]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-[#52627A]">{label}</p>
    </div>
  );
}
