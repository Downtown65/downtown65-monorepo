import { Container, createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Zalando Sans, Roboto, Helvetica, Arial, sans-serif',
  components: {
    Container: Container.extend({
      defaultProps: {
        px: { base: 0, sm: 'md' },
      },
    }),
  },
  colors: {
    pink: [
      '#ffebf7',
      '#f9d7e8',
      '#eca0c5',
      '#e47fb0',
      '#dc5998',
      '#d74189',
      '#d53482',
      '#bd266f',
      '#aa1e63',
      '#951156',
    ],
  },
});
