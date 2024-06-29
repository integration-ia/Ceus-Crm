import { CheckCircle, XCircle } from "lucide-react";
import React from "react";
import { type RouterOutputs } from "~/utils/api";

type WebDomainStatusAlertProps = {
  statusInfo: RouterOutputs["webDomains"]["verifyDomainStatus"];
};

const WebDomainStatusAlert = ({ statusInfo }: WebDomainStatusAlertProps) => {
  if (statusInfo.configured && statusInfo.verified) {
    return (
      <div className="flex items-center gap-3">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <p className="text-sm text-green-500">
          El dominio web está activo y funcionando correctamente
        </p>
      </div>
    );
  } else if (!statusInfo.configured || !statusInfo.verified) {
    return (
      <div className="flex items-center gap-3">
        <XCircle className="h-4 w-4 text-red-500" />
        <p className="text-sm text-red-500">
          Configuración incompleta o dominio no verificado
        </p>
      </div>
    );
  }

  return <>Estado desconocido</>;
};

export default WebDomainStatusAlert;
