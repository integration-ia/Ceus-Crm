export const passwordResetEmailTemplate = (resetPasswordUrl: string) => `<mjml>
  <mj-body background-color="#ffffff" font-size="13px">
    <mj-section background-color="#eab308" vertical-align="top" padding-bottom="0px" padding-top="0">
      <mj-column vertical-align="top" width="100%">
        <mj-text align="left" color="#1c1917" font-size="45px" font-weight="bold" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="30px" padding-top="50px">Restablecer contraseña</mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#f5f5f4" padding-bottom="20px" padding-top="20px">
      <mj-column vertical-align="middle" width="100%">
        <mj-text align="left" color="#1c1917" font-size="22px" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px"><span style="color:#1c1917">Estimado Usuario</span><br /></mj-text>
        <mj-text align="left" color="#1c1917" font-size="15px" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px">Para restablecer tu contraseña, presiona el siguiente botón.</mj-text>
        <mj-button align="left" font-size="16px" href="${resetPasswordUrl}" background-color="#facc15" border-radius="8px" color="#1c1917" font-family="open Sans Helvetica, Arial, sans-serif">Restablecer contraseña</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
