import { prefixZeroes } from "~/lib/utils";

export const shareWithCeusTemplate = (
  propertyCode: bigint,
  name: string,
  email: string,
  phoneNumber: string,
  organizationName: string,
) => `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all padding="0px"></mj-all>
      <mj-class name="preheader" color="#000000" font-size="11px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding="0px"></mj-class>
    </mj-attributes>
    <mj-style inline="inline">a { text-decoration: none; color: inherit; }</mj-style>
  </mj-head>
  <mj-body background-color="#e0f2ff">
    <mj-section background-color="#f8f9fa" padding="10px 0">
      <mj-column width="66%">
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#333" font-size="25px" font-family="Lato, Helvetica, Arial, sans-serif" padding="10px 25px"><strong>Un usuario ha decidido compartir contigo su inmueble</strong></mj-text>
      </mj-column>
    </mj-section>
     <mj-section background-color="#ffffff" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#333" font-size="14px" font-family="Lato, Helvetica, Arial, sans-serif" padding="10px 25px">
          El usuario con nombre ${name}, de correo ${email} de la empresa ${organizationName} ha marcado la casilla de compartir con CEUS el inmueble con ID ${prefixZeroes(propertyCode)}.<br />
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding="20px 0">
      <mj-column>
        <mj-text align="center" color="#333" font-size="20px" font-family="Lato, Helvetica, Arial, sans-serif" vertical-align="top" padding="20px 25px"><strong>ID del inmueble</strong> <br />
          <p style="font-size: 15px;color:#333;">${prefixZeroes(propertyCode)}</p>
        </mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#333" font-size="20px" font-family="Lato, Helvetica, Arial, sans-serif" vertical-align="top" padding="20px 25px"><strong>Nombre del usuario</strong> <br />
          <p style="font-size: 15px;color:#333;">${name}</p>
        </mj-text>
      </mj-column>
      <mj-column>
        <mj-text align="center" color="#333" font-size="20px" font-family="Lato, Helvetica, Arial, sans-serif" vertical-align="top" padding="20px 25px"><strong>Teléfono</strong> <br />
          <p style="font-size: 15px;color:#333;">${phoneNumber}</p>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#fff" padding="10px">
      <mj-column vertical-align="top" width="100%">
        <mj-text align="left" color="#333" font-size="20px" font-family="Lato, Helvetica, Arial, sans-serif" padding="10px 25px">Atte, CEUS</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;
