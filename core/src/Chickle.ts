export interface IChickleService {
  start(): Promise<void>;
  dispose(): Promise<void>;
}
