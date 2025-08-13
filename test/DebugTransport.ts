import { SPLAT } from 'triple-beam';
import TransportStream from 'winston-transport';
import type { WinstonInfo } from '../src';

export class DebugTransport extends TransportStream {
  constructor() {
    super({ silent: false });
  }

  log(info: WinstonInfo, callback: () => void) {
    console.log('=== SPLAT INSPECTION ===');
    console.log('Message:', info.message);
    console.log('Message type:', typeof info.message);
    console.log('Message constructor:', info.message?.constructor?.name);
    console.log('Info instanceof Error:', info instanceof Error);

    if (info.message instanceof Error) {
      const errorMessage = info.message;
      console.log('Message is Error:', {
        message: errorMessage.message,
        stack: errorMessage.stack,
      });
    }

    if (info instanceof Error) {
      const errorMessage = info;
      console.log('Info is Error:', {
        message: errorMessage.message,
        stack: errorMessage.stack,
      });
    }

    const splat = info[SPLAT];
    console.log('Splat symbol:', splat);

    if (Array.isArray(splat)) {
      console.log('Splat items:');
      splat.forEach((item, index) => {
        console.log(`  [${index}]:`, item);
        if (item instanceof Error) {
          console.log(`    Error message: ${item.message}`);
          console.log(`    Error stack: ${item.stack}`);
        }
      });
    }

    console.log('Full info keys:', Object.keys(info));
    console.log('==================');
    callback();
  }
}
