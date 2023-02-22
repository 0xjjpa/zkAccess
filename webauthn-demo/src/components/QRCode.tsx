import { Box, useColorMode } from "@chakra-ui/react";
import QRCode from "qrcode-svg";
import { useEffect } from "react";

export const QrCode = ({ payload }: { payload: string }) => {
  const { colorMode } = useColorMode();
  const SVG_QR_CODE_WIDTH_IN_PX = 256;

  useEffect(() => {
    console.log('(ℹ️,📄) Payload obtained for QR Code', payload)
  }, [])


  return (
    <Box
      style={{ width: SVG_QR_CODE_WIDTH_IN_PX, margin: 'auto' }}
      dangerouslySetInnerHTML={{
        __html: new QRCode({
          width: SVG_QR_CODE_WIDTH_IN_PX,
          height: SVG_QR_CODE_WIDTH_IN_PX,
          content: payload,
          ecl: 'H',
          join: true,
          padding: 1,
          container: "svg-viewbox",
          color: colorMode == "dark" ? "white" : "black",
          background: "none",
        }).svg(),
      }}
    />
  )
}