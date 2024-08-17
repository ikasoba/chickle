import { PigmoCollection } from "@ikasoba000/pigmo/PigmoCollection";
import { IFollower, IFollowersService } from "../../followers/IFollowersService.js";
import { QueryFn  } from "./helper.js";
import { $filter, $insert, $remove } from "@ikasoba000/pigmo/PigmoQuery";

export class FollowerService implements IFollowersService {
  constructor(private db: PigmoCollection<IFollower>) {}

  async pushTo(followers: IFollower[]): Promise<void> {
    await this.db.exec(
      $insert({
        values: followers
      })
    );
  }

  async delete(id: string, followers: string[]): Promise<void> {
    await this.db.exec(
      $remove({
        where: {
          to: {
            $eq: id
          },
          id: {
            $in: followers
          }
        }
      })
    )
  }

  async getFromId(id: string, untilAt: Date, amount: number): Promise<IFollower[]> {
    return (await this.db.exec(
      $filter({
        where: {
          to: {
            $eq: id
          },
          followedAt: {
            $lte: untilAt.getTime()
          }
        },
        sortBy: {
          followedAt: "DESC"
        },
        max: amount
      })
    ))
  }

  async includesFromId(id: string, followers: string[]): Promise<IFollower[]> {
    return await this.db.exec(
      $filter({
        where: {
          to: {
            $eq: id
          },
          id: {
            $in: followers
          }
        },
        sortBy: {
          followedAt: "DESC"
        }
      })
    )
  }
}

