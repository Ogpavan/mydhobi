import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  Stack,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowRight,
  Check,
  PackageOpen,
  Plus,
  Search,
  Shirt,
} from "lucide-react";
import type { AdminBookingInput } from "@/lib/admin-order-booking";
import type { ItemCategory } from "@/lib/item-master-types";
import type { TariffItem } from "@/lib/tariffs";

type BookingType = AdminBookingInput["bookingType"];

export function BookingTypeOptions({
  onSelect,
}: {
  onSelect: (type: BookingType) => void;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: 2,
        width: "100%",
        maxWidth: 800,
        mx: "auto",
        minHeight: { xs: 360, sm: "calc(100dvh - 180px)" },
        alignContent: "center",
        py: { xs: 1, sm: 3 },
      }}
    >
      {(
        [
          {
            type: "general",
            label: "General Booking",
            unit: "Per piece",
            tint: "#EEF5FF",
          },
          {
            type: "package",
            label: "Package Booking",
            unit: "Per kg",
            tint: "#EBF9F5",
          },
        ] as const
      ).map(({ type, label, unit, tint }) => (
        <Card key={type} variant="outlined" sx={{ borderColor: "divider" }}>
          <CardActionArea
            aria-label={label}
            onClick={() => onSelect(type)}
            sx={{
              p: 2.5,
              display: "flex",
              flexDirection: { xs: "row", sm: "column" },
              alignItems: "center",
              gap: 2,
              minHeight: { xs: 156, sm: 260 },
              "&:hover": { bgcolor: tint },
              "&.Mui-focusVisible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: -2,
              },
            }}
          >
            <Box
              component="img"
              src={`/booking/3d-v1/${type === "general" ? "general" : "package"}-booking.webp`}
              alt=""
              aria-hidden="true"
              sx={{
                width: { xs: 104, sm: 150 },
                height: { xs: 104, sm: 150 },
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <Stack sx={{ width: "100%", minWidth: 0 }} spacing={1.25}>
              <Chip
                label={unit}
                sx={{
                  alignSelf: "flex-start",
                  bgcolor: tint,
                  color: "text.secondary",
                }}
              />
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
              >
                <Typography
                  component="h2"
                  sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 600 }}
                >
                  {label}
                </Typography>
                <ArrowRight size={19} aria-hidden="true" />
              </Stack>
            </Stack>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}

type BookingTile = { item: TariffItem; price: string; added: number };

export function BookingItemPicker({
  categories,
  categoryId,
  loading,
  error,
  emptyMessage,
  query,
  items,
  onCategory,
  onSearch,
  onItem,
  onRetry,
}: {
  categories: ItemCategory[];
  categoryId: string;
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  query: string;
  items: BookingTile[];
  onCategory: (id: string) => void;
  onSearch: (query: string) => void;
  onItem: (item: TariffItem) => void;
  onRetry: () => void;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "88px minmax(0, 1fr)",
          sm: "164px minmax(0, 1fr)",
        },
        minHeight: 0,
        height: "100%",
        flex: 1,
      }}
    >
      <Box
        component="aside"
        aria-label="Item categories"
        sx={{
          bgcolor: "#FAFCFF",
          borderRight: 1,
          borderColor: "divider",
          pr: { xs: 1, sm: 2 },
          py: 1.5,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={0.5}
          sx={{ px: 1, pb: 1.25 }}
        >
          <Typography component="h3" sx={{ fontSize: 12, fontWeight: 600 }}>
            Category
          </Typography>
          <Chip
            label={categories.length}
            sx={{
              alignSelf: { xs: "center", sm: "auto" },
              height: 20,
              minWidth: 24,
              bgcolor: "#EAF2FF",
              color: "primary.main",
              fontSize: 10,
              fontWeight: 600,
            }}
          />
        </Stack>
        <List disablePadding aria-label="Categories">
          {categories.map((category) => {
            const selected = String(category.id) === categoryId;
            return (
              <ListItemButton
                key={category.id}
                selected={selected}
                aria-label={category.name}
                aria-pressed={selected}
                disabled={loading}
                onClick={() => onCategory(String(category.id))}
                sx={{
                  border: 1,
                  borderColor: selected ? "#BFD4FF" : "transparent",
                  borderRadius: 1,
                  bgcolor: selected ? "#EEF5FF" : "transparent",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                  px: 1,
                  py: 1.25,
                  mb: 0.5,
                  "&.Mui-selected": { bgcolor: "#EEF5FF" },
                  "&:hover": { bgcolor: selected ? "#EAF2FF" : "#F4F8FD" },
                }}
              >
                <Avatar
                  variant="rounded"
                  src={category.imagePath || undefined}
                  alt=""
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 13,
                    bgcolor: selected ? "primary.main" : "#EAF0F8",
                    color: selected ? "white" : "text.secondary",
                    "& img": { objectFit: "contain" },
                  }}
                >
                  {category.name.slice(0, 1).toUpperCase()}
                </Avatar>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: selected ? 600 : 400,
                    overflowWrap: "anywhere",
                    textAlign: { xs: "center", sm: "left" },
                  }}
                >
                  {category.name}
                </Typography>
              </ListItemButton>
            );
          })}
        </List>
      </Box>
      <Box
        component="section"
        aria-label="Available items"
        sx={{
          display: "flex",
          minWidth: 0,
          minHeight: 0,
          flexDirection: "column",
          pl: { xs: 1.5, sm: 2.5 },
          py: 1.5,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          gap={1.5}
          sx={{
            mb: 2,
            borderBottom: 1,
            borderColor: "#E7EDF5",
            pb: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0, pt: 0.5 }}>
            <Typography component="h3" sx={{ fontSize: 14, fontWeight: 600 }}>
              {categories.find((category) => String(category.id) === categoryId)
                ?.name || "Items"}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 11, color: "text.secondary" }}>
              {items.length} item{items.length === 1 ? "" : "s"} available
            </Typography>
          </Box>
          <TextField
            label="Search items"
            value={query}
            onChange={(event) => onSearch(event.target.value)}
            sx={{
              width: { xs: "100%", sm: 230 },
              "& .MuiOutlinedInput-root": { bgcolor: "#FAFCFF" },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
        {loading ? (
          <Stack
            role="status"
            alignItems="center"
            justifyContent="center"
            gap={1}
            sx={{ minHeight: 240 }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2">Loading items…</Typography>
          </Stack>
        ) : error ? (
          <Alert
            severity="error"
            action={<Button onClick={onRetry}>Retry</Button>}
          >
            {error}
          </Alert>
        ) : items.length === 0 ? (
          <Stack
            role="status"
            alignItems="center"
            justifyContent="center"
            gap={1.5}
            sx={{ minHeight: 240, textAlign: "center" }}
          >
            <PackageOpen size={32} aria-hidden="true" />
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
            {query && (
              <Button onClick={() => onSearch("")}>Clear search</Button>
            )}
          </Stack>
        ) : (
          <TableContainer
            sx={{
              minHeight: 0,
              flex: 1,
              overflowX: "auto",
              overflowY: "auto",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "white",
            }}
          >
            <MuiTable
              stickyHeader
              size="small"
              aria-label="Available items table"
              sx={{ minWidth: 540 }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200 }}>Item</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(({ item, price, added }) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      bgcolor: added ? "#F8FBFF" : "white",
                      "&:last-child td": { borderBottom: 0 },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1.25}>
                        <Avatar
                          variant="rounded"
                          src={item.imagePath || undefined}
                          alt=""
                          sx={{
                            width: 42,
                            height: 42,
                            flexShrink: 0,
                            bgcolor: added ? "#EAF2FF" : "#EEF5FF",
                            color: "primary.main",
                            border: 1,
                            borderColor: added ? "#BFD4FF" : "#E0EBFF",
                            "& img": { objectFit: "contain" },
                          }}
                        >
                          <Shirt size={22} />
                        </Avatar>
                        <Typography
                          sx={{
                            minWidth: 0,
                            fontSize: 12,
                            fontWeight: 600,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography
                        sx={{ fontSize: 11, color: "text.secondary" }}
                      >
                        {price}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {added > 0 ? (
                        <Chip
                          icon={<Check size={13} />}
                          label={`${added} added`}
                          sx={{
                            height: 24,
                            bgcolor: "#EAF2FF",
                            color: "primary.main",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: 11, color: "#71809A" }}>
                          Not added
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant={added > 0 ? "outlined" : "contained"}
                        aria-label={`Add ${item.name}`}
                        onClick={() => onItem(item)}
                        sx={{ minWidth: 72, whiteSpace: "nowrap" }}
                      >
                        <Plus size={15} /> Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </MuiTable>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
