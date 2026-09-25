import { useEffect, useState } from "react";
import { isAuthenticated } from "./auth";

/**
 * Client-side auth state. Starts `false` (SSR / first paint) and syncs
 * with localStorage after mount, so statically prerendered pages never
 * hydrate with a mismatch.
 */
export default function useAuth() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  return authed;
}
