export const userInvitationTemplate = (
  firstName: string,
  companyName: string,
  resetPasswordUrl: string,
) => `<mjml>
<mj-body background-color="#f5f5f4" font-size="13px">
  <mj-section background-color="#eab308" vertical-align="top" padding-bottom="0px" padding-top="0">
    <mj-column vertical-align="top" width="100%">
      <mj-text align="left" color="#1c1917" font-size="45px" font-weight="bold" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="30px" padding-top="50px">Bienvenid@ a CEUS</mj-text>
    </mj-column>
  </mj-section>
  <mj-section background-color="#f5f5f4" padding-bottom="20px" padding-top="20px">
    <mj-column vertical-align="middle" width="100%">
      <mj-text align="left" color="#1c1917" font-size="22px" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px"><span style="color:#1c1917">Estimad@ ${firstName} de ${companyName}</span></mj-text>
      <mj-text align="left" color="#1c1917" font-size="15px" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px">Se ha creado un usuario para ti. Termina de configurar tu cuenta en el siguiente botón.</mj-text>
      <mj-button align="left" font-size="22px" font-weight="bold" background-color="#eab308" border-radius="10px" color="#1c1917" font-family="open Sans Helvetica, Arial, sans-serif" href="${resetPasswordUrl}">Aceptar invitación</mj-button>
      <mj-text align="left" color="#1c1917" font-size="10px" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px">Si recibiste este correo por error, puedes hacer caso omiso.</mj-text>
    </mj-column>
  </mj-section>
</mj-body>
</mjml>`;
