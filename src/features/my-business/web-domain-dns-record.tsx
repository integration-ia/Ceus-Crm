import React from "react";

interface WebDomainDnsRecordProps {
  type: string;
  name: string;
  value: string;
}

const WebDomainDnsRecord = ({ type, name, value }: WebDomainDnsRecordProps) => {
  return (
    <div className="flex flex-wrap items-center gap-12 py-6 font-mono">
      <div className="flex flex-col gap-4">
        <p className="text-sm">Type</p>
        <p className="text-sm">{type}</p>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-sm">Name (o hostname)</p>
        <p className="text-sm">{name}</p>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-sm">Value (o ipv4)</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
};

export default WebDomainDnsRecord;
