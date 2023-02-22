import { useEffect } from "react";
import QrHunter from '@stevent-team/react-qr-hunter'


export const BarcodeScanner = ({ setBarcodeValue }: { setBarcodeValue: (string) => void }) => {
  useEffect(() => {
    console.log('(ℹ️,ℹ️) Loading Video...');
  }, [])

  return (
    <>
      <QrHunter
        onScan={(result) => {
          console.log('(📸,ℹ️) Obtained result from barcode scanned', result);
          setBarcodeValue(result.data);
        }}
        onError={(error) => console.log(error)}
      />
    </>);
};
