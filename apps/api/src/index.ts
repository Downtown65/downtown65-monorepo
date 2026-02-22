import { DT65_APP_NAME } from '@dt65/shared';

export default {
  async fetch(): Promise<Response> {
    return new Response(`${DT65_APP_NAME} - api`);
  },
};
