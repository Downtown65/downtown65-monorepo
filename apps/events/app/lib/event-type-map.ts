import type { EventType } from '@dt65/shared';
import {
  type Icon,
  IconBike,
  IconBlind,
  IconCarFan,
  IconCompass,
  IconDots,
  IconIceSkating,
  IconMug,
  IconMusic,
  IconRun,
  IconSnowflake,
  IconSwimming,
  IconTrack,
  IconTrees,
  IconTriangleSquareCircle,
  IconUsers,
} from '@tabler/icons-react';

type EventTypeInfo = {
  label: string;
  image: string;
  icon: Icon;
};

const EVENT_TYPE_MAP: Record<EventType, EventTypeInfo> = {
  CYCLING: {
    label: 'Pyöräily',
    image: '/event-images/cycling.jpg',
    icon: IconBike,
  },
  KARONKKA: {
    label: 'Karonkka',
    image: '/event-images/karonkka.jpg',
    icon: IconMug,
  },
  MEETING: {
    label: 'Kokous',
    image: '/event-images/meeting.jpg',
    icon: IconUsers,
  },
  NORDIC_WALKING: {
    label: 'Sauvakävely',
    image: '/event-images/nordicwalking.jpg',
    icon: IconBlind,
  },
  ICE_HOCKEY: {
    label: 'Jääkiekko',
    image: '/event-images/hockey.jpg',
    icon: IconIceSkating,
  },
  ORIENTEERING: {
    label: 'Suunnistus',
    image: '/event-images/orienteering.jpg',
    icon: IconCompass,
  },
  OTHER: {
    label: 'Muu',
    image: '/event-images/other.jpg',
    icon: IconDots,
  },
  RUNNING: {
    label: 'Juoksu',
    image: '/event-images/running.jpg',
    icon: IconRun,
  },
  SKIING: {
    label: 'Hiihto',
    image: '/event-images/skiing.jpg',
    icon: IconSnowflake,
  },
  SPINNING: {
    label: 'Spinning',
    image: '/event-images/spinning.jpg',
    icon: IconCarFan,
  },
  SWIMMING: {
    label: 'Uinti',
    image: '/event-images/swimming.jpg',
    icon: IconSwimming,
  },
  TRACK_RUNNING: {
    label: 'Ratajuoksu',
    image: '/event-images/trackrunning.jpg',
    icon: IconTrack,
  },
  TRAIL_RUNNING: {
    label: 'Polkujuoksu',
    image: '/event-images/trailrunning.jpg',
    icon: IconTrees,
  },
  TRIATHLON: {
    label: 'Triathlon',
    image: '/event-images/triathlon.jpg',
    icon: IconTriangleSquareCircle,
  },
  ULTRAS: {
    label: 'Ultras',
    image: '/event-images/ultras.jpg',
    icon: IconMusic,
  },
};

export function getEventTypeInfo(type: EventType): EventTypeInfo {
  return EVENT_TYPE_MAP[type];
}
