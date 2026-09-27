// Kept as the import path every screen uses; the implementation moved to
// the shared store so three screens no longer run three subscriptions and
// three copies of the same month fetch.
export { useShift } from "./shifts-store";
