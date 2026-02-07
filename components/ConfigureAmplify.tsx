'use client';

import { Amplify } from 'aws-amplify';

export default function ConfigureAmplifyClientSide() {
  try {
    const outputs = require('@/amplify_outputs.json');
    Amplify.configure(outputs, { ssr: true });
    console.log("Amplify configured successfully on client.");
  } catch (e) {
    console.error("Amplify configuration missing or invalid. Check your build environment.", e);
  }
  return null;
}


