export { mapCompareResponse } from "../app/mappers/compare.mapper";

export type CompareViewModel = ReturnType<typeof import("../app/mappers/compare.mapper").mapCompareResponse>;
