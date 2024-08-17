import { $record, $string } from "lizod"
import { $guard } from "../JsonLd.js"

export type LangString = Record<string, string>
export const LangString = $guard($record($string, $string))
