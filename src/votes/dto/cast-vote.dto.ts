import type { VoteChoice } from '@idemos/common';

export interface CastVoteDto {
  userId: string;
  initiativeId: string;
  choice: VoteChoice;
}

export interface VoteStats {
  si: number;
  no: number;
  abst: number;
  total: number;
  officialYes: number | null;
  officialNo: number | null;
  officialAbst: number | null;
  officialVotedAt: string | null;
}
