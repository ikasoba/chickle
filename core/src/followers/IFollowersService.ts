export interface IFollower {
  id: string;
  to: string;
  followedAt: number;
}

export interface IFollowersService {
  getFromId(id: string, untilAt: Date, amount: number): Promise<IFollower[]>;
  pushTo(followers: IFollower[]): Promise<void>;
  delete(id: string, folowers: string[]): Promise<void>;
  includesFromId(id: string, followers: string[]): Promise<IFollower[]>;
}
