"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Link2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import {
  buildAttributionCampaignUrl,
  slugifyAttributionValue,
} from "@/lib/attribution-campaigns";

type Campaign = {
  id: string;
  name: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  destinationPath: string;
  active: boolean;
  url: string;
  createdAt: string | null;
};

const fieldClassName =
  "mt-2 !border !border-[#BFC5CF] !bg-white shadow-none ring-1 ring-transparent hover:!border-[#8F98A8] focus-visible:!border-[#265BD1] focus-visible:ring-[#265BD1]/25";

export default function AttributionAdminPage() {
  const { user, loading: userLoading } = useUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sourceTouched, setSourceTouched] = useState(false);
  const [form, setForm] = useState({
    name: "",
    utmSource: "",
    utmMedium: "referral",
    utmCampaign: "checkout",
    destinationPath: "/payment",
  });

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/attribution/campaigns", { cache: "no-store" });
      const body = (await response.json().catch(() => ({}))) as {
        campaigns?: Campaign[];
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || "Unable to load campaigns.");
      setCampaigns(body.campaigns || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && user?.role === "admin") void loadCampaigns();
    if (!userLoading && user?.role !== "admin") setLoading(false);
  }, [loadCampaigns, user?.role, userLoading]);

  const previewUrl = useMemo(() => {
    if (typeof window === "undefined" || !form.utmSource) return "";
    try {
      return buildAttributionCampaignUrl(window.location.origin, {
        destinationPath: form.destinationPath || "/payment",
        utmSource: form.utmSource,
        utmMedium: form.utmMedium || "referral",
        utmCampaign: form.utmCampaign || "checkout",
      });
    } catch {
      return "";
    }
  }, [form.destinationPath, form.utmCampaign, form.utmMedium, form.utmSource]);

  function updateName(name: string) {
    setForm((current) => ({
      ...current,
      name,
      ...(!sourceTouched ? { utmSource: slugifyAttributionValue(name) } : {}),
    }));
  }

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/attribution/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json().catch(() => ({}))) as {
        campaign?: Campaign;
        error?: string;
      };
      if (!response.ok || !body.campaign) {
        throw new Error(body.error || "Unable to create campaign.");
      }
      setCampaigns((current) => [body.campaign!, ...current]);
      setForm({
        name: "",
        utmSource: "",
        utmMedium: "referral",
        utmCampaign: "checkout",
        destinationPath: "/payment",
      });
      setSourceTouched(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create campaign.");
    } finally {
      setSaving(false);
    }
  }

  async function copyCampaign(campaign: Campaign) {
    try {
      await navigator.clipboard.writeText(campaign.url);
      setCopiedId(campaign.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("Could not copy the link. Select and copy it manually.");
    }
  }

  if (userLoading) {
    return (
      <main className="min-h-screen bg-[#F6F7F9] px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm text-[#565A5E]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading admin access...
        </div>
      </main>
    );
  }

  if (user?.role !== "admin") {
    return (
      <main className="min-h-screen bg-[#F6F7F9] px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-[8px] border border-[#E4E5E7] bg-white p-8">
          <h1 className="text-2xl font-semibold text-[#0D1218]">Admin access required</h1>
          <p className="mt-2 text-sm text-[#565A5E]">Only administrators can manage attribution campaigns.</p>
          <Button asChild className="mt-6"><Link href="/">Go home</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F7F9] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#565A5E] hover:text-[#0D1218]">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="mt-4 flex items-start gap-3">
          <div className="rounded-[10px] bg-[#E8EFFC] p-2.5 text-[#265BD1]"><Link2 className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0D1218]">Attribution</h1>
            <p className="mt-1 text-sm text-[#565A5E]">Create trackable checkout links for partners and campaigns.</p>
          </div>
        </div>

        {error && <div className="mt-6 rounded-[8px] border border-[#F2C5C0] bg-[#FFF6F5] px-4 py-3 text-sm text-[#B93428]">{error}</div>}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <form onSubmit={createCampaign} className="rounded-[10px] border border-[#DDE0E5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0D1218]">New campaign</h2>
            <p className="mt-1 text-sm text-[#68707C]">For example, use Madhura as both the name and source.</p>

            <label htmlFor="campaign-name" className="mt-5 block text-sm font-semibold text-[#0D1218]">Name</label>
            <Input id="campaign-name" required maxLength={80} value={form.name} onChange={(event) => updateName(event.target.value)} placeholder="Madhura" className={fieldClassName} />

            <label htmlFor="campaign-source" className="mt-4 block text-sm font-semibold text-[#0D1218]">UTM source</label>
            <Input id="campaign-source" required maxLength={120} value={form.utmSource} onChange={(event) => { setSourceTouched(true); setForm((current) => ({ ...current, utmSource: slugifyAttributionValue(event.target.value) })); }} placeholder="madhura" className={fieldClassName} />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="campaign-medium" className="block text-sm font-semibold text-[#0D1218]">Medium</label>
                <Input id="campaign-medium" required value={form.utmMedium} onChange={(event) => setForm((current) => ({ ...current, utmMedium: slugifyAttributionValue(event.target.value) }))} className={fieldClassName} />
              </div>
              <div>
                <label htmlFor="campaign-value" className="block text-sm font-semibold text-[#0D1218]">Campaign</label>
                <Input id="campaign-value" required value={form.utmCampaign} onChange={(event) => setForm((current) => ({ ...current, utmCampaign: slugifyAttributionValue(event.target.value) }))} className={fieldClassName} />
              </div>
            </div>

            <label htmlFor="campaign-destination" className="mt-4 block text-sm font-semibold text-[#0D1218]">Destination</label>
            <Input id="campaign-destination" required value={form.destinationPath} onChange={(event) => setForm((current) => ({ ...current, destinationPath: event.target.value }))} placeholder="/payment" className={fieldClassName} />

            {previewUrl && <div className="mt-4 break-all rounded-[7px] bg-[#F6F7F9] p-3 text-xs leading-5 text-[#68707C]">{previewUrl}</div>}

            <Button type="submit" disabled={saving || !form.name || !form.utmSource} className="mt-5 w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create campaign
            </Button>
          </form>

          <section className="overflow-hidden rounded-[10px] border border-[#DDE0E5] bg-white shadow-sm">
            <div className="border-b border-[#E4E5E7] px-5 py-4">
              <h2 className="font-semibold text-[#0D1218]">Campaign links</h2>
              <p className="mt-1 text-sm text-[#68707C]">{campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}</p>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-[#68707C]"><Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#68707C]">No campaigns yet. Create the first one using the form.</div>
            ) : (
              <div className="divide-y divide-[#E9EAEC]">
                {campaigns.map((campaign) => (
                  <article key={campaign.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#0D1218]">{campaign.name}</h3>
                          <span className="rounded-full bg-[#EDF9F0] px-2 py-0.5 text-xs font-medium text-[#18753C]">Active</span>
                        </div>
                        <p className="mt-1 text-xs text-[#68707C]">Source: {campaign.utmSource} · Campaign: {campaign.utmCampaign}</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => copyCampaign(campaign)}>
                        {copiedId === campaign.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedId === campaign.id ? "Copied" : "Copy link"}
                      </Button>
                    </div>
                    <p className="mt-3 break-all rounded-[7px] bg-[#F6F7F9] p-3 text-xs leading-5 text-[#565A5E]">{campaign.url}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
