import type { EventType } from '@dt65/shared';
import { Badge, Card, Image, Text } from '@mantine/core';
import { IconAt, IconTrophy, IconUsers } from '@tabler/icons-react';
import { getEventTypeInfo } from '~/lib/event-type-map';
import classes from './event-card.module.css';

interface EventImageHeaderProps {
  title: string;
  type: EventType;
  race: boolean;
  creatorNickname: string;
  participantCount: number;
  isParticipant: boolean;
  imageHeight: number;
}

export function EventImageHeader({
  title,
  type,
  race,
  creatorNickname,
  participantCount,
  isParticipant,
  imageHeight,
}: EventImageHeaderProps) {
  const typeInfo = getEventTypeInfo(type);

  return (
    <Card.Section className={classes.imageSection}>
      <Image src={typeInfo.image} height={imageHeight} alt={title} />
      <div className={classes.imageOverlay}>
        {race && <IconTrophy size={imageHeight > 200 ? 80 : 64} className={classes.raceTrophy} />}
        <Text className={classes.imageTitle} size="xl" fw={700}>
          {title}
        </Text>

        <Badge radius="xs" size="sm" leftSection={<typeInfo.icon size={14} />}>
          {typeInfo.label}
        </Badge>
      </div>
      <Badge
        className={classes.imageBottomRight}
        color="grey"
        radius="xs"
        size="sm"
        tt="none"
        leftSection={<IconAt size={14} />}
      >
        {creatorNickname}
      </Badge>
      <Badge
        className={classes.imageTopRight}
        size="md"
        radius="xs"
        color={isParticipant ? 'pink.3' : undefined}
        leftSection={<IconUsers size={14} />}
      >
        {participantCount}
      </Badge>
    </Card.Section>
  );
}
