import { Box, Typography } from '@mui/material';

/**
 * Fecha estilo flyer:
 *        23/24          -> blanco, grande
 *   OCTUBRE 2026        -> cian + rosa
 *
 * @param {object} props
 * @param {string} [props.days='23/24']
 * @param {string} [props.month='Octubre']
 * @param {string|number} [props.year=2026]
 * @param {number} [props.scale=1] Multiplicador de tamaño (0.5 = chico, 1 = default, 1.5 = grande)
 */
export default function EventDate({
  days = '23/24',
  month = 'Octubre',
  year = 2026,
  scale = 1,
  sx,
  ...rest
}) {
  return (
    <Box sx={{ textAlign: 'center', ...sx }} {...rest}>
      {days && (
        <Typography
          variant="brandDisplay"
          component="p"
          sx={{ color: 'brand.white', fontSize: `${3.4 * scale}rem`, letterSpacing: '0.01em' }}
        >
          {days}
        </Typography>
      )}
      <Typography
        variant="brandDisplay"
        component="p"
        sx={{ fontSize: `${1.6 * scale}rem`, letterSpacing: '0.03em', mt: 0.5 * scale }}
      >
        <Box component="span" sx={{ color: 'brand.cyan' }}>{month}</Box>{' '}
        <Box component="span" sx={{ color: 'brand.pink' }}>{year}</Box>
      </Typography>
    </Box>
  );
}
