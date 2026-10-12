import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Navigate,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  Shirt,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Sparkles,
  Scissors,
  Footprints,
  Bell,
  CalendarDays,
  Check,
  Clock3,
  Phone,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type {
  OrderingCatalog,
  OrderingCategoryGroup,
  OrderQuote,
} from "@/lib/customer-ordering";
import { groupServices, pickupSlots } from "@/lib/customer-ordering";
import type { CatalogService } from "@/lib/service-catalog";
import type { PortalAddress, PortalOrder } from "@/lib/customer-portal";
import Image from "@/platform/image";
import {
  useCustomerData,
  invalidateCustomerData,
  preloadCustomerData,
} from "./customer-client-data";
import { CustomerPageError, CustomerPageSkeleton } from "./customer-page-state";
import { CustomerSimpleHeader } from "./customer-simple-header";
import { CustomerSidebar } from "./customer-sidebar";
import { startNavigationProgress } from "@/components/navigation-loader";
import {
  useOrderingDraft,
  readDraft,
  saveDraft,
  clearOrderingDraft,
  type OrderingDraft,
} from "./ordering-state";
import { apiFetch } from "@/platform/http";

const money = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const purple = "#7040dc";
const pickupCta = "#7040dc";
function Frame({
  title,
  back = "/customer",
  children,
  footer,
}: {
  title: string;
  back?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8f7fc",
        pb: footer ? 20 : 3,
        color: "#211a35",
      }}
    >
      <CustomerSimpleHeader title={title} backHref={back} />
      <Stack
        component="main"
        spacing={1.5}
        sx={{ maxWidth: 520, mx: "auto", px: 2, py: 2 }}
      >
        {children}
      </Stack>
      {footer && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "white",
            borderTop: "1px solid #e5e2eb",
            p: 1.5,
            pb: {
              xs: "env(safe-area-inset-bottom)",
              sm: "env(safe-area-inset-bottom)",
            },
            zIndex: 50,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>{footer}</Box>
        </Box>
      )}
    </Box>
  );
}
function Action({
  to,
  children,
  disabled,
  onClick,
  large = false,
}: {
  to?: string;
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  large?: boolean;
}) {
  const actionSx = {
    bgcolor: pickupCta,
    color: "#fff",
    minHeight: large ? 56 : 48,
    borderRadius: 2,
    fontSize: large ? 14 : 13,
    fontWeight: 600,
    textTransform: "none",
    boxShadow: "none",
    "&:hover": { bgcolor: "#6033c7", boxShadow: "none" },
    "&.Mui-disabled": { bgcolor: "#c9b7ec", color: "rgba(255,255,255,.9)" },
  };
  return to ? (
    <Button
      component={Link}
      to={to}
      onClick={onClick}
      fullWidth
      variant="contained"
      sx={actionSx}
    >
      {children}
    </Button>
  ) : (
    <Button
      onClick={onClick}
      disabled={disabled}
      fullWidth
      variant="contained"
      sx={actionSx}
    >
      {children}
    </Button>
  );
}
function CatalogBoundary({
  children,
}: {
  children: (catalog: OrderingCatalog) => ReactNode;
}) {
  const query = useCustomerData<OrderingCatalog>(
    "/api/customer/catalog",
    30000,
  );
  if (query.loading)
    return <CustomerPageSkeleton variant="services" rows={4} />;
  if (query.error)
    return <CustomerPageError message={query.error} retry={query.retry} />;
  if (!query.data?.store)
    return (
      <Frame title="Services">
        <Alert severity="info">No store is available right now.</Alert>
      </Frame>
    );
  return children(query.data);
}
const description = (name: string) => {
  const text = name.toLowerCase();
  return text.includes("dry")
    ? "Care for delicate clothes"
    : text.includes("fold")
      ? "Clean, dry and folded"
      : text.includes("rafu") || text.includes("repair")
        ? "Repair small tears"
        : text.includes("shoe")
          ? "Fresh, clean footwear"
          : text.includes("iron")
            ? "Neat, smooth clothes"
            : "Fresh care for your items";
};

function groupAudience(group: OrderingCategoryGroup) {
  const name = group.name.toLowerCase();
  if (name.includes("women")) return "women" as const;
  if (name.includes("men")) return "men" as const;
  if (name.includes("kid") || name.includes("child")) return "kid" as const;
  return "other" as const;
}

function groupGarmentIds(
  catalog: OrderingCatalog,
  group: OrderingCategoryGroup,
) {
  return new Set(
    catalog.categories
      .filter(
        (category) =>
          category.groupId === group.id ||
          (category.groupId === undefined &&
            category.audience === groupAudience(group)),
      )
      .map((category) => category.id),
  );
}

function servicesForGroup(
  catalog: OrderingCatalog,
  group: OrderingCategoryGroup,
) {
  const garmentIds = groupGarmentIds(catalog, group);
  return [
    ...new Map(
      catalog.services
        .filter(
          (service) => service.isActive && garmentIds.has(service.garmentId),
        )
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((service) => [service.id, service]),
    ).values(),
  ];
}

function CategoryImage({
  path,
  name,
  size = 84,
}: {
  path: string;
  name: string;
  size?: number;
}) {
  return path ? (
    <Image
      src={path}
      alt=""
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
    />
  ) : (
    <Box
      sx={{
        display: "flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 3,
        bgcolor: "#f0eaff",
        color: purple,
        fontSize: size > 60 ? 28 : 20,
        fontWeight: 800,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </Box>
  );
}

export function CalculatorPage() {
  return (
    <CatalogBoundary>
      {(catalog) => <CalculatorCategorySelector catalog={catalog} />}
    </CatalogBoundary>
  );
}

function CalculatorCategorySelector({ catalog }: { catalog: OrderingCatalog }) {
  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const groups = catalog.categoryGroups.filter((group) => group.isActive);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const services = selectedGroup
    ? servicesForGroup(catalog, selectedGroup)
    : [];
  const selectedService = services.find(
    (service) => service.id === selectedServiceId,
  );

  function selectGroup(group: OrderingCategoryGroup) {
    setSelectedGroupId(group.id);
    setSelectedServiceId("");
  }

  function checkGarments() {
    if (!selectedGroup || !selectedService) return;
    startNavigationProgress();
    navigate(
      `/customer/calculator/${encodeURIComponent(selectedGroup.id)}/${encodeURIComponent(selectedService.id)}`,
    );
  }

  return (
    <Frame
      title="Laundry calculator"
      footer={
        <Action large disabled={!selectedService} onClick={checkGarments}>
          {selectedService ? "Check garments" : "Choose a service"}
        </Action>
      }
    >
      <section>
        <Typography component="h2" fontWeight={700}>
          Choose a category
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1.5,
            mt: 1.5,
          }}
        >
          {groups.map((group) => {
            const selected = selectedGroupId === group.id;
            const garmentCount = groupGarmentIds(catalog, group).size;
            return (
              <Card
                key={group.id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: selected ? purple : "#e5e2eb",
                  bgcolor: selected ? "#f4efff" : "white",
                  boxShadow: selected
                    ? "0 6px 18px rgba(116,64,220,0.12)"
                    : "none",
                }}
              >
                <CardActionArea
                  component="button"
                  type="button"
                  onClick={() => selectGroup(group)}
                  aria-pressed={selected}
                  sx={{ minHeight: 160, p: 1.5, textAlign: "center" }}
                >
                  <CategoryImage path={group.imagePath} name={group.name} />
                  <Typography sx={{ mt: 1, fontSize: 12, fontWeight: 800 }}>
                    {group.name}
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 10, color: "#858796" }}>
                    {garmentCount} garments
                  </Typography>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
        {!groups.length && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            Categories are unavailable right now.
          </Alert>
        )}
      </section>

      {selectedGroup && (
        <section>
          <Typography component="h2" fontWeight={700}>
            Choose a service
          </Typography>
          {services.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1.25,
                mt: 1.5,
              }}
            >
              {services.map((service) => {
                const selected = selectedServiceId === service.id;
                return (
                  <Card
                    key={service.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      borderColor: selected ? purple : "#e5e2eb",
                      bgcolor: selected ? "#f4efff" : "white",
                    }}
                  >
                    <CardActionArea
                      component="button"
                      type="button"
                      onClick={() => setSelectedServiceId(service.id)}
                      aria-pressed={selected}
                      sx={{ minHeight: 132, p: 1.5, textAlign: "left" }}
                    >
                      <Stack direction="row" alignItems="center" gap={1.25}>
                        <CategoryImage
                          path={service.imagePath}
                          name={service.name}
                          size={48}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{ fontSize: 12, fontWeight: 800 }}
                            noWrap
                          >
                            {service.name}
                          </Typography>
                          <Typography
                            sx={{ mt: 0.5, fontSize: 10, color: "#858796" }}
                          >
                            From {money(service.regularPrice)} / {service.unit}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography
                        sx={{
                          mt: 1.25,
                          fontSize: 10,
                          fontWeight: 700,
                          color: selected ? purple : "#858796",
                        }}
                      >
                        {selected ? "Selected" : "Select service"}
                      </Typography>
                    </CardActionArea>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              No services are available for this category.
            </Alert>
          )}
        </section>
      )}
    </Frame>
  );
}

export function CalculatorGarmentsPage() {
  return (
    <CatalogBoundary>
      {(catalog) => <CalculatorGarments catalog={catalog} />}
    </CatalogBoundary>
  );
}

function CalculatorGarments({ catalog }: { catalog: OrderingCatalog }) {
  const { categoryId, serviceId } = useParams<{
    categoryId: string;
    serviceId: string;
  }>();
  const { draft, update } = useOrderingDraft();
  const group = catalog.categoryGroups.find((item) => item.id === categoryId);
  const garmentIds = group
    ? groupGarmentIds(catalog, group)
    : new Set<string>();
  const items = catalog.services
    .filter(
      (item) =>
        item.id === serviceId &&
        item.isActive &&
        garmentIds.has(item.garmentId),
    )
    .sort((left, right) => left.garmentName.localeCompare(right.garmentName));
  const selectedService = items[0];
  const staleStore = Boolean(
    draft.storeId && draft.storeId !== catalog.store?.id,
  );
  const activeItems = staleStore ? [] : draft.items;
  const selectedItems = items.map((item) => ({
    item,
    quantity:
      activeItems.find(
        (entry) =>
          entry.garmentId === item.garmentId && entry.serviceId === item.id,
      )?.quantity ?? 0,
  }));
  const count = selectedItems.reduce((sum, row) => sum + row.quantity, 0);
  const total = selectedItems.reduce(
    (sum, row) => sum + row.quantity * row.item.regularPrice,
    0,
  );

  function changeQuantity(item: CatalogService, nextQuantity: number) {
    const rest = activeItems.filter(
      (entry) =>
        !(entry.garmentId === item.garmentId && entry.serviceId === item.id),
    );
    update({
      kind: "items",
      storeId: catalog.store?.id ?? "",
      coupon: "",
      items: nextQuantity
        ? [
            ...rest,
            {
              name: `${item.garmentName} · ${item.name}`,
              quantity: nextQuantity,
              unitPrice: item.regularPrice,
              image:
                item.garmentImagePath || item.imagePath || "/wash_fold.png",
              garmentId: item.garmentId,
              garmentName: item.garmentName,
              serviceId: item.id,
              serviceName: item.name,
              service: `${item.garmentName} · ${item.name}`,
              serviceSlug: item.slug,
            },
          ]
        : rest,
    });
  }

  if (!group || !selectedService) {
    return (
      <Frame title="Calculator" back="/customer/calculator">
        <Alert severity="info">This category or service is unavailable.</Alert>
        <Action to="/customer/calculator">Choose again</Action>
      </Frame>
    );
  }

  return (
    <Frame
      title={`${group.name} · ${selectedService.name}`}
      back="/customer/calculator"
      footer={
        <Action
          to={count ? "/customer/cart" : undefined}
          disabled={!count}
          large
        >
          {count ? `Add ${count} garments · ${money(total)}` : "Add garments"}
        </Action>
      }
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          border: "1px solid #e5e2eb",
          borderRadius: 3,
          bgcolor: "white",
          p: 1.5,
        }}
      >
        <CategoryImage path={group.imagePath} name={group.name} size={52} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
            {group.name}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 11, color: "#77798a" }}>
            {selectedService.name} pricing
          </Typography>
        </Box>
      </Box>

      {staleStore && (
        <Alert severity="warning">
          Your store changed. Adding an item starts a new cart.
        </Alert>
      )}

      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
        >
          <Typography component="h2" fontWeight={700}>
            Garment pricing
          </Typography>
          <Typography sx={{ fontSize: 10, color: "#858796" }}>
            {items.length} garments
          </Typography>
        </Stack>
        <Box
          role="table"
          aria-label={`${selectedService.name} garment pricing`}
          sx={{
            mt: 1.5,
            overflow: "hidden",
            border: "1px solid #e5e2eb",
            borderRadius: 3,
            bgcolor: "white",
          }}
        >
          <Box
            role="row"
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 88px 104px",
              gap: 1,
              borderBottom: "1px solid #eeeaf4",
              bgcolor: "#faf8ff",
              px: 1.5,
              py: 1,
            }}
          >
            <Typography
              role="columnheader"
              sx={{ fontSize: 9, fontWeight: 800 }}
            >
              Garment
            </Typography>
            <Typography
              role="columnheader"
              sx={{ fontSize: 9, fontWeight: 800, textAlign: "right" }}
            >
              Price
            </Typography>
            <Typography
              role="columnheader"
              sx={{ fontSize: 9, fontWeight: 800, textAlign: "right" }}
            >
              Quantity
            </Typography>
          </Box>
          {selectedItems.map(({ item, quantity }) => (
            <Box
              key={item.garmentId}
              role="row"
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 88px 104px",
                alignItems: "center",
                gap: 1,
                borderBottom: "1px solid #eeeaf4",
                px: 1.5,
                py: 1.25,
                "&:last-child": { borderBottom: 0 },
              }}
            >
              <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
                <CategoryImage
                  path={item.garmentImagePath}
                  name={item.garmentName}
                  size={42}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.garmentName}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontSize: 9, color: "#858796" }}>
                    {item.turnaround}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800 }}>
                  {money(item.regularPrice)}
                </Typography>
                <Typography sx={{ mt: 0.25, fontSize: 9, color: "#858796" }}>
                  / {item.unit.replace("_", " ")}
                </Typography>
              </Box>
              <Stack
                direction="row"
                justifyContent="flex-end"
                alignItems="center"
                gap={0.25}
              >
                <IconButton
                  size="small"
                  aria-label={`Remove one ${item.garmentName}`}
                  disabled={quantity === 0}
                  onClick={() => changeQuantity(item, quantity - 1)}
                >
                  <Minus size={16} />
                </IconButton>
                <Typography
                  sx={{
                    minWidth: 20,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {quantity}
                </Typography>
                <IconButton
                  size="small"
                  aria-label={`Add one ${item.garmentName}`}
                  disabled={quantity >= 100}
                  onClick={() => changeQuantity(item, quantity + 1)}
                  sx={{ color: purple }}
                >
                  <Plus size={16} />
                </IconButton>
              </Stack>
            </Box>
          ))}
          {!items.length && (
            <Alert severity="info" sx={{ m: 1.5 }}>
              No garments are available for this service.
            </Alert>
          )}
        </Box>
      </Box>

      <Button component={Link} to="/customer/calculator" startIcon={<Plus />}>
        Choose another service
      </Button>
    </Frame>
  );
}

function ServiceIcon({ name }: { name: string }) {
  return /rafu|repair/i.test(name) ? (
    <Scissors />
  ) : /shoe/i.test(name) ? (
    <Footprints />
  ) : /dry/i.test(name) ? (
    <Sparkles />
  ) : (
    <Shirt />
  );
}
export function ServiceCards({ catalog }: { catalog: OrderingCatalog }) {
  const { update } = useOrderingDraft();
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2,minmax(0,1fr))",
          sm: "repeat(3,minmax(0,1fr))",
        },
        gap: 1.5,
      }}
    >
      {groupServices(catalog.services).map((service) => {
        const rates = catalog.services.filter(
          (item) => item.id === service.id && item.isActive,
        );
        return (
          <Card key={service.id} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardActionArea
              component={Link}
              to={`/customer/services/${service.id}`}
              onClick={() => update({ kind: "items" })}
              disabled={!rates.length}
              sx={{ p: 2, height: "100%" }}
            >
              <Box sx={{ color: purple, mb: 1.5 }}>
                <ServiceIcon name={service.name} />
              </Box>
              <Typography fontWeight={700}>{service.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                {description(service.name)}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {rates.length
                  ? `From ${money(Math.min(...rates.map((item) => item.regularPrice)))}`
                  : "Unavailable"}
              </Typography>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}
export function HomeOrdering() {
  return (
    <CatalogBoundary>
      {(catalog) => (
        <Stack spacing={2}>
          <Typography component="h2" fontWeight={700}>
            Choose a service
          </Typography>
          <ServiceCards catalog={catalog} />
          <QuickPickupLink />
        </Stack>
      )}
    </CatalogBoundary>
  );
}
function QuickPickupLink() {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #d8c8f5",
        borderRadius: 3,
        bgcolor: "#f3edff",
      }}
    >
      <Button
        component={Link}
        to="/customer/quick-pickup"
        startIcon={<ShoppingBag />}
        sx={{ color: purple, fontWeight: 700 }}
      >
        Schedule Quick Pickup
      </Button>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Don't know the exact items? We'll count them after pickup.
      </Typography>
    </Box>
  );
}
export function ServicesPage() {
  return <QuickPickupPage />;
}
function CartLink() {
  const { draft } = useOrderingDraft();
  const count = draft.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <Action to="/customer/cart">
      View cart · {count} items ·{" "}
      {money(
        draft.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        ),
      )}
    </Action>
  );
}
export function GarmentsPage() {
  return (
    <CatalogBoundary>
      {(catalog) => <Garments catalog={catalog} />}
    </CatalogBoundary>
  );
}
function Garments({ catalog }: { catalog: OrderingCatalog }) {
  const { slug } = useParams();
  const { draft, update } = useOrderingDraft();
  const selected = catalog.services.find(
    (item) => item.id === slug || item.slug === slug,
  );
  const [category, setCategory] = useState("men");
  const serviceId = selected?.id;
  const supported = catalog.services.filter((item) => item.id === serviceId);
  const items = supported.filter(
    (item) =>
      catalog.categories.find((category) => category.id === item.garmentId)
        ?.audience === category,
  );
  const staleStore = Boolean(
    draft.storeId && draft.storeId !== catalog.store?.id,
  );
  const activeItems = staleStore ? [] : draft.items;
  const total = activeItems
    .filter((item) => item.serviceId === serviceId)
    .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const count = activeItems
    .filter((item) => item.serviceId === serviceId)
    .reduce((sum, item) => sum + item.quantity, 0);
  if (!selected)
    return (
      <Frame title="Service unavailable">
        <Action to="/customer/services">Choose another service</Action>
      </Frame>
    );
  return (
    <Frame
      title={selected.name}
      back="/customer/services"
      footer={
        count ? (
          <Action to="/customer/cart">
            Add {count} Items • {money(total)}
          </Action>
        ) : (
          <Action disabled>Add items</Action>
        )
      }
    >
      <Typography variant="body2">Store: {catalog.store?.name}</Typography>
      {staleStore && (
        <Alert severity="warning">
          Your store changed. Adding an item starts a new cart.
        </Alert>
      )}
      <Tabs
        value={category}
        onChange={(_, value: string) => setCategory(value)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Garment category"
      >
        {[
          ["men", "Men"],
          ["women", "Women"],
          ["kid", "Kids"],
          ["other", "Household"],
        ].map(([id, label]) => (
          <Tab key={id} value={id} label={label} />
        ))}
      </Tabs>
      {!items.length && (
        <Alert severity="info">
          No garments available in this category for {selected.name}.
        </Alert>
      )}
      <Stack divider={<Divider />}>
        {items.map((item) => {
          const quantity =
            activeItems.find(
              (row) =>
                row.garmentId === item.garmentId && row.serviceId === item.id,
            )?.quantity ?? 0;
          function change(next: number) {
            const rest = activeItems.filter(
              (row) =>
                !(
                  row.garmentId === item.garmentId && row.serviceId === item.id
                ),
            );
            update({
              kind: "items",
              storeId: catalog.store!.id,
              coupon: "",
              items: next
                ? [
                    ...rest,
                    {
                      garmentId: item.garmentId,
                      serviceId: item.id,
                      garmentName: item.garmentName,
                      serviceName: item.name,
                      name: item.garmentName,
                      quantity: next,
                      unitPrice: item.regularPrice,
                      image: item.garmentImagePath,
                    },
                  ]
                : rest,
            });
          }
          return (
            <Stack
              key={item.garmentId}
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ py: 2 }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={600} sx={{ overflowWrap: "anywhere" }}>
                  {item.garmentName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.isActive
                    ? `${money(item.regularPrice)} / ${item.unit.replace("_", " ")}`
                    : "Unavailable"}
                </Typography>
              </Box>
              <Quantity
                name={item.garmentName}
                quantity={quantity}
                change={change}
                disabled={!item.isActive}
              />
            </Stack>
          );
        })}
      </Stack>
      <Button component={Link} to="/customer/services">
        Add another service
      </Button>
      <CartLink />
    </Frame>
  );
}
function Quantity({
  name,
  quantity,
  change,
  disabled = false,
}: {
  name: string;
  quantity: number;
  change: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <IconButton
        aria-label={`Remove one ${name}`}
        disabled={disabled || quantity === 0}
        onClick={() => change(quantity - 1)}
      >
        <Minus size={20} />
      </IconButton>
      <Typography sx={{ minWidth: 22, textAlign: "center" }}>
        {quantity}
      </Typography>
      <IconButton
        aria-label={`Add one ${name}`}
        disabled={disabled || quantity >= 100}
        onClick={() => change(quantity + 1)}
        sx={{ color: purple }}
      >
        <Plus size={20} />
      </IconButton>
    </Stack>
  );
}
async function post<T>(
  url: string,
  data: unknown,
  key?: string,
  signal?: AbortSignal,
): Promise<T> {
  const transport = url === "/api/customer/quote" ? fetch : apiFetch;
  const response = await transport(url, {
    method: "POST",
    credentials: "same-origin",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "Please try again.");
  return result as T;
}
function useQuote(draft: OrderingDraft) {
  return useQuery({
    queryKey: ["customer", "quote", draft.storeId, draft.items, draft.coupon],
    queryFn: ({ signal }) =>
      post<OrderQuote>(
        "/api/customer/quote",
        {
          storeId: draft.storeId,
          items: draft.items,
          couponCode: draft.coupon,
        },
        undefined,
        signal,
      ),
    enabled: draft.kind === "items" && draft.items.length > 0,
    staleTime: 0,
    retry: false,
  });
}
function Totals({ quote }: { quote: OrderQuote }) {
  return (
    <Stack spacing={1}>
      {[
        ["Subtotal", quote.subtotal],
        ...(quote.discount > 0
          ? [[quote.discountLabel || "Discount", -quote.discount]]
          : []),
        ["Pickup / Delivery", quote.deliveryFee],
        ...(quote.tax ? [["Tax", quote.tax]] : []),
        ["Grand Total", quote.total],
      ].map(([label, value]) => (
        <Stack
          key={String(label)}
          direction="row"
          justifyContent="space-between"
          gap={2}
        >
          <Typography fontWeight={label === "Grand Total" ? 700 : 400}>
            {label}
          </Typography>
          <Typography fontWeight={label === "Grand Total" ? 700 : 400}>
            {money(Number(value))}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
function GroupedItems({
  draft,
  quote,
  update,
}: {
  draft: OrderingDraft;
  quote?: OrderQuote;
  update?: (change: Partial<OrderingDraft>) => void;
}) {
  const groups = [...new Set(draft.items.map((item) => item.serviceId))];
  return (
    <Stack spacing={3}>
      {groups.map((id) => (
        <Box key={id}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography component="h2" fontWeight={700}>
              {draft.items.find((item) => item.serviceId === id)?.serviceName ??
                "Service"}
            </Typography>
            {update && (
              <IconButton
                aria-label={`Remove ${draft.items.find((item) => item.serviceId === id)?.serviceName} service`}
                onClick={() =>
                  update({
                    items: draft.items.filter((item) => item.serviceId !== id),
                    coupon: "",
                  })
                }
              >
                <Trash2 size={18} />
              </IconButton>
            )}
          </Stack>
          {draft.items
            .filter((item) => item.serviceId === id)
            .map((item) => {
              const price =
                quote?.items.find(
                  (row) =>
                    row.serviceId === id && row.garmentId === item.garmentId,
                )?.unitPrice ?? item.unitPrice;
              const change = (quantity: number) =>
                update?.({
                  coupon: "",
                  items: draft.items.flatMap((row) =>
                    row === item
                      ? quantity
                        ? [{ ...row, quantity }]
                        : []
                      : [row],
                  ),
                });
              return (
                <Box
                  key={`${id}-${item.garmentId}`}
                  sx={{ py: 1.5, borderBottom: "1px solid #e5e2eb" }}
                >
                  <Stack direction="row" gap={1} justifyContent="space-between">
                    <Stack
                      direction="row"
                      gap={1}
                      minWidth={0}
                      alignItems="center"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-lg object-contain"
                        />
                      ) : null}
                      <Typography sx={{ overflowWrap: "anywhere" }}>
                        {item.garmentName ?? item.name} × {item.quantity}
                      </Typography>
                    </Stack>
                    <Typography sx={{ whiteSpace: "nowrap" }}>
                      {money(price * item.quantity)}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2" color="text.secondary">
                      {money(price)} each
                    </Typography>
                    {update && (
                      <Stack direction="row">
                        <Quantity
                          name={item.garmentName ?? item.name}
                          quantity={item.quantity}
                          change={change}
                        />
                        <IconButton
                          aria-label={`Remove ${item.garmentName ?? item.name}`}
                          onClick={() => change(0)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              );
            })}
          {update && (
            <Button component={Link} to={`/customer/services/${id}`}>
              Add more items
            </Button>
          )}
        </Box>
      ))}
    </Stack>
  );
}
export function OrderingCartPage() {
  const { draft, update } = useOrderingDraft();
  const navigate = useNavigate();
  const quote = useQuote({ ...draft, kind: "items" });
  const [coupon, setCoupon] = useState(draft.coupon);
  const dates = useMemo(() => quickPickupDates().slice(0, 8), []);
  const [pickupDate, setPickupDate] = useState(
    () => draft.date || dates[0]?.id || "",
  );
  const [pickupSlot, setPickupSlot] = useState(() => {
    const date = draft.date || dates[0]?.id || "";
    return draft.slot &&
      quickPickupTimestamp(date, draft.slot) >= Date.now() + 1800000
      ? draft.slot
      : firstAvailableQuickSlot(date);
  });
  const [scheduleError, setScheduleError] = useState("");
  const availableSlots: readonly string[] = pickupSlots.filter(
    (slot) => quickPickupTimestamp(pickupDate, slot) >= Date.now() + 1800000,
  );
  const pickupReady = Boolean(
    draft.items.length &&
    quote.data &&
    !quote.isFetching &&
    !quote.error &&
    pickupDate &&
    pickupSlot &&
    availableSlots.includes(pickupSlot),
  );

  function choosePickupDate(date: string) {
    const slot = firstAvailableQuickSlot(date);
    setPickupDate(date);
    setPickupSlot(slot);
    update({ date, slot });
    setScheduleError("");
  }

  function choosePickupSlot(slot: string) {
    setPickupSlot(slot);
    update({ date: pickupDate, slot });
    setScheduleError("");
  }

  function schedulePickup() {
    if (!pickupReady) {
      setScheduleError("Choose an available pickup date and time slot.");
      return;
    }
    update({ kind: "items", date: pickupDate, slot: pickupSlot });
    startNavigationProgress();
    navigate(draft.addressId ? "/customer/schedule" : "/customer/addresses");
  }

  return (
    <Frame
      title="Your cart"
      back="/customer/services"
      footer={
        draft.items.length ? (
          <Action large disabled={!pickupReady} onClick={schedulePickup}>
            {quote.isFetching ? "Checking price…" : "Schedule pickup"}
          </Action>
        ) : (
          <Action to="/customer/services">Choose a service</Action>
        )
      }
    >
      {!draft.items.length ? (
        <Alert severity="info">Your cart is empty.</Alert>
      ) : (
        <>
          <GroupedItems draft={draft} quote={quote.data} update={update} />
          <section>
            <Typography component="h2" fontWeight={700}>
              Pickup date
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mt: 1.5,
                overflowX: "auto",
                pb: 0.5,
              }}
            >
              {dates.map((date) => {
                const selected = pickupDate === date.id;
                return (
                  <Button
                    key={date.id}
                    type="button"
                    onClick={() => choosePickupDate(date.id)}
                    variant={selected ? "contained" : "outlined"}
                    sx={{
                      minWidth: 76,
                      minHeight: 72,
                      flexShrink: 0,
                      borderRadius: 2,
                      bgcolor: selected ? purple : "white",
                      color: selected ? "white" : "#303241",
                      borderColor: "#e3e1e9",
                      "&:hover": {
                        bgcolor: selected ? purple : "#fbf9ff",
                        borderColor: purple,
                      },
                    }}
                  >
                    <Stack spacing={0.25} alignItems="center">
                      <Typography
                        component="span"
                        sx={{ fontSize: 10, fontWeight: 600, color: "inherit" }}
                      >
                        {date.day}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 21,
                          fontWeight: 800,
                          lineHeight: 1,
                          color: "inherit",
                        }}
                      >
                        {date.date}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{ fontSize: 10, color: "inherit" }}
                      >
                        {date.month}
                      </Typography>
                    </Stack>
                  </Button>
                );
              })}
            </Box>
          </section>

          <section>
            <Typography component="h2" fontWeight={700}>
              Available time slots
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(4, minmax(0, 1fr))",
                },
                gap: 1,
                mt: 1.5,
              }}
            >
              {pickupSlots.map((slot) => {
                const available = availableSlots.includes(slot);
                const selected = pickupSlot === slot;
                return (
                  <Button
                    key={slot}
                    type="button"
                    disabled={!available}
                    onClick={() => choosePickupSlot(slot)}
                    variant={selected ? "contained" : "outlined"}
                    aria-pressed={selected}
                    sx={{
                      minHeight: 46,
                      borderRadius: 2,
                      borderColor: selected ? purple : "#e3e1e9",
                      bgcolor: selected ? purple : "white",
                      color: selected ? "white" : "#303241",
                      "&:hover": {
                        bgcolor: selected ? purple : "#fbf9ff",
                        borderColor: purple,
                      },
                    }}
                  >
                    {slot}
                  </Button>
                );
              })}
            </Box>
          </section>

          <TextField
            label="Pickup remark (optional)"
            placeholder="Example: Please call when you arrive"
            multiline
            minRows={3}
            value={draft.instructions}
            onChange={(event) => {
              update({ instructions: event.target.value.slice(0, 120) });
              setScheduleError("");
            }}
            helperText={`${draft.instructions.length}/120`}
          />
          {scheduleError && <Alert severity="error">{scheduleError}</Alert>}
        </>
      )}
      <Button component={Link} to="/customer/services" startIcon={<Plus />}>
        Add another service
      </Button>
      {draft.items.length > 0 && (
        <>
          <Stack direction="row" gap={1}>
            <TextField
              label="Coupon code"
              size="small"
              value={coupon}
              onChange={(event) => setCoupon(event.target.value.toUpperCase())}
              fullWidth
            />
            <Button
              disabled={quote.isFetching}
              onClick={() => update({ coupon: coupon.trim() })}
            >
              Apply
            </Button>
          </Stack>
          {draft.coupon && (
            <Button
              onClick={() => {
                setCoupon("");
                update({ coupon: "" });
              }}
            >
              Remove coupon
            </Button>
          )}
          {quote.isFetching && (
            <Typography role="status">Checking current prices…</Typography>
          )}
          {quote.error && (
            <Alert
              severity="error"
              action={
                <Button onClick={() => void quote.refetch()}>Retry</Button>
              }
            >
              {quote.error.message}
            </Alert>
          )}
          {quote.data && <Totals quote={quote.data} />}
        </>
      )}
    </Frame>
  );
}
export function QuickPickupPage() {
  const query = useCustomerData<OrderingCatalog>(
    "/api/customer/catalog",
    30000,
  );
  if (query.error)
    return <CustomerPageError message={query.error} retry={query.retry} />;
  return (
    <QuickServices
      catalog={query.data ?? null}
      catalogLoading={query.loading}
    />
  );
}

function quickPickupDates() {
  const start = new Date();
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      id: date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
      day:
        index === 0
          ? "Today"
          : date.toLocaleDateString("en-IN", {
              weekday: "short",
              timeZone: "Asia/Kolkata",
            }),
      date: date.toLocaleDateString("en-IN", {
        day: "numeric",
        timeZone: "Asia/Kolkata",
      }),
      month: date.toLocaleDateString("en-IN", {
        month: "short",
        timeZone: "Asia/Kolkata",
      }),
    };
  });
}
function quickPickupTimestamp(date: string, slot: string) {
  return new Date(`${date}T${slot.slice(0, 5)}:00+05:30`).getTime();
}
function firstAvailableQuickSlot(date: string) {
  return (
    pickupSlots.find(
      (slot) => quickPickupTimestamp(date, slot) >= Date.now() + 1800000,
    ) ?? ""
  );
}
function QuickServices({
  catalog,
  catalogLoading,
}: {
  catalog: OrderingCatalog | null;
  catalogLoading: boolean;
}) {
  const navigate = useNavigate();
  const { draft } = useOrderingDraft();
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get("service");
  const [serviceIds, setServiceIds] = useState(() => {
    if (requestedService) return [requestedService];
    return draft.kind === "quick" ? draft.serviceIds : [];
  });
  const [notSure, setNotSure] = useState(
    draft.kind === "quick" && draft.serviceIds.length === 0,
  );
  const services = catalog
    ? [
        ...new Map(
          catalog.services
            .filter((service) => service.isActive)
            .map((service) => [service.name.trim().toLowerCase(), service]),
        ).values(),
      ]
    : [];

  function toggleService(id: string) {
    setServiceIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
    setNotSure(false);
  }

  function continueToAddress() {
    if (!catalog?.store) return;
    const nextDraft: OrderingDraft = {
      ...readDraft(),
      kind: "quick",
      storeId: catalog.store.id,
      items: [],
      serviceIds: notSure ? [] : serviceIds,
      quickItemCount: 0,
      addressId: "",
      requestKey: "",
      method: "cash",
      coupon: "",
      delivery: "standard",
    };
    saveDraft(nextDraft);
    startNavigationProgress();
    navigate("/customer/addresses");
  }

  if (catalogLoading)
    return <CustomerPageSkeleton variant="services" rows={5} />;
  return (
    <Frame
      title="Choose services"
      back="/customer"
      footer={
        <Action
          large
          disabled={!catalog?.store || (!notSure && serviceIds.length === 0)}
          onClick={continueToAddress}
        >
          Continue
        </Action>
      }
    >
      <Typography fontWeight={700}>What would you like cleaned?</Typography>
      <Stack spacing={1}>
        {services.map((service) => {
          const selected = serviceIds.includes(service.id) && !notSure;
          return (
            <Card
              key={service.id}
              variant="outlined"
              sx={{
                overflow: "hidden",
                borderColor: selected ? purple : "#e5e2eb",
                borderRadius: 3,
                bgcolor: selected ? "#faf7ff" : "white",
              }}
            >
              <CardActionArea
                onClick={() => toggleService(service.id)}
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  gap: 1.25,
                  minHeight: 82,
                  p: 1.25,
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    borderRadius: 2.5,
                    bgcolor: "#f0eaff",
                    color: purple,
                  }}
                >
                  {service.imagePath ? (
                    <Image
                      src={service.imagePath}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                    />
                  ) : (
                    <ServiceIcon name={service.name} />
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                  <Typography fontWeight={700}>{service.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {description(service.name)}
                  </Typography>
                </Box>
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 22,
                    height: 22,
                    border: "1.5px solid",
                    borderColor: selected ? purple : "#b9b6c3",
                    borderRadius: 1,
                    bgcolor: selected ? purple : "white",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                  }}
                >
                  {selected ? "✓" : ""}
                </Box>
              </CardActionArea>
            </Card>
          );
        })}
        <Card
          variant="outlined"
          sx={{ borderColor: notSure ? purple : "#e5e2eb", borderRadius: 2 }}
        >
          <CardActionArea
            onClick={() => {
              setNotSure(true);
              setServiceIds([]);
            }}
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              gap: 1.5,
              p: 1.5,
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 22,
                height: 22,
                border: "1.5px solid",
                borderColor: notSure ? purple : "#b9b6c3",
                borderRadius: 1,
                bgcolor: notSure ? purple : "white",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              {notSure ? "✓" : ""}
            </Box>
            <Typography fontWeight={600}>
              Not sure? Let our team inspect your items.
            </Typography>
          </CardActionArea>
        </Card>
      </Stack>
      {!services.length && (
        <Alert severity="info">
          Services are unavailable right now. You can still ask our team to
          inspect your items.
        </Alert>
      )}
    </Frame>
  );
}

export function OrderingSchedulePage() {
  return (
    <CatalogBoundary>
      {(catalog) => <OrderingSchedule catalog={catalog} />}
    </CatalogBoundary>
  );
}

function OrderingSchedule({ catalog }: { catalog: OrderingCatalog }) {
  const { draft, update } = useOrderingDraft();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [express, setExpress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const addresses = useCustomerData<{ addresses: PortalAddress[] }>(
    "/api/customer/addresses",
  );
  const quote = useQuote(draft);
  const address = addresses.data?.addresses.find(
    (item) => item.id === draft.addressId,
  );
  const quick = draft.kind === "quick";
  const storeMatches = draft.storeId === catalog.store?.id;
  const dateValue = (offset: number) =>
    new Date(Date.now() + offset * 86400000).toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
  const dates = Array.from({ length: 7 }, (_, offset) => {
    const value = dateValue(offset);
    const date = new Date(`${value}T12:00:00+05:30`);
    return {
      value,
      day:
        offset === 0
          ? "Today"
          : offset === 1
            ? "Tomorrow"
            : date.toLocaleDateString("en-IN", {
                weekday: "short",
                timeZone: "Asia/Kolkata",
              }),
      number: date.toLocaleDateString("en-IN", {
        day: "numeric",
        timeZone: "Asia/Kolkata",
      }),
      month: date.toLocaleDateString("en-IN", {
        month: "short",
        timeZone: "Asia/Kolkata",
      }),
    };
  });
  useEffect(() => {
    if (draft.date) return;
    const firstAvailable = dates.find((option) =>
      pickupSlots.some(
        (slot) =>
          new Date(`${option.value}T${slot.slice(0, 5)}:00+05:30`).getTime() >=
          Date.now() + 1800000,
      ),
    );
    const date = firstAvailable?.value ?? dateValue(0);
    const slot =
      pickupSlots.find(
        (candidate) =>
          new Date(`${date}T${candidate.slice(0, 5)}:00+05:30`).getTime() >=
          Date.now() + 1800000,
      ) ?? "";
    update({ date, slot });
  }, [draft.date, dates, update]);
  const ready = draft.kind === "quick" || draft.items.length > 0;
  const quoteReady =
    quick || Boolean(quote.data && !quote.isFetching && !quote.error);
  const canPlace = Boolean(ready && storeMatches && address && quoteReady);
  async function next() {
    const timestamp = new Date(
      `${draft.date}T${draft.slot.slice(0, 5)}:00+05:30`,
    ).getTime();
    if (
      !draft.date ||
      !draft.slot ||
      !Number.isFinite(timestamp) ||
      timestamp < Date.now() + 1800000 ||
      timestamp > Date.now() + 30 * 86400000
    ) {
      setError(
        "Choose a pickup slot at least 30 minutes from now, within 30 days.",
      );
      return;
    }
    if (!draft.addressId) {
      startNavigationProgress();
      navigate("/customer/addresses");
      return;
    }
    if (!address) {
      startNavigationProgress();
      navigate("/customer/addresses");
      return;
    }
    if (!canPlace || submitting) return;

    setSubmitting(true);
    setError("");
    const current = readDraft();
    const requestKey = current.requestKey || crypto.randomUUID();
    saveDraft({ ...current, requestKey });
    try {
      const response = await post<{ order: { id: string } }>(
        "/api/customer/orders",
        {
          bookingKind: draft.kind,
          storeId: draft.storeId,
          serviceIds: quick ? draft.serviceIds : [],
          service: quick ? "Quick Pickup" : "Multiple Services",
          items: quick ? [] : draft.items,
          addressId: draft.addressId,
          pickupAt: new Date(
            `${draft.date}T${draft.slot.slice(0, 5)}:00+05:30`,
          ).toISOString(),
          pickupSlot: draft.slot,
          deliveryOption: draft.delivery,
          instructions: draft.instructions,
          paymentMethod: quick ? "cash" : draft.method,
          couponCode: quick ? "" : draft.coupon,
        },
        requestKey,
      );
      clearOrderingDraft();
      invalidateCustomerData();
      try {
        await preloadCustomerData<{ order: PortalOrder }>(
          `/api/customer/orders/${encodeURIComponent(response.order.id)}`,
        );
      } catch {
        // The order is already saved. The success screen will retry this warm-up.
      }
      startNavigationProgress();
      navigate(
        `/customer/order-success?order=${encodeURIComponent(response.order.id)}`,
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Unable to place order.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#faf8ff",
        color: "#211a35",
        pb: { xs: 22, sm: 22 },
      }}
    >
      <CustomerSimpleHeader title="Pickup date & time" backHref="/customer" />
      <Box
        component="main"
        sx={{ flex: 1, width: "100%", maxWidth: 520, mx: "auto", px: 2, py: 2 }}
      >
        <Stack spacing={2.5}>
          <Box component="section" aria-labelledby="pickup-date-title">
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1.25 }}
            >
              <CalendarDays size={17} color="#7040dc" />
              <Typography
                id="pickup-date-title"
                component="h2"
                sx={{ fontSize: 14, fontWeight: 700 }}
              >
                Choose a day
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 0.5,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {dates.map((option) => {
                const selected = draft.date === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      update({ date: option.value, slot: "" });
                      setError("");
                    }}
                    sx={{
                      flex: "0 0 64px",
                      minWidth: 64,
                      minHeight: 76,
                      px: 0.5,
                      py: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.15,
                      border: "1px solid",
                      borderColor: selected ? "#7040dc" : "#e7e1f0",
                      borderRadius: 2,
                      bgcolor: selected ? "#7040dc" : "#fff",
                      color: selected ? "#fff" : "#332b43",
                      textTransform: "none",
                      boxShadow: selected
                        ? "0 5px 12px rgba(112,64,220,.18)"
                        : "none",
                      "&:hover": {
                        bgcolor: selected ? "#6033c7" : "#f5f1fc",
                        borderColor: "#7040dc",
                      },
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 10,
                        fontWeight: 600,
                        opacity: selected ? 0.9 : 0.72,
                      }}
                    >
                      {option.day}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontSize: 21, lineHeight: 1.1, fontWeight: 800 }}
                    >
                      {option.number}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontSize: 10, opacity: selected ? 0.9 : 0.72 }}
                    >
                      {option.month}
                    </Typography>
                  </Button>
                );
              })}
            </Box>
          </Box>

          <Box component="section" aria-labelledby="pickup-slot-title">
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1.25 }}
            >
              <Clock3 size={17} color="#7040dc" />
              <Typography
                id="pickup-slot-title"
                component="h2"
                sx={{ fontSize: 14, fontWeight: 700 }}
              >
                Choose a time
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(4, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              {pickupSlots.map((slot) => {
                const disabled =
                  new Date(
                    `${draft.date}T${slot.slice(0, 5)}:00+05:30`,
                  ).getTime() <
                  Date.now() + 1800000;
                const selected = draft.slot === slot;
                const [start, end] = slot.split("–");
                const twelveHour = (time: string) => {
                  const [hour, minute] = time.split(":");
                  const numericHour = Number(hour);
                  const displayedHour = numericHour % 12 || 12;
                  const suffix = numericHour < 12 ? "AM" : "PM";
                  return `${displayedHour}:${minute} ${suffix}`;
                };
                return (
                  <Button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() => {
                      update({ slot });
                      setError("");
                    }}
                    sx={{
                      minWidth: 0,
                      minHeight: 48,
                      px: 1,
                      border: "1px solid",
                      borderColor: selected ? "#7040dc" : "#e7e1f0",
                      borderRadius: 1.5,
                      bgcolor: selected ? "#f1eaff" : "#fff",
                      color: selected ? "#6033c7" : "#453d55",
                      textTransform: "none",
                      fontSize: 11,
                      fontWeight: selected ? 700 : 600,
                      lineHeight: 1.2,
                      "&:hover": {
                        bgcolor: selected ? "#eee6ff" : "#f7f4fb",
                        borderColor: "#7040dc",
                      },
                      "&.Mui-disabled": {
                        color: "#aaa5b3",
                        bgcolor: "#f3f1f6",
                        borderColor: "#ebe8f0",
                      },
                    }}
                  >
                    {selected && (
                      <Check
                        size={14}
                        style={{ marginRight: 5, flexShrink: 0 }}
                      />
                    )}
                    {twelveHour(start)} - {twelveHour(end)}
                  </Button>
                );
              })}
            </Box>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Box
          sx={{
            position: "fixed",
            right: 16,
            bottom: 210,
            left: 16,
            zIndex: 60,
            maxWidth: 488,
            mx: "auto",
          }}
        >
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      {draft.storeId !== catalog.store?.id && (
        <Alert severity="warning" sx={{ mx: 2, mb: 1 }}>
          Your store changed.{" "}
          <Link to="/customer/services">Choose items again</Link>.
        </Alert>
      )}
      {addresses.error && (
        <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
          {addresses.error}
        </Alert>
      )}
      {!quick && quote.isFetching && (
        <Typography role="status" sx={{ mx: 2, mb: 1, fontSize: 11 }}>
          Checking current prices…
        </Typography>
      )}
      {!quick && quote.error && (
        <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
          {quote.error.message}
        </Alert>
      )}
      <Box
        sx={{
          position: "fixed",
          right: 0,
          bottom: 0,
          left: 0,
          maxWidth: 552,
          mx: "auto",
          zIndex: 50,
          bgcolor: "#fff",
          border: "1px solid #e9e3f2",
          borderBottom: 0,
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 -4px 16px rgba(48,32,77,.06)",
        }}
      >
        <Button
          type="button"
          onClick={() => setExpress((value) => !value)}
          aria-pressed={express}
          sx={{
            width: "100%",
            minHeight: 54,
            px: 2,
            justifyContent: "flex-start",
            borderRadius: 0,
            color: "#332b43",
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 22,
              height: 22,
              mr: 1.25,
              borderRadius: "50%",
              border: `2px solid ${pickupCta}`,
              bgcolor: express ? pickupCta : "transparent",
              boxShadow: express ? "inset 0 0 0 4px #fff" : "none",
            }}
          />
          Express pickup
        </Button>
        <Stack
          spacing={1}
          sx={{ px: 2, pb: "calc(12px + env(safe-area-inset-bottom))" }}
        >
          <Button
            type="button"
            disabled={
              !ready ||
              !storeMatches ||
              submitting ||
              Boolean(draft.addressId && addresses.loading) ||
              Boolean(address && !quoteReady)
            }
            onClick={() => void next()}
            sx={{
              display: "flex",
              minHeight: 52,
              width: "100%",
              borderRadius: 2,
              bgcolor: pickupCta,
              color: "#fff",
              textTransform: "none",
              fontSize: 14,
              fontWeight: 700,
              "&:hover": { bgcolor: "#6033c7" },
              "&.Mui-disabled": {
                bgcolor: "#c9b7ec",
                color: "rgba(255,255,255,.9)",
              },
            }}
          >
            {submitting
              ? quick
                ? "Confirming pickup…"
                : "Placing order…"
              : address
                ? quick
                  ? "Confirm pickup"
                  : "Place order"
                : "Continue"}
          </Button>
          <Button
            component={Link}
            to="/customer"
            startIcon={<ArrowLeft size={17} />}
            fullWidth
            variant="outlined"
            sx={{
              minHeight: 44,
              borderColor: "#d9c9f5",
              borderRadius: 2,
              color: purple,
              fontSize: 13,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                borderColor: purple,
                bgcolor: "#f7f3ff",
              },
            }}
          >
            Back
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
export function OrderingReviewPage() {
  return <Navigate to="/customer/schedule" replace />;
}
