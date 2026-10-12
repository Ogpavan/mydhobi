import { createTheme } from "@mui/material/styles";
export const theme = createTheme({
  palette: {
    primary: { main: "#075DFF" },
    background: { default: "#F7F9FC", paper: "#FFFFFF" },
    text: { primary: "#172B4D", secondary: "#52627A" },
    divider: "#DFE6EF",
  },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 13,
    h1: { fontSize: 24, fontWeight: 600 },
    h2: { fontSize: 21, fontWeight: 600 },
    h3: { fontSize: 18, fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      defaultProps: { size: "small", disableElevation: true },
      styleOverrides: {
        root: { minHeight: 36, gap: 6, textTransform: "none" },
      },
    },
    MuiIconButton: { defaultProps: { size: "small" } },
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiOutlinedInput: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: { backgroundColor: "#fff", fontSize: 13 },
        input: { padding: "9px 12px" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: "10px 12px", fontSize: 13 },
        head: {
          fontWeight: 600,
          backgroundColor: "#F5F7FA",
          color: "#52627A",
          whiteSpace: "nowrap",
        },
      },
    },
    MuiChip: { defaultProps: { size: "small" } },
    MuiDialog: { defaultProps: { fullWidth: true, maxWidth: "sm" } },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: 17, fontWeight: 600 } },
    },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiCssBaseline: {
      styleOverrides: {
        body: { margin: 0 },
        "*": { boxSizing: "border-box" },
        img: { maxWidth: "100%" },
        "p,h1,h2,h3,h4,h5,h6,figure": { margin: 0 },
        ":root": { "--font-inter": "Inter" },
      },
    },
  },
});
