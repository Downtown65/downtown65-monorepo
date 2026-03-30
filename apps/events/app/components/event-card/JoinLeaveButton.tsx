import { Button } from '@mantine/core';
import { IconUsersMinus, IconUsersPlus } from '@tabler/icons-react';
import { useFetcher } from 'react-router';

interface JoinLeaveButtonProps {
  eventId: number;
  isParticipant: boolean;
  size?: string | undefined;
}

export function JoinLeaveButton({ eventId, isParticipant, size = 'sm' }: JoinLeaveButtonProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';

  const optimisticIsParticipant =
    fetcher.formData != null ? fetcher.formData.get('intent') === 'join' : isParticipant;

  return (
    <fetcher.Form method="post" action={`/events/${String(eventId)}/participate`}>
      {optimisticIsParticipant ? (
        <Button
          type="submit"
          name="intent"
          value="leave"
          color="pink.3"
          size={size}
          leftSection={<IconUsersMinus size={14} />}
          loading={isSubmitting}
        >
          Poistu
        </Button>
      ) : (
        <Button
          type="submit"
          name="intent"
          value="join"
          size={size}
          leftSection={<IconUsersPlus size={14} />}
          loading={isSubmitting}
        >
          Osallistu
        </Button>
      )}
    </fetcher.Form>
  );
}
