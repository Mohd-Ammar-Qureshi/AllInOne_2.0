/**
 * Starter text for the in-app legal screens.
 *
 * IMPORTANT: this is a plain-language template, not legal advice. Have a
 * qualified professional review and replace it before you publish the app.
 * To change the wording later, edit only this file.
 */

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_DOCUMENTS: Record<'terms' | 'privacy', LegalDocument> = {
  terms: {
    title: 'Terms & Conditions',
    updated: 'Last updated: 1 October 2026',
    intro:
      'These terms explain how you may use AllInOne. By creating an account or using the app you agree to them.',
    sections: [
      {
        heading: '1. Your account',
        body: 'You must give accurate information when you register and keep your password private. You are responsible for activity on your account. Your account type (Buyer or Seller) is chosen at registration.',
      },
      {
        heading: '2. Licences and verification',
        body: 'Sellers must provide a valid drug or trade licence before selling. We may ask for further proof at any time and may suspend accounts that provide false or expired details.',
      },
      {
        heading: '3. Using the marketplace',
        body: "Use AllInOne only for lawful trade of medical products between licensed businesses. Do not list prohibited items, misuse other users' information, or interfere with the app or its services.",
      },
      {
        heading: '4. Orders and deliveries',
        body: 'Orders, prices, stock and delivery times are agreed between buyers and sellers. AllInOne provides the platform and is not the seller of the products.',
      },
      {
        heading: '5. Suspension and closing your account',
        body: 'We may suspend or close accounts that break these terms. You may stop using the app at any time by contacting support to close your account.',
      },
      {
        heading: '6. Changes to these terms',
        body: 'We may update these terms from time to time. Continuing to use the app after an update means you accept the new terms.',
      },
      {
        heading: '7. Contact',
        body: 'Questions about these terms can be sent to our support email shown on the About screen.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: 1 October 2026',
    intro:
      'This policy explains what information AllInOne collects and how it is used.',
    sections: [
      {
        heading: '1. Information we collect',
        body: 'Account details (name, email, phone number, address, city, state and pincode), your account type, and for sellers a licence number. We also store the orders and product records you create in the app.',
      },
      {
        heading: '2. How we use it',
        body: 'To create and secure your account, verify sellers, show your details to the businesses you trade with, and provide support. We do not sell your personal information.',
      },
      {
        heading: '3. Where it is stored',
        body: 'Your data is stored with our backend provider. Only you can read and change your own profile; other users see only what is needed to complete an order.',
      },
      {
        heading: '4. On your device',
        body: 'The app saves preferences such as theme, language and notification choices on your device. This does not include your password.',
      },
      {
        heading: '5. Your choices',
        body: 'You can view and edit your profile in Settings. To correct data you cannot edit, or to ask for your account to be closed, contact support.',
      },
      {
        heading: '6. Changes to this policy',
        body: 'We may update this policy from time to time. The date at the top shows when it last changed.',
      },
    ],
  },
};