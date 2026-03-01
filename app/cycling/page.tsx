/**
 * app/cycling/page.tsx
 *
 * Redirects to the standalone Bike Maintenance app at /bike-maintenance.html.
 * The actual app logic lives entirely in public/bike-maintenance.html so it can
 * use the same direct-to-/api/strava fetch pattern as chain-wax.html.
 */

import { redirect } from "next/navigation";

export default function CyclingPage() {
  redirect("/public/bike-maintenance.html");
}
