import React, { useState } from "react";
import { Search } from "lucide-react";
import { Card, Tabs, TabsList, Tab, TabPanel } from "../../v2/ui";
import ListenerBLock from "./ListenerBLock";
import UserBlock from "./UserBlock";

function ReportBlock() {
  const [key, setKey] = useState("Listener");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Report & Block</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">View reports and blocks between users and listeners</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
      </div>

      <Card flush>
        <Tabs value={key} onChange={setKey}>
          <TabsList ariaLabel="Report block sections">
            <Tab value="Listener">Listener</Tab>
            <Tab value="User">User</Tab>
          </TabsList>
          <TabPanel value="Listener">
            <ListenerBLock search={searchTerm} />
          </TabPanel>
          <TabPanel value="User">
            <UserBlock search={searchTerm} />
          </TabPanel>
        </Tabs>
      </Card>
    </div>
  );
}

export default ReportBlock;
