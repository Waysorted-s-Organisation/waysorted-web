import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import Loading from "../../loading";
import SubscriptionCard from "../SubscriptionCard";
import BillingDetailsModal, { type BillingDetails } from "@/components/BillingDetailsModal";

export function SubscriptionTab() {
  const { user, loading, refreshUser } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return <Loading />;
  }

  const handleBillingSubmit = async (details: BillingDetails) => {
    const res = await fetch("/api/billing/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save billing details");
    }
    
    setIsModalOpen(false);
    await refreshUser();
  };

  return (
    <>
      <BillingDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleBillingSubmit}
        initialData={user?.billing?.billingDetails}
      />
      <SubscriptionCard
        user={user!}
        onEditBilling={() => setIsModalOpen(true)}
      />
    </>
  );
}
