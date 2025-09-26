import IntegrationsCard, { Integration } from "../IntegrationsCard";

export function IntegrationsTab({ connected = false }: { connected?: boolean }) {
  const integrations: Integration[] = connected
    ? [
        { id: "figma", name: "Figma", icon: "/icons/figma-int.svg", status: "connected" },
        { id: "webflow", name: "Webflow", icon: "/icons/webflow.svg", status: "coming-soon" },
      ]
    : [
        { id: "figma", name: "Figma", icon: "/icons/figma-int.svg", status: "none" },
        { id: "webflow", name: "Webflow", icon: "/icons/webflow.svg", status: "coming-soon" },
      ];

  return <IntegrationsCard integrations={integrations} anyConnected={connected} />;
}