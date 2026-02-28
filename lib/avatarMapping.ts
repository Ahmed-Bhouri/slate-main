
export type AvatarId = 'amara' | 'bence' | 'mate' | 'sofia';

export const AVATAR_IDS: AvatarId[] = ['amara', 'bence', 'mate', 'sofia'];

/**
 * Maps a student's avatar ID and current state (mood/status) to the correct image path.
 */
export function getAvatarImage(
  avatarId: string,
  mood: string,
  status: string
): string {
  const base = '/assets/Avatars';
  const id = avatarId.toLowerCase() as AvatarId;

  // Normalize mood/status to lowercase for easier matching
  const m = mood.toLowerCase();
  const s = status.toLowerCase();

  switch (id) {
    case 'amara':
      if (s === 'hand_raised') return `${base}/Amara/amara-question.gif`;
      if (s === 'confused' || m === 'confused' || m === 'scared') return `${base}/Amara/amara-scared.gif`;
      if (s === 'zoned_out' || m === 'tired' || m === 'bored' || s === 'zoned_out') return `${base}/Amara/amara-sleepy.gif`; // Changed to gif
      if (m === 'happy' || m === 'excited') return `${base}/Amara/amara-happy.gif`;
      return `${base}/Amara/amara-happy.gif`; // Default

    case 'bence':
      if (s === 'hand_raised') return `${base}/Bence/Raise Hand for a Question (1).gif`;
      if (s === 'confused' || m === 'confused' || m === 'scared') return `${base}/Bence/Scared Pixel Lab.png`;
      if (s === 'zoned_out' || m === 'tired' || m === 'bored' || s === 'zoned_out') return `${base}/Bence/Heavy Drooping Eyelids.gif`; // Changed to gif
      if (m === 'happy' || m === 'excited') return `${base}/Bence/Big Open Grin Bright Eyes.gif`;
      return `${base}/Bence/Big Open Grin Bright Eyes.gif`; // Default

    case 'mate':
      if (s === 'hand_raised') return `${base}/Mate/mate-question.gif`;
      if (s === 'confused' || m === 'confused' || m === 'shocked') return `${base}/Mate/mate-shocked.png`;
      if (s === 'zoned_out' || m === 'tired' || m === 'bored' || s === 'zoned_out') return `${base}/Mate/mate-tired.gif`; // Changed to gif
      if (m === 'happy' || m === 'excited') return `${base}/Mate/mate-happy.gif`;
      return `${base}/Mate/mate-happy.gif`; // Default

    case 'sofia':
      if (s === 'hand_raised') return `${base}/Sofia/sofia-question.gif`;
      if (s === 'confused' || m === 'confused' || m === 'shocked') return `${base}/Sofia/sofia-shocked.png`;
      if (s === 'zoned_out' || m === 'tired' || m === 'bored' || s === 'zoned_out') return `${base}/Sofia/sofia-tired.gif`; // Changed to gif
      if (m === 'happy' || m === 'excited') return `${base}/Sofia/sofia-smiley.png`;
      return `${base}/Sofia/sofia-smiley.png`; // Default

    default:
      // Fallback if avatarId is unknown
      return `${base}/course-in-progress/avatar1.png`;
  }
}

export function getRandomAvatarId(): AvatarId {
  return AVATAR_IDS[Math.floor(Math.random() * AVATAR_IDS.length)];
}
