import { Box, Typography } from '@mui/material';

/**
 * Título de marca estilo flyer:
 *   “HIJOS      -> blanco con borde cian/rosa (efecto glitch)
 *    AMADOS”    -> púrpura/malva
 *
 * @param {object} props
 * @param {string} [props.first='Hijos']
 * @param {string} [props.second='Amados']
 * @param {boolean} [props.quotes=true]   Muestra las comillas “ ” en rosa
 * @param {boolean} [props.stacked=true]  Una palabra por línea (como el flyer)
 * @param {object|number|string} [props.size] fontSize (acepta valores responsivos de MUI)
 * @param {string} [props.component='h1']
 */
export default function BrandTitle({
  first = 'Hijos',
  second = 'Amados',
  quotes = true,
  stacked = true,
  size = { xs: '2.6rem', sm: '4rem', md: '5rem' },
  component = 'h1',
  sx,
  ...rest
}) {
  const quoteSx = { color: 'brand.pink', textShadow: 'none' };

  return (
    <Typography
      variant="brandTitle"
      component={component}
      sx={{ fontSize: size, textAlign: 'center', m: 0, ...sx }}
      {...rest}
    >
      <Box
        component="span"
        sx={{
          display: stacked ? 'block' : 'inline',
          color: 'brand.white',
          // Desfase cian / rosa como en el flyer
          textShadow: (t) =>
            `-0.035em 0 ${t.palette.brand.cyan}, 0.035em 0 ${t.palette.brand.pink}`,
        }}
      >
        {quotes && <Box component="span" sx={quoteSx}>“</Box>}
        {first}
      </Box>
      {!stacked && ' '}
      <Box
        component="span"
        sx={{
          display: stacked ? 'block' : 'inline',
          color: 'brand.mauve',
          textShadow: (t) => `0.03em 0 ${t.palette.brand.mauveLight}55`,
        }}
      >
        {second}
        {quotes && <Box component="span" sx={quoteSx}>”</Box>}
      </Box>
    </Typography>
  );
}
