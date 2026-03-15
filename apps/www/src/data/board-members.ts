interface BoardMember {
  nickname: string;
  title: string;
  photoPath: string;
  rotation: string;
}

const boardMembers: BoardMember[] = [
  {
    nickname: 'Jasen 1',
    title: 'Puheenjohtaja',
    photoPath: '/images/board/placeholder.svg',
    rotation: '-2deg',
  },
  {
    nickname: 'Jasen 2',
    title: 'Varapuheenjohtaja',
    photoPath: '/images/board/placeholder.svg',
    rotation: '1.5deg',
  },
  {
    nickname: 'Jasen 3',
    title: 'Sihteeri',
    photoPath: '/images/board/placeholder.svg',
    rotation: '-1deg',
  },
  {
    nickname: 'Jasen 4',
    title: 'Rahastonhoitaja',
    photoPath: '/images/board/placeholder.svg',
    rotation: '2deg',
  },
  {
    nickname: 'Jasen 5',
    title: 'Jasen',
    photoPath: '/images/board/placeholder.svg',
    rotation: '-1.5deg',
  },
  {
    nickname: 'Jasen 6',
    title: 'Jasen',
    photoPath: '/images/board/placeholder.svg',
    rotation: '1deg',
  },
  {
    nickname: 'Jasen 7',
    title: 'Jasen',
    photoPath: '/images/board/placeholder.svg',
    rotation: '-2.5deg',
  },
];

export { boardMembers };
