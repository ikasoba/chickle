import { LDContext } from "../JsonLd.js";

export interface IConfigService {
  port: string;
  host: string;
  url: string;
  documents: Record<string, LDContext>;
  deliverInterval: number;
  deliverSize: number;
}
