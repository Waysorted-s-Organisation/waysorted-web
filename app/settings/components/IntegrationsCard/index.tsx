"use client";

import Image from "next/image";

export type Integration = {
  id: string;
  name: string;
  icon: string;              // path to icon
  status: "none" | "connected" | "coming-soon";
};

export type IntegrationsCardProps = {
  integrations: Integration[];
  anyConnected: boolean;
};

export default function IntegrationsCard({ integrations, anyConnected }: IntegrationsCardProps) {
  return (
    <section className="max-w-3xl rounded-lg border border-secondary-db-5 bg-white">
      <header className="px-5 py-3 border-b border-secondary-db-5">
        <h1 className="text-base font-medium text-secondary-db-100">Integrations</h1>
        <p className="text-sm text-secondary-db-80 font-medium">
          No more tool chaos. Just smooth connections.
        </p>
      </header>

      <div className="px-6 pb-8 pt-5">
        {/* Status Panel */}
        {!anyConnected ? (
          <div className="relative mb-6 rounded-md bg-error-100 p-4 text-error-500">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                <Image
                    src="/icons/info-red.svg"
                    alt="Error Icon"
                    width={16}
                    height={16}
                    className="object-contain"
                    />
                <p className="text-sm font-medium">
                    No integrations yet. 
                </p>
                </div>
            </div>
        </div>
        ) : (
          <div className="mb-6 rounded-md bg-blue-50 p-4 text-blue-700 border border-blue-100 flex items-start gap-2">
            <span
              aria-hidden="true"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-300 bg-blue-50 text-[11px] font-semibold leading-none shrink-0 text-blue-600"
            >
              i
            </span>
            <p className="text-sm">
              Waysorted is now successfully integrated with listed softwares.
            </p>
          </div>
        )}

        <ul className="space-y-4">
          {integrations.map((intg) => {
            const comingSoon = intg.status === "coming-soon";
            const connected = intg.status === "connected";
            return (
              <li key={intg.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md">
                    <Image
                      src={intg.icon}
                      alt={intg.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-secondary-db-100">
                      {intg.name}
                    </span>
                    {comingSoon && (
                      <span className="rounded-sm bg-primary-way-10 px-1.5 py-1 text-[10px] font-medium text-primary-way-100">
                        Unlocks soon
                      </span>
                    )}
                  </div>
                </div>

                {connected ? (
                  <span className="inline-flex items-center rounded-md bg-secondary-db-5 px-3 py-1.5 text-xs font-medium text-secondary-db-70">
                    Connected
                  </span>
                ) : (
                  <button
                    disabled={comingSoon}
                    onClick={() => alert(`Connect ${intg.name}`)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      comingSoon
                        ? "cursor-not-allowed bg-secondary-db-5 text-secondary-db-50"
                        : "bg-primary-way-10 text-primary-way-100 hover:bg-primary-way-20 cursor-pointer"
                    }`}
                  >
                    {comingSoon ? "Connect" : "Connect"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}