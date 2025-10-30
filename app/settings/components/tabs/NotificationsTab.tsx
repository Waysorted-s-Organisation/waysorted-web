import NotificationsCard from "../NotificationsCard";

export function NotificationsTab() {
  // Demo data (right side screenshot scenario)
  return (
    <NotificationsCard
      hasAny={true}
      categories={[
        {
          id: "1",
            title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus volutpat dui gravida ipsum.",
        },
        {
          id: "2",
          title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus volutpat dui gravida ipsum.",
        },
      ]}
    />
  );
}