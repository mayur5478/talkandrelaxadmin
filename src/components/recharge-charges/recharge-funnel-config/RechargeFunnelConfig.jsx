import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Card,
  Button,
  Pill,
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
} from "../../v2/ui";
import {
  useGetRechargeFunnelConfigQuery,
  useUpdateRechargeFunnelConfigMutation,
  useGetRechargeFunnelResultsQuery,
} from "../../../services/rechargeFunnelConfig";

const MODES = [
  { value: "off", label: "Off", description: "Not-yet-recharged users see nothing extra on home." },
  { value: "connect", label: "Listener Connect only", description: "Everyone eligible gets auto-rung to the best-ranked live listener." },
  { value: "nudge", label: "AI Nudge only", description: "Everyone eligible sees the scripted Hinglish recharge nudge." },
  { value: "ab_test", label: "A/B Test", description: "Split traffic between both arms to compare conversion." },
];

const VARIANT_LABELS = { connect: "Listener Connect", nudge: "AI Nudge" };

function RechargeFunnelConfig() {
  const { data: configData, isLoading: isConfigLoading } = useGetRechargeFunnelConfigQuery();
  const { data: resultsData, isLoading: isResultsLoading, refetch: refetchResults } =
    useGetRechargeFunnelResultsQuery(undefined, { pollingInterval: 30000 });
  const [updateConfig, { isLoading: isSaving }] = useUpdateRechargeFunnelConfigMutation();

  const [mode, setMode] = useState("off");
  const [connectPct, setConnectPct] = useState(50);
  const [nudgePct, setNudgePct] = useState(50);

  useEffect(() => {
    if (configData?.data) {
      setMode(configData.data.mode);
      setConnectPct(configData.data.connect_pct);
      setNudgePct(configData.data.nudge_pct);
    }
  }, [configData]);

  const dirty =
    configData?.data &&
    (mode !== configData.data.mode ||
      (mode === "ab_test" &&
        (Number(connectPct) !== configData.data.connect_pct || Number(nudgePct) !== configData.data.nudge_pct)));

  const handleSave = async () => {
    if (mode === "ab_test" && Number(connectPct) + Number(nudgePct) > 100) {
      Swal.fire("Error", "Connect % + Nudge % cannot exceed 100.", "error");
      return;
    }
    try {
      await updateConfig({ mode, connect_pct: Number(connectPct), nudge_pct: Number(nudgePct) }).unwrap();
      Swal.fire("Saved", "Recharge funnel config updated.", "success");
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Failed to save config", "error");
    }
  };

  const results = resultsData?.results || [];

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div>
        <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Recharge Funnel Experiment</h1>
        <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
          Choose what not-yet-recharged first-time users see on the home screen, and compare conversion.
        </p>
      </div>

      <Card>
        {isConfigLoading ? (
          <TableSkeleton rows={3} cols={1} />
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-3">
            {MODES.map((m) => (
              <label
                key={m.value}
                className={`tw-flex tw-items-start tw-gap-3 tw-p-3 tw-rounded-md tw-border tw-cursor-pointer tw-transition-colors ${
                  mode === m.value ? "tw-border-fg-info tw-bg-bg-secondary" : "tw-border-hairline tw-border-tertiary"
                }`}
              >
                <input
                  type="radio"
                  name="funnel-mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                  className="tw-mt-1"
                />
                <div>
                  <div className="tw-text-[13px] tw-font-semibold tw-text-fg-primary">{m.label}</div>
                  <div className="tw-text-[12px] tw-text-fg-tertiary">{m.description}</div>
                </div>
              </label>
            ))}

            {mode === "ab_test" && (
              <div className="tw-flex tw-items-center tw-gap-4 tw-pl-8">
                <label className="tw-flex tw-items-center tw-gap-2 tw-text-[13px] tw-text-fg-primary">
                  Connect %
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={connectPct}
                    onChange={(e) => setConnectPct(e.target.value)}
                    className="tw-w-16 tw-h-8 tw-px-2 tw-text-[13px] tw-text-center tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info"
                  />
                </label>
                <label className="tw-flex tw-items-center tw-gap-2 tw-text-[13px] tw-text-fg-primary">
                  Nudge %
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={nudgePct}
                    onChange={(e) => setNudgePct(e.target.value)}
                    className="tw-w-16 tw-h-8 tw-px-2 tw-text-[13px] tw-text-center tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info"
                  />
                </label>
                <span className="tw-text-[12px] tw-text-fg-tertiary">
                  Remainder ({100 - Number(connectPct || 0) - Number(nudgePct || 0)}%) sees neither — useful for a small canary.
                </span>
              </div>
            )}

            <div>
              <Button size="sm" onClick={handleSave} disabled={!dirty || isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-text-h2 tw-text-fg-primary tw-m-0">Results</h2>
        <Button size="sm" variant="ghost" onClick={() => refetchResults()}>
          Refresh
        </Button>
      </div>

      <Card flush>
        {isResultsLoading ? (
          <TableSkeleton rows={2} cols={5} />
        ) : (
          <Table>
            <THead>
              <TR>
                <Th>Arm</Th>
                <Th>Assigned</Th>
                <Th>Unique Phone Numbers</Th>
                <Th>Converted (recharged)</Th>
                <Th>Conversion Rate</Th>
                <Th>Avg. Time to Convert</Th>
              </TR>
            </THead>
            <TBody>
              {results.length === 0 ? (
                <TR>
                  <Td colSpan={6} className="tw-text-center tw-text-fg-tertiary">
                    No data yet — results appear once users start getting assigned (mode must not be "Off").
                  </Td>
                </TR>
              ) : (
                results.map((r, index) => {
                  const best =
                    results.length > 1 &&
                    r.conversion_rate === Math.max(...results.map((x) => x.conversion_rate || 0));
                  return (
                    <TR key={r.variant} isLast={index === results.length - 1}>
                      <Td className="tw-text-fg-primary tw-font-medium">
                        {VARIANT_LABELS[r.variant] || r.variant}
                        {best && <Pill tone="success" className="tw-ml-2">Leading</Pill>}
                      </Td>
                      <Td>{r.assigned}</Td>
                      <Td>
                        {r.unique_mobiles}
                        {r.unique_mobiles < r.assigned && (
                          <span className="tw-text-fg-tertiary tw-text-[11px] tw-ml-1">
                            ({r.assigned - r.unique_mobiles} repeat signup{r.assigned - r.unique_mobiles === 1 ? "" : "s"} on same number)
                          </span>
                        )}
                      </Td>
                      <Td>{r.converted}</Td>
                      <Td>{r.conversion_rate != null ? `${(r.conversion_rate * 100).toFixed(1)}%` : "-"}</Td>
                      <Td>{r.avg_minutes_to_convert != null ? `${Math.round(r.avg_minutes_to_convert)} min` : "-"}</Td>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        )}
      </Card>
      <p className="tw-text-[12px] tw-text-fg-tertiary tw-mt-0">
        Rule of thumb: wait for at least ~30 conversions per arm (by unique phone number, not raw "assigned") before trusting the gap between them.
      </p>
    </div>
  );
}

export default RechargeFunnelConfig;
