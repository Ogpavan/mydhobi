import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  ClipboardList,
  Gift,
  Home,
  Menu,
  MessageCircle,
  Package,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

const items = [
  { label: "Home", href: "/customer", icon: Home },
  {
    label: "Request pickup",
    href: "/customer/quick-pickup",
    icon: Sparkles,
  },
  { label: "My Orders", href: "/customer/orders", icon: ClipboardList },
  { label: "Offers", href: "/customer/offers", icon: Gift },
  { label: "Wallet", href: "/customer/wallet", icon: WalletCards },
  { label: "Price list", href: "/customer/calculator", icon: Package },
  { label: "Contact us", href: "/customer/help", icon: MessageCircle },
  { label: "My profile", href: "/customer/profile", icon: UserRound },
] as const;

export function CustomerSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <IconButton
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        title="Open menu"
        sx={{
          width: 40,
          height: 40,
          color: "#7040dc",
          bgcolor: "#f2ecff",
          "&:hover": { bgcolor: "#e9ddff" },
        }}
      >
        <Menu size={21} />
      </IconButton>
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "min(88vw, 340px)", sm: 320 },
              border: 0,
              borderRadius: "0 20px 20px 0",
              bgcolor: "#faf8ff",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100dvh",
            display: "flex",
            flexDirection: "column",
            pb: "env(safe-area-inset-bottom)",
          }}
          role="presentation"
        >
          <Box
            component="header"
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              px: 2,
              py: 2,
              background: "linear-gradient(120deg, #7040dc, #8b4def)",
              color: "#fff",
            }}
          >
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: "#fff",
                color: "#7040dc",
                fontWeight: 800,
                fontSize: 17,
              }}
            >
              M
            </Box>
            <Box component="p" sx={{ m: 0, fontSize: 17, fontWeight: 800 }}>
              MyDhobi
            </Box>
            <IconButton
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              title="Close menu"
              size="small"
              sx={{ position: "absolute", right: 8, top: 8, color: "#fff" }}
            >
              <X size={19} />
            </IconButton>
          </Box>
          <List
            component="nav"
            aria-label="Customer menu"
            sx={{ px: 1.25, py: 1.5, overflowY: "auto" }}
          >
            {items.map((item) => {
              const Icon = item.icon;
              const selected =
                location.pathname === item.href ||
                (item.href !== "/customer" &&
                  location.pathname.startsWith(`${item.href}/`)) ||
                (item.href === "/customer/quick-pickup" &&
                  location.pathname === "/customer/schedule");
              return (
                <ListItemButton
                  key={item.href}
                  component={RouterLink}
                  to={item.href}
                  selected={selected}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  sx={{
                    minHeight: 52,
                    borderRadius: 2.5,
                    mb: 0.75,
                    px: 1,
                    color: selected ? "#6033c7" : "#514a5f",
                    "&.Mui-selected": {
                      bgcolor: "#eee7ff",
                      color: "#6033c7",
                    },
                    "&.Mui-selected:hover": { bgcolor: "#e8deff" },
                    "&:hover": { bgcolor: "#f2edfa" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 48, color: "inherit" }}>
                    <Box
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: selected ? "#fff" : "#f0edf5",
                        color: "inherit",
                      }}
                    >
                      <Icon size={18} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 13,
                      fontWeight: selected ? 700 : 600,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
