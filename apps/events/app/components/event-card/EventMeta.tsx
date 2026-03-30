import { Text } from '@mantine/core';
import { IconCalendarEvent, IconMapPin } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';
import classes from './event-card.module.css';

function formatDateTime(isoDate: string, isoTime: string | null): string {
  const d = parseISO(isoDate);
  const date = format(d, 'd.M.yyyy (EEEEEE)', { locale: fi });
  const time = isoTime != null ? `klo ${isoTime}` : '';

  return `${date} ${time}`;
}

interface EventMetaProps {
  dateStart: string;
  timeStart: string | null;
  location: string | null;
}

export function EventMeta({ dateStart, timeStart, location }: EventMetaProps) {
  const dateText = formatDateTime(dateStart, timeStart);

  return (
    <>
      <div className={classes.metaRow}>
        <IconCalendarEvent size={14} className={classes.metaIcon} />
        <Text size="sm">{dateText}</Text>
      </div>

      {location && (
        <div className={classes.metaRow}>
          <IconMapPin size={14} className={classes.metaIcon} />
          <Text size="sm" c="dimmed">
            {location}
          </Text>
        </div>
      )}
    </>
  );
}
