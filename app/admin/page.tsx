// app/admin/page.tsx
import AdminClient from "./AdminClient";
import { supabaseAdmin } from "./supabaseAdmin";

export const dynamic = "force-dynamic";

export type Lead = {
  id: string;
  created_at: string;
  county: string | null;
  town: string | null;
  eircode: string | null;
  property_type: string | null;
  purpose: string | null;
  size_band: string | null;
  bedrooms: number | null;
  timing: string | null;
  extras: string[] | null;
  name: string | null;
  phone: string | null;
  email: string | null;
};

async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []) as Lead[];
}

export default async function AdminPage() {
  const leads = await getLeads();
  return <AdminClient leads={leads} />;
}
