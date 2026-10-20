import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    // Fondo general y contenedores
    background: {
      default: '#07010C', // Fondo casi negro con matiz violeta profundo
      paper: '#130820',   // Para Card, Dialog, Drawer, etc.
    },
    // Color principal: Violeta / Púrpura brillante
    primary: {
      main: '#9333EA',     // Púrpura medio
      light: '#C084FC',    // Lavanda claro
      dark: '#581C87',     // Púrpura oscuro
      contrastText: '#FFFFFF',
    },
    // Color secundario: Cian neón
    secondary: {
      main: '#00F0FF',     // Cian neón brillante
      light: '#67E8F9',
      dark: '#0891B2',
      contrastText: '#000000',
    },
    // Color de acento / error / llamada a la acción: Rosa neón
    error: {
      main: '#FF3385',     // Rosa/magenta brillante
    },
    info: {
      main: '#38BDF8',
    },
    // Textos
    text: {
      primary: '#FFFFFF',
      secondary: '#E9D5FF', // Lavanda claro legible para texto secundario
      disabled: '#6B7280',
    },
    divider: 'rgba(147, 51, 234, 0.2)', // Borde sutil púrpura
    // Colores de marca tomados del flyer
    brand: {
      white: '#FFFFFF',     // "HIJOS" / "23/24"
      mauve: '#B86BC0',     // "AMADOS" (púrpura/malva)
      mauveLight: '#D79BDB',
      cyan: '#5FD8E4',      // "OCTUBRE"
      pink: '#F26BB5',      // "2026" y comillas
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '0.04em',
    },
    // Título de marca: ancho y pesado como en el flyer
    brandTitle: {
      fontFamily: '"Unbounded", "Archivo Black", "Arial Black", sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      lineHeight: 1,
    },
    // Fechas / datos destacados: condensada y en negrita
    brandDisplay: {
      fontFamily: '"Oswald", "Bebas Neue", "Arial Narrow", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      lineHeight: 1,
    },
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: { brandTitle: 'h1', brandDisplay: 'p' },
      },
    },
    // Estilos personalizados para botones
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'uppercase',
          fontWeight: 700,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #9333EA 0%, #FF3385 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7E22CE 0%, #E11D48 100%)',
          },
        },
        containedSecondary: {
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
        },
      },
    },
    // Estilos para tarjetas/superficies con borde sutil brillante
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#130820',
          border: '1px solid rgba(147, 51, 234, 0.25)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;