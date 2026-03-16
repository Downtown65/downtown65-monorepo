interface BoardMember {
  nickname: string;
  title: string;
  photoPath: string;
  rotation: string;
}

const boardMembers: BoardMember[] = [
  {
    nickname: 'Janne Nurmi',
    title: 'Puheenjohtaja',
    photoPath: '/images/board/placeholder.svg',
    rotation: '-2deg',
  },
  {
    nickname: 'Jani Brandt',
    title: 'Varapuheenjohtaja',
    photoPath: '/images/board/placeholder.svg',
    rotation: '1.5deg',
  },
  {
    nickname: 'Jani Markkanen',
    title: 'Sihteeri',
    photoPath: '/images/board/placeholder.svg',
    rotation: '-1deg',
  },
  {
    nickname: 'Jani Brandt',
    title: 'Rahastonhoitaja',
    photoPath: '/images/board/placeholder.svg',
    rotation: '2deg',
  },
  {
    nickname: 'Vepe Korhonen',
    title: 'Jasen',
    photoPath: '/images/board/placeholder.svg',
    rotation: '-1.5deg',
  },
  {
    nickname: 'Niko Niklander',
    title: 'Jasen',
    photoPath: '/images/board/placeholder.svg',
    rotation: '1deg',
  },
  {
    nickname: 'Juho Poutanen',
    title: 'Jasen',
    photoPath: '/images/board/placeholder.svg',
    rotation: '-2.5deg',
  },
];

export { boardMembers };
