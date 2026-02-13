# IndiaMART Real-Time Lead Capture System

This system automatically captures leads from IndiaMART emails and displays them on your dashboard.

## 🚀 Quick Start

1.  **Start the Next.js App**:
    Ensure your dev server is running:
    ```bash
    npm run dev
    ```

2.  **View Dashboard**:
    Open [http://localhost:3000/leads](http://localhost:3000/leads) to see the Real-Time Lead Dashboard.

3.  **Test with Mock Data**:
    To see leads appear instantly without configuring email, run:
    ```bash
    npx ts-node --compiler-options '{"module":"commonjs"}' scripts/mock-email-generator.ts
    ```
    Keep this running in a separate terminal. You will see new leads pop up on the dashboard every 10 seconds.

## 📧 Configuring Real Email Listener

To connect to your actual Gmail account:

1.  **Get Gmail App Password**:
    *   Go to Google Account > Security.
    *   Enable 2-Step Verification if not enabled.
    *   Search for "App Passwords".
    *   Create a new App Password (name it "LeadCapture").
    *   Copy the 16-character password.

2.  **Update `.env`**:
    Edit the `.env` file in the root directory:
    ```env
    DATABASE_URL="file:./dev.db"
    IMAP_USER="your-email@gmail.com"
    IMAP_PASSWORD="your-app-password-here"
    IMAP_HOST="imap.gmail.com"
    ```

3.  **Run the Listener**:
    ```bash
    npx ts-node --compiler-options '{"module":"commonjs"}' scripts/email-listener.ts
    ```
    This script will:
    *   Connect to your Gmail.
    *   Watch for **UNREAD** emails from IndiaMART.
    *   Parse them and extract Name, Phone, Product, Quantity.
    *   Push them to your dashboard.
    *   (Optional) Mark them as read.

## 🛠 Troubleshooting

*   **Connection Error**: Ensure "IMAP Access" is enabled in Gmail Settings > Forwarding and POP/IMAP.
*   **Parsing Issues**: If emails aren't being picked up, check the console logs in the listener. You may need to adjust the regex in `scripts/email-listener.ts` if IndiaMART changes their email format.
