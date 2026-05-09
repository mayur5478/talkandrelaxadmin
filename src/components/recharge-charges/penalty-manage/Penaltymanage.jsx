import React, { useState } from 'react';
import "./penalty.scss";
import { Card, Tabs, TabsList, Tab, TabPanel } from "../../v2/ui";
import Leave from './Leave';
import MissedSession from './MissedSession';
import Policy from './Policy';

function PenaltyManage() {
  const [key, setKey] = useState('Leave Penalty');

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Penalty Management</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Manage leave, missed session and policy penalties</p>
        </div>
      </div>

      <Card flush>
        <Tabs value={key} onChange={setKey}>
          <TabsList ariaLabel="Penalty sections">
            <Tab value="Leave Penalty">Leave Penalty</Tab>
            <Tab value="Missed Session Penalty">Missed Session Penalty</Tab>
            <Tab value="Policy Break Penalty">Policy Break Penalty</Tab>
          </TabsList>
          <TabPanel value="Leave Penalty">
            <Leave />
          </TabPanel>
          <TabPanel value="Missed Session Penalty">
            <MissedSession />
          </TabPanel>
          <TabPanel value="Policy Break Penalty">
            <Policy />
          </TabPanel>
        </Tabs>
      </Card>
    </div>
  );
}

export default PenaltyManage;
